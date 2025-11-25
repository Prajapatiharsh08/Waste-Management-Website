"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { pickupAPI } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Truck, Clock, CheckCircle, AlertCircle, Phone, Calendar } from "lucide-react"

interface PickupRequest {
  _id: string
  userId: string
  date: string
  status: "pending" | "assigned" | "on-the-way" | "completed"
  assignedDriver?: string
  driverPhone?: string
  scheduledTime: string
  estimatedArrival?: string
  location: string
}

export default function PickupTracking() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pickups, setPickups] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPickups = async () => {
      setLoading(true)
      try {
        const response = await pickupAPI.getUserPickups(user?.id || "")
        if (response.success && response.data) {
          setPickups(response.data as PickupRequest[])
        }
      } catch (error) {
        console.error("[v0] Error fetching pickups:", error)
        toast({
          title: "Error",
          description: "Failed to load pickup requests",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchPickups()
      const interval = setInterval(fetchPickups, 5000) // Auto-refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [user?.id, toast])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-success" />
      case "on-the-way":
        return <Truck className="w-6 h-6 text-info animate-bounce" />
      case "assigned":
        return <Clock className="w-6 h-6 text-warning" />
      case "pending":
        return <AlertCircle className="w-6 h-6 text-secondary" />
      default:
        return <AlertCircle className="w-6 h-6 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "on-the-way":
        return "info"
      case "assigned":
        return "warning"
      case "pending":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "completed":
        return "Your waste has been collected successfully"
      case "on-the-way":
        return "Collection vehicle is on the way to your location"
      case "assigned":
        return "Driver assigned and will arrive soon"
      case "pending":
        return "Your request is pending assignment"
      default:
        return "Unknown status"
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Pickups</h1>
          <p className="text-muted-foreground">Monitor the status of your waste collection requests in real-time</p>
        </div>

        {loading ? (
          <Card className="p-12 text-center border-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </Card>
        ) : pickups.length === 0 ? (
          <Card className="p-12 text-center border-2">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pickup Requests</h3>
            <p className="text-muted-foreground mb-4">You haven't requested any pickups yet.</p>
            <Button variant="hero">Request a Pickup</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {pickups.map((pickup) => (
              <Card key={pickup._id} className="p-6 border-2">
                <div className="flex items-start gap-6">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">{getStatusIcon(pickup.status)}</div>

                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{pickup.location}</h3>
                        <p className="text-muted-foreground">{pickup.date}</p>
                      </div>
                      <Badge variant={getStatusColor(pickup.status) as any}>
                        {pickup.status.replace("-", " ").toUpperCase()}
                      </Badge>
                    </div>

                    {/* Status Description */}
                    <p className="text-sm text-muted-foreground mb-6">{getStatusDescription(pickup.status)}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Scheduled Time</p>
                          <p className="font-semibold">{pickup.scheduledTime}</p>
                        </div>
                      </div>

                      {pickup.estimatedArrival && (
                        <div className="flex items-center gap-3 p-3 bg-info/10 rounded-lg border border-info/20">
                          <Clock className="w-5 h-5 text-info" />
                          <div>
                            <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                            <p className="font-semibold">{pickup.estimatedArrival}</p>
                          </div>
                        </div>
                      )}

                      {pickup.assignedDriver && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Truck className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Driver</p>
                            <p className="font-semibold">{pickup.assignedDriver}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Driver Contact */}
                    {pickup.driverPhone && pickup.status !== "pending" && (
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{pickup.driverPhone}</span>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                          <Phone className="w-4 h-4" />
                          Call Driver
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline for Completed Pickups */}
                {pickup.status === "completed" && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-sm text-muted-foreground">Completed on {pickup.date}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
