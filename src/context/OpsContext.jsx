/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react"
import { seedAuditLogs, seedDrivers, seedTrips } from "../data/opsSeed"
import apiService from "../services/api"

const OpsContext = createContext(null)
const REFERENCE_NOW = new Date("2026-04-03T00:00:00").getTime()
const OPEN_TRIP_STATUSES = ["pending_assignment", "assigned", "in_progress"]

const quickMessageTemplates = {
  driver_reached_pickup: "Driver reached pickup",
  trip_started: "Trip started",
  trip_completed: "Trip completed",
}

export function useOps() {
  const context = useContext(OpsContext)
  if (!context) {
    throw new Error("useOps must be used inside OpsProvider")
  }
  return context
}

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function toDateTime(value) {
  return new Date(value).getTime()
}

function computeEndTimestamp(trip) {
  return toDateTime(trip.pickupDateTime) + trip.estimatedDurationMin * 60 * 1000
}

export function OpsProvider({ children }) {
  const [trips, setTrips] = useState(() => clone(seedTrips))
  const [drivers, setDrivers] = useState(() => clone(seedDrivers))
  const [auditLogs, setAuditLogs] = useState(() => clone(seedAuditLogs))
  const [alerts, setAlerts] = useState([])
  const [tripChats, setTripChats] = useState({})

  const tripsById = useMemo(() => Object.fromEntries(trips.map((trip) => [trip.id, trip])), [trips])
  const driversById = useMemo(() => Object.fromEntries(drivers.map((driver) => [driver.id, driver])), [drivers])

  const summary = useMemo(() => {
    const now = REFERENCE_NOW
    const upcomingTrips = trips.filter((trip) => toDateTime(trip.pickupDateTime) >= now && ["pending_assignment", "assigned"].includes(trip.status)).length
    const activeTrips = trips.filter((trip) => trip.status === "in_progress").length
    const unassignedTrips = trips.filter((trip) => !trip.driverId && ["pending_assignment", "assigned"].includes(trip.status)).length
    const completedTrips = trips.filter((trip) => trip.status === "completed").length
    const newRideRequests = trips.filter((trip) => trip.status === "pending_assignment").length

    return { upcomingTrips, activeTrips, unassignedTrips, completedTrips, newRideRequests }
  }, [trips])

  const newRideQueue = useMemo(() => {
    return trips
      .filter((trip) => trip.status === "pending_assignment")
      .sort((a, b) => toDateTime(a.pickupDateTime) - toDateTime(b.pickupDateTime))
  }, [trips])

  const pushAudit = (entry) => {
    setAuditLogs((prev) => [{ id: `AUD-${Date.now()}`, timestamp: new Date().toISOString(), ...entry }, ...prev])
  }

  const pushAlert = (entry) => {
    setAlerts((prev) => [{ id: Date.now(), time: new Date().toLocaleTimeString(), ...entry }, ...prev])
  }

  const emitRideCancellationNotification = (trip, requestedBy, reason, actor) => {
    void apiService.notifyRideCancellation({
      tripId: trip.id,
      requestedBy,
      reason,
      trip,
      actor,
    }).catch((error) => {
      console.warn("Failed to emit ride cancellation notification", error)
    })
  }

  const isBufferClear = (tripId, driverId, startDateTime, endDateTime) => {
    return !trips.some((trip) => {
      if (trip.id === tripId || trip.driverId !== driverId) {
        return false
      }
      if (!OPEN_TRIP_STATUSES.includes(trip.status)) {
        return false
      }

      const otherStart = toDateTime(trip.pickupDateTime)
      const otherEnd = computeEndTimestamp(trip)
      const minGap = 2 * 60 * 60 * 1000

      return !(endDateTime + minGap <= otherStart || startDateTime >= otherEnd + minGap)
    })
  }

  const getEligibleDrivers = (trip) => {
    const start = toDateTime(trip.pickupDateTime)
    const end = computeEndTimestamp(trip)

    return drivers
      .map((driver) => {
        let eligible = true
        const reasons = []

        if (!driver.approved) {
          eligible = false
          reasons.push("Driver is not approved")
        }
        if (!driver.available) {
          eligible = false
          reasons.push("Driver is not available")
        }
        if (driver.vehicle.classType !== trip.vehicleClass) {
          eligible = false
          reasons.push("Vehicle class mismatch")
        }
        if (driver.location !== trip.city) {
          eligible = false
          reasons.push("Driver location mismatch")
        }
        if (!isBufferClear(trip.id, driver.id, start, end)) {
          eligible = false
          reasons.push("2-hour scheduling buffer conflict")
        }

        return { ...driver, eligible, reasons }
      })
      .sort((a, b) => Number(b.eligible) - Number(a.eligible))
  }

  const assignDriver = (tripId, driverId, actor = "admin") => {
    const trip = tripsById[tripId]
    if (!trip) {
      return { ok: false, message: "Trip not found" }
    }

    const eligible = getEligibleDrivers(trip).find((driver) => driver.id === driverId)

    if (!eligible || !eligible.eligible) {
      return { ok: false, message: eligible?.reasons?.[0] || "Driver is not eligible" }
    }

    setTrips((prev) =>
      prev.map((currentTrip) =>
        currentTrip.id === tripId
          ? {
              ...currentTrip,
              driverId,
              status: "assigned",
            }
          : currentTrip
      )
    )

    setTripChats((prev) => {
      const existing = prev[tripId] || []
      return {
        ...prev,
        [tripId]: [
          ...existing,
          {
            id: `MSG-${Date.now()}`,
            tripId,
            senderType: "system",
            senderName: "System",
            text: `Chat activated. Driver ${driverId} assigned.`,
            createdAt: new Date().toISOString(),
            quickType: null,
          },
        ],
      }
    })

    pushAudit({
      actionType: "Driver Assigned",
      actor,
      tripId,
      details: `Driver ${driverId} assigned`,
    })

    return { ok: true }
  }

  const upsertDriverProfile = ({
    driverId,
    name,
    phone,
    location,
    status,
    available,
    approved,
    verificationStatus,
    vehicle,
    actor = "admin",
  }) => {
    if (!name || !phone || !location) {
      return { ok: false, message: "Driver name, phone, and location are required" }
    }

    const normalizedVerification = approved ? "Approved" : (verificationStatus || "Pending")
    const normalizedVehicle = {
      make: vehicle?.make || "",
      model: vehicle?.model || "",
      year: Number(vehicle?.year) || new Date().getFullYear(),
      classType: vehicle?.classType || "Business Sedan",
      status: vehicle?.status || (available ? "Available" : "Unavailable"),
    }

    if (driverId) {
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === driverId
            ? {
                ...driver,
                name,
                phone,
                location,
                status,
                available,
                approved,
                verificationStatus: normalizedVerification,
                vehicle: normalizedVehicle,
              }
            : driver
        )
      )

      pushAudit({
        actionType: "Driver Profile Updated",
        actor,
        tripId: "-",
        details: `Driver ${driverId} profile updated`,
      })

      return { ok: true, message: "Driver profile updated" }
    }

    const maxId = drivers.reduce((max, current) => {
      const numeric = Number(current.id.replace("DRV-", ""))
      return Number.isNaN(numeric) ? max : Math.max(max, numeric)
    }, 200)
    const newDriverId = `DRV-${maxId + 1}`

    setDrivers((prev) => [
      {
        id: newDriverId,
        name,
        phone,
        location,
        status,
        available,
        approved,
        verificationStatus: normalizedVerification,
        vehicle: normalizedVehicle,
      },
      ...prev,
    ])

    pushAudit({
      actionType: "New Driver Added",
      actor,
      tripId: "-",
      details: `Driver ${newDriverId} onboarded`,
    })

    return { ok: true, message: `Driver ${newDriverId} created` }
  }

  const setDriverApproval = (driverId, approved, actor = "admin") => {
    setDrivers((prev) =>
      prev.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              approved,
              verificationStatus: approved ? "Approved" : "Pending",
            }
          : driver
      )
    )

    pushAudit({
      actionType: "Driver Approval Updated",
      actor,
      tripId: "-",
      details: `Driver ${driverId} set to ${approved ? "approved" : "pending"}`,
    })

    return { ok: true }
  }

  const setDriverOperationalStatus = (driverId, { status, available, vehicleStatus }, actor = "admin") => {
    setDrivers((prev) =>
      prev.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              status: status ?? driver.status,
              available: available ?? driver.available,
              vehicle: {
                ...driver.vehicle,
                status: vehicleStatus ?? driver.vehicle.status,
              },
            }
          : driver
      )
    )

    pushAudit({
      actionType: "Driver Operational Status Updated",
      actor,
      tripId: "-",
      details: `Driver ${driverId} status changed`,
    })

    return { ok: true }
  }

  const unassignDriver = (tripId, actor = "admin", reason = "Driver cancelled assignment") => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, driverId: null, status: "pending_assignment" }
          : trip
      )
    )

    pushAudit({
      actionType: "Driver Unassigned/Cancelled",
      actor,
      tripId,
      details: reason,
    })

    pushAlert({
      title: `Driver Unassigned: ${tripId}`,
      detail: `Reason: ${reason}. Immediate reassignment required.`,
    })

    emitRideCancellationNotification(tripsById[tripId], "driver", reason, actor)

    return { ok: true }
  }

  const updateTripStatus = (tripId, status, actor = "admin") => {
    setTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, status } : trip)))

    pushAudit({
      actionType: "Trip Status Updated",
      actor,
      tripId,
      details: `Status changed to ${status}`,
    })
  }

  const overridePrice = (tripId, totalQuotedPrice, actor = "admin") => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              pricing: {
                ...trip.pricing,
                totalQuotedPrice: Number(totalQuotedPrice),
              },
            }
          : trip
      )
    )

    pushAudit({
      actionType: "Pricing Override",
      actor,
      tripId,
      details: `Quoted price overridden to $${Number(totalQuotedPrice).toFixed(2)}`,
    })
  }

  const cancelTrip = ({
    tripId,
    requestedBy = "customer",
    actor = "admin",
    approved = true,
    reason = "",
    overrideRefundPercent = null,
  }) => {
    const trip = tripsById[tripId]
    if (!trip) {
      return { ok: false, message: "Trip not found" }
    }

    const now = Date.now()
    const minutesBeforePickup = Math.max(0, Math.floor((toDateTime(trip.pickupDateTime) - now) / (1000 * 60)))
    const standardRefundPercent = minutesBeforePickup <= 30 ? 50 : 100
    const refundPercent = overrideRefundPercent == null ? standardRefundPercent : Number(overrideRefundPercent)

    if (!approved) {
      pushAudit({
        actionType: "Cancellation Denied",
        actor,
        tripId,
        details: reason || "Cancellation denied",
        cancelledBy: requestedBy,
        feeApplied: 0,
        refundPercent: 0,
      })

      return { ok: true, message: "Cancellation request denied" }
    }

    const feeApplied = ((100 - refundPercent) / 100) * trip.pricing.totalQuotedPrice

    setTrips((prev) =>
      prev.map((currentTrip) =>
        currentTrip.id === tripId
          ? {
              ...currentTrip,
              status: "cancelled",
              cancellation: {
                requestedBy,
                approved: true,
                cancelledBy: actor,
                reason,
                cancelledAt: new Date().toISOString(),
                refundPercent,
                feeApplied,
              },
              payment: {
                ...currentTrip.payment,
                status: "Manual follow-up required",
              },
            }
          : currentTrip
      )
    )

    pushAudit({
      actionType: "Trip Cancelled",
      actor,
      tripId,
      details: reason || "Trip cancelled",
      cancelledBy: requestedBy,
      feeApplied,
      refundPercent,
    })

    if (requestedBy === "driver") {
      pushAlert({ title: `Driver cancelled ${tripId}`, detail: "Immediate reassignment required." })
    }

    if (requestedBy === "customer") {
      pushAlert({ title: `Customer cancelled ${tripId}`, detail: "Review refund and payment decision." })
    }

    emitRideCancellationNotification(trip, requestedBy, reason, actor)

    return { ok: true }
  }

  const getTripMessages = (tripId) => tripChats[tripId] || []

  const sendTripMessage = ({ tripId, senderType = "admin", text = "", quickType = null }) => {
    const trip = tripsById[tripId]
    if (!trip) {
      return { ok: false, message: "Trip not found" }
    }

    if (!trip.driverId || trip.status === "pending_assignment") {
      return { ok: false, message: "Chat is only available after a driver is assigned" }
    }

    if (trip.status === "cancelled") {
      return { ok: false, message: "Chat is unavailable for cancelled trips" }
    }

    if (!["admin", "driver"].includes(senderType)) {
      return { ok: false, message: "Invalid sender" }
    }

    const normalizedText = quickType ? quickMessageTemplates[quickType] : text.trim()
    if (!normalizedText) {
      return { ok: false, message: "Message cannot be empty" }
    }

    const senderName = senderType === "admin" ? "Admin Dispatch" : (driversById[trip.driverId]?.name || "Assigned Driver")

    const message = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tripId,
      senderType,
      senderId: senderType === "admin" ? "admin" : trip.driverId,
      senderName,
      text: normalizedText,
      createdAt: new Date().toISOString(),
      quickType,
    }

    setTripChats((prev) => ({
      ...prev,
      [tripId]: [...(prev[tripId] || []), message],
    }))

    pushAudit({
      actionType: "Trip Chat Message",
      actor: senderType,
      tripId,
      details: quickType ? `Quick message sent: ${normalizedText}` : "Chat message sent",
    })

    return { ok: true }
  }

  const value = {
    trips,
    drivers,
    tripsById,
    driversById,
    alerts,
    summary,
    newRideQueue,
    auditLogs,
    tripChats,
    getEligibleDrivers,
    assignDriver,
    unassignDriver,
    upsertDriverProfile,
    setDriverApproval,
    setDriverOperationalStatus,
    updateTripStatus,
    overridePrice,
    cancelTrip,
    getTripMessages,
    sendTripMessage,
    quickMessageTemplates,
  }

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>
}
