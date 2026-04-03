import { useState } from "react"
import { alerts } from "../data/limoStore"

const channels = ["Push", "SMS", "Email"]

export default function Notifications() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [channel, setChannel] = useState("Push")

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Broadcast Notification</h2>
          <p className="text-sm text-slate-500 mt-1">Send rider updates for booking changes, delays, and promotions.</p>

          <div className="space-y-3 mt-5">
            <div>
              <label className="text-sm font-medium text-slate-600">Channel</label>
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
              >
                {channels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Trip update for airport arrivals"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Message</label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows="4"
                placeholder="Your chauffeur is 6 minutes away at terminal pickup zone B."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <button className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
              Send to Active Riders
            </button>
          </div>
        </article>

        <article className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Recent Alerts</h2>
          <p className="text-sm text-slate-500 mt-1">System-generated operations and dispatch notifications.</p>

          <div className="space-y-3 mt-5">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-800">{alert.title}</p>
                  <span className="text-xs text-slate-400">{alert.time}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">{alert.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
