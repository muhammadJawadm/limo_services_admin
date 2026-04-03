import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useOps } from "../context/OpsContext"

const statusOptions = ["All", "Scheduled", "Assigned", "In Progress", "Completed", "Cancelled"]

export default function Bookings() {
  const { trips, driversById } = useOps()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const [vehicleClass, setVehicleClass] = useState("All")
  const [assignment, setAssignment] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const vehicleClasses = useMemo(() => ["All", ...new Set(trips.map((trip) => trip.vehicleClass))], [trips])

  const filtered = useMemo(() => {
    return trips.filter((trip) => {
      const tripDate = new Date(trip.pickupDateTime)
      const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
      const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null

      const matchesDate = (!from || tripDate >= from) && (!to || tripDate <= to)
      const matchesStatus = status === "All" || trip.status === status
      const matchesVehicle = vehicleClass === "All" || trip.vehicleClass === vehicleClass
      const matchesAssignment =
        assignment === "All" ||
        (assignment === "Assigned" ? Boolean(trip.driverId) : !trip.driverId)

      const searchText = `${trip.id} ${trip.customer.name} ${trip.pickupAddress}`.toLowerCase()
      const matchesSearch = searchText.includes(search.toLowerCase())

      return matchesDate && matchesStatus && matchesVehicle && matchesAssignment && matchesSearch
    })
  }, [trips, dateFrom, dateTo, status, vehicleClass, assignment, search])

  return (
    <section className="space-y-5">
      <div className="panel p-5 space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Trip search and filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Search by customer, trip ID, pickup address" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{statusOptions.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={vehicleClass} onChange={(event) => setVehicleClass(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{vehicleClasses.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={assignment} onChange={(event) => setAssignment(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option>All</option>
            <option>Assigned</option>
            <option>Unassigned</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
      </div>

      <article className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Trip ID</th>
                <th className="px-4 py-3 text-left font-semibold">Pickup Date & Time</th>
                <th className="px-4 py-3 text-left font-semibold">Pickup</th>
                <th className="px-4 py-3 text-left font-semibold">Drop-off</th>
                <th className="px-4 py-3 text-left font-semibold">Vehicle Class</th>
                <th className="px-4 py-3 text-left font-semibold">Trip Type</th>
                <th className="px-4 py-3 text-left font-semibold">Trip Status</th>
                <th className="px-4 py-3 text-left font-semibold">Driver Assignment Status</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trip) => (
                <tr 
                  key={trip.id} 
                  className="border-t border-slate-100 hover:bg-slate-50/70 cursor-pointer"
                  onClick={() => navigate(`/bookings/${trip.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-[var(--brand-primary)]">{trip.id}</td>
                  <td className="px-4 py-3 text-slate-700">{new Date(trip.pickupDateTime).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{trip.pickupAddress}</td>
                  <td className="px-4 py-3 text-slate-700">{trip.dropoffAddress}</td>
                  <td className="px-4 py-3 text-slate-700">{trip.vehicleClass}</td>
                  <td className="px-4 py-3 text-slate-700">{trip.tripType}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{trip.status}</span></td>
                  <td className="px-4 py-3 text-slate-700">{trip.driverId ? `Assigned (${driversById[trip.driverId]?.name || trip.driverId})` : "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
