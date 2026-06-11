import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Loader, Image as ImageIcon, Users, Briefcase, DollarSign, Plus, Upload, X } from "lucide-react"
import apiService from "../services/api"

function normalizeListResponse(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.vehicleCategories)) return response.vehicleCategories
  if (Array.isArray(response?.data?.vehicleCategories)) return response.data.vehicleCategories
  return []
}

function normalizeSingleResponse(response) {
  if (!response) return null
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) return response.data
  if (response.data?.data && typeof response.data.data === "object" && !Array.isArray(response.data.data)) return response.data.data
  if (response.vehicleCategory && typeof response.vehicleCategory === "object") return response.vehicleCategory
  if (response.success && response.data) return response.data
  return null
}

const initialFormState = {
  name: "",
  type: "airport",
  classification: "suv",
  passengers: "5",
  luggage: "3",
  baseFare: "75",
  perMileRate30: "3.5",
  perMileRate40: "2.5",
  pictureFile: null,
}

export default function Fleet() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [form, setForm] = useState(initialFormState)
  const [picturePreview, setPicturePreview] = useState("")

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiService.getVehicleCategories()
        setVehicles(normalizeListResponse(response))
      } catch (err) {
        console.error("Error fetching vehicles:", err)
        setError(err.message || "Failed to load vehicles. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  useEffect(() => {
    if (!form.pictureFile) {
      setPicturePreview("")
      return undefined
    }

    const previewUrl = URL.createObjectURL(form.pictureFile)
    setPicturePreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [form.pictureFile])

  const categoryStats = useMemo(() => {
    const total = vehicles.length
    const airportCount = vehicles.filter((vehicle) => String(vehicle.type || "").toLowerCase() === "airport").length
    const suvCount = vehicles.filter((vehicle) => String(vehicle.classification || "").toLowerCase().includes("suv")).length
    const sedanCount = vehicles.filter((vehicle) => String(vehicle.classification || "").toLowerCase().includes("sedan")).length

    return { total, airportCount, suvCount, sedanCount }
  }, [vehicles])

  const openCreateModal = () => {
    setShowCreateModal(true)
    setSubmitError(null)
  }

  const closeCreateModal = () => {
    if (submitting) return
    setShowCreateModal(false)
    setSubmitError(null)
    setForm(initialFormState)
    setPicturePreview("")
  }

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleFileChange = (file) => {
    setForm((current) => ({ ...current, pictureFile: file || null }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setSubmitError("Vehicle category name is required.")
      return
    }

    if (!form.pictureFile) {
      setSubmitError("Please choose a picture file for the category.")
      return
    }

    try {
      setSubmitting(true)
      setSubmitError(null)

      const payload = new FormData()
      payload.append("name", form.name.trim())
      payload.append("type", form.type)
      payload.append("classification", form.classification)
      payload.append("baseFare", form.baseFare)
      payload.append("perMileRate30", form.perMileRate30)
      payload.append("perMileRate40", form.perMileRate40)

      const passengersInt = Math.max(1, parseInt(form.passengers, 10) || 1)
      const luggageInt = Math.max(0, parseInt(form.luggage, 10) || 0)

      payload.append("passengers", passengersInt)
      payload.append("luggage", luggageInt)
      payload.append("passengerCapacity", passengersInt)
      payload.append("luggageCapacity", luggageInt)
      payload.append("capacity", JSON.stringify({ passengers: passengersInt, luggage: luggageInt }))
      payload.append("picture", form.pictureFile, form.pictureFile.name)

      const response = await apiService.createVehicleCategory(payload)
      const createdVehicle = normalizeSingleResponse(response)

      setVehicles((current) => (createdVehicle ? [createdVehicle, ...current] : current))
      setSelectedVehicle(createdVehicle || null)
      closeCreateModal()
    } catch (err) {
      console.error("Error creating vehicle category:", err)
      setSubmitError(err.message || "Unable to create the vehicle category.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Fleet & Vehicle Categories</h2>
          <p className="text-sm text-slate-500 mt-1">Manage vehicle types, pricing, and capacity configurations.</p>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
            <p className="text-slate-600">Loading vehicle categories...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-slate-900">Fleet & Vehicle Categories</h2>
          <p className="text-sm text-slate-500 mt-1">Manage vehicle types, pricing, and capacity configurations.</p>
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
    <>
      <section className="space-y-5">
        <div className="panel p-5">
          <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Fleet & Vehicle Categories</h2>
              <p className="text-sm text-slate-500 mt-1">Create and manage the vehicle categories used across bookings and drivers.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add category
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-[var(--brand-primary)]">{categoryStats.total}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Total Categories</p>
          </div>
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{categoryStats.airportCount}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Airport</p>
          </div>
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{categoryStats.suvCount}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">SUV</p>
          </div>
          <div className="panel p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{categoryStats.sedanCount}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Sedan</p>
          </div>
        </div>

        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => {
              const isExpanded = selectedVehicle?.id === vehicle.id

              return (
                <article
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(isExpanded ? null : vehicle)}
                  className="panel p-5 cursor-pointer hover:shadow-lg transition-all hover:border-[var(--brand-primary)]/20 overflow-hidden"
                >
                  <div className="relative h-40 mb-4 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                    {vehicle.picture ? (
                      <img
                        src={vehicle.picture}
                        alt={vehicle.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                        }}
                      />
                    ) : null}
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{vehicle.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                        {vehicle.classification}
                      </span>
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {vehicle.type}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-slate-500" />
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Passengers</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{vehicle.passengerCapacity}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-slate-500" />
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Luggage</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{vehicle.luggageCapacity}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">Base Fare</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">${vehicle.baseFare}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Per Mile Rate up to 30 miles </span>
                      <span className="text-sm font-bold text-slate-900">${vehicle.perMileRate30}/mile</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Per Mile Rate above the 40 miles </span>
                      <span className="text-sm font-bold text-slate-900">${vehicle.perMileRate40}/mile</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Category ID</p>
                        <p className="text-sm font-mono text-slate-900 break-all">{vehicle.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Classification</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">{vehicle.classification}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Service Type</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">{vehicle.type}</p>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Pricing Summary</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Base Fare:</span>
                            <span className="font-semibold text-slate-900">${vehicle.baseFare}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Per Mile:</span>
                            <span className="font-semibold text-slate-900">${vehicle.perMileRate}</span>
                          </div>
                          <div className="flex justify-between py-1 border-t border-slate-200 mt-1 pt-1">
                            <span className="text-slate-600">Capacity:</span>
                            <span className="font-semibold text-slate-900">
                              {vehicle.passengerCapacity} pax • {vehicle.luggageCapacity} bags
                            </span>
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
            <p className="text-slate-600">No vehicle categories found.</p>
          </div>
        )}

        <div className="panel p-5 bg-blue-50 border-l-4 border-blue-600">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">About Vehicle Categories</h4>
          <p className="text-sm text-blue-800">
            Vehicle categories define the transportation services available. Each category has specific passenger and luggage capacity, pricing structure, and service type.
          </p>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={closeCreateModal}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Add vehicle category</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">Create new fleet category</h3>
              </div>
              <button
                onClick={closeCreateModal}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all grid place-items-center"
              >
                <X size={16} />
              </button>
            </div>

            <form className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.9fr] max-h-[calc(90vh-73px)] overflow-hidden" onSubmit={handleSubmit}>
              <div className="overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Name</span>
                    <input
                      value={form.name}
                      onChange={(event) => handleFieldChange("name", event.target.value)}
                      placeholder="Haval H6 PHEV"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Type</span>
                    <select
                      value={form.type}
                      onChange={(event) => handleFieldChange("type", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    >
                      <option value="airport">airport</option>
                      <option value="hourly">hourly</option>
                      <option value="transfer">transfer</option>
                      <option value="city">city</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Classification</span>
                    <select
                      value={form.classification}
                      onChange={(event) => handleFieldChange("classification", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    >
                      <option value="suv">suv</option>
                      <option value="sedan">sedan</option>
                      <option value="van">van</option>
                      <option value="luxury">luxury</option>
                      <option value="minibus">minibus</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Picture file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Passengers</span>
                    <input
                      type="number"
                      min="1"
                      value={form.passengers}
                      onChange={(event) => handleFieldChange("passengers", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Luggage</span>
                    <input
                      type="number"
                      min="0"
                      value={form.luggage}
                      onChange={(event) => handleFieldChange("luggage", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Base fare</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.baseFare}
                      onChange={(event) => handleFieldChange("baseFare", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Per mile rate (up to 30 mi)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.perMileRate30}
                      onChange={(event) => handleFieldChange("perMileRate30", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-semibold text-slate-700">Per mile rate (above 40 mi)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.perMileRate40}
                      onChange={(event) => handleFieldChange("perMileRate40", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition-all"
                    />
                  </label>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 space-y-2">
                  <p className="font-semibold text-slate-900">Payload preview</p>
                  <p><span className="text-slate-500">Name:</span> {form.name || "Haval H6 PHEV"}</p>
                  <p><span className="text-slate-500">Capacity:</span> {form.passengers} passengers · {form.luggage} luggage</p>
                  <p><span className="text-slate-500">Rates:</span> ${form.perMileRate30}/mi (≤30) · ${form.perMileRate40}/mi (40+)</p>
                  <p><span className="text-slate-500">Image:</span> {form.pictureFile ? form.pictureFile.name : "No file selected"}</p>
                </div>

                {submitError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{submitError}</p>
                  </div>
                )}
              </div>

              <aside className="overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-100 p-4 bg-slate-50/60 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Picture preview</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Upload image for the vehicle category.</p>
                </div>

                <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                  {picturePreview ? (
                    <img src={picturePreview} alt="Vehicle preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400 p-6">
                      <Upload className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-sm">Choose an image to preview it here.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-white border border-slate-100 p-3 text-xs text-slate-700 space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Expected API body</p>
                    <pre className="text-xs whitespace-pre-wrap text-slate-600 leading-4">{`{
  "name": "Haval H6 PHEV",
  "type": "airport",
  "classification": "suv",
  "capacity": {
    "luggage": 3,
    "passengers": 5
  },
  "baseFare": 75,
  "perMileRate": 3.5,
  "picture": "file"
}`}</pre>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg bg-[var(--brand-primary)] text-white font-semibold shadow-sm hover:opacity-95 transition-all disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create category"}
                </button>
              </aside>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
