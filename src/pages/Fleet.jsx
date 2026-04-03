import { fleet, statusPill } from "../data/limoStore"

export default function Fleet() {
  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-xl font-semibold text-slate-900">Fleet Management</h2>
        <p className="text-sm text-slate-500 mt-1">Control limo inventory, utilization, and maintenance readiness across service areas.</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100/80 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Vehicle ID</th>
                <th className="px-4 py-3 text-left font-semibold">Model</th>
                <th className="px-4 py-3 text-left font-semibold">Class</th>
                <th className="px-4 py-3 text-left font-semibold">City</th>
                <th className="px-4 py-3 text-left font-semibold">Utilization</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{vehicle.id}</p>
                    <p className="text-xs text-slate-400 mt-1">{vehicle.plate}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.model}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.classType}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.city}</td>
                  <td className="px-4 py-3">
                    <div className="w-36 rounded-full h-2 bg-slate-100">
                      <div className="h-2 rounded-full bg-[var(--brand-primary)]" style={{ width: `${vehicle.utilization}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{vehicle.utilization}%</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusPill[vehicle.status] || "bg-slate-100 text-slate-700"}`}>
                      {vehicle.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
