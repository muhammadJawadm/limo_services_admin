import { useNotificationSocket } from "../hooks/useNotificationSocket"

export default function SocketBootstrap() {
  useNotificationSocket()
  return null
}

