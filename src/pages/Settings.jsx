import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Clock3, Loader, Mail, MessageSquare, Phone, UserRound } from "lucide-react"
import apiService from "../services/api"

function normalizeSupportResponse(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.supportRequests)) return response.supportRequests
  if (Array.isArray(response?.data?.supportRequests)) return response.data.supportRequests
  return []
}

function formatDateTime(value) {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString()
}

function getRequesterLabel(request) {
  const name = [request?.firstName, request?.lastName].filter(Boolean).join(" ").trim()
  return name || request?.email || request?.phone || `Request ${request?.id || ""}`.trim() || "Unknown requester"
}

export default function Settings() {
  const [supportRequests, setSupportRequests] = useState([])
  const [selectedSupportRequestId, setSelectedSupportRequestId] = useState(null)
  const [selectedSupportRequest, setSelectedSupportRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)
  const [error, setError] = useState("")
  const [detailError, setDetailError] = useState("")
  const [actionMessage, setActionMessage] = useState("")

  useEffect(() => {
    const loadSupportRequests = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await apiService.getAllSupportRequests()
        const requests = normalizeSupportResponse(response)
        setSupportRequests(requests)
        setSelectedSupportRequestId((currentId) => currentId || (requests[0]?.id ? String(requests[0].id) : null))
      } catch (err) {
        setError(err.message || "Unable to load support requests.")
      } finally {
        setLoading(false)
      }
    }

    loadSupportRequests()
  }, [])

  useEffect(() => {
    if (!selectedSupportRequestId) {
      setSelectedSupportRequest(null)
      return
    }

    const loadSupportRequestDetail = async () => {
      setLoadingDetail(true)
      setDetailError("")

      try {
        const response = await apiService.getSupportRequestById(selectedSupportRequestId)
        setSelectedSupportRequest(response?.data || response)
      } catch (err) {
        setDetailError(err.message || "Unable to load this support request.")
        setSelectedSupportRequest(supportRequests.find((request) => String(request.id) === String(selectedSupportRequestId)) || null)
      } finally {
        setLoadingDetail(false)
      }
    }

    loadSupportRequestDetail()
  }, [selectedSupportRequestId, supportRequests])

  const sortedSupportRequests = useMemo(() => {
    return [...supportRequests].sort((a, b) => {
      const unreadRank = Number(Boolean(a?.isRead)) - Number(Boolean(b?.isRead))
      if (unreadRank !== 0) return unreadRank
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    })
  }, [supportRequests])

  const summary = useMemo(() => {
    const unreadCount = supportRequests.filter((request) => !request?.isRead).length
    return {
      totalCount: supportRequests.length,
      unreadCount,
      readCount: supportRequests.length - unreadCount,
    }
  }, [supportRequests])

  const selectedRequester = selectedSupportRequest ? getRequesterLabel(selectedSupportRequest) : ""

  const handleMarkAsRead = async () => {
    if (!selectedSupportRequestId) return

    setMarkingRead(true)
    setActionMessage("")
    setError("")

    try {
      const response = await apiService.markSupportRequestAsRead(selectedSupportRequestId)
      const updatedRequest = response?.data || response

      setSupportRequests((currentRequests) =>
        currentRequests.map((request) =>
          String(request.id) === String(updatedRequest.id) ? { ...request, ...updatedRequest } : request
        )
      )
      setSelectedSupportRequest(updatedRequest)
      setActionMessage("Support request marked as read.")
    } catch (err) {
      setError(err.message || "Unable to mark this support request as read.")
    } finally {
      setMarkingRead(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="hero-strip p-6 md:p-7">
        <p className="text-xs uppercase tracking-[0.25em] text-white/70">Platform settings</p>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mt-2">Support inbox</h2>
        <p className="text-sm text-white/80 mt-3 max-w-3xl leading-6">
          Review inbound support questions from riders and prospects, inspect the full request details, and mark items as read after triage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm text-slate-500">Total requests</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalCount}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-slate-500">Unread</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.unreadCount}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-slate-500">Read</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.readCount}</p>
        </article>
      </div>

      {error ? (
        <div className="panel p-4 border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {actionMessage ? (
        <div className="panel p-4 border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
          <p>{actionMessage}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-4">
        <article className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Support requests</h3>
              <p className="text-sm text-slate-500 mt-1">Latest questions pulled from the support API.</p>
            </div>
            <MessageSquare className="h-5 w-5 text-[var(--brand-primary)]" />
          </div>

          <div className="mt-4 space-y-3 max-h-[620px] overflow-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-14 text-slate-500 gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Loading support requests...
              </div>
            ) : sortedSupportRequests.length > 0 ? (
              sortedSupportRequests.map((request) => {
                const isSelected = String(request.id) === String(selectedSupportRequestId)
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedSupportRequestId(String(request.id))}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{getRequesterLabel(request)}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{request.email || request.phone || "No contact details"}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          request.isRead ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {request.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 line-clamp-2">{request.description || "No description provided."}</p>
                    <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDateTime(request.createdAt)}
                    </p>
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No support requests were returned by the API.
              </div>
            )}
          </div>
        </article>

        <article className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Request details</h3>
              <p className="text-sm text-slate-500 mt-1">Inspect the selected support message.</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAsRead}
              disabled={!selectedSupportRequest || selectedSupportRequest.isRead || markingRead}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingRead ? <Loader className="h-4 w-4 animate-spin" /> : null}
              {selectedSupportRequest?.isRead ? "Already read" : markingRead ? "Marking..." : "Mark as read"}
            </button>
          </div>

          <div className="mt-5">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Loading request details...
              </div>
            ) : selectedSupportRequest ? (
              <div className="space-y-5">
                {detailError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {detailError}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Requester</p>
                      <h4 className="mt-1 text-xl font-semibold text-slate-900">{selectedRequester}</h4>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        selectedSupportRequest.isRead ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedSupportRequest.isRead ? "Read" : "Unread"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                    <div className="rounded-xl bg-white px-3 py-2 border border-slate-200 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{selectedSupportRequest.email || "No email provided"}</span>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-slate-200 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{selectedSupportRequest.phone || "No phone provided"}</span>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-slate-200 flex items-center gap-2 md:col-span-2">
                      <UserRound className="h-4 w-4 text-slate-400" />
                      <span>Support request ID: {selectedSupportRequest.id}</span>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-slate-200 flex items-center gap-2 md:col-span-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      <span>Created: {formatDateTime(selectedSupportRequest.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Message</p>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                    {selectedSupportRequest.description || "No description provided."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center text-sm text-slate-500">
                {loading ? "Loading support requests..." : "Select a support request to view the details."}
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
