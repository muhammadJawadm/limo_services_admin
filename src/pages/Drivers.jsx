import { useEffect, useState, useMemo } from "react"
import {
  AlertCircle, Loader, Mail, Phone, CheckCircle, XCircle,
  Building2, Clock, Users, ChevronDown, ChevronUp, FileText,
  Shield, ShieldOff, Eye, Car, Calendar, MapPin, CreditCard,
  Wifi, Cigarette, Package, User, BadgeCheck, AlertTriangle,
  ExternalLink, RefreshCw, X
} from "lucide-react"
import apiService from "../services/api"

// ─── Document label map ───────────────────────────────────────────────────────
const DOC_LABELS = {
  w9Form:               "W-9 Form",
  articleOfIncorporation: "Article of Incorporation",
  einCertificate:       "EIN Certificate",
  cityPermit:           "City Permit",
  voidCheck:            "Void Check",
  profilePicture:       "Profile Picture",
  licensePicture:       "License Picture",
  limoLicenseDecal:     "Limo License Decal",
  liabilityInsurance:   "Liability Insurance",
  vehicleRegistration:  "Vehicle Registration",
  cityPermittedSticker: "City Permitted Sticker",
  licensePlatePhoto:    "License Plate Photo",
  airportPermit:        "Airport Permit",
}

const DOC_KEYS = Object.keys(DOC_LABELS)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusPill = (status) => {
  const map = {
    uploaded: "bg-green-100 text-green-700",
    missing:  "bg-red-100 text-red-700",
    pending:  "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  }
  return map[status] || "bg-slate-100 text-slate-600"
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"

const isPdf = (url) => url && url.toLowerCase().includes(".pdf")

const resolveUrl = (url) => {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`
}

// ─── Document Card ────────────────────────────────────────────────────────────
function DocCard({ label, url, expiry, status }) {
  const [preview, setPreview] = useState(false)
  const [imgError, setImgError] = useState(false)
  const uploaded = status === "uploaded" && url
  const resolvedUrl = resolveUrl(url)

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-800">{label}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusPill(status)}`}>
          {status || "missing"}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {expiry && (
          <p className="text-xs text-slate-500">
            Expires: <span className="font-medium text-slate-700">{fmtDate(expiry)}</span>
          </p>
        )}

        {uploaded ? (
          <div className="flex gap-2">
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--brand-primary)] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open file
            </a>
            {!isPdf(resolvedUrl) && (
              <button
                onClick={() => { setPreview(true); setImgError(false) }}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No file uploaded</p>
        )}
      </div>

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreview(false)}
        >
          <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm"
            >
              <X className="w-4 h-4" /> Close
            </button>
            {imgError ? (
              <div className="flex flex-col items-center justify-center gap-3 bg-slate-900 rounded-xl p-12 text-slate-400">
                <FileText className="w-10 h-10" />
                <p className="text-sm">Unable to load preview.</p>
                <a href={resolvedUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Open file directly
                </a>
              </div>
            ) : (
              <img
                src={resolvedUrl}
                alt={label}
                onError={() => setImgError(true)}
                className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh] bg-slate-900"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono }) {
  if (!value && value !== 0 && value !== false) return null
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium text-slate-900 ${mono ? "font-mono" : ""}`}>{display}</p>
    </div>
  )
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Icon className="w-4 h-4 text-[var(--brand-primary)]" />
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      </div>
      {children}
    </div>
  )
}

// ─── Driver Detail Panel ──────────────────────────────────────────────────────
function DriverDetailPanel({ driver, onVerify, verifying }) {
  const user = driver.user || {}
  const docs = driver.requiredDocuments || {}

  const uploadedCount = DOC_KEYS.filter((k) => docs[`${k}Status`] === "uploaded").length
  const allUploaded   = uploadedCount === DOC_KEYS.length

  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
  const scheduleMap = {
    monday:    { enabled: driver.mondayEnabled,    start: driver.mondayStart,    end: driver.mondayEnd },
    tuesday:   { enabled: driver.tuesdayEnabled,   start: driver.tuesdayStart,   end: driver.tuesdayEnd },
    wednesday: { enabled: driver.wednesdayEnabled, start: driver.wednesdayStart, end: driver.wednesdayEnd },
    thursday:  { enabled: driver.thursdayEnabled,  start: driver.thursdayStart,  end: driver.thursdayEnd },
    friday:    { enabled: driver.fridayEnabled,    start: driver.fridayStart,    end: driver.fridayEnd },
    saturday:  { enabled: driver.saturdayEnabled,  start: driver.saturdayStart,  end: driver.saturdayEnd },
    sunday:    { enabled: driver.sundayEnabled,    start: driver.sundayStart,    end: driver.sundayEnd },
  }

  return (
    <div className="space-y-6">

      {/* ── Verify / Unverify Banner ── */}
      <div className={`rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        user.isVerified
          ? "bg-green-50 border border-green-200"
          : "bg-amber-50 border border-amber-200"
      }`}>
        <div className="flex items-center gap-3">
          {user.isVerified
            ? <BadgeCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            : <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />}
          <div>
            <p className={`text-sm font-semibold ${user.isVerified ? "text-green-800" : "text-amber-800"}`}>
              {user.isVerified ? "Driver is Verified & Active" : "Pending Admin Verification"}
            </p>
            <p className={`text-xs mt-0.5 ${user.isVerified ? "text-green-600" : "text-amber-600"}`}>
              {user.isVerified
                ? "This driver can receive and operate ride assignments."
                : "Review all documents below, then verify to activate this driver."}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {user.isVerified ? (
            <button
              onClick={() => onVerify(driver.id, false)}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all"
            >
              {verifying ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
              Revoke Verification
            </button>
          ) : (
            <button
              onClick={() => onVerify(driver.id, true)}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {verifying ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Verify Driver
            </button>
          )}
        </div>
      </div>

      {/* ── Documents ── */}
      <Section icon={FileText} title={`Required Documents (${uploadedCount}/${DOC_KEYS.length} uploaded)`}>
        {!allUploaded && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs mb-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Not all documents have been uploaded yet.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOC_KEYS.map((key) => (
            <DocCard
              key={key}
              label={DOC_LABELS[key]}
              url={docs[`${key}Url`]}
              expiry={docs[`${key}Expiry`]}
              status={docs[`${key}Status`]}
            />
          ))}
        </div>
      </Section>

      {/* ── Personal & Company ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={User} title="Personal Information">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="First Name"  value={user.firstName} />
            <InfoRow label="Last Name"   value={user.lastName} />
            <InfoRow label="Email"       value={user.email} />
            <InfoRow label="Phone"       value={user.phone} />
            <InfoRow label="Location"    value={user.location} />
            <InfoRow label="Role"        value={user.role} />
            <InfoRow label="Onboarded"   value={user.onboardingCompleted} />
            <InfoRow label="Joined"      value={fmtDate(user.createdAt)} />
          </div>
        </Section>

        <Section icon={Building2} title="Company Information">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Company"       value={driver.companyName} />
            <InfoRow label="Type"          value={driver.companyType} />
            <InfoRow label="Tax ID"        value={driver.taxIdentificationNumber} mono />
            <InfoRow label="Business Reg." value={driver.businessRegistrationNumber} mono />
            <InfoRow label="Country"       value={driver.companyCountry} />
            <InfoRow label="State"         value={driver.companyState} />
            <InfoRow label="City"          value={driver.companyCity} />
            <InfoRow label="Street"        value={driver.companyStreet} />
            <InfoRow label="Postal Code"   value={driver.companyPostalCode} />
          </div>
        </Section>
      </div>

      {/* ── Fleet & Vehicle ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={Users} title="Fleet Information">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Chauffeurs"         value={driver.numberOfChauffeurs} />
            <InfoRow label="First Class Vehicles" value={driver.numberOfFirstClassVehicles} />
            <InfoRow label="Business Class Vans"  value={driver.numberOfBusinessClassVans} />
            <InfoRow label="Female Chauffeurs"    value={driver.femaleChauffeurs} />
            <InfoRow label="Electric Fleet"       value={driver.electricVehicleFleet} />
            <InfoRow label="Prior Limo Exp."      value={driver.priorLimoExperience} />
            <div className="col-span-2">
              <InfoRow label="Van Description" value={driver.businessClassVansDescription} />
            </div>
          </div>
        </Section>

        <Section icon={Car} title="Primary Vehicle">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Brand & Model" value={driver.vehicleBrandAndModel} />
            <InfoRow label="Year"          value={driver.vehicleYearOfManufacture} />
            <InfoRow label="Class"         value={driver.vehicleClass} />
            <InfoRow label="Color"         value={driver.vehicleColor} />
            <InfoRow label="Passengers"    value={driver.vehiclePassengerCapacity} />
            <InfoRow label="Luggage"       value={driver.vehicleLuggageCapacity} />
            <InfoRow label="Number Plate"  value={driver.vehicleNumberPlate} mono />
            <InfoRow label="VIN"           value={driver.vehicleVIN} mono />
            <InfoRow label="WiFi"          value={driver.vehicleWifi} />
            <InfoRow label="Smoking"       value={driver.vehicleSmokingAllowed} />
          </div>
        </Section>
      </div>

      {/* ── First Chauffeur ── */}
      <Section icon={User} title="First Chauffeur Information">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoRow label="First Name"    value={driver.chauffeurFirstName} />
          <InfoRow label="Last Name"     value={driver.chauffeurLastName} />
          <InfoRow label="Email"         value={driver.chauffeurEmail} />
          <InfoRow label="Phone"         value={driver.chauffeurPhone} />
          <InfoRow label="License ID"    value={driver.chauffeurDriverLicenseId} mono />
          <InfoRow label="Uses Auth Rep" value={driver.useAuthorizedRepresentativeDetails} />
        </div>
      </Section>

      {/* ── Contract & Payment ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={FileText} title="Contract Agreement">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Signed"       value={driver.contractSigned} />
            <InfoRow label="Confirmed"    value={driver.contractConfirmationAgreement} />
            <InfoRow label="Signed Place" value={driver.contractPlace} />
          </div>
        </Section>

        <Section icon={CreditCard} title="Payment / Stripe">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Account ID" value={driver.stripeAccountId || "Not set"} mono />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Stripe Status</p>
              {(() => {
                const isConnected =
                  driver.stripeOnboarded ||
                  driver.chargesEnabled ||
                  driver.payoutsEnabled
                const hasPendingAccount = driver.stripeAccountId && !isConnected
                if (isConnected)
                  return <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Connected</span>
                if (hasPendingAccount)
                  return <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pending</span>
                return <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Not Connected</span>
              })()}
            </div>
            {driver.chargesEnabled != null && (
              <InfoRow label="Charges Enabled" value={driver.chargesEnabled ? "Yes" : "No"} />
            )}
            {driver.payoutsEnabled != null && (
              <InfoRow label="Payouts Enabled" value={driver.payoutsEnabled ? "Yes" : "No"} />
            )}
          </div>
        </Section>
      </div>

      {/* ── Availability ── */}
      <Section icon={Calendar} title={`Availability — ${driver.availabilityTimeZone || "No timezone set"}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {days.map((day) => {
            const s = scheduleMap[day]
            return (
              <div
                key={day}
                className={`rounded-lg px-3 py-2 text-center text-xs ${
                  s.enabled
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-slate-50 border border-slate-200 text-slate-400"
                }`}
              >
                <p className="font-semibold capitalize">{day.slice(0, 3)}</p>
                {s.enabled
                  ? <p className="mt-0.5">{s.start} – {s.end}</p>
                  : <p className="mt-0.5">Off</p>
                }
              </div>
            )
          })}
        </div>
        {driver.availabilityNotes && (
          <p className="text-xs text-slate-500 mt-2 italic">Notes: {driver.availabilityNotes}</p>
        )}
      </Section>

      {/* ── Training ── */}
      <Section icon={Clock} title="Partner Training">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-600">
            {driver.trainingCompletedModules} / {driver.trainingTotalModules} modules complete
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            driver.trainingIsComplete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {driver.trainingIsComplete ? "Complete" : "In Progress"}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-[var(--brand-primary)] h-2 rounded-full transition-all"
            style={{
              width: driver.trainingTotalModules > 0
                ? `${(driver.trainingCompletedModules / driver.trainingTotalModules) * 100}%`
                : "0%"
            }}
          />
        </div>
      </Section>

      {/* ── Application Status ── */}
      <Section icon={BadgeCheck} title="Application Submission">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Submitted"    value={driver.submittedApplication ? "Yes" : "No"} />
          <InfoRow label="Submitted At" value={fmtDate(driver.submittedAt)} />
        </div>
      </Section>
    </div>
  )
}

// ─── Main Drivers Component ───────────────────────────────────────────────────
export default function Drivers() {
  const [drivers, setDrivers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [expandedId, setExpandedId]   = useState(null)
  const [searchTerm, setSearchTerm]   = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [verifyingId, setVerifyingId] = useState(null)

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
      setError(err.message || "Failed to load drivers. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDrivers() }, [])

  const stats = useMemo(() => ({
    total:     drivers.length,
    verified:  drivers.filter(d => d.user?.isVerified).length,
    pending:   drivers.filter(d => !d.user?.isVerified && d.submittedApplication).length,
    submitted: drivers.filter(d => d.submittedApplication).length,
  }), [drivers])

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const s = searchTerm.toLowerCase()
      const u = driver.user || {}
      const matchesSearch =
        u.firstName?.toLowerCase().includes(s) ||
        u.lastName?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.phone?.includes(searchTerm) ||
        driver.companyName?.toLowerCase().includes(s)

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "verified"   && u.isVerified) ||
        (filterStatus === "pending"    && !u.isVerified && driver.submittedApplication) ||
        (filterStatus === "unverified" && !u.isVerified) ||
        (filterStatus === "submitted"  && driver.submittedApplication)

      return matchesSearch && matchesStatus
    })
  }, [drivers, searchTerm, filterStatus])

  // ── Verify / Unverify ──────────────────────────────────────────────────────
  const handleVerify = async (driverId, isVerified) => {
    setVerifyingId(driverId)
    try {
      // Call your admin verify endpoint:
      // PATCH /api/admin/drivers/:driverId/verify  { isVerified: true|false }
      const response = await apiService.verifyDriver(driverId, isVerified)
      if (response.success) {
        setDrivers(prev =>
          prev.map(d =>
            d.id === driverId
              ? { ...d, user: { ...d.user, isVerified } }
              : d
          )
        )
      } else {
        alert(response.message || "Failed to update verification status")
      }
    } catch (err) {
      alert(err.message || "Failed to update verification status")
    } finally {
      setVerifyingId(null)
    }
  }

  const FILTERS = [
    { key: "all",       label: "All Drivers",    color: "bg-[var(--brand-primary)] text-white",  active: "bg-[var(--brand-primary)] text-white",  inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    { key: "pending",   label: "Pending Review", color: "bg-amber-600 text-white",               active: "bg-amber-600 text-white",               inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    { key: "verified",  label: "Verified",        color: "bg-green-600 text-white",               active: "bg-green-600 text-white",               inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    { key: "unverified",label: "Unverified",      color: "bg-red-500 text-white",                 active: "bg-red-500 text-white",                 inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    { key: "submitted", label: "App Submitted",   color: "bg-blue-600 text-white",                active: "bg-blue-600 text-white",                inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  ]

  return (
    <section className="space-y-5">

      {/* ── Header ── */}
      <div className="panel p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Drivers Management</h2>
            <p className="text-sm text-slate-500 mt-1">Review documents and verify driver accounts before they can operate.</p>
          </div>
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Drivers",   value: stats.total,     color: "text-[var(--brand-primary)]" },
          { label: "Verified",        value: stats.verified,  color: "text-green-600" },
          { label: "Pending Review",  value: stats.pending,   color: "text-amber-600" },
          { label: "App Submitted",   value: stats.submitted, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="panel p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
            <p className="text-slate-600">Loading drivers...</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="panel p-8">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
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
              {FILTERS.map(({ key, label, active, inactive }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === key ? active : inactive
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">Showing {filteredDrivers.length} driver(s)</p>
          </div>

          {/* ── Driver List ── */}
          {filteredDrivers.length > 0 ? (
            <div className="space-y-4">
              {filteredDrivers.map((driver) => {
                const user       = driver.user || {}
                const isExpanded = expandedId === driver.id
                const docs       = driver.requiredDocuments || {}
                const uploaded   = DOC_KEYS.filter(k => docs[`${k}Status`] === "uploaded").length

                return (
                  <article key={driver.id} className="panel overflow-hidden">

                    {/* ── Collapsed Header (always visible) ── */}
                    <div
                      className="p-5 cursor-pointer hover:bg-slate-50/60 transition-all"
                      onClick={() => setExpandedId(isExpanded ? null : driver.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-slate-900">
                              {user.firstName} {user.lastName}
                            </h3>
                            {/* Verification badge */}
                            {user.isVerified ? (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            ) : driver.submittedApplication ? (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                <AlertTriangle className="w-3 h-3" /> Pending Review
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                <XCircle className="w-3 h-3" /> Not Submitted
                              </span>
                            )}
                            {user.onboardingCompleted && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Onboarded
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            <span className="flex items-center gap-1.5 text-sm text-slate-500">
                              <Mail className="w-3.5 h-3.5" />{user.email}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-slate-500">
                              <Phone className="w-3.5 h-3.5" />{user.phone}
                            </span>
                            {driver.companyName && (
                              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Building2 className="w-3.5 h-3.5" />{driver.companyName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Quick doc progress */}
                          <div className="hidden sm:flex flex-col items-end">
                            <p className="text-xs text-slate-500">Documents</p>
                            <p className={`text-sm font-semibold ${
                              uploaded === DOC_KEYS.length ? "text-green-600" : "text-amber-600"
                            }`}>
                              {uploaded}/{DOC_KEYS.length}
                            </p>
                          </div>

                          {isExpanded
                            ? <ChevronUp className="w-5 h-5 text-slate-400" />
                            : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {/* Quick-action verify buttons (visible in collapsed state too) */}
                      {!isExpanded && driver.submittedApplication && (
                        <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                          {user.isVerified ? (
                            <button
                              onClick={() => handleVerify(driver.id, false)}
                              disabled={verifyingId === driver.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-all"
                            >
                              {verifyingId === driver.id
                                ? <Loader className="w-3.5 h-3.5 animate-spin" />
                                : <ShieldOff className="w-3.5 h-3.5" />}
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerify(driver.id, true)}
                              disabled={verifyingId === driver.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-all"
                            >
                              {verifyingId === driver.id
                                ? <Loader className="w-3.5 h-3.5 animate-spin" />
                                : <Shield className="w-3.5 h-3.5" />}
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(driver.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review Documents
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Expanded Detail Panel ── */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-5">
                        <DriverDetailPanel
                          driver={driver}
                          onVerify={handleVerify}
                          verifying={verifyingId === driver.id}
                        />
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