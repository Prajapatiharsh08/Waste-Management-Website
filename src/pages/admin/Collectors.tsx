import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Search, Edit, Phone, Mail, MapPin, Truck, CheckCircle, Clock } from 'lucide-react';
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRealTime } from "@/hooks/useRealTime";

export default function AdminCollectors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [collectors, isLoading, error, refetch] = useRealTime('/users/collectors', []);

  const stats = [
    { label: "Total Collectors", value: (collectors as any[]).length.toString(), icon: Users, color: "primary" },
    { label: "Active Now", value: (collectors as any[]).filter((c: any) => c.status === "active").length.toString(), icon: CheckCircle, color: "success" },
    { label: "On Break", value: (collectors as any[]).filter((c: any) => c.status === "on-break").length.toString(), icon: Clock, color: "warning" },
    { label: "Total Vehicles", value: (collectors as any[]).length.toString(), icon: Truck, color: "info" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "on-break": return "warning";
      case "off-duty": return "secondary";
      default: return "default";
    }
  };

  const handleAddCollector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/add-collector`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: formData.get('collectorName'),
          phone: formData.get('collectorPhone'),
          email: formData.get('collectorEmail'),
          vehicleId: formData.get('collectorVehicle'),
          area: formData.get('collectorArea'),
          licenseNumber: formData.get('collectorLicense'),
        }),
      });

      if (response.ok) {
        toast({ title: "Collector Added Successfully", description: "New collector has been added to the system." });
        setIsAddDialogOpen(false);
        refetch();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add collector", variant: "destructive" });
    }
  };

  const filteredCollectors = (collectors as any[]).filter(collector =>
    collector.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collector._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collector.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Collector Management</h1>
            <p className="text-muted-foreground">Real-time management of collection staff and vehicle assignments</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Collector
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Collector</DialogTitle>
                <DialogDescription>Register a new waste collection staff member</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleAddCollector}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collectorName">Full Name</Label>
                    <Input id="collectorName" name="collectorName" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectorPhone">Phone Number</Label>
                    <Input id="collectorPhone" name="collectorPhone" type="tel" placeholder="+1 (234) 567-8900" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectorEmail">Email</Label>
                    <Input id="collectorEmail" name="collectorEmail" type="email" placeholder="john@ecosmart.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectorVehicle">Vehicle ID</Label>
                    <Input id="collectorVehicle" name="collectorVehicle" placeholder="WM-1234" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectorArea">Assigned Area</Label>
                    <Input id="collectorArea" name="collectorArea" placeholder="North Zone" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectorLicense">License Number</Label>
                    <Input id="collectorLicense" name="collectorLicense" placeholder="DL12345" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="hero">
                    Add Collector
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 border-2 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card className="p-6 border-2 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search by name, ID, or area..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </Card>

        {/* Collectors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <Card className="p-6 text-center col-span-full">Loading...</Card>
          ) : filteredCollectors.length === 0 ? (
            <Card className="p-6 text-center col-span-full">No collectors found</Card>
          ) : (
            filteredCollectors.map((collector: any) => (
              <Card key={collector._id} className="p-6 border-2 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                      {collector.name?.split(' ').map((n: string) => n[0]).join('') || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold">{collector.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{collector._id}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(collector.status)}>
                    {collector.status}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{collector.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{collector.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span>{collector.vehicleId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{collector.area}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold">{collector.shiftsCompleted || 0}</p>
                    <p className="text-xs text-muted-foreground">Shifts Completed</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{collector.rating || 5.0}</span>
                      <span className="text-warning">★</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>

                {collector.currentRoute && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-primary">
                      Currently on: {collector.currentRoute}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="hero" size="sm" className="flex-1">
                    Assign Route
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
