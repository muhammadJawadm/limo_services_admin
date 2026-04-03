import { useOps } from "../context/OpsContext"
import { money, maskSensitive } from "../data/opsSeed"

export default function Payments() {
  const { trips } = useOps()

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-xl font-semibold text-slate-900">Payment and billing visibility</h2>
        <p className="text-sm text-slate-500 mt-1">Payments land in admin account, then forwarded to drivers after reconciliation.</p>
      </div>

      <article className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Trip</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Payment Method</th>
                <th className="px-4 py-3 text-left font-semibold">Card Verification</th>
                <th className="px-4 py-3 text-left font-semibold">Payment Status</th>
                <th className="px-4 py-3 text-left font-semibold">Total Amount Charged</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-[var(--brand-primary)]">{trip.id}</td>
                  <td className="px-4 py-3">{maskSensitive(trip.customer.name, 2, 1)}</td>
                  <td className="px-4 py-3">{trip.payment.method}</td>
                  <td className="px-4 py-3">{trip.payment.method === "Credit Card" ? (trip.payment.cardVerified ? "ID verified" : "Not verified") : "N/A"}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{trip.payment.status}</span></td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{money(trip.payment.totalAmountCharged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
