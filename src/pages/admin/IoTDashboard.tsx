"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminSidebar } from "@/components/AdminSidebar"
import { useLiveIoT } from "@/hooks/useLiveIoT"
import { useSmartBins } from "@/hooks/useSmartBins"
import { Zap, Thermometer, Droplets, Play, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Trash2 } from "lucide-react" // Import Trash2 here
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useState } from "react"

export default function IoTDashboard() {
  const { iotData, loading: iotLoading, startSimulation } = useLiveIoT()
  const { bins, loading: binsLoading } = useSmartBins()
  const [simulating, setSimulating] = useState(false)

  const handleStartSimulation = async () => {
    setSimulating(true)
    await startSimulation()
    setSimulating(false)
  }

  // Prepare chart data from IoT data
  const chartData = iotData.slice(-10).map((data, index) => ({
    time: `${index * 30}s`,
    fillLevel: data.fillLevel || 0,
    temperature: data.temperature || 0,
    battery: data.battery || 0,
    humidity: data.humidity || 0,
  }))

  // Calculate statistics
  const avgFillLevel =
    iotData.length > 0 ? Math.round(iotData.reduce((sum, d) => sum + d.fillLevel, 0) / iotData.length) : 0

  const avgTemperature =
    iotData.length > 0 ? (iotData.reduce((sum, d) => sum + d.temperature, 0) / iotData.length).toFixed(1) : 0

  const avgBattery =
    iotData.length > 0 ? Math.round(iotData.reduce((sum, d) => sum + d.battery, 0) / iotData.length) : 0

  const avgHumidity =
    iotData.length > 0 ? Math.round(iotData.reduce((sum, d) => sum + d.humidity, 0) / iotData.length) : 0

  const criticalBins = bins.filter((b) => b.fillLevel > 95)
  const warningBins = bins.filter((b) => b.fillLevel > 80 && b.fillLevel <= 95)
  const normalBins = bins.filter((b) => b.fillLevel <= 80)

  const binStatusData = [
    { name: "Critical", value: criticalBins.length, color: "#ef4444" },
    { name: "Warning", value: warningBins.length, color: "#f59e0b" },
    { name: "Normal", value: normalBins.length, color: "#10b981" },
  ]

  if (iotLoading && binsLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">IoT Live Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time sensor data from smart bins ({iotData.length} active sensors)
            </p>
          </div>
          <Button variant="hero" onClick={handleStartSimulation} disabled={simulating} className="gap-2">
            {simulating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Simulation
              </>
            )}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-2">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-primary" />
              </div>
              <Badge variant={avgFillLevel > 80 ? "destructive" : "default"}>
                {avgFillLevel > 95 ? "Critical" : avgFillLevel > 80 ? "Warning" : "Normal"}
              </Badge>
            </div>
            <p className="text-3xl font-bold mb-1">{avgFillLevel}%</p>
            <p className="text-sm text-muted-foreground">Avg Fill Level</p>
          </Card>

          <Card className="p-6 border-2">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
              <Thermometer className="w-6 h-6 text-warning" />
            </div>
            <p className="text-3xl font-bold mb-1">{avgTemperature}°C</p>
            <p className="text-sm text-muted-foreground">Avg Temperature</p>
          </Card>

          <Card className="p-6 border-2">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <p className="text-3xl font-bold mb-1">{avgBattery}%</p>
            <p className="text-sm text-muted-foreground">Avg Battery</p>
          </Card>

          <Card className="p-6 border-2">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center mb-4">
              <Droplets className="w-6 h-6 text-info" />
            </div>
            <p className="text-3xl font-bold mb-1">{avgHumidity}%</p>
            <p className="text-sm text-muted-foreground">Avg Humidity</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Fill Level Trend */}
          <Card className="p-6 border-2">
            <h3 className="text-lg font-bold mb-6">Fill Level Trend (Last 10 readings)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="fillLevel" stroke="#3b82f6" fill="#3b82f650" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Temperature & Humidity */}
          <Card className="p-6 border-2">
            <h3 className="text-lg font-bold mb-6">Temperature & Humidity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" domain={[0, 50]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f59e0b" name="Temp (°C)" />
                <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#06b6d4" name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Bin Status Distribution & Battery Levels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution Pie Chart */}
          <Card className="p-6 border-2">
            <h3 className="text-lg font-bold mb-6">Bin Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={binStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {binStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Battery Levels */}
          <Card className="p-6 border-2">
            <h3 className="text-lg font-bold mb-6">Battery Levels</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="battery" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Critical Alerts */}
        <Card className="p-6 border-2">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <h3 className="text-lg font-bold">Critical Alerts</h3>
          </div>

          <div className="space-y-3">
            {criticalBins.length > 0 ? (
              criticalBins.map((bin) => (
                <div
                  key={bin._id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-danger/5 border border-danger/20"
                >
                  <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{bin.location}</h4>
                    <p className="text-sm text-muted-foreground">
                      Fill Level: {bin.fillLevel}% | Battery: {bin.battery}%
                    </p>
                  </div>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm text-muted-foreground">All bins operating within normal parameters</p>
              </div>
            )}
          </div>
        </Card>

        {/* Real-time Sensor Data Table */}
        <Card className="p-6 border-2 mt-8">
          <h3 className="text-lg font-bold mb-6">Latest Sensor Readings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Bin ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Fill Level</th>
                  <th className="text-left py-3 px-4 font-semibold">Temperature</th>
                  <th className="text-left py-3 px-4 font-semibold">Battery</th>
                  <th className="text-left py-3 px-4 font-semibold">Humidity</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {iotData.slice(0, 10).map((data) => (
                  <tr key={data.binId} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs">{data.binId.slice(-8)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              data.fillLevel > 95 ? "bg-danger" : data.fillLevel > 80 ? "bg-warning" : "bg-success"
                            }`}
                            style={{ width: `${data.fillLevel}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{data.fillLevel}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{data.temperature}°C</td>
                    <td className="py-3 px-4">
                      <Badge variant={data.battery < 20 ? "destructive" : data.battery < 50 ? "secondary" : "default"}>
                        {data.battery}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{data.humidity}%</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={data.fillLevel > 95 ? "destructive" : data.fillLevel > 80 ? "secondary" : "default"}
                      >
                        {data.fillLevel > 95 ? "Critical" : data.fillLevel > 80 ? "Warning" : "Normal"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
