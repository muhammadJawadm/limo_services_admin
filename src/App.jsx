import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"

import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import Bookings from './pages/Bookings'
import TripDetail from './pages/TripDetail'
import Fleet from './pages/Fleet'
import Drivers from './pages/Drivers'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import Login from './pages/Login'

function AdminLayout({ children }) {
  // collapsed only matters on desktop (md+); on mobile sidebar is hidden via transform
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto-respond to window resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false) // close drawer when going to desktop (lg+)
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[var(--surface-bg)]">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      {/* On mobile: no left margin (sidebar overlays); on desktop: push content right by sidebar width */}
      <div
        className="flex flex-col flex-1 min-h-screen min-w-0 transition-all duration-300 lg:ml-[var(--sidebar-w)]"
        style={{ "--sidebar-w": collapsed ? "72px" : "260px" }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { OpsProvider } from './context/OpsContext'

export default function App() {
  return (
    <AuthProvider>
      <OpsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route element={<AdminLayout><Outlet /></AdminLayout>}>
              <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
              <Route path="/bookings" element={<ProtectedRoute component={Bookings} />} />
              <Route path="/bookings/:tripId" element={<ProtectedRoute component={TripDetail} />} />
              <Route path="/fleet" element={<ProtectedRoute component={Fleet} />} />
              <Route path="/drivers" element={<ProtectedRoute component={Drivers} />} />
              <Route path="/customers" element={<ProtectedRoute component={Customers} />} />
              <Route path="/payments" element={<ProtectedRoute component={Payments} />} />
              <Route path="/notifications" element={<ProtectedRoute component={Notifications} />} />
              <Route path="/audit-logs" element={<ProtectedRoute component={AuditLogs} />} />
              <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </OpsProvider>
    </AuthProvider>
  )
}

