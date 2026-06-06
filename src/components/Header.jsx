import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Bell, Search, ChevronDown, Menu } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const PAGE_INFO = {
  "/dashboard": { title: "Operations Dashboard", sub: "Real-time overview of bookings and service health" },
  "/bookings": { title: "Bookings", sub: "Manage online taxi and limo reservations" },
  "/fleet": { title: "Fleet", sub: "Track vehicle utilization and maintenance" },
  "/drivers": { title: "Drivers", sub: "Monitor chauffeur availability and performance" },
  "/customers": { title: "Customers", sub: "Rider activity, segments, and loyalty" },
  "/payments": { title: "Payments", sub: "Collections, pending settlements, and refunds" },
  "/notifications": { title: "Notifications", sub: "Broadcast rider and driver updates" },
  "/audit-logs": { title: "Audit Logs", sub: "Track admin actions and security events" },
  "/settings": { title: "Settings", sub: "Dispatch, SLA, and account configuration" },
}

const NOTIFS = [
  { id: 1, dot: "bg-amber-400", text: "Peak demand alert in Los Angeles Downtown", time: "3m ago" },
  { id: 2, dot: "bg-blue-400", text: "2 new corporate bookings confirmed", time: "11m ago" },
]

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const page =
    PAGE_INFO[pathname] ||
    (pathname.startsWith("/bookings/")
      ? { title: "Booking Detail", sub: "Trip-level dispatch and payment activity" }
      : { title: "Admin", sub: "" })
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  const currentUsername =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.name ||
        user?.username ||
        user?.email ||
        "Guest"

  const userInitials = currentUsername
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G"

  return (
    <div className="sticky top-0 z-10">
      <header className="h-16 flex items-center justify-between px-3 sm:px-6 gap-3 bg-white/90 border-b border-white/50 backdrop-blur-md">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[var(--brand-primary)] transition-all shrink-0 border border-slate-200"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Page title */}
        <div className="flex flex-col leading-tight flex-1 min-w-0">
          <h1 className="text-[17px] font-bold text-slate-900">{page.title}</h1>
          <span className="hidden sm:block text-xs text-slate-500">{page.sub} {user ? `- ${currentUsername}` : ''}</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search icon – mobile only */}
          <button
            onClick={() => setSearchOpen(s => !s)}
            className={`sm:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all shrink-0 border ${
              searchOpen
                ? "bg-[#C4963D] text-white border-[#C4963D]"
                : "text-slate-500 hover:bg-slate-100 hover:text-[var(--brand-primary)] bg-white border-slate-200"
            }`}
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          {/* Search bar – sm and above */}
          <div
            className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 w-[160px] md:w-[220px] focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/20 transition-all bg-slate-50 border border-slate-200"
          >
            <Search size={14} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search bookings, customers"
              className="bg-transparent border-none outline-none text-slate-900 text-[13px] w-full placeholder:text-slate-400"
            />
          </div>

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all bg-slate-50 border border-slate-200"
            >
              <Bell size={17} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                2
              </span>
            </button>

            {open && (
              <div
                className="absolute top-[calc(100%+10px)] -right-12 w-80 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50 bg-white border border-slate-200"
              >
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                  <span className="text-[13px] font-bold text-slate-900">Operations alerts</span>
                  <span className="text-[11px] font-semibold bg-[var(--brand-soft)] text-[var(--brand-primary)] px-2 py-0.5 rounded-full">2 new</span>
                </div>
                {NOTIFS.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2.5 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100"
                  >
                    <div className={`w-2 h-2 min-w-[8px] rounded-full mt-1 ${n.dot}`} />
                    <div>
                      <p className="text-[12.5px] text-slate-700 leading-snug">{n.text}</p>
                      <span className="text-[11px] text-slate-500">{n.time}</span>
                    </div>
                  </div>
                ))}
                <div
                  className="px-4 py-2.5 text-center text-[12px] font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 cursor-pointer bg-slate-50 border-t border-slate-100"
                >
                  Open notification center
                </div>
              </div>
            )}
          </div>

          {/* Admin profile */}
          <div className="relative">
            <div
              onClick={() => setProfileOpen(p => !p)}
              className={`flex items-center gap-2.5 rounded-xl pl-1.5 pr-2 sm:pr-3 py-1.5 cursor-pointer transition-all border ${
                profileOpen ? "border-[var(--brand-primary)] bg-slate-50" : "border-slate-200 bg-white hover:border-[var(--brand-primary)] hover:bg-slate-50"
              }`}
            >
              <div className="w-7 h-7 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center text-[13px] font-bold text-white shrink-0 uppercase">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-slate-900">{currentUsername}</span>
                <span className="text-[10px] text-slate-500">Administrator</span>
              </div>
              <ChevronDown size={13} className={`hidden sm:block text-slate-500 ml-1 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
            </div>

            {profileOpen && (
              <div
                className="absolute top-[calc(100%+10px)] right-0 w-72 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden z-50 bg-white border border-slate-200"
              >
                {/* Profile header */}
                <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-100">
                  <div className="w-12 h-12 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 uppercase">
                    {userInitials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-slate-900 truncate w-40">{currentUsername}</span>
                    <span className="text-[12px] text-slate-500 truncate w-40">ops@limo-services.com</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold bg-[var(--brand-soft)] text-[var(--brand-primary)] px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] inline-block" />
                      Administrator
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  {[
                    { label: "Access", value: "Full" },
                    { label: "Status", value: "Active" },
                    { label: "Since", value: "2026" },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center py-3">
                      <span className="text-[13px] font-semibold text-slate-900">{s.value}</span>
                      <span className="text-[10px] text-slate-500">{s.label}</span>
                    </div>
                  ))}
                </div>

                

                {/* Sign out */}
                <div
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 cursor-pointer transition-colors"
                  onClick={handleLogout}
                >
                  <span className="text-[11px] w-6 h-6 rounded-md bg-red-100 text-red-500 grid place-items-center font-semibold">X</span>
                  <span className="text-[13px] text-red-500 font-semibold">Sign Out</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search bar — slides in below header */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          searchOpen ? "max-h-16 opacity-100 border-b border-gray-200" : "max-h-0 opacity-0"
        } bg-white`}
      >
        <div className="px-3 py-2.5">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 w-full focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/20 transition-all bg-slate-50 border border-slate-200"
          >
            <Search size={14} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search bookings, customers"
              autoFocus={searchOpen}
              className="bg-transparent border-none outline-none text-slate-900 text-[13px] w-full placeholder:text-slate-400"
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="text-slate-500 hover:text-slate-700 transition-colors shrink-0 text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
