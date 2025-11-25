"use client"

/**
 * React Hooks for API Integration
 * Provides convenient hooks for fetching data in React components
 */

import { useEffect, useState, useCallback } from "react"
import { apiClient, type ApiResponse } from "@/lib/api-client"

export function useApiData<T>(fetchFn: () => Promise<ApiResponse<T>>, dependencies: any[] = [], pollInterval = 0) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchFn()
      if (response.data) {
        setData(response.data)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    fetchData()

    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval)
      return () => clearInterval(interval)
    }
  }, [...dependencies, pollInterval, fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.auth.getCurrentUser()
        if (response.data) {
          setUser(response.data)
        }
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return { user, loading }
}

export function useNearbyBins(latitude: number, longitude: number, pollInterval = 10000) {
  return useApiData(() => apiClient.polling.getNearbyBins(latitude, longitude), [latitude, longitude], pollInterval)
}

export function useUserPickups(pollInterval = 15000) {
  return useApiData(() => apiClient.polling.getPickups(), [], pollInterval)
}

export function useUserComplaints(pollInterval = 20000) {
  return useApiData(() => apiClient.polling.getComplaints(), [], pollInterval)
}

export function useCollectorStatus(pollInterval = 5000) {
  return useApiData(() => apiClient.polling.getCollectorStatus(), [], pollInterval)
}

export function useAdminDashboard(pollInterval = 5000) {
  return useApiData(() => apiClient.polling.getAdminDashboard(), [], pollInterval)
}
