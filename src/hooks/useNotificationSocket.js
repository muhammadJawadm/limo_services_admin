import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import { SOCKET_URL } from "../config/socket"
import { showNotificationToast } from "../lib/notificationToast.jsx"
import { useAuthStore } from "../store/authStore"

let notificationSocket = null

function createNotificationSocket(token) {
  if (!token) return null

  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: false,
  })
}

export function useNotificationSocket() {
  const token = useAuthStore((state) => state.token)

  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState(null)

  const lastTokenRef = useRef(token)

  useEffect(() => {
    if (!token) {
      lastTokenRef.current = null
      setConnected(false)
      setLoading(false)
      setError(null)

      if (notificationSocket) {
        notificationSocket.removeAllListeners()
        notificationSocket.disconnect()
        notificationSocket = null
      }

      return
    }

    setLoading(true)
    setError(null)

    if (notificationSocket) {
      notificationSocket.removeAllListeners()
      notificationSocket.disconnect()
      notificationSocket = null
    }

    const socket = createNotificationSocket(token)
    notificationSocket = socket
    lastTokenRef.current = token

    const handleConnect = () => {
      console.log("Admin socket connected:", socket.id)

      setConnected(true)
      setLoading(false)

      // ye zaroori hai
      socket.emit("join_admin")
    }

    const handleDisconnect = () => {
      console.log("Admin socket disconnected")
      setConnected(false)
    }

    const handleConnectError = (err) => {
      console.error("Admin socket error:", err?.message)
      setError(err?.message || "Socket connection failed.")
      setLoading(false)
      setConnected(false)
    }

    const handleNotification = (payload) => {
      showNotificationToast({
        title: payload?.title || "New notification",
        message: payload?.message || payload?.text || "You have a new update.",
        type: payload?.type || "notification",
        data: payload,
      })
    }

    const handleAdminNewMessage = (message) => {
      // sender._id === driverUserId → driver sent it → show toast
      // sender._id !== driverUserId → admin echo → skip toast
      const senderId = String(message?.sender?._id || message?.sender?.id || "")
      const driverUserId = String(message?.driverUserId || message?.meta?.driverUserId || "")
      if (senderId && driverUserId && senderId !== driverUserId) return

      const senderName =
        [message?.sender?.firstName, message?.sender?.lastName]
          .filter(Boolean)
          .join(" ") || "Driver"

      showNotificationToast({
        title: "New driver message",
        message: `${senderName}: ${message?.text || ""}`,
        type: "message",
        data: message,
      })
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)

    socket.on("notification", handleNotification)
    socket.on("admin_new_message", handleAdminNewMessage)

    socket.connect()

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off("notification", handleNotification)
      socket.off("admin_new_message", handleAdminNewMessage)

      if (lastTokenRef.current === token) {
        socket.disconnect()
        if (notificationSocket === socket) {
          notificationSocket = null
        }
      }
    }
  }, [token])

  return {
    connected,
    loading,
    error,
  }
}