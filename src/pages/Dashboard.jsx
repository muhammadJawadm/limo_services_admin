import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Loader,
  MapPin,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  UserRoundMinus,
} from "lucide-react"
import apiService from "../services/api"

function normalizeListResponse(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.bookings)) return response.bookings
  if (Array.isArray(response?.drivers)) return response.drivers
  if (Array.isArray(response?.users)) return response.users
  if (Array.isArray(response?.vehicleCategories)) return response.vehicleCategories
  if (Array.isArray(response?.data?.bookings)) return response.data.bookings
  if (Array.isArray(response?.data?.drivers)) return response.data.drivers
  if (Array.isArray(response?.data?.users)) return response.data.users
  if (Array.isArray(response?.data?.vehicleCategories)) return response.data.vehicleCategories
  return []
}

function getBookingLabel(booking) {
  return booking?.confNumber || booking?.confirmationNumber || booking?.id || "Unknown"
}

function getPassengerName(booking) {
  const firstName = booking?.passengerFirstName || booking?.user?.firstName || booking?.customer?.firstName || ""
  const lastName = booking?.passengerLastName || booking?.user?.lastName || booking?.customer?.lastName || ""
  const combined = `${firstName} ${lastName}`.trim()
  return combined || booking?.passengerName || booking?.customer?.name || "Unknown passenger"
}

function getDriverName(driver) {
  const user = driver?.user || {}
  const combined = `${driver?.firstName || user.firstName || ""} ${driver?.lastName || user.lastName || ""}`.trim()
  return combined || driver?.name || user.name || "Unknown driver"
}

function getVehicleLabel(vehicle) {
  return vehicle?.name || vehicle?.classification || vehicle?.vehicleClass || "Unknown vehicle"
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatDateTime(value) {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString()
}

function StatCard({ title, value, subtext, icon: Icon, tone, trend }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl grid place-items-center ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{trend}</span>
        </div>
      )}
    </article>
  )
}

function ProgressBar({ label, value, total, tone = "bg-[var(--brand-primary)]" }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(percent, value > 0 ? 8 : 0)}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [drivers, setDrivers] = useState([])
  const [customers, setCustomers] = useState([])
  const [vehicleCategories, setVehicleCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [bookingsResult, driversResult, customersResult, vehicleCategoriesResult] = await Promise.allSettled([
          apiService.getAllBookings(),
          apiService.getAllDrivers(),
          apiService.getCustomers(),
          apiService.getVehicleCategories(),
        ])

        if (bookingsResult.status === "fulfilled") {
          setBookings(normalizeListResponse(bookingsResult.value))
        }

        if (driversResult.status === "fulfilled") {
          setDrivers(normalizeListResponse(driversResult.value))
        }

        if (customersResult.status === "fulfilled") {
          setCustomers(normalizeListResponse(customersResult.value))
        }

        if (vehicleCategoriesResult.status === "fulfilled") {
          setVehicleCategories(normalizeListResponse(vehicleCategoriesResult.value))
        }

        const rejected = [bookingsResult, driversResult, customersResult, vehicleCategoriesResult].filter((result) => result.status === "rejected")
        if (rejected.length === 4) {
          throw rejected[0].reason || new Error("Unable to load dashboard data")
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError(err.message || "Unable to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const metrics = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || booking.tripPrice || 0), 0)
    const completedBookings = bookings.filter((booking) => booking.rideStatus === "completed")
    const upcomingBookings = bookings.filter((booking) => booking.rideStatus === "upcoming")
    const assignedBookings = bookings.filter((booking) => booking.driverId || booking.assignedDriver)
    const unassignedBookings = bookings.filter((booking) => !booking.driverId && !booking.assignedDriver)
    const cancelledBookings = bookings.filter((booking) => booking.rideStatus === "cancelled")

    const verifiedDrivers = drivers.filter((driver) => driver?.user?.isVerified ?? driver?.isVerified)
    const onboardedDrivers = drivers.filter((driver) => driver?.user?.onboardingCompleted ?? driver?.onboardingCompleted)
    const availableDrivers = drivers.filter((driver) => (driver?.available ?? driver?.user?.available) !== false)

    const recentBookings = [...bookings]
      .sort((a, b) => new Date(b.createdAt || b.pickupDateTime || 0) - new Date(a.createdAt || a.pickupDateTime || 0))
      .slice(0, 6)

    const recentDrivers = [...drivers]
      .sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0))
      .slice(0, 5)

    const topVehicles = [...vehicleCategories]
      .sort((a, b) => Number(b.passengerCapacity || 0) - Number(a.passengerCapacity || 0))
      .slice(0, 5)

    const bookingStatusCounts = [
      { label: "Upcoming", value: upcomingBookings.length, tone: "bg-blue-500" },
      { label: "Assigned", value: assignedBookings.length, tone: "bg-indigo-500" },
      { label: "Completed", value: completedBookings.length, tone: "bg-emerald-500" },
      { label: "Cancelled", value: cancelledBookings.length, tone: "bg-rose-500" },
      { label: "Unassigned", value: unassignedBookings.length, tone: "bg-amber-500" },
    ]

    const mostRecentBooking = recentBookings[0] || null

    return {
      totalRevenue,
      completedBookings,
      upcomingBookings,
      assignedBookings,
      unassignedBookings,
      cancelledBookings,
      verifiedDrivers,
      onboardedDrivers,
      availableDrivers,
      recentBookings,
      recentDrivers,
      topVehicles,
      bookingStatusCounts,
      mostRecentBooking,
    }
  }, [bookings, drivers, vehicleCategories])

  const loadingView = (
    <section className="space-y-5">
      <div className="hero-strip p-6 md:p-7">
        <h2 className="text-2xl font-semibold text-white">Operations dashboard</h2>
        <p className="text-sm text-white/80 mt-2">Loading live bookings, drivers, customers, and fleet data...</p>
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    </section>
  )

  if (loading) {
    return loadingView
  }

  if (error) {
    return (
      <section className="space-y-5">
        <div className="hero-strip p-6 md:p-7">
          <h2 className="text-2xl font-semibold text-white">Operations dashboard</h2>
          <p className="text-sm text-white/80 mt-2">Live overview of bookings, drivers, customers, and fleet.</p>
        </div>

        <div className="panel p-8">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  const { totalRevenue, completedBookings, upcomingBookings, assignedBookings, unassignedBookings, cancelledBookings, verifiedDrivers, onboardedDrivers, availableDrivers, recentBookings, recentDrivers, topVehicles, bookingStatusCounts, mostRecentBooking } = metrics

  return (
    <section className="space-y-5">
      <div className="hero-strip p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">Live admin overview</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mt-2">Real operations snapshot across bookings, drivers, customers, and fleet</h2>
            <p className="text-sm text-white/80 mt-3 leading-6">
              This dashboard pulls directly from your production APIs so you can see the current state of the business, track assignment pressure, and move quickly from overview to action.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[340px]">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">{formatMoney(totalRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Recent booking</p>
              <p className="text-sm font-semibold text-white mt-1 line-clamp-2">{mostRecentBooking ? getBookingLabel(mostRecentBooking) : "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total bookings" value={bookings.length} subtext={`${assignedBookings.length} assigned · ${unassignedBookings.length} unassigned`} icon={CalendarClock} tone="bg-blue-100 text-blue-700" trend="All live booking records" />
        <StatCard title="Total drivers" value={drivers.length} subtext={`${verifiedDrivers.length} verified · ${availableDrivers.length} available`} icon={CarFront} tone="bg-indigo-100 text-indigo-700" trend="Driver roster from API" />
        <StatCard title="Customers" value={customers.length} subtext="Users with customer role" icon={Users} tone="bg-emerald-100 text-emerald-700" trend="Real users list" />
        <StatCard title="Vehicle categories" value={vehicleCategories.length} subtext="Fleet classes and pricing" icon={ShieldCheck} tone="bg-amber-100 text-amber-700" trend="Vehicle catalog from API" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <article className="panel p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Bookings status overview</h3>
              <p className="text-xs text-slate-500 mt-1">Assignment pressure and trip health based on live booking data.</p>
            </div>
            <span className="text-xs text-slate-500">Total: {bookings.length}</span>
          </div>

          <div className="mt-5 space-y-4">
            {bookingStatusCounts.map((item) => (
              <ProgressBar key={item.label} label={item.label} value={item.value} total={bookings.length} tone={item.tone} />
            ))}
          </div>
        </article>

        <article className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Revenue & workflow</h3>
              <p className="text-xs text-slate-500 mt-1">Quick business signals from live records</p>
            </div>
            <CircleDollarSign className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Revenue</span>
              <span className="font-semibold text-slate-900">{formatMoney(totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Completed rides</span>
              <span className="font-semibold text-emerald-700">{completedBookings.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Upcoming rides</span>
              <span className="font-semibold text-blue-700">{upcomingBookings.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Cancelled rides</span>
              <span className="font-semibold text-rose-700">{cancelledBookings.length}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white border border-slate-100 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Onboarded drivers</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{onboardedDrivers.length}</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-100 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Available drivers</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{availableDrivers.length}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Recent bookings</h3>
              <p className="text-xs text-slate-500 mt-1">Most recent live booking records from the API</p>
            </div>
            <button onClick={() => navigate("/bookings")} className="text-xs font-semibold text-[var(--brand-primary)] hover:opacity-80">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Booking</th>
                  <th className="px-4 py-3 text-left font-semibold">Passenger</th>
                  <th className="px-4 py-3 text-left font-semibold">Route</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={5}>No bookings available.</td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => navigate("/bookings")}
                    >
                      <td className="px-4 py-3 font-semibold text-[var(--brand-primary)]">{getBookingLabel(booking)}</td>
                      <td className="px-4 py-3 text-slate-700">{getPassengerName(booking)}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                          <span className="line-clamp-2">{booking?.pickupLocation || booking?.pickupAddress || "N/A"} → {booking?.dropoffLocation || booking?.dropoffAddress || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700"><span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{booking.rideStatus || "unknown"}</span></td>
                      <td className="px-4 py-3 text-slate-700">{formatMoney(booking.totalAmount || booking.tripPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Fleet and driver readiness</h3>
              <p className="text-xs text-slate-500 mt-1">Live counts and top fleet classes</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Verified drivers</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{verifiedDrivers.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Unassigned rides</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{unassignedBookings.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-900">Top vehicle categories</h4>
                <span className="text-xs text-slate-500">{vehicleCategories.length} total</span>
              </div>
              <div className="space-y-3">
                {topVehicles.length === 0 ? (
                  <p className="text-sm text-slate-500">No vehicle category data available.</p>
                ) : (
                  topVehicles.map((vehicle) => {
                    const totalCapacity = Number(vehicle.passengerCapacity || 0) + Number(vehicle.luggageCapacity || 0)
                    return (
                      <div key={vehicle.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{getVehicleLabel(vehicle)}</p>
                            <p className="text-xs text-slate-500 mt-1">{vehicle.type || "Vehicle category"}</p>
                          </div>
                          <span className="text-xs font-semibold text-[var(--brand-primary)]">{formatMoney(vehicle.baseFare || 0)}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>Passengers: <span className="font-semibold text-slate-900">{vehicle.passengerCapacity ?? "N/A"}</span></div>
                          <div>Luggage: <span className="font-semibold text-slate-900">{vehicle.luggageCapacity ?? "N/A"}</span></div>
                          <div>Per mile up to 30 Miles: <span className="font-semibold text-slate-900">{vehicle.perMileRate30}</span></div>
                          <div>Per mile above 40 Miles: <span className="font-semibold text-slate-900">{vehicle.perMileRate40}</span></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Recent drivers</h3>
              <p className="text-xs text-slate-500 mt-1">Live driver records for assignment readiness</p>
            </div>
            <button onClick={() => navigate("/drivers")} className="text-xs font-semibold text-[var(--brand-primary)] hover:opacity-80">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Driver</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-left font-semibold">Verified</th>
                  <th className="px-4 py-3 text-left font-semibold">Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {recentDrivers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>No driver data available.</td>
                  </tr>
                ) : (
                  recentDrivers.map((driver) => {
                    const verified = driver?.user?.isVerified ?? driver?.isVerified
                    const onboarded = driver?.user?.onboardingCompleted ?? driver?.onboardingCompleted
                    return (
                      <tr key={driver.id} className="border-t border-slate-100 hover:bg-slate-50/70 cursor-pointer" onClick={() => navigate("/drivers")}>
                        <td className="px-4 py-3 text-slate-700">
                          <p className="font-semibold text-slate-900">{getDriverName(driver)}</p>
                          <p className="text-xs text-slate-500 mt-1">{driver.companyName || "Independent"}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{driver.location || driver.user?.location || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-700">{verified ? "Yes" : "No"}</td>
                        <td className="px-4 py-3 text-slate-700">{onboarded ? "Yes" : "No"}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900">Customer snapshot</h3>
            <p className="text-xs text-slate-500 mt-1">Real customer totals from the users API</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Customers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Booked now</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{assignedBookings.length}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Quick insights</h4>
            <p className="text-sm text-slate-600">Completed bookings are driving {bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0}% of current trip volume.</p>
            <p className="text-sm text-slate-600">There are {unassignedBookings.length} bookings still waiting for manual assignment.</p>
            <p className="text-sm text-slate-600">Driver readiness is currently {drivers.length > 0 ? Math.round((verifiedDrivers.length / drivers.length) * 100) : 0}% verified.</p>
          </div>
        </article>
      </div>

      <article className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Recent operational notes</h3>
            <p className="text-xs text-slate-500 mt-1">Key items from the live API data set</p>
          </div>
          <Star className="w-5 h-5 text-amber-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Most recent booking</p>
            <p className="font-semibold text-slate-900 mt-1">{mostRecentBooking ? getBookingLabel(mostRecentBooking) : "N/A"}</p>
            <p className="text-slate-600 mt-1">{mostRecentBooking ? formatDateTime(mostRecentBooking.createdAt || mostRecentBooking.pickupDateTime) : "No booking data"}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Most recent driver</p>
            <p className="font-semibold text-slate-900 mt-1">{metrics.recentDrivers[0] ? getDriverName(metrics.recentDrivers[0]) : "N/A"}</p>
            <p className="text-slate-600 mt-1">{metrics.recentDrivers[0] ? (metrics.recentDrivers[0].location || metrics.recentDrivers[0].user?.location || "N/A") : "No driver data"}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Fleet coverage</p>
            <p className="font-semibold text-slate-900 mt-1">{vehicleCategories.length} categories ready</p>
            <p className="text-slate-600 mt-1">All categories are sourced from the live vehicle-categories API.</p>
          </div>
        </div>
      </article>
    </section>
  )
}
