import { useEffect, useState, useMemo } from "react"
import { AlertCircle, Loader, MapPin, Mail, Phone, CheckCircle, XCircle, Building2, Clock, Users } from "lucide-react"
import apiService from "../services/api"

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  /**
   * Fetch drivers from API
   */
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiService.getAllDrivers()

        if (response.success && response.data) {
          setDrivers(response.data)
        } else {
          throw new Error(response.message || "Failed to fetch drivers")
        }
      } catch (err) {
        console.error("Error fetching drivers:", err)
        setError(err.message || "Failed to load drivers. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [])

  /**
   * Calculate driver statistics
   */
  const stats = useMemo(() => {
    return {
      total: drivers.length,
      verified: drivers.filter(d => d.user?.isVerified).length,
      onboarded: drivers.filter(d => d.user?.onboardingCompleted).length,
      submitted: drivers.filter(d => d.submittedApplication).length,
    }
  }, [drivers])

  /**
   * Filter drivers based on search and status
   */
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const searchLower = searchTerm.toLowerCase()
      const user = driver.user || {}

      const matchesSearch =
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm) ||
        driver.companyName?.toLowerCase().includes(searchLower)

      const matchesStatus = filterStatus === "all" || (
        filterStatus === "verified" && user.isVerified ||
        filterStatus === "unverified" && !user.isVerified ||
        filterStatus === "training" && !driver.trainingIsComplete ||
        filterStatus === "completed" && driver.trainingIsComplete
      )

      return matchesSearch && matchesStatus
    })
  }, [drivers, searchTerm, filterStatus])

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="panel p-5">
        <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Drivers Management</h2>
            <p className="text-sm text-slate-500 mt-1">Manage driver profiles, verification, and training status.</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-[var(--brand-primary)]">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Total Drivers</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Verified</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.onboarded}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Onboarded</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.submitted}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">App Submitted</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
            <p className="text-slate-600">Loading drivers...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="panel p-8">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {!loading && !error && (
        <>
          <div className="panel p-5 space-y-4">
            <input
              type="text"
              placeholder="Search by name, email, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === "all"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Drivers
              </button>
              <button
                onClick={() => setFilterStatus("verified")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === "verified"
                    ? "bg-green-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilterStatus("unverified")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === "unverified"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Unverified
              </button>
              <button
                onClick={() => setFilterStatus("training")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === "training"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                In Training
              </button>
              <button
                onClick={() => setFilterStatus("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === "completed"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Training Complete
              </button>
            </div>

            <p className="text-xs text-slate-400">Found {filteredDrivers.length} driver(s)</p>
          </div>

          {/* Drivers List */}
          {filteredDrivers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredDrivers.map((driver) => {
                const user = driver.user || {}
                const isExpanded = selectedDriver?.id === driver.id

                return (
                  <article
                    key={driver.id}
                    onClick={() =>
                      setSelectedDriver(isExpanded ? null : driver)
                    }
                    className="panel p-5 cursor-pointer hover:shadow-lg transition-all hover:border-[var(--brand-primary)]/20"
                  >
                    {/* Main Info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          {user.isVerified ? (
                            <div className="flex items-center gap-1 text-green-600" title="Verified">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-500" title="Unverified">
                              <XCircle className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 mt-1">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{user.email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 mt-1">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{user.phone}</span>
                        </div>

                        {driver.companyName && (
                          <div className="flex items-center gap-2 text-slate-600 mt-1">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{driver.companyName}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Status */}
                      <div className="text-right space-y-2">
                        <div className="text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              user.isVerified
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {user.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              user.onboardingCompleted
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {user.onboardingCompleted ? "Onboarded" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grid Info */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Location</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{user.location}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Company Type</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{driver.companyType || "N/A"}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Chauffeurs</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{driver.numberOfChauffeurs}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Vehicles</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {driver.numberOfFirstClassVehicles + driver.numberOfBusinessClassVans}
                        </p>
                      </div>
                    </div>

                    {/* Training Progress */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">Training Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {driver.trainingCompletedModules}/{driver.trainingTotalModules}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-[var(--brand-primary)] h-2 rounded-full transition-all"
                          style={{
                            width: `${(driver.trainingCompletedModules / driver.trainingTotalModules) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {/* Vehicle Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Vehicle Details
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm">
                              <p className="text-slate-500">Primary Vehicle</p>
                              <p className="font-medium text-slate-900 mt-0.5">
                                {driver.vehicleBrandAndModel} ({driver.vehicleYearOfManufacture})
                              </p>
                            </div>
                            <div className="text-sm">
                              <p className="text-slate-500">Class</p>
                              <p className="font-medium text-slate-900 mt-0.5">{driver.vehicleClass}</p>
                            </div>
                            <div className="text-sm">
                              <p className="text-slate-500">Passengers</p>
                              <p className="font-medium text-slate-900 mt-0.5">{driver.vehiclePassengerCapacity}</p>
                            </div>
                            <div className="text-sm">
                              <p className="text-slate-500">Luggage</p>
                              <p className="font-medium text-slate-900 mt-0.5">{driver.vehicleLuggageCapacity}</p>
                            </div>
                          </div>
                        </div>

                        {/* Business Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Business Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-slate-500">Tax ID</p>
                              <p className="font-medium text-slate-900 mt-0.5">{driver.taxIdentificationNumber}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Business Reg.</p>
                              <p className="font-medium text-slate-900 mt-0.5">{driver.businessRegistrationNumber}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-500">Address</p>
                              <p className="font-medium text-slate-900 mt-0.5">
                                {driver.companyStreet}, {driver.companyCity}, {driver.companyState} {driver.companyPostalCode}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contract & Payment */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Contract & Payment</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-slate-500">Contract Signed</p>
                              <p className={`font-medium mt-0.5 ${driver.contractSigned ? "text-green-600" : "text-red-600"}`}>
                                {driver.contractSigned ? "Yes" : "No"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Stripe Onboarded</p>
                              <p className={`font-medium mt-0.5 ${driver.stripeOnboarded ? "text-green-600" : "text-red-600"}`}>
                                {driver.stripeOnboarded ? "Yes" : "No"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Application Status */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Application Status</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-slate-500">Submitted</p>
                              <p className={`font-medium mt-0.5 ${driver.submittedApplication ? "text-green-600" : "text-amber-600"}`}>
                                {driver.submittedApplication ? "Yes" : "No"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Submitted At</p>
                              <p className="font-medium text-slate-900 mt-0.5">
                                {driver.submittedAt
                                  ? new Date(driver.submittedAt).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="panel p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No drivers found matching your criteria.</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
