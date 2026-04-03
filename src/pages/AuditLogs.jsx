import { useOps } from "../context/OpsContext"
import { money } from "../data/opsSeed"

export default function AuditLogs() {
  const { auditLogs } = useOps()

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-xl font-semibold text-slate-900">Security and admin audit logs</h2>
        <p className="text-sm text-slate-500 mt-1">Every admin action on trips, status, pricing, and cancellations is recorded for traceability.</p>
      </div>

      <article className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
                <th className="px-4 py-3 text-left font-semibold">Trip</th>
                <th className="px-4 py-3 text-left font-semibold">Actor</th>
                <th className="px-4 py-3 text-left font-semibold">Who Cancelled</th>
                <th className="px-4 py-3 text-left font-semibold">Fee Applied</th>
                <th className="px-4 py-3 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">{entry.actionType}</td>
                  <td className="px-4 py-3">{entry.tripId}</td>
                  <td className="px-4 py-3">{entry.actor}</td>
                  <td className="px-4 py-3">{entry.cancelledBy || "-"}</td>
                  <td className="px-4 py-3">{entry.feeApplied != null ? money(entry.feeApplied) : "-"}</td>
                  <td className="px-4 py-3">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
