import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Loader,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  User,
  X,
  XCircle,
} from "lucide-react"
import { io } from "socket.io-client"
import apiService from "../services/api"
import { useAuth } from "../context/AuthContext"

function normalizeListResponse(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.bookings)) return response.bookings
  if (Array.isArray(response?.drivers)) return response.drivers
  if (Array.isArray(response?.users)) return response.users
  if (Array.isArray(response?.data?.bookings)) return response.data.bookings
  if (Array.isArray(response?.data?.drivers)) return response.data.drivers
  if (Array.isArray(response?.data?.users)) return response.data.users
  return []
}

function normalizeSingleResponse(response) {
  if (!response) return null
  if (response.booking && typeof response.booking === "object") return response.booking
  if (response.data?.booking && typeof response.data.booking === "object") return response.data.booking
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) return response.data
  if (response.data?.data && typeof response.data.data === "object" && !Array.isArray(response.data.data)) return response.data.data
  if (response.success && response.data && typeof response.data === "object") return response.data
  return null
}

function getPassengerName(booking) {
  const firstName = booking?.passengerFirstName || booking?.user?.firstName || booking?.customer?.firstName || booking?.customer?.name?.split(" ")?.[0] || ""
  const lastName = booking?.passengerLastName || booking?.user?.lastName || booking?.customer?.lastName || booking?.customer?.name?.split(" ").slice(1).join(" ") || ""
  return `${firstName} ${lastName}`.trim() || booking?.passengerName || booking?.customer?.name || "Unknown passenger"
}

function getBookingDateTime(booking) {
  const rawDate = booking?.pickupDateTime || booking?.date || booking?.createdAt || booking?.scheduledAt
  if (!rawDate) return { dateText: "N/A", timeText: "" }

  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return { dateText: "N/A", timeText: "" }

  return {
    dateText: parsed.toLocaleDateString(),
    timeText: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }
}

function formatMoney(value) {
  const amount = Number(value || 0)
  return `$${amount.toFixed(0)}`
}

function getBookingVehicleLabel(booking) {
  return booking?.vehicleCategory?.classification || booking?.vehicleCategory?.name || booking?.vehicleClass || "Any class"
}

function getBookingPassengerEmail(booking) {
  return booking?.passengerEmail || booking?.user?.email || booking?.customer?.email || ""
}

function getBookingPassengerPhone(booking) {
  return booking?.passengerPhone || booking?.user?.phone || booking?.customer?.phone || "N/A"
}

function buildAssignmentEmail(booking, driver) {
  const passengerName = getPassengerName(booking)
  const passengerEmail = getBookingPassengerEmail(booking)
  const passengerPhone = getBookingPassengerPhone(booking)
  const bookingNumber = booking?.confNumber || booking?.confirmationNumber || booking?.id || "N/A"
  const dateInfo = getBookingDateTime(booking)
  const pickupLocation = booking?.pickupLocation || booking?.pickupAddress || "N/A"
  const dropoffLocation = booking?.dropoffLocation || booking?.dropoffAddress || "N/A"
  const vehicleLabel = getBookingVehicleLabel(booking)
  const driverName = getDriverName(driver)
  const driverPhone = driver?.phone || driver?.user?.phone || "N/A"

  return {
    to: passengerEmail,
    subject: `Driver assigned for booking ${bookingNumber}`,
    message: [
      `Hello ${passengerName},`,
      "",
      `A driver has been assigned to your booking ${bookingNumber}.`,
      "",
      `Booking details:`,
      `- Booking number: ${bookingNumber}`,
      `- Pickup: ${pickupLocation}`,
      `- Dropoff: ${dropoffLocation}`,
      `- Date: ${dateInfo.dateText}${dateInfo.timeText ? ` at ${dateInfo.timeText}` : ""}`,
      `- Vehicle class: ${vehicleLabel}`,
      `- Passenger phone: ${passengerPhone}`,
      "",
      `Assigned driver:`,
      `- Name: ${driverName}`,
      `- Phone: ${driverPhone}`,
      `- Company: ${driver?.companyName || driver?.company || "N/A"}`,
      `- Location: ${driver?.location || driver?.user?.location || "N/A"}`,
      "",
      "If you need any help, please contact the admin team.",
    ].join("\n"),
  }
}

function getBookingRequirementSummary(booking) {
  return {
    vehicleClass: getBookingVehicleLabel(booking),
    passengers: Number(booking?.noOfPassengers ?? booking?.passengerCount ?? 0),
    luggage: Number(booking?.luggage ?? booking?.luggageCount ?? 0),
    pickupLocation: booking?.pickupLocation || booking?.pickupAddress || "N/A",
    dropoffLocation: booking?.dropoffLocation || booking?.dropoffAddress || "N/A",
    status: booking?.rideStatus || "unknown",
    paymentStatus: booking?.paymentStatus || "unknown",
  }
}

function getDriverName(driver) {
  const user = driver?.user || {}
  return (
    `${driver?.firstName || user.firstName || ""} ${driver?.lastName || user.lastName || ""}`.trim() ||
    driver?.name ||
    user.name ||
    "Unknown driver"
  )
}

function getDriverVehicleLabel(driver) {
  return (
    driver?.vehicleBrandAndModel ||
    [driver?.vehicle?.make, driver?.vehicle?.model].filter(Boolean).join(" ") ||
    driver?.vehicleClass ||
    driver?.vehicle?.classType ||
    "Vehicle not listed"
  )
}

function getDriverCapacity(driver) {
  return {
    passengers: Number(driver?.vehiclePassengerCapacity ?? driver?.vehicle?.passengerCapacity ?? 0),
    luggage: Number(driver?.vehicleLuggageCapacity ?? driver?.vehicle?.luggageCapacity ?? 0),
  }
}

function getDriverUserId(driver) {
  return driver?.user?.id || driver?.userId || driver?.user?._id || driver?.user?.userId || driver?.id || driver?._id || null
}

function normalizeChatMessages(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.messages)) return response.messages
  if (Array.isArray(response?.data?.messages)) return response.data.messages
  return []
}

function getMessageId(message) {
  return message?.id || message?._id || message?.messageId || null
}

function isAdminMessage(message) {
  return String(message?.senderRole || message?.role || message?.sender?.role || "").toLowerCase() === "admin"
}

function getSocketUrl(baseUrl) {
  if (!baseUrl) return window.location.origin

  try {
    const parsed = new URL(baseUrl, window.location.origin)
    const cleanedPath = parsed.pathname.replace(/\/api\/?$/, "")
    return `${parsed.origin}${cleanedPath === "/" ? "" : cleanedPath}`
  } catch {
    return baseUrl.replace(/\/api\/?$/, "")
  }
}

function formatMessageTime(value) {
  if (!value) return "Just now"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Just now"
  return parsed.toLocaleString()
}

function evaluateDriverFit(booking, driver) {
  const checks = []
  const reasons = []
  let score = 0

  const verified = driver?.user?.isVerified ?? driver?.isVerified
  if (verified === false) reasons.push("Driver is not verified")
  if (verified === true) score += 10
  checks.push({ label: "Verified", ok: verified !== false })

  const onboardingComplete = driver?.user?.onboardingCompleted ?? driver?.onboardingCompleted
  if (onboardingComplete === false) reasons.push("Onboarding incomplete")
  if (onboardingComplete === true) score += 5
  checks.push({ label: "Onboarded", ok: onboardingComplete !== false })

  const available = driver?.available ?? driver?.user?.available
  const notAvailableStatus = ["offline", "unavailable", "on trip", "on_trip"]
  const availabilityOk = available !== false && !notAvailableStatus.includes(status)
  if (!availabilityOk) reasons.push("Driver is currently unavailable")
  score += availabilityOk ? 10 : 0
  checks.push({ label: "Available", ok: availabilityOk })

  return {
    eligible: reasons.length === 0,
    score,
    reasons,
    checks,
  }
}

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-green-100 text-green-700",
    upcoming: "bg-blue-100 text-blue-700",
    assigned: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
    in_progress: "bg-amber-100 text-amber-700",
  }

  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>{status || "unknown"}</span>
}

export default function Bookings() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [driversLoading, setDriversLoading] = useState(true)
  const [error, setError] = useState(null)
  const [driversError, setDriversError] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [assignmentBooking, setAssignmentBooking] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [driverSearchTerm, setDriverSearchTerm] = useState("")
  const [assigningDriverId, setAssigningDriverId] = useState(null)
  const [assignmentError, setAssignmentError] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [chatStatus, setChatStatus] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [assignmentStatus, setAssignmentStatus] = useState(null)
  const socketRef = useRef(null)
  const activeChatKeyRef = useRef("")
  const activeChatDriverIdRef = useRef("")
  const selectedChatDriver = selectedBooking ? (selectedBooking.assignedDriver || selectedBooking.driver || null) : null
  const selectedChatDriverUserId = getDriverUserId(selectedChatDriver)
  const selectedChatDriverLabel = selectedChatDriver ? getDriverName(selectedChatDriver) : "No assigned driver"

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getAllBookings()
        setBookings(normalizeListResponse(response))
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError(err.message || "Failed to load bookings. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setDriversLoading(true)
        setDriversError(null)
        const response = await apiService.getAllDrivers()
        setDrivers(normalizeListResponse(response))
      } catch (err) {
        console.error("Error fetching drivers:", err)
        setDriversError(err.message || "Driver assignment list could not be loaded.")
      } finally {
        setDriversLoading(false)
      }
    }

    fetchDrivers()
  }, [])

  useEffect(() => {
    const socketUrl = getSocketUrl(apiService.baseURL)
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      autoConnect: Boolean(token),
    })

    socketRef.current = socket

    const handleConnect = () => {
      setSocketConnected(true)
      socket.emit("join_admin")
    }

    const handleDisconnect = () => {
      setSocketConnected(false)
    }

    const handleAdminMessage = (message) => {
      if (!message) return

      const messageDriverUserId = String(message.driverUserId || message.meta?.driverUserId || "")
      if (!messageDriverUserId || messageDriverUserId !== String(activeChatDriverIdRef.current)) return

      setChatMessages((currentMessages) => {
        const nextMessageId = getMessageId(message)
        if (nextMessageId && currentMessages.some((existingMessage) => String(getMessageId(existingMessage)) === String(nextMessageId))) {
          return currentMessages.map((existingMessage) =>
            String(getMessageId(existingMessage)) === String(nextMessageId) ? { ...existingMessage, ...message } : existingMessage
          )
        }

        return [...currentMessages, message]
      })
    }

    const handleNotification = (payload) => {
      const notice = payload?.message || payload?.text || "New notification received."
      setChatStatus(notice)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("admin_new_message", handleAdminMessage)
    socket.on("notification", handleNotification)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("admin_new_message", handleAdminMessage)
      socket.off("notification", handleNotification)
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  useEffect(() => {
    activeChatDriverIdRef.current = String(selectedChatDriverUserId || "")
  }, [selectedChatDriverUserId])

  useEffect(() => {
    if (!selectedBooking || !selectedChatDriverUserId) {
      setChatMessages([])
      setChatError(null)
      setChatLoading(false)
      return
    }

    const requestKey = `${selectedBooking.id}:${selectedChatDriverUserId}`
    activeChatKeyRef.current = requestKey

    const loadChatMessages = async () => {
      try {
        setChatLoading(true)
        setChatError(null)

        const response = await apiService.getDriverChatMessages(selectedChatDriverUserId)
        if (activeChatKeyRef.current !== requestKey) return

        setChatMessages(normalizeChatMessages(response))
      } catch (err) {
        if (activeChatKeyRef.current === requestKey) {
          setChatError(err.message || "Unable to load driver chat.")
          setChatMessages([])
        }
      } finally {
        if (activeChatKeyRef.current === requestKey) {
          setChatLoading(false)
        }
      }
    }

    loadChatMessages()
  }, [selectedChatDriverUserId, selectedBooking])

  useEffect(() => {
    if (!chatStatus) return undefined

    const timeoutId = window.setTimeout(() => setChatStatus(null), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [chatStatus])

  const sendDriverMessage = async (event) => {
    event.preventDefault()

    const text = chatInput.trim()
    if (!selectedBooking || !selectedChatDriverUserId || !text) return

    setChatSending(true)
    setChatError(null)

    try {
      const socket = socketRef.current
      if (socket?.connected) {
        socket.emit("admin_send_message", { driverUserId: selectedChatDriverUserId, text })
        setChatStatus("Message sent to driver.")
      } else {
        const response = await apiService.sendDriverChatMessage(selectedChatDriverUserId, text)
        const persistedMessage = response?.data || response
        if (persistedMessage) {
          setChatMessages((currentMessages) => {
            const messageId = getMessageId(persistedMessage)
            if (messageId && currentMessages.some((message) => String(getMessageId(message)) === String(messageId))) {
              return currentMessages.map((message) =>
                String(getMessageId(message)) === String(messageId) ? { ...message, ...persistedMessage } : message
              )
            }

            return [...currentMessages, persistedMessage]
          })
        }
        setChatStatus("Message sent to driver.")
      }

      setChatInput("")
    } catch (err) {
      setChatError(err.message || "Unable to send message.")
    } finally {
      setChatSending(false)
    }
  }

  const stats = useMemo(() => ({
    total: bookings.length,
    completed: bookings.filter((booking) => booking.rideStatus === "completed").length,
    upcoming: bookings.filter((booking) => booking.rideStatus === "upcoming").length,
    cancelled: bookings.filter((booking) => booking.rideStatus === "cancelled").length,
    revenue: bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || booking.tripPrice || 0), 0),
  }), [bookings])

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return bookings.filter((booking) => {
      const passengerName = getPassengerName(booking)
      const pickupLocation = booking?.pickupLocation || booking?.pickupAddress || ""
      const dropoffLocation = booking?.dropoffLocation || booking?.dropoffAddress || ""
      const confirmation = booking?.confNumber || booking?.confirmationNumber || booking?.id || ""

      const matchesSearch =
        !search ||
        String(confirmation).toLowerCase().includes(search) ||
        pickupLocation.toLowerCase().includes(search) ||
        dropoffLocation.toLowerCase().includes(search) ||
        passengerName.toLowerCase().includes(search) ||
        String(booking?.passengerEmail || booking?.user?.email || booking?.customer?.email || "").toLowerCase().includes(search) ||
        String(booking?.passengerPhone || booking?.user?.phone || booking?.customer?.phone || "").includes(search)

      const matchesStatus = filterStatus === "all" || booking?.rideStatus === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [bookings, searchTerm, filterStatus])

  const assignmentDrivers = useMemo(() => {
    if (!assignmentBooking) return []

    const search = driverSearchTerm.trim().toLowerCase()

    return drivers
      .map((driver) => {
        const fit = evaluateDriverFit(assignmentBooking, driver)
        return { driver, ...fit }
      })
      .filter(({ driver }) => {
        if (!search) return true
        const name = getDriverName(driver).toLowerCase()
        const vehicle = getDriverVehicleLabel(driver).toLowerCase()
        const company = String(driver?.companyName || "").toLowerCase()
        const location = String(driver?.location || driver?.user?.location || "").toLowerCase()
        return name.includes(search) || vehicle.includes(search) || company.includes(search) || location.includes(search)
      })
      .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || getDriverName(a.driver).localeCompare(getDriverName(b.driver)))
  }, [drivers, assignmentBooking, driverSearchTerm])

  const assignmentRequirements = assignmentBooking ? getBookingRequirementSummary(assignmentBooking) : null

  const openAssignmentModal = (booking) => {
    setAssignmentBooking(booking)
    setAssignmentError(null)
    setAssignmentStatus(null)
    setDriverSearchTerm("")
  }

  const closeAssignmentModal = () => {
    if (assigningDriverId) return
    setAssignmentBooking(null)
    setAssignmentError(null)
    setAssignmentStatus(null)
  }

  const handleAssignDriver = async (driver) => {
    if (!assignmentBooking) return

    try {
      setAssigningDriverId(driver.id)
      setAssignmentError(null)

      const response = await apiService.assignDriverToBooking(assignmentBooking.id, driver.id)
      const updatedBooking = normalizeSingleResponse(response)

      setBookings((current) => current.map((booking) => {
        if (booking.id !== assignmentBooking.id) return booking

        return {
          ...booking,
          ...(updatedBooking || {}),
          driverId: driver.id,
          assignedDriver: driver,
          rideStatus: updatedBooking?.rideStatus || "assigned",
        }
      }))

      setSelectedBooking((current) => (
        current?.id === assignmentBooking.id
          ? {
              ...current,
              ...(updatedBooking || {}),
              driverId: driver.id,
              assignedDriver: driver,
              rideStatus: updatedBooking?.rideStatus || "assigned",
            }
          : current
      ))

      const passengerEmail = getBookingPassengerEmail(assignmentBooking)
      if (passengerEmail) {
        const mailPayload = buildAssignmentEmail(assignmentBooking, driver)
        await apiService.sendAdminMail(mailPayload)
        setAssignmentStatus(`Assignment email sent to ${passengerEmail}.`)
      } else {
        setAssignmentStatus("Driver assigned, but no passenger email was available to notify.")
      }

      setAssignmentBooking(null)
    } catch (err) {
      console.error("Error assigning driver:", err)
      setAssignmentError(err.message || "Unable to assign this driver. Please try again.")
    } finally {
      setAssigningDriverId(null)
    }
  }

  if (loading) {
    return (
      <section className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Bookings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and track all ride bookings.</p>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
            <p className="text-slate-600">Loading bookings...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Bookings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and track all ride bookings.</p>
        </div>

        <div className="panel p-8">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="space-y-5">
        <div className="panel p-5">
          <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Bookings Management</h2>
              <p className="text-sm text-slate-500 mt-1">Review rides, assess requirements, and manually assign a driver.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-[var(--brand-primary)]">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Total Bookings</p>
          </div>
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Completed</p>
          </div>
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Upcoming</p>
          </div>
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Cancelled</p>
          </div>
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{formatMoney(stats.revenue)}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Total Revenue</p>
          </div>
        </div>

        <div className="panel p-5 space-y-4">
          <input
            type="text"
            placeholder="Search by confirmation #, location, name, email, or phone..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
          />

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All Bookings", "bg-[var(--brand-primary)] text-white"],
              ["upcoming", "Upcoming", "bg-blue-600 text-white"],
              ["completed", "Completed", "bg-green-600 text-white"],
              ["cancelled", "Cancelled", "bg-red-600 text-white"],
            ].map(([value, label, activeClass]) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === value ? activeClass : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">Found {filteredBookings.length} booking(s)</p>
        </div>

        {filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map((booking) => {
              const isExpanded = selectedBooking?.id === booking.id
              const passengerName = getPassengerName(booking)
              const dateInfo = getBookingDateTime(booking)
              const pickupLocation = booking?.pickupLocation || booking?.pickupAddress || "N/A"
              const dropoffLocation = booking?.dropoffLocation || booking?.dropoffAddress || "N/A"
              const assignedDriver = booking?.assignedDriver || booking?.driver || null
              const vehicleName = booking?.vehicleCategory?.name || booking?.vehicle?.name || booking?.vehicleClass || "N/A"
              const stopLocations = Array.isArray(booking?.stopLocations) ? booking.stopLocations : []

              return (
                <article
                  key={booking.id}
                  onClick={() => setSelectedBooking(isExpanded ? null : booking)}
                  className="panel p-5 cursor-pointer hover:shadow-lg transition-all hover:border-[var(--brand-primary)]/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{booking.confNumber || booking.confirmationNumber || booking.id}</h3>
                        <StatusBadge status={booking.rideStatus} />
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{passengerName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{pickupLocation} → {dropoffLocation}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{dateInfo.dateText}{dateInfo.timeText ? ` at ${dateInfo.timeText}` : ""}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-sm">
                        <p className="text-slate-500 text-xs">Amount</p>
                        <p className="text-xl font-bold text-slate-900">{formatMoney(booking.totalAmount || booking.tripPrice)}</p>
                      </div>
                      <div className="text-sm">
                        <span className={`px-2.5 py-1 rounded text-xs font-semibold ${booking.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {booking.paymentStatus || "unpaid"}
                        </span>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          openAssignmentModal(booking)
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all"
                      >
                        {booking.assignedDriver || booking.driverId ? "Change Driver" : "Assign Driver"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Vehicle</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{vehicleName}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Passengers</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{booking.noOfPassengers ?? booking.passengerCount ?? "N/A"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Luggage</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{booking.luggage ?? booking.luggageCount ?? "N/A"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Driver</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{assignedDriver ? getDriverName(assignedDriver) : "Unassigned"}</p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100" onClick={(event) => event.stopPropagation()}>
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                        <div className="space-y-4 min-w-0">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Passenger Information</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-slate-500">Name</p>
                                <p className="font-medium text-slate-900 mt-0.5">{passengerName}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Phone</p>
                                <p className="font-medium text-slate-900 mt-0.5">{booking.passengerPhone || booking.user?.phone || booking.customer?.phone || "N/A"}</p>
                              </div>
                              <div className="col-span-2 flex items-center gap-2 text-sm text-slate-900">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <span>{booking.passengerEmail || booking.user?.email || booking.customer?.email || "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Trip Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-slate-500">Pickup</p>
                                <p className="font-medium text-slate-900 mt-0.5">{pickupLocation}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Dropoff</p>
                                <p className="font-medium text-slate-900 mt-0.5">{dropoffLocation}</p>
                              </div>
                              {stopLocations.length > 0 && (
                                <div className="col-span-2">
                                  <p className="text-slate-500">Stop Locations</p>
                                  <div className="space-y-1 mt-1">
                                    {stopLocations.map((stop, index) => (
                                      <p key={stop.id || `${stop.location}-${index}`} className="font-medium text-slate-900">• {stop.location || stop.address || stop.name}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Payment & Breakdown
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-slate-500">Trip Price</p>
                                <p className="font-medium text-slate-900 mt-0.5">{formatMoney(booking.tripPrice)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Platform Fee</p>
                                <p className="font-medium text-slate-900 mt-0.5">{formatMoney(booking.platformFee)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Child Seats Fee</p>
                                <p className="font-medium text-slate-900 mt-0.5">{formatMoney(booking.childSeatsFee)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Other Fees</p>
                                <p className="font-medium text-slate-900 mt-0.5">{formatMoney(booking.otherFees)}</p>
                              </div>
                              <div className="col-span-2 border-t pt-2 mt-2">
                                <p className="text-slate-500">Driver Receives</p>
                                <p className="font-semibold text-green-700 mt-0.5">{formatMoney(booking.driverAmount)}</p>
                              </div>
                            </div>
                          </div>

                          {assignedDriver && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900 mb-2">Assigned Driver</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-slate-500">Name</p>
                                  <p className="font-medium text-slate-900 mt-0.5">{getDriverName(assignedDriver)}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Phone</p>
                                  <p className="font-medium text-slate-900 mt-0.5">{assignedDriver.phone || assignedDriver.user?.phone || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Company</p>
                                  <p className="font-medium text-slate-900 mt-0.5">{assignedDriver.companyName || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Location</p>
                                  <p className="font-medium text-slate-900 mt-0.5">{assignedDriver.location || assignedDriver.user?.location || "N/A"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <aside className="flex h-[520px] flex-col overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-lg shadow-sky-100/60 xl:sticky xl:top-4 xl:h-[540px]">
                          <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-4 sm:px-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.24em] text-sky-600">Driver chat</p>
                                <h4 className="mt-1 text-lg font-semibold text-slate-900">{selectedChatDriverLabel}</h4>
                                <p className="mt-1 text-xs leading-5 text-slate-500">Assigned driver conversation for this booking.</p>
                              </div>
                              <span className={`mt-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${socketConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                {socketConnected ? "Connected" : "Offline"}
                              </span>
                            </div>
                          </div>

                          <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-5">
                            {!selectedChatDriverUserId ? (
                              <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                Assign a driver to this booking to start chatting.
                              </p>
                            ) : null}

                            {chatStatus ? (
                              <p className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{chatStatus}</p>
                            ) : null}

                            {chatError ? (
                              <p className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{chatError}</p>
                            ) : null}

                            <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-sky-100 bg-sky-50/60 p-3">
                              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                                <span>History</span>
                                <span>{chatMessages.length} message{chatMessages.length === 1 ? "" : "s"}</span>
                              </div>

                              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                                {chatLoading ? (
                                  <div className="flex flex-1 items-center justify-center py-10 text-slate-500 gap-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Loading chat history...
                                  </div>
                                ) : chatMessages.length > 0 ? (
                                  chatMessages.map((message, index) => {
                                    const messageId = getMessageId(message) || `${index}-${message.createdAt || message.text || index}`
                                    const fromAdmin = isAdminMessage(message)

                                    return (
                                      <div
                                        key={messageId}
                                        className={`rounded-3xl px-3.5 py-3 text-sm shadow-sm ${fromAdmin ? "ml-auto max-w-[88%] bg-sky-500 text-white" : "mr-auto max-w-[88%] bg-white text-slate-800 border border-sky-100"}`}
                                      >
                                        <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-75">
                                          <span>{fromAdmin ? "Admin" : message.sender?.firstName || message.sender?.name || "Driver"}</span>
                                          <span>{formatMessageTime(message.createdAt || message.timestamp)}</span>
                                        </div>
                                        <p className="whitespace-pre-wrap leading-6">{message.text || message.message || ""}</p>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <div className="flex flex-1 items-center justify-center rounded-[20px] border border-dashed border-sky-200 bg-white px-4 py-10 text-center text-xs leading-5 text-slate-500">
                                    No messages yet. Start the conversation from here.
                                  </div>
                                )}
                              </div>
                            </div>

                            <form className="flex mt-4 space-y-1" onSubmit={sendDriverMessage}>
                              <textarea
                                value={chatInput}
                                onChange={(event) => setChatInput(event.target.value)}
                                rows="1"
                                placeholder="Type a message to the driver..."
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400"
                              
                              />
                              <div className="flex items-center justify-between gap-3">
                                {/* <p className="text-xs leading-5 text-slate-500">You chat is lived</p> */}
                                <button
                                  type="submit"
                                  disabled={chatSending || !selectedChatDriverUserId || !chatInput.trim()}
                                  className="inline-flex items-center gap-2 rounded-3xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {chatSending ? "Sending..." : "Send"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </aside>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-4">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Click again to collapse</span>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="panel p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No bookings found matching your criteria.</p>
          </div>
        )}
      </section>

      {assignmentBooking && assignmentRequirements && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={closeAssignmentModal}>
          <div className="w-full max-w-7xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Manual driver assignment</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">
                  Assign driver to {assignmentBooking.confNumber || assignmentBooking.confirmationNumber || assignmentBooking.id}
                </h3>
              </div>
              <button
                onClick={closeAssignmentModal}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all grid place-items-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] max-h-[calc(90vh-73px)] overflow-hidden">
              <aside className="overflow-y-auto border-r border-slate-100 p-5 space-y-4 bg-slate-50/60">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Booking requirements</h4>
                  <p className="text-xs text-slate-500 mt-1">Choose a driver who matches the ride requirements below.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Vehicle class</p>
                    <p className="font-semibold text-slate-900 mt-1">{assignmentRequirements.vehicleClass}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Passengers</p>
                    <p className="font-semibold text-slate-900 mt-1">{assignmentRequirements.passengers || "N/A"}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Luggage</p>
                    <p className="font-semibold text-slate-900 mt-1">{assignmentRequirements.luggage || "N/A"}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                    <p className="font-semibold text-slate-900 mt-1">{assignmentRequirements.status}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-slate-100 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Pickup</p>
                    <p className="font-medium text-slate-900 mt-1">{assignmentRequirements.pickupLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Dropoff</p>
                    <p className="font-medium text-slate-900 mt-1">{assignmentRequirements.dropoffLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Payment status</p>
                    <p className="font-medium text-slate-900 mt-1">{assignmentRequirements.paymentStatus}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-primary)]/10 p-4 text-sm text-slate-700 space-y-2">
                  <p className="font-semibold text-slate-900">Assignment rules</p>
                  <p>We only use basic assignment requirements now: verification, onboarding, and availability.</p>
                  <p>Vehicle class, capacity, and location are shown for context only and do not block assignment.</p>
                </div>

                {driversError && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{driversError}</p>
                  </div>
                )}
              </aside>

              <section className="overflow-y-auto p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={driverSearchTerm}
                      onChange={(event) => setDriverSearchTerm(event.target.value)}
                      placeholder="Search by driver, company, vehicle, or location..."
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </div>
                  <div className="text-sm text-slate-500">
                    {assignmentDrivers.length} driver(s) shown
                  </div>
                </div>

                {driversLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
                      <p className="text-slate-600">Loading drivers...</p>
                    </div>
                  </div>
                ) : assignmentDrivers.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {assignmentDrivers.map(({ driver, eligible, score, reasons, checks }) => {
                      const driverName = getDriverName(driver)
                      const vehicleLabel = getDriverVehicleLabel(driver)
                      const vehicleCapacity = getDriverCapacity(driver)
                      const verification = driver?.user?.isVerified ?? driver?.isVerified
                      const onboarded = driver?.user?.onboardingCompleted ?? driver?.onboardingCompleted
                      const available = driver?.available ?? driver?.user?.available

                      return (
                        <article
                          key={driver.id}
                          className={`rounded-2xl border p-4 transition-all ${eligible ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-slate-900">{driverName}</h4>
                              <p className="text-sm text-slate-500 mt-1">{driver.companyName || driver.company || "Independent driver"} · {driver.location || driver.user?.location || "Location not listed"}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                                <span className={`px-2 py-1 rounded-full ${verification ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                  {verification ? "Verified" : "Unverified"}
                                </span>
                                <span className={`px-2 py-1 rounded-full ${available !== false ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                                  {available !== false ? "Available" : "Unavailable"}
                                </span>
                                <span className={`px-2 py-1 rounded-full ${onboarded ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}`}>
                                  {onboarded ? "Onboarded" : "Pending onboarding"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-500 uppercase tracking-wide">Fit score</p>
                              <p className={`text-2xl font-bold ${eligible ? "text-emerald-600" : "text-slate-700"}`}>{score}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-xl bg-white border border-slate-100 p-3">
                              <p className="text-xs text-slate-500 uppercase tracking-wide">Vehicle</p>
                              <p className="font-semibold text-slate-900 mt-1">{vehicleLabel}</p>
                            </div>
                            <div className="rounded-xl bg-white border border-slate-100 p-3">
                              <p className="text-xs text-slate-500 uppercase tracking-wide">Class</p>
                              <p className="font-semibold text-slate-900 mt-1">{driver.vehicleClass || driver.vehicle?.classType || "N/A"}</p>
                            </div>
                            <div className="rounded-xl bg-white border border-slate-100 p-3">
                              <p className="text-xs text-slate-500 uppercase tracking-wide">Capacity</p>
                              <p className="font-semibold text-slate-900 mt-1">{vehicleCapacity.passengers || "N/A"} pax · {vehicleCapacity.luggage || "N/A"} bags</p>
                            </div>
                            <div className="rounded-xl bg-white border border-slate-100 p-3">
                              <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
                              <p className="font-semibold text-slate-900 mt-1">{driver.phone || driver.user?.phone || "N/A"}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2 text-xs">
                              {checks.map((check) => (
                                <span key={check.label} className={`px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${check.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                  {check.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                  {check.label}
                                </span>
                              ))}
                            </div>

                            <button
                              onClick={() => handleAssignDriver(driver)}
                              disabled={!eligible || assigningDriverId === driver.id}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${eligible ? "bg-[var(--brand-primary)] text-white hover:opacity-95" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                            >
                              {assigningDriverId === driver.id ? "Assigning..." : eligible ? "Assign driver" : "Basic requirement missing"}
                            </button>
                          </div>

                          {!eligible && reasons.length > 0 && (
                            <p className="mt-3 text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100 px-3 py-2">
                              {reasons.join(" · ")}
                            </p>
                          )}
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No drivers match the current search.</p>
                  </div>
                )}
              </section>
            </div>

            {assignmentError && (
              <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{assignmentError}</span>
              </div>
            )}

            {assignmentStatus && !assignmentError && (
              <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{assignmentStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
