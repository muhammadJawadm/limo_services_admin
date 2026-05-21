import { useEffect, useMemo, useState } from "react"
import { BellRing, Send } from "lucide-react"
import apiService from "../services/api"

const recipientModes = [
  { label: "All Users", value: "all" },
  { label: "Single User", value: "one" },
]

const notificationTypes = [
  { label: "General", value: "general" },
  { label: "Booking Update", value: "booking_update" },
  { label: "Trip Alert", value: "trip_alert" },
  { label: "Delay Notice", value: "delay_notice" },
]

export default function Notifications() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [recipientMode, setRecipientMode] = useState("all")
  const [recipientUserId, setRecipientUserId] = useState("")
  const [type, setType] = useState("general")
  const [sending, setSending] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [users, setUsers] = useState([])
  const [recentNotifications, setRecentNotifications] = useState([])
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [recentError, setRecentError] = useState("")

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true)
      setError("")

      try {
        const response = await apiService.getAllUsers()
        const nextUsers = Array.isArray(response?.data)
          ? response.data.filter((user) => user?.role && user.role !== "admin")
          : []

        setUsers(nextUsers)

        if (nextUsers.length > 0) {
          setRecipientUserId((currentRecipientUserId) => currentRecipientUserId || nextUsers[0].id)
        }
      } catch (err) {
        setError(err.message || "Unable to load users.")
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  useEffect(() => {
    const loadNotifications = async () => {
      setLoadingNotifications(true)
      setRecentError("")

      try {
        const response = await apiService.getAllNotifications()
        setRecentNotifications(Array.isArray(response?.data) ? response.data : [])
      } catch (err) {
        setRecentError(err.message || "Unable to load recent notifications.")
      } finally {
        setLoadingNotifications(false)
      }
    }

    loadNotifications()
  }, [])

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(recipientUserId)),
    [recipientUserId, users]
  )

  const formatUserLabel = (user) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    return fullName || user.email || user.id
  }

  const formatNotificationTime = (value) => {
    if (!value) {
      return "Just now"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return "Just now"
    }

    return date.toLocaleString()
  }

  const formatRecipientLabel = (notification) => {
    if (notification.recipientUserId) {
      const matchedUser = users.find((user) => String(user.id) === String(notification.recipientUserId))
      if (matchedUser) {
        return formatUserLabel(matchedUser)
      }

      return String(notification.recipientUserId)
    }

    return notification.recipientRole ? `All ${notification.recipientRole}s` : "All users"
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSending(true)
    setStatus("")

    try {
      const trimmedTitle = title.trim()
      const trimmedMessage = message.trim()

      if (!trimmedTitle || !trimmedMessage) {
        throw new Error("Title and message are required.")
      }

      if (recipientMode === "one") {
        if (!selectedUser) {
          throw new Error("Please select a user to notify.")
        }

        await apiService.createNotification({
          recipientRole: selectedUser.role,
          recipientUserId: selectedUser.id,
          title: trimmedTitle,
          message: trimmedMessage,
          type,
        })
      } else {
        if (users.length === 0) {
          throw new Error("No users found to notify.")
        }

        const eligibleUsers = users.filter((user) => user.id)
        await Promise.all(
          eligibleUsers.map((user) =>
            apiService.createNotification({
              recipientRole: user.role,
              recipientUserId: user.id,
              title: trimmedTitle,
              message: trimmedMessage,
              type,
            })
          )
        )
      }

      setStatus("Notification sent successfully.")
      setTitle("")
      setMessage("")
      setType("general")
    } catch (err) {
      setError(err.message || "Unable to send notification.")
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="panel p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Broadcast Notification</h2>
              <p className="text-sm text-slate-500 mt-1">Send rider or driver updates from your backend notification endpoint.</p>
            </div>
          </div>

          <form className="space-y-3 mt-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-600">Recipient Mode</label>
              <select
                value={recipientMode}
                onChange={(event) => setRecipientMode(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
              >
                {recipientModes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            {recipientMode === "one" ? (
              <div>
                <label className="text-sm font-medium text-slate-600">Select User</label>
                <select
                  value={recipientUserId}
                  onChange={(event) => setRecipientUserId(event.target.value)}
                  disabled={loadingUsers}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {loadingUsers ? (
                    <option value="">Loading users...</option>
                  ) : (
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {formatUserLabel(user)} {user.role ? `(${user.role})` : ""}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {users.length > 0 ? `${users.length} users loaded from the API.` : "No recipients available."}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                This will send the notification to every loaded user from the API.
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-600">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Trip update for airport arrivals"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Message</label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows="4"
                placeholder="Your chauffeur is 6 minutes away at terminal pickup zone B."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Notification Type</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
              >
                {notificationTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}

            {status ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>
            ) : null}

            <button
              type="submit"
              disabled={sending || loadingUsers}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : loadingUsers ? "Loading Users..." : "Send Notification"}
            </button>
          </form>
        </article>

        <article className="panel p-5 flex flex-col">
          <h2 className="text-xl font-semibold text-slate-900">Recent Alerts</h2>
          <p className="text-sm text-slate-500 mt-1">Most recent notifications pulled from the backend.</p>

          <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {loadingNotifications ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                Loading recent notifications...
              </div>
            ) : recentError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {recentError}
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                No recent notifications found.
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-800">{notification.title || "Untitled notification"}</p>
                    <span className="text-xs text-slate-400">{formatNotificationTime(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{notification.message || "No message provided."}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-2 py-1 border border-slate-200">
                      {notification.type || "general"}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 border border-slate-200">
                      {formatRecipientLabel(notification)}
                    </span>
                    {notification.isRead ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 border border-emerald-200 text-emerald-700">
                        Read
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-1 border border-amber-200 text-amber-700">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
