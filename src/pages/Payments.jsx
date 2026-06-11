import { createElement, useEffect, useMemo, useState } from "react"
import { AlertCircle, CircleDollarSign, Loader, ShieldCheck, Ticket } from "lucide-react"
import apiService from "../services/api"

function formatMoney(value) {
  const amount = Number(value || 0)
  return `$${amount.toFixed(2)}`
}

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function getStatusTone(status) {
  const s = String(status || "").toLowerCase()
  if (s === "paid") return "bg-emerald-100 text-emerald-700"
  if (s === "pending") return "bg-amber-100 text-amber-700"
  if (s === "failed") return "bg-red-100 text-red-700"
  if (s === "refunded") return "bg-blue-100 text-blue-700"
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
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await apiService.getAdminPayments()
        const records = Array.isArray(res?.data) ? res.data : []
        setPayments(records)
      } catch (err) {
        setError(err.message || "Failed to load payment records.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const summary = useMemo(() => {
    const totalRevenue = payments
      .filter((p) => p.paymentStatus === "paid")
      .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)
    const paidCount = payments.filter((p) => p.paymentStatus === "paid").length
    const attentionCount = payments.filter((p) => p.paymentStatus === "pending" || p.paymentStatus === "failed").length
    return { totalRevenue, paidCount, attentionCount }
  }, [payments])

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-xl font-semibold text-slate-900">Payment Records</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time payment data from Stripe — only bookings with an actual payment intent are shown.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total records" value={loading ? "—" : payments.length} description="Bookings with a payment intent" icon={Ticket} tone="bg-blue-50 text-blue-600" />
        <StatCard title="Total revenue" value={loading ? "—" : formatMoney(summary.totalRevenue)} description="Sum of paid transactions" icon={CircleDollarSign} tone="bg-emerald-50 text-emerald-600" />
        <StatCard title="Paid" value={loading ? "—" : summary.paidCount} description="Payments confirmed as paid" icon={ShieldCheck} tone="bg-emerald-50 text-emerald-600" />
        <StatCard title="Needs attention" value={loading ? "—" : summary.attentionCount} description="Pending or failed payments" icon={AlertCircle} tone="bg-rose-50 text-rose-600" />
      </div>

      <article className="panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader size={18} className="animate-spin" />
            <span className="text-sm">Loading payment records…</span>
          </div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-red-600 text-sm">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Conf #</th>
                  <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
                  <th className="px-4 py-3 text-left font-semibold">Total</th>
                  <th className="px-4 py-3 text-left font-semibold">Platform Fee</th>
                  <th className="px-4 py-3 text-left font-semibold">Driver Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length ? (
                  payments.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--brand-primary)]">{p.confNumber || p.id}</td>
                      <td className="px-4 py-3 text-slate-700">{p.vehicleCategory?.name || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(p.totalAmount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(p.platformFee)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(p.driverAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusTone(p.paymentStatus)}`}>
                          {p.paymentStatus || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-100">
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No payment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  )
}
