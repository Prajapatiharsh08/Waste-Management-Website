"use client"

import { authAPI, tokenErrorEmitter } from "@/services/api"
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"

interface User {
  id: string
  name: string
  email: string
  role: "citizen" | "admin" | "collector"
  phone?: string
  address?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, role: "citizen" | "admin" | "collector") => Promise<boolean>
  register: (userData: {
    name: string
    email: string
    phone: string
    address: string
    password: string
    role: "citizen" | "admin"
  }) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken")
      if (token) {
        await refreshUser()
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const handleTokenExpiry = () => {
      logout()
      setError("Your session has expired. Please login again.")
    }

    tokenErrorEmitter.addEventListener("tokenExpired", handleTokenExpiry as EventListener)
    return () => {
      tokenErrorEmitter.removeEventListener("tokenExpired", handleTokenExpiry as EventListener)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string, role: "citizen" | "admin" | "collector"): Promise<boolean> => {
      setError(null)
      try {
        const response = await authAPI.login(email, password)
        if (response.success && response.data) {
          const { token, user: userData } = response.data as {
            token: string
            user: User
          }
          localStorage.setItem("authToken", token)
          localStorage.setItem("user", JSON.stringify(userData))
          setUser(userData)
          return true
        }
        setError(response.error || "Login failed")
        return false
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed"
        setError(message)
        console.error("[v0] Login error", err)
        return false
      }
    },
    [],
  )

  const register = useCallback(
    async (userData: {
      name: string
      email: string
      phone: string
      address: string
      password: string
      role: "citizen" | "admin"
    }): Promise<boolean> => {
      setError(null)
      try {
        const response = await authAPI.register(userData)
        if (response.success && response.data) {
          const { token, user: newUser } = response.data as {
            token: string
            user: User
          }
          localStorage.setItem("authToken", token)
          localStorage.setItem("user", JSON.stringify(newUser))
          setUser(newUser)
          return true
        }
        setError(response.error || "Registration failed")
        return false
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed"
        setError(message)
        console.error("[v0] Register error", err)
        return false
      }
    },
    [],
  )

  const logout = useCallback(() => {
    authAPI.logout()
    setUser(null)
    setError(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data as User)
        setError(null)
        localStorage.setItem("user", JSON.stringify(response.data))
      } else {
        logout()
        setError("Failed to refresh user session")
      }
    } catch (err) {
      console.error("[v0] Refresh user error", err)
      logout()
      setError("Session refresh failed")
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
