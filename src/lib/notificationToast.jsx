import { MessageCircle, CarFront, AlertCircle, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

function formatTitle(payload) {
  return payload?.title || payload?.heading || payload?.subject || "Notification"
}

function formatMessage(payload) {
  return payload?.message || payload?.text || payload?.body || "You have a new notification."
}

function NotificationToast({ icon, title, message, toneClassName }) {
  return (
    <div className={`flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-lg ${toneClassName}`}>
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-600">{message}</p>
      </div>
    </div>
  )
}

export function showNotificationToast(payload = {}) {
  const type = String(payload?.type || "").toLowerCase()
  const title = formatTitle(payload)
  const message = formatMessage(payload)

  if (type === "alert") {
    return toast.custom(
      <NotificationToast
        icon={<AlertCircle className="h-4 w-4" />}
        title={title}
        message={message}
        toneClassName="border-rose-100"
      />,
      { duration: 5000 }
    )
  }

  if (type === "message") {
    return toast.custom(
      <NotificationToast
        icon={<MessageCircle className="h-4 w-4" />}
        title={title}
        message={message}
        toneClassName="border-sky-100"
      />,
      { duration: 4500 }
    )
  }

  if (type === "booking") {
    return toast.custom(
      <NotificationToast
        icon={<CarFront className="h-4 w-4" />}
        title={title}
        message={message}
        toneClassName="border-amber-100"
      />,
      { duration: 4500 }
    )
  }

  return toast.custom(
    <NotificationToast
      icon={<CheckCircle2 className="h-4 w-4" />}
      title={title}
      message={message}
      toneClassName="border-emerald-100"
    />,
    { duration: 4000 }
  )
}

export function showDriverChatNotificationToast(payload = {}) {
  return showNotificationToast({
    ...payload,
    type: payload?.type || "message",
    title: payload?.title || "Driver chat",
  })
}
