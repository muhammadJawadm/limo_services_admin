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
      if (!trip.driverId || !["Scheduled", "Assigned", "In Progress"].includes(trip.status)) {
        return acc
      }
      acc[trip.driverId] = (acc[trip.driverId] || 0) + 1
      return acc
    }, {})
  }, [trips])

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
    <section className="space-y-5">
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Driver assignment and management</h2>
            <p className="text-sm text-slate-500 mt-1">Approve drivers, update profiles, control status, and keep manual assignment-ready drivers available.</p>
          </div>
          <button onClick={openCreateModal} className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm">Add new driver</button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, name, phone, location"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option>All</option>
            <option>Approved</option>
            <option>Pending</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option>All</option>
            <option>Online</option>
            <option>On Trip</option>
            <option>Offline</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleDrivers.map((driver) => (
          <article key={driver.id} className="panel p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{driver.id}</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">{driver.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{maskSensitive(driver.phone, 4, 2)}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${driver.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {driver.verificationStatus}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-slate-500">Driver status:</span> {driver.status}</p>
              <p><span className="text-slate-500">Available:</span> {driver.available ? "Yes" : "No"}</p>
              <p><span className="text-slate-500">Location:</span> {driver.location}</p>
              <p><span className="text-slate-500">Vehicle class:</span> {driver.vehicle.classType}</p>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm">
              <p><span className="text-slate-500">Vehicle:</span> {driver.vehicle.make} {driver.vehicle.model}</p>
              <p><span className="text-slate-500">Year:</span> {driver.vehicle.year}</p>
              <p><span className="text-slate-500">Vehicle status:</span> {driver.vehicle.status}</p>
              <p><span className="text-slate-500">Upcoming assigned trips:</span> {assignmentsByDriver[driver.id] || 0}</p>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={() => openEditModal(driver)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm">Manage profile</button>
              <button
                onClick={() => setDriverApproval(driver.id, !driver.approved)}
                className={`px-3 py-2 rounded-xl text-sm text-white ${driver.approved ? "bg-amber-500" : "bg-emerald-600"}`}
              >
                {driver.approved ? "Mark pending" : "Approve driver"}
              </button>
              <button
                onClick={() => setDriverOperationalStatus(driver.id, {
                  status: driver.status === "Online" ? "Offline" : "Online",
                  available: driver.status !== "Online",
                  vehicleStatus: driver.status === "Online" ? "Unavailable" : "Available",
                })}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm"
              >
                {driver.status === "Online" ? "Set Offline" : "Set Online"}
              </button>
              <button
                onClick={() => setDriverOperationalStatus(driver.id, {
                  status: "On Trip",
                  available: false,
                  vehicleStatus: "On Trip",
                })}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm"
              >
                Mark On Trip
              </button>
            </div>
          </article>
        ))}
      </div>

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
