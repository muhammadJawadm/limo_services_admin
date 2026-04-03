import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useOps } from "../context/OpsContext"
import { maskSensitive, money } from "../data/opsSeed"

const tripStatuses = ["Scheduled", "Assigned", "In Progress", "Completed", "Cancelled"]

export default function TripDetail() {
  const { tripId } = useParams()
  const { tripsById, auditLogs, getEligibleDrivers, assignDriver, unassignDriver, updateTripStatus, overridePrice, cancelTrip, driversById } = useOps()
  const [status, setStatus] = useState("")
  const [overrideValue, setOverrideValue] = useState("")
  const [overrideReason, setOverrideReason] = useState("")
  const [cancellationReason, setCancellationReason] = useState("")
  const [overrideRefund, setOverrideRefund] = useState("")
  const [vehicleClassFilter, setVehicleClassFilter] = useState("All")
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("All")
  const [driverStatusFilter, setDriverStatusFilter] = useState("All")
  const [availabilityFilter, setAvailabilityFilter] = useState("All")
  const [locationFilter, setLocationFilter] = useState("All")
  const [showEligibleOnly, setShowEligibleOnly] = useState(false)
  const [assignmentNotice, setAssignmentNotice] = useState("")

  const trip = tripsById[tripId]

  const eligibleDrivers = useMemo(() => {
    if (!trip) {
      return []
    }

    return getEligibleDrivers(trip).filter((driver) => {
      const matchesVehicleClass = vehicleClassFilter === "All" || driver.vehicle.classType === vehicleClassFilter
      const matchesVehicleStatus = vehicleStatusFilter === "All" || driver.vehicle.status === vehicleStatusFilter
      const matchesDriverStatus = driverStatusFilter === "All" || driver.status === driverStatusFilter
      const matchesAvailability = availabilityFilter === "All" || String(driver.available) === availabilityFilter
      const matchesLocation = locationFilter === "All" || driver.location === locationFilter
      const matchesEligibility = !showEligibleOnly || driver.eligible

      return matchesVehicleClass && matchesVehicleStatus && matchesDriverStatus && matchesAvailability && matchesLocation && matchesEligibility
    })
  }, [trip, getEligibleDrivers, vehicleClassFilter, vehicleStatusFilter, driverStatusFilter, availabilityFilter, locationFilter, showEligibleOnly])

  const tripAudit = useMemo(() => auditLogs.filter((log) => log.tripId === tripId), [auditLogs, tripId])

  if (!trip) {
    return (
      <section className="panel p-6">
        <h2 className="text-lg font-semibold text-slate-900">Trip not found</h2>
        <Link to="/bookings" className="text-sm text-[var(--brand-primary)] mt-2 inline-block">Back to bookings</Link>
      </section>
    )
  }

  const selectedDriver = trip.driverId ? driversById[trip.driverId] : null

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Trip detail view</p>
            <h2 className="text-2xl font-semibold text-slate-900 mt-1">{trip.id}</h2>
          </div>
          <Link to="/bookings" className="text-sm px-3 py-2 rounded-xl bg-slate-100 text-slate-700">Back to list</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Trip information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><span className="text-slate-500">Trip type:</span> {trip.tripType}</p>
            <p><span className="text-slate-500">Pickup date/time:</span> {new Date(trip.pickupDateTime).toLocaleString()}</p>
            <p><span className="text-slate-500">Pickup:</span> {trip.pickupAddress}</p>
            <p><span className="text-slate-500">Drop-off:</span> {trip.dropoffAddress}</p>
            <p><span className="text-slate-500">Estimated duration:</span> {trip.estimatedDurationMin} mins</p>
            <p><span className="text-slate-500">Estimated distance:</span> {trip.estimatedDistanceMiles} miles</p>
            {trip.tripType === "Hourly" && <p><span className="text-slate-500">Hourly duration:</span> {trip.hourlyDurationHours} hour(s)</p>}
          </div>
          <div>
            <p className="text-sm text-slate-500">Additional stops</p>
            <ul className="text-sm text-slate-700 mt-1 list-disc pl-5">
              {trip.additionalStops.length === 0 && <li>None</li>}
              {trip.additionalStops.map((stop) => <li key={stop}>{stop}</li>)}
            </ul>
          </div>
        </article>

        <article className="panel p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Customer information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><span className="text-slate-500">Name:</span> {trip.customer.name}</p>
            <p><span className="text-slate-500">Phone:</span> {maskSensitive(trip.customer.phone, 3, 2)}</p>
            <p><span className="text-slate-500">Email:</span> {maskSensitive(trip.customer.email, 2, 10)}</p>
            <p><span className="text-slate-500">Vehicle class:</span> {trip.vehicleClass}</p>
          </div>
          <p className="text-sm"><span className="text-slate-500">Special instructions:</span> {trip.customer.specialInstructions}</p>
          <p className="text-sm"><span className="text-slate-500">Trip options:</span> {trip.customer.options.join(", ")}</p>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Pricing and quote details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="text-slate-500">Base fare:</span> {money(trip.pricing.baseFare)}</p>
            <p><span className="text-slate-500">Per-mile rate:</span> {trip.pricing.perMileRate ? money(trip.pricing.perMileRate) : "N/A"}</p>
            <p><span className="text-slate-500">Hourly rate:</span> {trip.pricing.hourlyRate ? money(trip.pricing.hourlyRate) : "N/A"}</p>
            <p><span className="text-slate-500">Wait-time charge:</span> {money(trip.pricing.waitTimeCharge)}</p>
            <p><span className="text-slate-500">Toll charges:</span> {money(trip.pricing.tollCharge)}</p>
            <p><span className="text-slate-500">Minimum fare applied:</span> {trip.pricing.minimumFareApplied ? "Yes" : "No"}</p>
          </div>
          <p className="text-sm font-semibold text-slate-900">Total quoted price: {money(trip.pricing.totalQuotedPrice)}</p>

          <div className="border-t pt-3">
            <p className="text-sm font-medium text-slate-700 mb-2">Override pricing</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input type="number" value={overrideValue} onChange={(event) => setOverrideValue(event.target.value)} placeholder="New total quote" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Override reason" className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
            </div>
            <button
              onClick={() => {
                if (!overrideValue) return
                overridePrice(trip.id, overrideValue)
                if (overrideReason) {
                  setCancellationReason(overrideReason)
                }
                setOverrideValue("")
                setOverrideReason("")
              }}
              className="mt-2 px-3 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm"
            >
              Apply manual override
            </button>
          </div>
        </article>

        <article className="panel p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Payment and billing visibility</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="text-slate-500">Method:</span> {trip.payment.method}</p>
            <p><span className="text-slate-500">Credit verification:</span> {trip.payment.cardVerified ? "ID verified" : "Not verified"}</p>
            <p><span className="text-slate-500">Payment status:</span> {trip.payment.status}</p>
            <p><span className="text-slate-500">Total charged:</span> {money(trip.payment.totalAmountCharged)}</p>
          </div>
        </article>
      </div>

      <article className="panel p-5 space-y-3">
        <h3 className="font-semibold text-slate-900">Driver assignment and management</h3>
        <div className="text-sm text-slate-700">
          {selectedDriver ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><span className="text-slate-500">Assigned driver:</span> {selectedDriver.name}</p>
              <p><span className="text-slate-500">Driver phone:</span> {maskSensitive(selectedDriver.phone, 4, 2)}</p>
              <p><span className="text-slate-500">Vehicle:</span> {selectedDriver.vehicle.make} {selectedDriver.vehicle.model} ({selectedDriver.vehicle.year})</p>
              <p><span className="text-slate-500">Driver verification:</span> {selectedDriver.verificationStatus}</p>
            </div>
          ) : (
            <p className="text-rose-600 font-medium">Trip is unassigned</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <select value={vehicleClassFilter} onChange={(event) => setVehicleClassFilter(event.target.value)} className="rounded-xl border border-slate-200 px-2 py-2 text-sm"><option>All</option><option>Business Sedan</option><option>Premium Sedan</option><option>Premium SUV</option></select>
          <select value={vehicleStatusFilter} onChange={(event) => setVehicleStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-2 py-2 text-sm"><option>All</option><option>Available</option><option>On Trip</option><option>Unavailable</option></select>
          <select value={driverStatusFilter} onChange={(event) => setDriverStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-2 py-2 text-sm"><option>All</option><option>Online</option><option>On Trip</option><option>Offline</option></select>
          <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)} className="rounded-xl border border-slate-200 px-2 py-2 text-sm"><option value="All">All</option><option value="true">Available</option><option value="false">Not available</option></select>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="rounded-xl border border-slate-200 px-2 py-2 text-sm"><option>All</option><option>Los Angeles</option><option>San Francisco</option><option>Houston</option><option>New York</option></select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
          <p className="text-slate-700">
            Assignment rules: Approved driver, matching vehicle class, available status, and 2-hour scheduling buffer.
          </p>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={showEligibleOnly} onChange={(event) => setShowEligibleOnly(event.target.checked)} />
            Show eligible only
          </label>
        </div>

        <p className="text-sm text-slate-600">
          Eligible now: {eligibleDrivers.filter((driver) => driver.eligible).length} / {eligibleDrivers.length}
        </p>

        {assignmentNotice && <p className="text-sm text-rose-600">{assignmentNotice}</p>}

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Driver</th>
                <th className="px-3 py-2 text-left">Vehicle</th>
                <th className="px-3 py-2 text-left">Verification</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Eligibility</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {eligibleDrivers.map((driver) => (
                <tr key={driver.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{driver.name}</td>
                  <td className="px-3 py-2">{driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.classType})</td>
                  <td className="px-3 py-2">{driver.verificationStatus}</td>
                  <td className="px-3 py-2">{driver.status} / {driver.available ? "Available" : "Not available"}</td>
                  <td className="px-3 py-2">{driver.eligible ? "Eligible" : driver.reasons.join("; ")}</td>
                  <td className="px-3 py-2">
                    <button
                      disabled={!driver.eligible}
                      onClick={() => {
                        const result = assignDriver(trip.id, driver.id)
                        setAssignmentNotice(result.ok ? `Assigned ${driver.name} successfully.` : result.message)
                      }}
                      className="px-2 py-1 rounded-lg text-xs bg-[var(--brand-primary)] text-white disabled:opacity-40"
                    >
                      {trip.driverId ? "Reassign" : "Assign"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <select value={status || trip.status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{tripStatuses.map((item) => <option key={item}>{item}</option>)}</select>
          <button onClick={() => updateTripStatus(trip.id, status || trip.status)} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Update trip status</button>
          <button onClick={() => cancelTrip({ tripId: trip.id, requestedBy: "admin", reason: "Admin canceled assigned ride" })} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-sm">Cancel this ride</button>
          {trip.driverId && (
             <button onClick={() => unassignDriver(trip.id, "admin", "Admin unassigned driver")} className="px-3 py-2 rounded-xl bg-amber-500 text-white text-sm">Unassign driver</button>
          )}
        </div>
      </article>

      <article className="panel p-5 space-y-3">
        <h3 className="font-semibold text-slate-900">Cancellation and refund policy</h3>
        <p className="text-sm text-slate-600">Standard rules: 50% refund when 30 minutes or less before pickup, and 100% refund when more than 30 minutes before pickup.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Cancellation reason" />
          <input type="number" min="0" max="100" value={overrideRefund} onChange={(event) => setOverrideRefund(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Override refund %" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => cancelTrip({ tripId: trip.id, requestedBy: "customer", approved: true, reason: cancellationReason, overrideRefundPercent: overrideRefund || null })} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm">Approve customer cancellation</button>
          <button onClick={() => cancelTrip({ tripId: trip.id, requestedBy: "customer", approved: false, reason: cancellationReason })} className="px-3 py-2 rounded-xl bg-amber-500 text-white text-sm">Deny customer cancellation</button>
          <button onClick={() => {
            // Unassign instead of full cancellation to allow re-assignment by admin as per requirement.
            unassignDriver(trip.id, "driver", cancellationReason || "Driver cancelled assignment");
            setCancellationReason("")
          }} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-sm">Driver cancelled (Unassign & Alert)</button>
        </div>
      </article>

      <article className="panel p-5">
        <h3 className="font-semibold text-slate-900">Admin and audit handling</h3>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Who cancelled</th>
                <th className="px-3 py-2 text-left">Fee applied</th>
                <th className="px-3 py-2 text-left">Refund %</th>
                <th className="px-3 py-2 text-left">When</th>
              </tr>
            </thead>
            <tbody>
              {tripAudit.length === 0 && (
                <tr><td className="px-3 py-3 text-slate-500" colSpan={5}>No audit records yet for this trip.</td></tr>
              )}
              {tripAudit.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{entry.actionType}</td>
                  <td className="px-3 py-2">{entry.cancelledBy || "-"}</td>
                  <td className="px-3 py-2">{entry.feeApplied != null ? money(entry.feeApplied) : "-"}</td>
                  <td className="px-3 py-2">{entry.refundPercent != null ? `${entry.refundPercent}%` : "-"}</td>
                  <td className="px-3 py-2">{new Date(entry.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
