import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Trash2, Navigation, Filter, Locate, Loader2 } from 'lucide-react';
import { useState, useEffect } from "react";
import { binsAPI } from "@/services/api";

interface Bin {
  _id: string;
  binId: string;
  name: string;
  latitude: number;
  longitude: number;
  fillLevel: number;
  status: string;
  temperature?: number;
  battery?: number;
}

export default function BinMap() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBins = async () => {
      setLoading(true);
      try {
        const response = await binsAPI.getAllBins();
        if (response.success && response.data) {
          setBins(response.data as Bin[]);
        }
      } catch (error) {
        console.error("[v0] Error fetching bins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBins();
    const interval = setInterval(fetchBins, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "full": return "danger";
      case "maintenance": return "warning";
      default: return "muted";
    }
  };

  const filteredBins = bins.filter(bin => 
    bin.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && bins.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      
      <div className="flex-1 pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Smart Bin Map</h1>
            <p className="text-muted-foreground">Real-time location and status of all smart waste bins</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <Card className="p-6 border-2 h-[600px] relative overflow-hidden">
                <div className="absolute top-6 left-6 right-6 z-10">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background/95 backdrop-blur-sm"
                      />
                    </div>
                    <Button variant="outline" size="icon" className="bg-background/95 backdrop-blur-sm">
                      <Filter className="w-5 h-5" />
                    </Button>
                    <Button variant="hero" size="icon" className="shadow-lg">
                      <Locate className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Mock Map Grid */}
                <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg flex items-center justify-center relative">
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border border-border" />
                    ))}
                  </div>

                  {/* Bin Markers */}
                  {filteredBins.map((bin) => (
                    <div
                      key={bin._id}
                      className={`absolute cursor-pointer transition-transform hover:scale-110 ${
                        selectedBin === bin._id ? "scale-125 z-20" : "z-10"
                      }`}
                      style={{
                        left: `${(Math.random() * 80 + 10)}%`,
                        top: `${(Math.random() * 70 + 15)}%`,
                      }}
                      onClick={() => setSelectedBin(bin._id)}
                    >
                      <div className={`relative`}>
                        <div className={`w-12 h-12 rounded-full bg-${getStatusColor(bin.status)} flex items-center justify-center shadow-lg border-4 border-white animate-pulse-glow`}>
                          <Trash2 className="w-6 h-6 text-white" />
                        </div>
                        {selectedBin === bin._id && (
                          <Card className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-3 min-w-[220px] shadow-xl animate-fade-in z-50">
                            <h4 className="font-semibold text-sm mb-2">{bin.name}</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fill Level:</span>
                                <Badge variant={bin.fillLevel > 80 ? "destructive" : "default"}>
                                  {bin.fillLevel}%
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="capitalize font-medium">{bin.status}</span>
                              </div>
                              {bin.temperature && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Temp:</span>
                                  <span>{bin.temperature.toFixed(1)}°C</span>
                                </div>
                              )}
                              {bin.battery !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Battery:</span>
                                  <span>{bin.battery.toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                            <Button size="sm" className="w-full mt-3">
                              <Navigation className="w-3 h-3 mr-1" />
                              Navigate
                            </Button>
                          </Card>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredBins.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">No bins found</p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
                  <h4 className="font-semibold text-sm mb-3">Status Legend</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-success" />
                      <span className="text-xs">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-warning" />
                      <span className="text-xs">Maintenance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-danger" />
                      <span className="text-xs">Full</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bins List */}
            <div className="space-y-4">
              <Card className="p-4 border-2 bg-gradient-primary text-white">
                <h3 className="font-bold mb-2">Total Bins</h3>
                <p className="text-3xl font-bold">{bins.length}</p>
              </Card>

              <Card className="p-6 border-2 max-h-[520px] overflow-y-auto">
                <h3 className="font-bold mb-4">All Locations</h3>
                <div className="space-y-3">
                  {filteredBins.length > 0 ? (
                    filteredBins.map((bin) => (
                      <div
                        key={bin._id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedBin === bin._id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedBin(bin._id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-${getStatusColor(bin.status)}/10 flex items-center justify-center flex-shrink-0`}>
                            <Trash2 className={`w-5 h-5 text-${getStatusColor(bin.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate">{bin.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3" />
                              <span>{bin.binId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-${getStatusColor(bin.status)}`} 
                                  style={{ width: `${bin.fillLevel}%` }} 
                                />
                              </div>
                              <span className="text-xs font-medium">{bin.fillLevel}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No bins available</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
