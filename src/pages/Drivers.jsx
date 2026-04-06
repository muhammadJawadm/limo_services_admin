import { useMemo, useState } from "react"
import { useOps } from "../context/OpsContext"
import { maskSensitive } from "../data/opsSeed"

const defaultFormState = {
  name: "",
  phone: "",
  location: "",
  status: "Online",
  available: true,
  approved: false,
  verificationStatus: "Pending",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  classType: "Business Sedan",
  vehicleStatus: "Available",
}

export default function Drivers() {
  const { drivers, trips, upsertDriverProfile, setDriverApproval, setDriverOperationalStatus } = useOps()
  const [search, setSearch] = useState("")
  const [approvalFilter, setApprovalFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [formState, setFormState] = useState(defaultFormState)
  const [formMessage, setFormMessage] = useState("")

  const assignmentsByDriver = useMemo(() => {
    return trips.reduce((acc, trip) => {
      if (!trip.driverId || !["pending_assignment", "assigned", "in_progress"].includes(trip.status)) {
        return acc
      }
      acc[trip.driverId] = (acc[trip.driverId] || 0) + 1
      return acc
    }, {})
  }, [trips])

  const driverSummary = useMemo(() => {
    const online = drivers.filter((driver) => driver.status === "Online").length
    const approved = drivers.filter((driver) => driver.approved).length
    const onTrip = drivers.filter((driver) => driver.status === "On Trip").length

    return {
      total: drivers.length,
      online,
      approved,
      onTrip,
    }
  }, [drivers])

  const visibleDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch = `${driver.id} ${driver.name} ${driver.phone} ${driver.location}`.toLowerCase().includes(search.toLowerCase())
      const matchesApproval = approvalFilter === "All" || (approvalFilter === "Approved" ? driver.approved : !driver.approved)
      const matchesStatus = statusFilter === "All" || driver.status === statusFilter

      return matchesSearch && matchesApproval && matchesStatus
    })
  }, [drivers, search, approvalFilter, statusFilter])

  const openCreateModal = () => {
    setIsCreateMode(true)
    setSelectedDriver(null)
    setFormState(defaultFormState)
    setFormMessage("")
    setIsModalOpen(true)
  }

  const openEditModal = (driver) => {
    setIsCreateMode(false)
    setSelectedDriver(driver)
    setFormState({
      name: driver.name,
      phone: driver.phone,
      location: driver.location,
      status: driver.status,
      available: driver.available,
      approved: driver.approved,
      verificationStatus: driver.verificationStatus,
      make: driver.vehicle.make,
      model: driver.vehicle.model,
      year: driver.vehicle.year,
      classType: driver.vehicle.classType,
      vehicleStatus: driver.vehicle.status,
    })
    setFormMessage("")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDriver(null)
    setFormMessage("")
  }

  const saveDriver = () => {
    const result = upsertDriverProfile({
      driverId: selectedDriver?.id,
      name: formState.name,
      phone: formState.phone,
      location: formState.location,
      status: formState.status,
      available: formState.available,
      approved: formState.approved,
      verificationStatus: formState.verificationStatus,
      vehicle: {
        make: formState.make,
        model: formState.model,
        year: formState.year,
        classType: formState.classType,
        status: formState.vehicleStatus,
      },
    })

    if (!result.ok) {
      setFormMessage(result.message)
      return
    }

    setFormMessage(result.message)
    closeModal()
  }

  return (
    <section className="space-y-6">
      <div className="hero-strip p-5 md:p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.28em] uppercase text-blue-100/90">Operations control</p>
            <h2 className="text-2xl font-semibold mt-2">Driver assignment and management</h2>
            <p className="text-sm text-blue-100/90 mt-2 max-w-2xl">Approve drivers, update profiles, control status, and keep manual assignment-ready drivers available.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/30 text-white text-sm font-medium hover:bg-white/20 transition"
          >
            + Add new driver
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-blue-100/80">Total drivers</p>
            <p className="text-xl font-semibold mt-1">{driverSummary.total}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-blue-100/80">Online now</p>
            <p className="text-xl font-semibold mt-1">{driverSummary.online}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-blue-100/80">Approved</p>
            <p className="text-xl font-semibold mt-1">{driverSummary.approved}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-blue-100/80">On trip</p>
            <p className="text-xl font-semibold mt-1">{driverSummary.onTrip}</p>
          </div>
        </div>
      </div>

      <div className="panel p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, name, phone, location"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)]/30"
          />
          <select
            value={approvalFilter}
            onChange={(event) => setApprovalFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)]/30"
          >
            <option>All</option>
            <option>Approved</option>
            <option>Pending</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)]/30"
          >
            <option>All</option>
            <option>Online</option>
            <option>On Trip</option>
            <option>Offline</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleDrivers.map((driver) => (
          <article
            key={driver.id}
            className="panel p-5 relative overflow-hidden border border-slate-100 hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-accent)]" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{driver.id}</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">{driver.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{maskSensitive(driver.phone, 4, 2)}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${driver.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {driver.verificationStatus}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-slate-500">Driver status:</span> <span className="font-medium text-slate-800">{driver.status}</span></p>
              <p><span className="text-slate-500">Available:</span> <span className="font-medium text-slate-800">{driver.available ? "Yes" : "No"}</span></p>
              <p><span className="text-slate-500">Location:</span> <span className="font-medium text-slate-800">{driver.location}</span></p>
              <p><span className="text-slate-500">Vehicle class:</span> <span className="font-medium text-slate-800">{driver.vehicle.classType}</span></p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-sm space-y-1.5">
              <p><span className="text-slate-500">Vehicle:</span> <span className="font-medium text-slate-800">{driver.vehicle.make} {driver.vehicle.model}</span></p>
              <p><span className="text-slate-500">Year:</span> <span className="font-medium text-slate-800">{driver.vehicle.year}</span></p>
              <p><span className="text-slate-500">Vehicle status:</span> <span className="font-medium text-slate-800">{driver.vehicle.status}</span></p>
              <p><span className="text-slate-500">Upcoming assigned trips:</span> <span className="font-medium text-slate-800">{assignmentsByDriver[driver.id] || 0}</span></p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => openEditModal(driver)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition"
              >
                Manage profile
              </button>
              <button
                onClick={() => setDriverApproval(driver.id, !driver.approved)}
                className={`px-3 py-2.5 rounded-xl text-sm text-white font-medium shadow-sm hover:brightness-105 transition ${driver.approved ? "bg-gradient-to-r from-red-800 to-red-700" : "bg-gradient-to-r from-emerald-500 to-emerald-600"}`}
              >
                {driver.approved ? "Mark pending" : "Approve driver"}
              </button>
              <button
                onClick={() => setDriverOperationalStatus(driver.id, {
                  status: driver.status === "Online" ? "Offline" : "Online",
                  available: driver.status !== "Online",
                  vehicleStatus: driver.status === "Online" ? "Unavailable" : "Available",
                })}
                className="px-3 py-2.5 rounded-xl text-sm text-white font-medium bg-gradient-to-r from-slate-700 to-slate-900 shadow-sm hover:brightness-105 transition"
              >
                {driver.status === "Online" ? "Set Offline" : "Set Online"}
              </button>
              <button
                onClick={() => setDriverOperationalStatus(driver.id, {
                  status: "On Trip",
                  available: false,
                  vehicleStatus: "On Trip",
                })}
                className="px-3 py-2.5 rounded-xl text-sm text-white font-medium bg-gradient-to-r from-indigo-500 to-indigo-700 shadow-sm hover:brightness-105 transition"
              >
                Mark On Trip
              </button>
            </div>
          </article>
        ))}
      </div>

      {visibleDrivers.length === 0 && (
        <div className="panel p-8 text-center">
          <p className="text-slate-700 font-medium">No drivers matched your filters.</p>
          <p className="text-sm text-slate-500 mt-1">Try clearing one or more filters to see all available driver profiles.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{isCreateMode ? "Add new driver" : `Update profile: ${selectedDriver?.id}`}</h3>
              <button onClick={closeModal} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm">Close</button>
            </div>

            {formMessage && <p className="text-sm text-rose-600">{formMessage}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} placeholder="Driver name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={formState.phone} onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={formState.location} onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location / city" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <select value={formState.status} onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option>Online</option>
                <option>On Trip</option>
                <option>Offline</option>
              </select>
              <select value={String(formState.available)} onChange={(event) => setFormState((prev) => ({ ...prev, available: event.target.value === "true" }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="true">Available</option>
                <option value="false">Not Available</option>
              </select>
              <select value={String(formState.approved)} onChange={(event) => setFormState((prev) => ({ ...prev, approved: event.target.value === "true", verificationStatus: event.target.value === "true" ? "Approved" : "Pending" }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">Vehicle details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={formState.make} onChange={(event) => setFormState((prev) => ({ ...prev, make: event.target.value }))} placeholder="Make" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={formState.model} onChange={(event) => setFormState((prev) => ({ ...prev, model: event.target.value }))} placeholder="Model" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input type="number" value={formState.year} onChange={(event) => setFormState((prev) => ({ ...prev, year: event.target.value }))} placeholder="Year" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <select value={formState.classType} onChange={(event) => setFormState((prev) => ({ ...prev, classType: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option>Business Sedan</option>
                  <option>Premium Sedan</option>
                  <option>Premium SUV</option>
                </select>
                <select value={formState.vehicleStatus} onChange={(event) => setFormState((prev) => ({ ...prev, vehicleStatus: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2">
                  <option>Available</option>
                  <option>On Trip</option>
                  <option>Unavailable</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm">Cancel</button>
              <button onClick={saveDriver} className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm">Save driver profile</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
