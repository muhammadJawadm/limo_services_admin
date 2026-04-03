import { createElement } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarClock, CarFront, CheckCircle2, UserRoundMinus } from "lucide-react"
import { useOps } from "../context/OpsContext"

function StatTile({ title, value, icon: Icon, tone }) {
  return (
    <article className="panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl grid place-items-center ${tone}`}>
          {createElement(Icon, { size: 20 })}
        </div>
      </div>
    </article>
  )
}

export default function Dashboard() {
  const { trips, summary, driversById, alerts } = useOps()
  const navigate = useNavigate()

  return (
    <section className="space-y-5">
      <div className="hero-strip p-6">
        <h2 className="text-2xl font-semibold text-white">Admin dashboard</h2>
        <p className="text-sm text-white/80 mt-2">
          Upcoming, active, unassigned, and completed trips with immediate assignment and reassignment visibility.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile title="Upcoming Trips" value={summary.upcomingTrips} icon={CalendarClock} tone="bg-blue-100 text-blue-700" />
        <StatTile title="Active Trips" value={summary.activeTrips} icon={CarFront} tone="bg-amber-100 text-amber-700" />
        <StatTile title="Unassigned Trips" value={summary.unassignedTrips} icon={UserRoundMinus} tone="bg-rose-100 text-rose-700" />
        <StatTile title="Completed Trips" value={summary.completedTrips} icon={CheckCircle2} tone="bg-emerald-100 text-emerald-700" />
      </div>

      <article className="panel overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Trips overview</h3>
          <p className="text-xs text-slate-500 mt-1">Each trip includes required identifiers, locations, class/type, status, and assignment status.</p>
        </div>
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
                <th className="px-4 py-3 text-left font-semibold">Driver Assignment</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr 
                  key={trip.id} 
                  className="border-t border-slate-100 hover:bg-slate-50/70 cursor-pointer"
                  onClick={() => navigate(`/bookings/${trip.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-[var(--brand-primary)]">
                    {trip.id}
                  </td>
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

      <article className="panel p-5">
        <h3 className="font-semibold text-slate-900">Realtime alerts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {alerts.length === 0 && <p className="text-sm text-slate-500">No cancellation or reassignment alerts right now.</p>}
          {alerts.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
              <p className="text-xs text-slate-400 mt-2">{item.time}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
