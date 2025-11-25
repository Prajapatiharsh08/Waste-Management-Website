"use client"

import { useState, useEffect, useCallback } from "react"
import { iotAPI } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export interface IoTData {
  binId: string
  fillLevel: number
  temperature: number
  battery: number
  humidity: number
  timestamp: string
}

interface UseLiveIoTReturn {
  iotData: IoTData[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  startSimulation: () => Promise<void>
}

export function useLiveIoT(autoRefresh = true): UseLiveIoTReturn {
  const [iotData, setIoTData] = useState<IoTData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const response = await iotAPI.getRealTimeData()

      if (response.success && response.data) {
        setIoTData(response.data as IoTData[])
        setError(null)
      } else {
        throw new Error(response.error || "Failed to fetch IoT data")
      }
    } catch (err) {
      console.error("[v0] Error fetching IoT data:", err)
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast({
        title: "Error",
        description: "Failed to fetch live IoT data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const startSimulation = useCallback(async () => {
    try {
      const response = await iotAPI.simulateBinStatus()
      if (response.success) {
        toast({
          title: "Simulation Started",
          description: "IoT sensor simulation is now active",
        })
        await refetch()
      }
    } catch (err) {
      console.error("[v0] Error starting simulation:", err)
      toast({
        title: "Error",
        description: "Failed to start IoT simulation",
        variant: "destructive",
      })
    }
  }, [toast, refetch])

  useEffect(() => {
    refetch()

    if (autoRefresh) {
      const interval = setInterval(refetch, 5000)
      return () => clearInterval(interval)
    }
  }, [refetch, autoRefresh])

  return {
    iotData,
    loading,
    error,
    refetch,
    startSimulation,
  }
}
