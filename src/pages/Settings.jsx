export default function Settings() {
  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-xl font-semibold text-slate-900">Platform Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Configure dispatch, corporate accounts, notifications, and SLA settings.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel p-5">
          <h3 className="text-base font-semibold text-slate-800">Dispatch Rules</h3>
          <ul className="mt-3 text-sm text-slate-600 space-y-2">
            <li>Nearest premium vehicle matching rider preference</li>
            <li>Assign chauffeurs with rating above 4.7 for VIP rides</li>
            <li>Auto-escalate unassigned booking after 90 seconds</li>
          </ul>
        </article>

        <article className="panel p-5">
          <h3 className="text-base font-semibold text-slate-800">Corporate Accounts</h3>
          <ul className="mt-3 text-sm text-slate-600 space-y-2">
            <li>Monthly invoicing cycle set to 30 days</li>
            <li>Top accounts: Helix Group, North Peak Ventures, Omni Hotels</li>
            <li>Billing contacts synced with finance dashboard</li>
          </ul>
        </article>

        <article className="panel p-5">
          <h3 className="text-base font-semibold text-slate-800">Notification Rules</h3>
          <ul className="mt-3 text-sm text-slate-600 space-y-2">
            <li>SMS for trip accepted and driver arrival</li>
            <li>Email receipt on trip completion</li>
            <li>Push alerts for delay above 7 minutes</li>
          </ul>
        </article>

        <article className="panel p-5">
          <h3 className="text-base font-semibold text-slate-800">Service Level Targets</h3>
          <ul className="mt-3 text-sm text-slate-600 space-y-2">
            <li>Pickup punctuality target: 96%</li>
            <li>Average assignment time target: under 55 seconds</li>
            <li>Customer satisfaction target: above 4.8 stars</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
