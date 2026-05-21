import { createElement, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  BookOpen,
  CarFront,
  UserRound,
  Users,
  Wallet,
  Bell,
  Settings,
  ClipboardList,
  LogOut,
  X,
} from "lucide-react"
import logo from "../assets/Logo.png"
import { useAuth } from "../context/AuthContext"

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Bookings", path: "/bookings" },
  { icon: CarFront, label: "Fleet", path: "/fleet" },
  { icon: UserRound, label: "Drivers", path: "/drivers" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Wallet, label: "Payments", path: "/payments" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  // { icon: ClipboardList, label: "Audit Logs", path: "/audit-logs" },
  { icon: Settings, label: "Settings", path: "/settings" },
]

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  const itemCls = (active) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all no-underline w-full border ${active
      ? "bg-[var(--brand-primary)] text-white font-semibold border-[var(--brand-primary)] shadow-md shadow-[var(--brand-primary)]/20"
      : "text-slate-600 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-primary)] border-transparent"
    }`

  const visibleNav = isAuthenticated ? NAV : []

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen flex flex-col z-50 overflow-hidden bg-white/95 border-r border-white/60 backdrop-blur-md
          transition-[width,transform] duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{
          /* On mobile/tablet: full drawer width; on desktop (lg+): respect collapsed */
          width: collapsed ? 72 : 260,
        }}
      >
        {/* Logo row */}
        <div
          className="flex items-center gap-3 px-4 py-5 min-h-[72px] relative border-b border-slate-100"
        >
          <div className="w-32 h-12 min-w-[36px] rounded-xl flex items-center justify-center text-lg font-black shadow-sm bg-slate-50 border border-slate-100">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-[var(--brand-primary)] transition-all bg-slate-50 border border-slate-200"
            title="Close sidebar"
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2.5 py-4 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 pb-2.5">
              Operations
            </span>
          )}
          {visibleNav.map(({ icon: Icon, label, path }) => {
            const active = pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
            return (
              <Link key={path} to={path} className={itemCls(active)} title={collapsed ? label : ""}>
                {createElement(Icon, { size: 18, className: `shrink-0 ${active ? "text-white" : ""}` })}
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2.5 pb-4">
          {!collapsed && <div className="h-px mb-3 bg-slate-200" />}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer w-full mt-0.5"
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
