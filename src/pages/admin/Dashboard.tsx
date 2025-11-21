import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, TrendingUp, Users, AlertTriangle, CheckCircle, Clock, BarChart3, Download, RefreshCw, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { adminAPI, pickupAPI, complaintsAPI, binsAPI } from "@/services/api";

interface Stats {
  totalBins?: number;
  activeBins?: number;
  fullBins?: number;
  totalPickups?: number;
  completedPickups?: number;
  pendingPickups?: number;
  activeComplaints?: number;
  resolvedComplaints?: number;
  totalCitizens?: number;
  recyclingRate?: string | number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, pickupsRes, complaintsRes, binsRes] = await Promise.all([
          adminAPI.getStats(),
          pickupAPI.getAllPickups(),
          complaintsAPI.getAllComplaints(),
          binsAPI.getAllBins(),
        ]);

        if (statsRes.success) {
          setStats(statsRes.data as Stats);
        }

        // Create alerts from bins with high fill levels
        if (binsRes.success && Array.isArray(binsRes.data)) {
          const binAlerts = (binsRes.data as any[])
            .filter((bin: any) => bin.fillLevel > 80)
            .slice(0, 5)
            .map((bin: any, idx: number) => ({
              id: idx,
              bin: bin.name,
              status: `Fill level at ${bin.fillLevel}%`,
              level: bin.fillLevel > 95 ? 'high' : 'medium',
              time: 'Just now'
            }));
          setAlerts(binAlerts);
        }
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: "Total Bins", value: stats.totalBins || 0, change: "+2%", icon: Trash2, color: "primary", trend: "up" },
    { label: "Completed Pickups", value: stats.completedPickups || 0, change: "+8%", icon: TrendingUp, color: "success", trend: "up" },
    { label: "Active Citizens", value: stats.totalCitizens || 0, change: "+5", icon: Users, color: "info", trend: "up" },
    { label: "Pending Alerts", value: stats.fullBins || 0, change: "-1", icon: AlertTriangle, color: "warning", trend: "down" },
  ];

  const wasteData = [
    { day: "Mon", waste: 45, predicted: 50 },
    { day: "Tue", waste: 52, predicted: 55 },
    { day: "Wed", waste: 48, predicted: 48 },
    { day: "Thu", waste: 61, predicted: 60 },
    { day: "Fri", waste: 55, predicted: 65 },
    { day: "Sat", waste: 67, predicted: 70 },
    { day: "Sun", waste: 72, predicted: 75 },
  ];

  const areaData = [
    { area: "North Zone", waste: 120 },
    { area: "South Zone", waste: 95 },
    { area: "East Zone", waste: 110 },
    { area: "West Zone", waste: 85 },
    { area: "Central Zone", waste: 140 },
  ];

  const wasteTypeData = [
    { name: "Organic", value: 45, color: "#10b981" },
    { name: "Plastic", value: 25, color: "#3b82f6" },
    { name: "Metal", value: 15, color: "#f59e0b" },
    { name: "Paper", value: 15, color: "#8b5cf6" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-muted-foreground">Real-time insights and analytics (Auto-refreshing every 5s)</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button variant="hero" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-6 border-2 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
                <Badge variant={stat.trend === "up" ? "default" : "secondary"}>
                  {stat.change}
                </Badge>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Waste Collection */}
          <Card className="p-6 border-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Daily Waste Collection</h3>
              <Badge variant="outline">Last 7 Days</Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={wasteData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="waste" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" name="AI Predicted" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Area-wise Distribution */}
          <Card className="p-6 border-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Area-wise Waste Pattern</h3>
              <Badge variant="outline">This Week</Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="waste" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waste Type Distribution */}
          <Card className="p-6 border-2">
            <h3 className="text-lg font-bold mb-6">Waste Type Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={wasteTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {wasteTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Recent Alerts */}
          <Card className="p-6 border-2 lg:col-span-2">
            <h3 className="text-lg font-bold mb-6">Recent Bin Alerts</h3>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors">
                    <div className={`w-10 h-10 rounded-lg ${alert.level === "high" ? "bg-danger/10" : "bg-warning/10"} flex items-center justify-center`}>
                      {alert.level === "high" ? (
                        <AlertTriangle className="w-5 h-5 text-danger" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{alert.bin}</h4>
                      <p className="text-sm text-muted-foreground">{alert.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{alert.time}</p>
                      <Badge variant={alert.level === "high" ? "destructive" : "secondary"}>
                        {alert.level}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active alerts</p>
              )}
            </div>
          </Card>
        </div>

        {/* AI Insights Card */}
        <Card className="p-6 border-2 bg-gradient-hero text-white mt-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">AI Insights</h3>
              <p className="text-white/90 mb-4">
                Current recycling rate: <strong>{stats.recyclingRate}%</strong>. 
                {stats.fullBins && stats.fullBins > 0 ? ` You have ${stats.fullBins} full bins requiring immediate collection.` : ' All bins are at optimal levels.'}
              </p>
              <Button className="bg-white text-primary hover:bg-white/90">
                View Recommendations
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
