import { createElement, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarClock, CarFront, CheckCircle2, UserRoundMinus } from "lucide-react"
import { useOps } from "../context/OpsContext"

function statusLabel(status) {
  return {
    pending_assignment: "Pending Assignment",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  }[status] || status
}

function barWidth(value, maxValue) {
  if (maxValue === 0) {
    return "0%"
  }
  return `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%`
}

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
  const { trips, summary, driversById, alerts, newRideQueue } = useOps()
  const navigate = useNavigate()

  const statusBreakdown = useMemo(() => {
    const statuses = [
      { key: "pending_assignment", label: "Pending", tone: "bg-rose-500" },
      { key: "assigned", label: "Assigned", tone: "bg-blue-500" },
      { key: "in_progress", label: "In Progress", tone: "bg-amber-500" },
      { key: "completed", label: "Completed", tone: "bg-emerald-500" },
      { key: "cancelled", label: "Cancelled", tone: "bg-slate-500" },
    ]

    const data = statuses.map((status) => ({
      ...status,
      value: trips.filter((trip) => trip.status === status.key).length,
    }))

    return {
      items: data,
      max: Math.max(...data.map((item) => item.value), 0),
    }
  }, [trips])

  const vehicleClassBreakdown = useMemo(() => {
    const grouped = trips.reduce((acc, trip) => {
      acc[trip.vehicleClass] = (acc[trip.vehicleClass] || 0) + 1
      return acc
    }, {})

    const items = Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)

    return {
      items,
      max: Math.max(...items.map((item) => item.value), 0),
    }
  }, [trips])

  const tripTypeBreakdown = useMemo(() => {
    const grouped = trips.reduce((acc, trip) => {
      acc[trip.tripType] = (acc[trip.tripType] || 0) + 1
      return acc
    }, {})

    const total = trips.length || 1

    return Object.entries(grouped)
      .map(([label, value]) => ({
        label,
        value,
        percent: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
  }, [trips])

  const weeklyTrend = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      return {
        key,
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        value: 0,
      }
    })

    const countMap = trips.reduce((acc, trip) => {
      const key = new Date(trip.pickupDateTime).toISOString().slice(0, 10)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const items = days.map((day) => ({
      ...day,
      value: countMap[day.key] || 0,
    }))

    const max = Math.max(...items.map((item) => item.value), 0)
    const points = items.map((item, index) => {
      const x = (index / 6) * 100
      const y = max === 0 ? 95 : 95 - (item.value / max) * 75
      return `${x},${y}`
    }).join(" ")

    return { items, points, max }
  }, [trips])

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <article className="panel p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Trips status distribution</h3>
            <span className="text-xs text-slate-500">Total: {trips.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {statusBreakdown.items.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${item.tone}`} style={{ width: barWidth(item.value, statusBreakdown.max) }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel p-5">
          <h3 className="font-semibold text-slate-900">Queue pressure</h3>
          <p className="text-xs text-slate-500 mt-1">Pending trips waiting for assignment</p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-3xl font-bold text-[var(--brand-primary)]">{newRideQueue.length}</p>
            <p className="text-xs text-slate-500 mt-1">New ride requests in queue</p>
            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600"
                style={{ width: `${Math.min((newRideQueue.length / Math.max(trips.length, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {tripTypeBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value} ({item.percent}%)</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel p-5">
          <h3 className="font-semibold text-slate-900">Vehicle class demand</h3>
          <p className="text-xs text-slate-500 mt-1">Trip count by requested vehicle class</p>
          <div className="mt-4 space-y-3">
            {vehicleClassBreakdown.items.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)]" style={{ width: barWidth(item.value, vehicleClassBreakdown.max) }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">7-day pickup trend</h3>
            <span className="text-xs text-slate-500">Peak: {weeklyTrend.max}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Trips scheduled per day</p>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <svg viewBox="0 0 100 100" className="w-full h-36">
              <polyline fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" points="0,95 100,95" />
              <polyline fill="none" stroke="rgba(45, 75, 140, 0.95)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" points={weeklyTrend.points} />
              {weeklyTrend.items.map((item, index) => {
                const x = (index / 6) * 100
                const y = weeklyTrend.max === 0 ? 95 : 95 - (item.value / weeklyTrend.max) * 75
                return <circle key={item.key} cx={x} cy={y} r="1.8" fill="rgba(27, 45, 93, 1)" />
              })}
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2 text-center">
            {weeklyTrend.items.map((item) => (
              <div key={item.key}>
                <p className="text-[11px] text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
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
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{statusLabel(trip.status)}</span></td>
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
