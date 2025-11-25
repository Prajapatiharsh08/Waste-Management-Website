"use client"

import { useState, useEffect, useCallback } from "react"
import { collectorsAPI } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export interface Collector {
  _id: string
  name: string
  email: string
  phone: string
  area: string
  vehicleId: string
  status: "active" | "on-break" | "off-duty"
  location?: { latitude: number; longitude: number }
  currentRoute?: string
  shiftsCompleted: number
  rating: number
  binsCollected?: number
}

interface UseCollectorsReturn {
  collectors: Collector[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  activeCollectors: Collector[]
}

export function useCollectors(autoRefresh = true): UseCollectorsReturn {
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const response = await collectorsAPI.getCollectors()

      if (response.success && response.data) {
        setCollectors(response.data as Collector[])
        setError(null)
      } else {
        throw new Error(response.error || "Failed to fetch collectors")
      }
    } catch (err) {
      console.error("[v0] Error fetching collectors:", err)
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast({
        title: "Error",
        description: "Failed to fetch collector data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const activeCollectors = collectors.filter((c) => c.status === "active")

  useEffect(() => {
    refetch()

    if (autoRefresh) {
      const interval = setInterval(refetch, 5000)
      return () => clearInterval(interval)
    }
  }, [refetch, autoRefresh])

  return {
    collectors,
    loading,
    error,
    refetch,
    activeCollectors,
  }
}
