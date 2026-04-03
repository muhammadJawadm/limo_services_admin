import { customers, toCurrency } from "../data/limoStore"

export default function Customers() {
  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-xl font-semibold text-slate-900">Customer Insights</h2>
        <p className="text-sm text-slate-500 mt-1">Review rider segments, lifetime value, and loyalty tiers for retention strategy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {customers.map((customer) => (
          <article key={customer.id} className="panel p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{customer.id}</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">{customer.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{customer.city}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--brand-soft)] text-[var(--brand-primary)] font-semibold">
                {customer.loyalty}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-400">Segment</p>
                <p className="font-medium text-slate-700 mt-1">{customer.segment}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-400">Rides</p>
                <p className="font-medium text-slate-700 mt-1">{customer.rides}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-400">Spend</p>
                <p className="font-medium text-slate-700 mt-1">{toCurrency(customer.spend)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
