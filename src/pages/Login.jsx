import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { AlertCircle, Loader } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, error: authError } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    setError("")

    // Validation
    if (!email || !password) {
      setError("Please enter email and password")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    try {
      const result = await login(email, password)

      if (result.success) {
        // Redirect to dashboard on successful login
        navigate("/dashboard")
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setError(err.message || "An error occurred during login")
    }
  }

  // Show auth context error if exists
  const displayError = error || authError

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
            <p>✓ Real-time booking queue and assignment status</p>
            <p>✓ Fleet and driver control by service area</p>
            <p>✓ Revenue, refunds, and settlement visibility</p>
            <p>✓ Customer and driver management</p>
          </div>
        </div>

        <div className="p-8 md:p-10 bg-white">
          <h2 className="text-2xl font-semibold text-slate-900">Admin Sign In</h2>
          <p className="text-sm text-slate-500 mt-1">Use your admin credentials to access the panel.</p>

          {/* Error Alert */}
          {displayError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin1@yopmail.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-1">Test: admin1@yopmail.com</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--brand-primary)] text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to Admin Panel"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">Demo Credentials</p>
            <p className="text-xs text-slate-500 text-center mt-2">
              Email: <span className="font-medium">admin1@yopmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
