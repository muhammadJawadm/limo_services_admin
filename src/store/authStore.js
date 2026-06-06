import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const hasStorage = typeof localStorage !== "undefined"
const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

function readStoredAuth() {
  try {
    if (!hasStorage) {
      return {
        user: null,
        token: null,
      }
    }

    const rawUser = localStorage.getItem("adminUser")
    const token = localStorage.getItem("adminToken")

    return {
      user: rawUser ? JSON.parse(rawUser) : null,
      token: token || null,
    }
  } catch {
    return {
      user: null,
      token: null,
    }
  }
}

const initialAuth = readStoredAuth()

export const useAuthStore = create(
  persist(
    (set) => ({
      user: initialAuth.user,
      token: initialAuth.token,
      setAuth: ({ user, token }) =>
        set(() => {
          if (hasStorage && user) {
            localStorage.setItem("adminUser", JSON.stringify(user))
          } else if (hasStorage) {
            localStorage.removeItem("adminUser")
          }

          if (hasStorage && token) {
            localStorage.setItem("adminToken", token)
          } else if (hasStorage) {
            localStorage.removeItem("adminToken")
          }

          return {
            user: user ?? null,
            token: token ?? null,
          }
        }),
      setUser: (user) =>
        set(() => {
          if (hasStorage && user) {
            localStorage.setItem("adminUser", JSON.stringify(user))
          } else if (hasStorage) {
            localStorage.removeItem("adminUser")
          }

          return { user: user ?? null }
        }),
      setToken: (token) =>
        set(() => {
          if (hasStorage && token) {
            localStorage.setItem("adminToken", token)
          } else if (hasStorage) {
            localStorage.removeItem("adminToken")
          }

          return { token: token ?? null }
        }),
      clearAuth: () =>
        set(() => {
          if (hasStorage) {
            localStorage.removeItem("adminUser")
            localStorage.removeItem("adminToken")
          }

          return { user: null, token: null }
        }),
    }),
    {
      name: "admin-auth-store",
      storage: createJSONStorage(() => (hasStorage ? localStorage : memoryStorage)),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)
