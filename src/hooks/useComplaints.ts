"use client"

import { useState, useEffect, useCallback } from "react"
import { complaintsAPI } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export interface Complaint {
  _id: string
  userId: string
  title: string
  description: string
  category: "overflowing-bin" | "uncollected-waste" | "damaged-bin" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "acknowledged" | "in-progress" | "resolved" | "closed"
  attachments?: string[]
  createdAt: string
  updatedAt: string
  assignedTo?: string
  resolution?: string
  satisfactionRating?: number
}

interface UseComplaintsReturn {
  complaints: Complaint[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  fileComplaint: (complaint: Omit<Complaint, "_id" | "createdAt" | "updatedAt">) => Promise<boolean>
  updateComplaint: (id: string, updates: Partial<Complaint>) => Promise<boolean>
  activeComplaints: Complaint[]
  resolvedComplaints: Complaint[]
}

export function useComplaints(userId?: string, autoRefresh = true): UseComplaintsReturn {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const response = userId ? await complaintsAPI.getUserComplaints(userId) : await complaintsAPI.getAllComplaints()

      if (response.success && response.data) {
        setComplaints(response.data as Complaint[])
        setError(null)
      } else {
        throw new Error(response.error || "Failed to fetch complaints")
      }
    } catch (err) {
      console.error("[v0] Error fetching complaints:", err)
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userId, toast])

  const fileComplaint = useCallback(
    async (complaint: Omit<Complaint, "_id" | "createdAt" | "updatedAt">) => {
      try {
        const response = await complaintsAPI.fileComplaint(complaint)
        if (response.success) {
          toast({
            title: "Success",
            description: "Complaint filed successfully",
          })
          await refetch()
          return true
        }
        throw new Error(response.error || "Failed to file complaint")
      } catch (err) {
        console.error("[v0] Error filing complaint:", err)
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to file complaint",
          variant: "destructive",
        })
        return false
      }
    },
    [toast, refetch],
  )

  const updateComplaint = useCallback(
    async (id: string, updates: Partial<Complaint>) => {
      try {
        const response = await complaintsAPI.updateComplaintStatus(id, updates)
        if (response.success) {
          toast({
            title: "Success",
            description: "Complaint updated successfully",
          })
          await refetch()
          return true
        }
        throw new Error(response.error || "Failed to update complaint")
      } catch (err) {
        console.error("[v0] Error updating complaint:", err)
        toast({
          title: "Error",
          description: "Failed to update complaint",
          variant: "destructive",
        })
        return false
      }
    },
    [toast, refetch],
  )

  const activeComplaints = complaints.filter((c) => !["resolved", "closed"].includes(c.status))
  const resolvedComplaints = complaints.filter((c) => ["resolved", "closed"].includes(c.status))

  useEffect(() => {
    refetch()

    if (autoRefresh) {
      const interval = setInterval(refetch, 5000)
      return () => clearInterval(interval)
    }
  }, [refetch, autoRefresh])

  return {
    complaints,
    loading,
    error,
    refetch,
    fileComplaint,
    updateComplaint,
    activeComplaints,
    resolvedComplaints,
  }
}
