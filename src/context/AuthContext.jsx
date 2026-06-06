/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"
import apiService from "../services/api"
import { useAuthStore } from "../store/authStore"

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(!!token)

  /**
   * Admin Login
   */
  const login = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.login(email, password)

      if (response.success) {
        const newToken =
  response.token ||
  response.data?.token ||
  response.data?.accessToken

const userData =
  response.user ||
  response.data?.user

if (!newToken || !userData) {
  throw new Error("Login response is missing token or user.")
}

        apiService.setToken(newToken)
        setAuth({ user: userData, token: newToken })
        setIsAuthenticated(true)

        return {
          success: true,
          user: userData,
          token: newToken,
        }
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (err) {
      const errorMessage = err.message || "An error occurred during login"
      setError(errorMessage)
      setIsAuthenticated(false)

      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout
   */
  const logout = () => {
    apiService.logout()
    clearAuth()
    setIsAuthenticated(false)
    setError(null)
  }

  /**
   * Check if user is admin (optional role check)
   */
  const isAdmin = () => {
    return user?.role === "admin"
  }

  // Initialize auth state from stored token
  useEffect(() => {
    if (token) {
      apiService.setToken(token)
      setIsAuthenticated(true)
    } else {
      apiService.setToken(null)
      setIsAuthenticated(false)
    }
  }, [token])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
