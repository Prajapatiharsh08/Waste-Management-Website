import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, MapPin, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle, Gift, FileText, Recycle, Leaf, Award } from 'lucide-react';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { binsAPI, complaintsAPI, pickupAPI } from "@/services/api";

interface Bin {
  _id: string;
  location: string;
  distance?: number;
  fillLevel: number;
  status: "operational" | "maintenance" | "offline";
  latitude: number;
  longitude: number;
}

interface PickupRequest {
  _id: string;
  date: string;
  status: "pending" | "assigned" | "on-the-way" | "completed";
  assignedDriver?: string;
  scheduledTime: string;
}

interface Complaint {
  _id: string;
  title: string;
  date: string;
  status: "pending" | "in-progress" | "resolved";
}

export default function CitizenDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [nearbyBins, setNearbyBins] = useState<Bin[]>([]);
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [binsRes, pickupsRes, complaintsRes] = await Promise.all([
          binsAPI.getAllBins(),
          pickupAPI.getUserPickups(user?.id || ""),
          complaintsAPI.getUserComplaints(user?.id || ""),
        ]);

        if (binsRes.success && binsRes.data) {
          setNearbyBins(binsRes.data as Bin[]);
        }
        if (pickupsRes.success && pickupsRes.data) {
          setPickupRequests(pickupsRes.data as PickupRequest[]);
        }
        if (complaintsRes.success && complaintsRes.data) {
          setComplaints(complaintsRes.data as Complaint[]);
        }
      } catch (error) {
        console.error("[v0] Error fetching dashboard data", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, toast]);

  const handleRequestPickup = async () => {
    try {
      const response = await pickupAPI.requestPickup({
        userId: user?.id,
        status: "pending",
      });

      if (response.success) {
        toast({
          title: "Pickup Requested",
          description:
            "Your waste pickup request has been submitted successfully.",
        });
        // Refresh pickups list
        const pickupsRes = await pickupAPI.getUserPickups(user?.id || "");
        if (pickupsRes.success && pickupsRes.data) {
          setPickupRequests(pickupsRes.data as PickupRequest[]);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to request pickup.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const segregationGuide = [
    {
      type: "Biodegradable",
      items: "Food waste, Garden waste, Paper",
      color: "success",
      icon: Leaf,
    },
    {
      type: "Recyclable",
      items: "Plastic, Glass, Metal, Cardboard",
      color: "info",
      icon: Recycle,
    },
    {
      type: "Hazardous",
      items: "Batteries, Electronics, Chemicals",
      color: "danger",
      icon: AlertCircle,
    },
    {
      type: "Non-Recyclable",
      items: "Mixed waste, Styrofoam, Diapers",
      color: "muted",
      icon: Trash2,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "on-the-way":
        return <Clock className="w-5 h-5 text-info" />;
      case "assigned":
        return <TrendingUp className="w-5 h-5 text-warning" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {user?.name || "Citizen"}!
            </h1>
            <p className="text-muted-foreground">
              Manage your waste, track pickups, and earn rewards
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 border-2 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">847</p>
                  <p className="text-sm text-muted-foreground">Reward Points</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {pickupRequests.filter((p) => p.status === "completed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pickups Done</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">68%</p>
                  <p className="text-sm text-muted-foreground">Recycling Rate</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {complaints.filter((c) => c.status !== "resolved").length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Active Complaints
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Nearby Bins */}
              <Card className="p-6 border-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Nearby Smart Bins</h2>
                  <Button variant="outline" size="sm">
                    View Map
                  </Button>
                </div>
                <div className="space-y-4">
                  {nearbyBins.length > 0 ? (
                    nearbyBins.map((bin) => (
                      <div
                        key={bin._id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{bin.location}</h3>
                            <Badge
                              variant={
                                bin.fillLevel < 50
                                  ? "default"
                                  : bin.fillLevel < 80
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {bin.fillLevel}% Full
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>Status: {bin.status}</span>
                          </div>
                        </div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${bin.fillLevel}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No bins found</p>
                  )}
                </div>
              </Card>

              {/* Pickup Requests */}
              <Card className="p-6 border-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Pickup Status</h2>
                  <Button variant="hero" size="sm" onClick={handleRequestPickup}>
                    Request Pickup
                  </Button>
                </div>
                <div className="space-y-4">
                  {pickupRequests.length > 0 ? (
                    pickupRequests.map((request) => (
                      <div
                        key={request._id}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                      >
                        {getStatusIcon(request.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold capitalize">
                              {request.status.replace("-", " ")}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              • {request.date}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Driver: {request.assignedDriver || "Not assigned"} •
                            Scheduled: {request.scheduledTime}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Track
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No pickup requests yet
                    </p>
                  )}
                </div>
              </Card>

              {/* Complaints */}
              <Card className="p-6 border-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">My Complaints</h2>
                  <Button variant="outline" size="sm">
                    File New
                  </Button>
                </div>
                <div className="space-y-4">
                  {complaints.length > 0 ? (
                    complaints.map((complaint) => (
                      <div
                        key={complaint._id}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                      >
                        <AlertCircle
                          className={`w-5 h-5 ${
                            complaint.status === "resolved"
                              ? "text-success"
                              : "text-warning"
                          }`}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{complaint.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {complaint.date}
                          </p>
                        </div>
                        <Badge
                          variant={
                            complaint.status === "resolved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {complaint.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No complaints</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Rewards Card */}
              <Card className="p-6 border-2 bg-gradient-primary text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="w-8 h-8" />
                  <h3 className="text-xl font-bold">Rewards</h3>
                </div>
                <p className="text-3xl font-bold mb-2">847 Points</p>
                <p className="text-white/80 mb-4 text-sm">
                  Keep recycling to earn more rewards and unlock exclusive
                  benefits!
                </p>
                <Button className="w-full bg-white text-primary hover:bg-white/90">
                  Redeem Rewards
                </Button>
              </Card>

              {/* Segregation Guide */}
              <Card className="p-6 border-2">
                <h3 className="text-lg font-bold mb-4">
                  Waste Segregation Guide
                </h3>
                <div className="space-y-3">
                  {segregationGuide.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg bg-${item.color}/10 border border-${item.color}/20`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon
                          className={`w-5 h-5 text-${item.color}`}
                        />
                        <h4 className="font-semibold">{item.type}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.items}
                      </p>
                    </div>
                  ))}
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
