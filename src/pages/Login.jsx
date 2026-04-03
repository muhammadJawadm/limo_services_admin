import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (event) => {
    event.preventDefault()
    const username = email ? email.split("@")[0] : "Admin User"
    login(username)
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen p-4 grid place-items-center bg-[var(--surface-bg)]">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 panel overflow-hidden">
        <div className="p-8 md:p-10 bg-[var(--brand-primary)] text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Limo Services</p>
          <h1 className="text-3xl font-semibold mt-3">Admin Operations Panel</h1>
          <p className="text-white/80 mt-3 text-sm">
            Manage online taxi bookings, fleet utilization, chauffeur availability, and payment performance.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/90">
            <p>- Real-time booking queue and assignment status</p>
            <p>- Fleet and driver control by service area</p>
            <p>- Revenue, refunds, and settlement visibility</p>
          </div>
        </div>

        <div className="p-8 md:p-10 bg-white">
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Use your admin credentials to continue.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@limo-services.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--brand-primary)] text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
