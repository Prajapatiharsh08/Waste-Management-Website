"use client"

import { useAuth } from "@/context/AuthContext"
import { useSmartBins } from "@/hooks/useSmartBins"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, CheckCircle, Clock, Trash2, Thermometer, Zap, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { routesAPI } from "@/services/api"

interface CollectorRoute {
  _id: string
  collectorId: string
  bins: Array<{
    binId: string
    location: string
    latitude: number
    longitude: number
    fillLevel: number
  }>
  estimatedDuration: number
  status: "pending" | "in-progress" | "completed"
  createdAt: string
}

export default function CollectorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { bins, loading: binsLoading } = useSmartBins()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [route, setRoute] = useState<CollectorRoute | null>(null)
  const [collectedBins, setCollectedBins] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      })
    }
  }, [])

  // Fetch assigned route
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await routesAPI.getOptimizedRoute()
        if (response.success && response.data) {
          setRoute(response.data as CollectorRoute)
        }
      } catch (error) {
        console.error("[v0] Error fetching route:", error)
      }
    }

    fetchRoute()
    const interval = setInterval(fetchRoute, 5000)
    return () => clearInterval(interval)
  }, [])

  const assignedBins = route?.bins || []
  const remainingBins = assignedBins.length - collectedBins

  const handleStartNavigation = () => {
    setIsNavigating(true)
    // In a real app, this would open a maps app
    toast({
      title: "Navigation Started",
      description: "Opening directions to next bin...",
    })
  }

  const handleMarkBinCollected = async (binId: string) => {
    try {
      setCollectedBins((prev) => prev + 1)
      // API call would go here
      toast({
        title: "Bin Collected",
        description: "Marked as collected successfully",
      })
    } catch (error) {
      console.error("[v0] Error marking bin as collected:", error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/collector-login")
  }

  // Import toast from proper location - fix for this component
  const { useToast } = require("@/hooks/use-toast")
  const { toast } = useToast()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold">{user?.name || "Collector"}</h1>
              <p className="text-sm text-muted-foreground">ID: {user?.id}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-2">
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Assigned Bins</span>
            </div>
            <p className="text-3xl font-bold">{assignedBins.length}</p>
          </Card>

          <Card className="p-6 border-2">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Collected</span>
            </div>
            <p className="text-3xl font-bold">{collectedBins}</p>
          </Card>

          <Card className="p-6 border-2">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-warning" />
              <span className="text-sm text-muted-foreground">Remaining</span>
            </div>
            <p className="text-3xl font-bold">{remainingBins}</p>
          </Card>

          <Card className="p-6 border-2">
            <div className="flex items-center gap-3 mb-2">
              <Navigation className="w-5 h-5 text-info" />
              <span className="text-sm text-muted-foreground">Est. Duration</span>
            </div>
            <p className="text-3xl font-bold">{route?.estimatedDuration || 0} min</p>
          </Card>
        </div>

        {/* Current Location */}
        {userLocation && (
          <Card className="p-6 border-2 mb-8 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-semibold">Current Location</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
            </p>
          </Card>
        )}

        {/* Assigned Bins List */}
        <Card className="p-6 border-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Today's Collection Route</h2>
            <Button variant="hero" onClick={handleStartNavigation} disabled={remainingBins === 0} className="gap-2">
              <Navigation className="w-4 h-4" />
              Start Navigation
            </Button>
          </div>

          <div className="space-y-3">
            {assignedBins.map((bin, index) => {
              const binData = bins.find((b) => b._id === bin.binId)
              const isCollected = index < collectedBins

              return (
                <div
                  key={bin.binId}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      isCollected ? "bg-success" : "bg-primary"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{bin.location}</h3>
                      {isCollected && <Badge variant="default">Collected</Badge>}
                    </div>
                    {binData && (
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Trash2 className="w-4 h-4" />
                          Fill Level: {binData.fillLevel}%
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-4 h-4" />
                          Temp: {binData.temperature}°C
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          Battery: {binData.battery}%
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCollected && (
                    <Button size="sm" onClick={() => handleMarkBinCollected(bin.binId)}>
                      Mark Collected
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </main>
    </div>
  )
}
