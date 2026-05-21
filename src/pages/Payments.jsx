import { createElement, useMemo } from "react"
import { AlertCircle, CircleDollarSign, ShieldCheck, Ticket } from "lucide-react"
import { useOps } from "../context/OpsContext"

function formatMoney(value) {
  const amount = Number(value || 0)
  return `$${amount.toFixed(0)}`
}

function normalizeStatus(status) {
  return String(status || "unknown").trim().toLowerCase()
}

function getStatusTone(status) {
  const normalized = normalizeStatus(status)

  if (normalized === "completed") return "bg-emerald-100 text-emerald-700"
  if (normalized === "authorized") return "bg-blue-100 text-blue-700"
  if (normalized === "pending") return "bg-amber-100 text-amber-700"
  if (normalized.includes("follow-up") || normalized.includes("manual")) return "bg-rose-100 text-rose-700"

  return "bg-slate-100 text-slate-700"
}

function StatCard({ title, value, description, icon: IconComponent, tone }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl grid place-items-center ${tone}`}>
          {createElement(IconComponent, { size: 20 })}
        </div>
      </div>
    </article>
  )
}

export default function Payments() {
  const { trips } = useOps()

  const paymentTrips = trips.filter((trip) => trip.payment)

  const summary = useMemo(() => {
    const totalAmount = paymentTrips.reduce((sum, trip) => sum + Number(trip.payment?.totalAmountCharged || 0), 0)
    const completedCount = paymentTrips.filter((trip) => normalizeStatus(trip.payment?.status) === "completed").length
    const pendingCount = paymentTrips.filter((trip) => normalizeStatus(trip.payment?.status) === "pending").length
    const attentionCount = paymentTrips.filter((trip) => {
      const status = normalizeStatus(trip.payment?.status)
      return status.includes("follow-up") || status.includes("manual")
    }).length

    return { totalAmount, completedCount, pendingCount, attentionCount }
  }, [paymentTrips])

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-xl font-semibold text-slate-900">Booking payment records</h2>
        <p className="text-sm text-slate-500 mt-1">Track the payment amount and status for each booking in the system.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total bookings" value={paymentTrips.length} description="Bookings with payment records" icon={Ticket} tone="bg-blue-50 text-blue-600" />
        <StatCard title="Total amount" value={formatMoney(summary.totalAmount)} description="Combined charged amount" icon={CircleDollarSign} tone="bg-emerald-50 text-emerald-600" />
        <StatCard title="Completed payments" value={summary.completedCount} description="Payments marked completed" icon={ShieldCheck} tone="bg-emerald-50 text-emerald-600" />
        <StatCard title="Needs attention" value={summary.attentionCount || summary.pendingCount} description="Pending or follow-up payments" icon={AlertCircle} tone="bg-rose-50 text-rose-600" />
      </div>

      <article className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Booking Number</th>
                <th className="px-4 py-3 text-left font-semibold">Payment Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentTrips.length ? (
                paymentTrips.map((trip) => (
                  <tr key={trip.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-[var(--brand-primary)]">{trip.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(trip.payment.totalAmountCharged)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusTone(trip.payment.status)}`}>
                        {trip.payment.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-100">
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
