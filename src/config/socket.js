const cleanSocketBaseUrl = (value) => {
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : ""
  if (!value) return fallbackOrigin

  try {
    const parsed = new URL(value, fallbackOrigin || undefined)
    const pathname = parsed.pathname.replace(/\/api\/?$/, "")
    return `${parsed.origin}${pathname === "/" ? "" : pathname}`
  } catch {
    return String(value).replace(/\/api\/?$/, "")
  }
}

export const SOCKET_URL = cleanSocketBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
)
