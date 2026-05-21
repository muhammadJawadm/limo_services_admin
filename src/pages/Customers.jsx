import { useEffect, useState } from "react"
import { AlertCircle, Loader, MapPin, Mail, Phone, CheckCircle, XCircle } from "lucide-react"
import apiService from "../services/api"

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  /**
   * Fetch customers from API
   */
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiService.getCustomers()

        if (response.success && response.data) {
          setCustomers(response.data)
        } else {
          throw new Error(response.message || "Failed to fetch customers")
        }
      } catch (err) {
        console.error("Error fetching customers:", err)
        setError(err.message || "Failed to load customers. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  /**
   * Filter customers by search term
   */
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      customer.location.toLowerCase().includes(searchLower)
    )
  })

  // Loading state
  if (loading) {
    return (
      <section className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and view customer profiles and information.</p>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
            <p className="text-slate-600">Loading customers...</p>
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and view customer profiles and information.</p>
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

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
            <p className="text-sm text-slate-500 mt-1">Manage and view customer profiles and information.</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[var(--brand-primary)]">{customers.length}</p>
            <p className="text-xs text-slate-500">Total Customers</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="panel p-5">
        <input
          type="text"
          placeholder="Search by name, email, phone, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
        />
        <p className="text-xs text-slate-400 mt-2">Found {filteredCustomers.length} customer(s)</p>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => (
            <article
              key={customer.id}
              onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
              className="panel p-5 cursor-pointer hover:shadow-lg transition-all hover:border-[var(--brand-primary)]/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">{customer.id.slice(0, 8)}</p>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <div className="flex items-center gap-1 text-slate-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <p className="text-sm">{customer.location || "N/A"}</p>
                  </div>
                </div>
                <div className="text-right">
                  {customer.isVerified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-500">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1 font-medium uppercase">{customer.role}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {customer.isVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Onboarding</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {customer.onboardingCompleted ? "Completed" : "Pending"}
                  </p>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedCustomer?.id === customer.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  {customer.companyName && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Company</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{customer.companyName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Member Since</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Last Updated</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {new Date(customer.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="panel p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No customers found matching your search.</p>
        </div>
      )}
    </section>
  )
}
