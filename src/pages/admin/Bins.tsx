import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, Search, Filter, Edit, MapPin, Battery, Thermometer, Weight, Signal, Loader2 } from 'lucide-react';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
  lastUpdated?: string;
}

export default function AdminBins() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bins, setBins] = useState<Bin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBins = async () => {
      setIsLoading(true);
      try {
        const response = await binsAPI.getAllBins();
        if (response.success && response.data) {
          setBins(response.data as Bin[]);
        }
      } catch (error) {
        console.error("[v0] Error fetching bins:", error);
        toast({
          title: "Error",
          description: "Failed to fetch bins",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBins();
    const interval = setInterval(fetchBins, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [toast]);

  const handleAddBin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await binsAPI.createBin({
        binId: formData.get('binId'),
        name: formData.get('name'),
        latitude: parseFloat(formData.get('latitude') as string),
        longitude: parseFloat(formData.get('longitude') as string),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Bin added successfully",
        });
        setIsAddDialogOpen(false);
        (e.target as HTMLFormElement).reset();
        
        // Refresh bins list
        const binsResponse = await binsAPI.getAllBins();
        if (binsResponse.success) {
          setBins(binsResponse.data as Bin[]);
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add bin",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add bin",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (fill: number) => {
    if (fill > 80) return "danger";
    if (fill > 50) return "warning";
    return "success";
  };

  const filteredBins = bins.filter(bin =>
    bin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bin.binId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const normalBins = bins.filter((b: Bin) => b.fillLevel < 50).length;
  const halfBins = bins.filter((b: Bin) => b.fillLevel >= 50 && b.fillLevel < 80).length;
  const overflowBins = bins.filter((b: Bin) => b.fillLevel >= 80).length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Smart Bins Management</h1>
            <p className="text-muted-foreground">Live data from MongoDB - Auto-refreshing every 5 seconds</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Bin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Smart Bin</DialogTitle>
                <DialogDescription>
                  Register a new smart bin to the waste management system
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleAddBin}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="binId">Bin ID</Label>
                    <Input id="binId" name="binId" placeholder="BIN-007" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Bin Name/Location</Label>
                    <Input id="name" name="name" placeholder="Green Park Main Gate" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" name="latitude" type="number" step="0.000001" placeholder="28.5355" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" name="longitude" type="number" step="0.000001" placeholder="77.3910" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="hero">
                    Add Bin
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 border-2 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 border-2">
            <p className="text-sm text-muted-foreground mb-1">Total Bins</p>
            <p className="text-3xl font-bold">{bins.length}</p>
          </Card>
          <Card className="p-6 border-2">
            <p className="text-sm text-muted-foreground mb-1">Normal Status</p>
            <p className="text-3xl font-bold text-success">{normalBins}</p>
          </Card>
          <Card className="p-6 border-2">
            <p className="text-sm text-muted-foreground mb-1">Half Full</p>
            <p className="text-3xl font-bold text-warning">{halfBins}</p>
          </Card>
          <Card className="p-6 border-2">
            <p className="text-sm text-muted-foreground mb-1">Overflow</p>
            <p className="text-3xl font-bold text-danger">{overflowBins}</p>
          </Card>
        </div>

        {/* Bins Table */}
        <Card className="border-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b-2 border-border">
                <tr>
                  <th className="text-left p-4 font-semibold">Bin ID</th>
                  <th className="text-left p-4 font-semibold">Name/Location</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Fill Level</th>
                  <th className="text-left p-4 font-semibold">Sensors</th>
                  <th className="text-left p-4 font-semibold">Last Update</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredBins.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No bins found
                    </td>
                  </tr>
                ) : (
                  filteredBins.map((bin) => (
                    <tr key={bin._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-semibold text-sm">{bin.binId}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{bin.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={bin.status === 'active' ? 'default' : bin.status === 'full' ? 'destructive' : 'secondary'}>
                          {bin.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-${getStatusColor(bin.fillLevel)}`}
                                style={{ width: `${bin.fillLevel}%` }} 
                              />
                            </div>
                            <span className="text-sm font-medium min-w-fit">{bin.fillLevel}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-3 text-xs">
                          {bin.temperature && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              <span>{bin.temperature.toFixed(1)}°C</span>
                            </div>
                          )}
                          {bin.battery !== undefined && (
                            <div className={`flex items-center gap-1 ${bin.battery < 20 ? 'text-danger' : 'text-success'}`}>
                              <Battery className="w-3 h-3" />
                              <span>{bin.battery.toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground">
                          {bin.lastUpdated ? new Date(bin.lastUpdated).toLocaleTimeString() : 'Just now'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="View on Map">
                            <MapPin className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
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
