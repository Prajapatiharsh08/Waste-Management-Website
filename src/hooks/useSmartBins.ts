"use client"

import { useState, useEffect, useCallback } from "react"
import { binsAPI } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export interface SmartBin {
  _id: string
  location: string
  latitude: number
  longitude: number
  fillLevel: number
  temperature: number
  battery: number
  humidity: number
  status: "operational" | "maintenance" | "offline"
  lastUpdated: string
  distance?: number
}

interface UseSmartBinsReturn {
  bins: SmartBin[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  nearbyBins: SmartBin[]
  alertBins: SmartBin[]
}

export function useSmartBins(userLat?: number, userLng?: number, autoRefresh = true): UseSmartBinsReturn {
  const [bins, setBins] = useState<SmartBin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const response = userLat && userLng ? await binsAPI.getNearbyBins(userLat, userLng) : await binsAPI.getAllBins()

      if (response.success && response.data) {
        setBins(response.data as SmartBin[])
        setError(null)
      } else {
        throw new Error(response.error || "Failed to fetch bins")
      }
    } catch (err) {
      console.error("[v0] Error fetching smart bins:", err)
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast({
        title: "Error",
        description: "Failed to fetch smart bin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userLat, userLng, toast])

  // Calculate alert bins (fillLevel > 80%)
  const alertBins = bins.filter((bin) => bin.fillLevel > 80)

  // Calculate nearby bins (within 5km)
  const nearbyBins = bins.filter((bin) => {
    if (!userLat || !userLng) return false
    const distance = Math.sqrt(Math.pow(bin.latitude - userLat, 2) + Math.pow(bin.longitude - userLng, 2)) * 111 // Rough conversion to km
    return distance < 5
  })

  useEffect(() => {
    refetch()

    if (autoRefresh) {
      const interval = setInterval(refetch, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [refetch, autoRefresh])

  return {
    bins,
    loading,
    error,
    refetch,
    nearbyBins,
    alertBins,
  }
}
