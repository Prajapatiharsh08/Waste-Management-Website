import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RouteIcon, Truck, MapPin, Clock, TrendingDown, Zap, Navigation, Play, Pause } from 'lucide-react';
import { useRealTime } from "@/hooks/useRealTime";

export default function AdminRoutes() {
  const [routes, isLoading] = useRealTime('/routes/optimized', []);
  const [metrics, setMetrics] = useRealTime('/admin/route-metrics', {});

  const optimizationMetrics = [
    { label: "Total Routes Today", value: (routes as any[]).length.toString(), icon: RouteIcon, color: "primary" },
    { label: "Active Vehicles", value: (routes as any[]).filter((r: any) => r.status === "active").length.toString(), icon: Truck, color: "success" },
    { label: "Avg. Efficiency", value: (metrics as any).avgEfficiency || "91%", icon: Zap, color: "info" },
    { label: "Fuel Saved", value: (metrics as any).fuelSaved || "142L", icon: TrendingDown, color: "warning" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "scheduled": return "info";
      case "completed": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Route Optimization</h1>
            <p className="text-muted-foreground">Real-time AI-powered route planning and vehicle tracking</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Navigation className="w-4 h-4" />
              View Map
            </Button>
            <Button variant="hero" className="gap-2">
              <Zap className="w-4 h-4" />
              Optimize Routes
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {optimizationMetrics.map((metric, index) => (
            <Card key={index} className="p-6 border-2 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${metric.color}/10 flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </Card>
          ))}
        </div>

        {/* Map Visualization */}
        <Card className="p-6 border-2 mb-8 h-[400px] relative overflow-hidden">
          <div className="absolute top-6 left-6 z-10">
            <h3 className="text-lg font-bold mb-2">Live Route Tracking</h3>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-success">{(routes as any[]).filter((r: any) => r.status === "active").length} Active</Badge>
              <Badge variant="secondary">{(routes as any[]).filter((r: any) => r.status === "scheduled").length} Scheduled</Badge>
            </div>
          </div>

          <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg flex items-center justify-center relative">
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 opacity-10">
              {Array.from({ length: 96 }).map((_, i) => (
                <div key={i} className="border border-border" />
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full">
              <path d="M 100 100 Q 200 50 300 100 T 500 100 L 650 200" stroke="hsl(var(--success))" strokeWidth="3" fill="none" strokeDasharray="5,5" className="animate-pulse" />
              <path d="M 150 250 Q 300 200 450 250 T 700 250" stroke="hsl(var(--info))" strokeWidth="3" fill="none" strokeDasharray="5,5" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
            </svg>
            <div className="absolute" style={{ left: "20%", top: "25%" }}>
              <div className="w-12 h-12 rounded-full bg-success shadow-lg border-4 border-white flex items-center justify-center animate-pulse-glow">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="absolute" style={{ left: "60%", top: "60%" }}>
              <div className="w-12 h-12 rounded-full bg-info shadow-lg border-4 border-white flex items-center justify-center animate-pulse-glow">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-center text-muted-foreground">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Real-time Route Visualization</p>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
            <h4 className="font-semibold text-sm mb-3">Route Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success" />
                <span className="text-xs">Active Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-info" />
                <span className="text-xs">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-muted" />
                <span className="text-xs">Completed</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Routes List */}
        <Card className="border-2 overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold">All Routes (Real-time from Backend)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold">Route ID</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Driver/Vehicle</th>
                  <th className="text-left p-4 font-semibold">Bins</th>
                  <th className="text-left p-4 font-semibold">Distance</th>
                  <th className="text-left p-4 font-semibold">Duration</th>
                  <th className="text-left p-4 font-semibold">Efficiency</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="p-4 text-center">Loading...</td></tr>
                ) : (routes as any[]).length === 0 ? (
                  <tr><td colSpan={9} className="p-4 text-center">No routes found</td></tr>
                ) : (
                  (routes as any[]).map((route: any) => (
                    <tr key={route._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4"><span className="font-mono font-semibold">{route.routeId}</span></td>
                      <td className="p-4"><div className="flex items-center gap-2"><RouteIcon className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{route.name}</span></div></td>
                      <td className="p-4"><div><p className="font-medium">{route.driverName}</p><p className="text-sm text-muted-foreground">{route.vehicleId}</p></div></td>
                      <td className="p-4"><div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{route.bins?.length || 0} bins</span></div></td>
                      <td className="p-4"><span className="font-medium">{route.distance || "0"} km</span></td>
                      <td className="p-4"><div className="flex items-center gap-1"><Clock className="w-4 h-4 text-muted-foreground" /><span>{route.duration || "0"} mins</span></div></td>
                      <td className="p-4"><div className="space-y-1"><div className="flex items-center gap-2"><div className="w-20 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success" style={{ width: `${route.efficiency || 0}%` }} /></div><span className="text-sm font-medium">{route.efficiency || 0}%</span></div><p className="text-xs text-success">↓ {route.fuelSaved || "0%"} fuel</p></div></td>
                      <td className="p-4"><Badge variant={getStatusColor(route.status)}>{route.status}</Badge></td>
                      <td className="p-4"><div className="flex gap-2">{route.status === "active" ? <Button variant="ghost" size="sm" className="text-warning"><Pause className="w-4 h-4" /></Button> : <Button variant="ghost" size="sm" className="text-success"><Play className="w-4 h-4" /></Button>}<Button variant="ghost" size="sm" className="text-primary"><Navigation className="w-4 h-4" /></Button></div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
