import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Search, Filter, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { complaintsAPI } from "@/services/api";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  userId?: { name: string; email: string };
  createdAt: string;
  resolvedAt?: string;
}

export default function AdminComplaints() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      try {
        const response = await complaintsAPI.getAllComplaints();
        if (response.success && response.data) {
          setComplaints(response.data as Complaint[]);
        }
      } catch (error) {
        console.error("[v0] Error fetching complaints:", error);
        toast({
          title: "Error",
          description: "Failed to fetch complaints",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
    const interval = setInterval(fetchComplaints, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [toast]);

  const stats = [
    { 
      label: "Total Complaints", 
      value: complaints.length.toString(), 
      icon: MessageSquare, 
      color: "primary" 
    },
    { 
      label: "Pending", 
      value: complaints.filter((c) => c.status === "pending").length.toString(), 
      icon: Clock, 
      color: "warning" 
    },
    { 
      label: "In Progress", 
      value: complaints.filter((c) => c.status === "in-progress").length.toString(), 
      icon: AlertCircle, 
      color: "info" 
    },
    { 
      label: "Resolved", 
      value: complaints.filter((c) => c.status === "resolved").length.toString(), 
      icon: CheckCircle, 
      color: "success" 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "warning";
      case "in-progress": return "info";
      case "resolved": return "success";
      default: return "secondary";
    }
  };

  const handleResolve = async (complaintId: string) => {
    try {
      const response = await complaintsAPI.updateComplaintStatus(complaintId, { status: 'resolved' });

      if (response.success) {
        toast({ 
          title: "Success", 
          description: "Complaint marked as resolved" 
        });
        setSelectedComplaint(null);
        
        // Refresh complaints list
        const refreshResponse = await complaintsAPI.getAllComplaints();
        if (refreshResponse.success) {
          setComplaints(refreshResponse.data as Complaint[]);
        }
      } else {
        toast({ 
          title: "Error", 
          description: response.error || "Failed to resolve complaint", 
          variant: "destructive" 
        });
      }
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Failed to resolve complaint", 
        variant: "destructive" 
      });
    }
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complaints Management</h1>
          <p className="text-muted-foreground">Real-time complaint tracking - Auto-refreshing from MongoDB every 5 seconds</p>
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
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search by title..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Complaints List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </Card>
          ) : filteredComplaints.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              No complaints found
            </Card>
          ) : (
            filteredComplaints.map((complaint) => (
              <Card key={complaint._id} className="p-6 border-2 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold">{complaint.title}</h3>
                      <Badge variant={getStatusColor(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{complaint.description}</p>
                    
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Submitted by: </span>
                        <span className="font-medium">{complaint.userId?.name || "Unknown"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      {complaint.resolvedAt && (
                        <div>
                          <span className="text-muted-foreground">Resolved: </span>
                          <span className="font-medium">{new Date(complaint.resolvedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Complaint Details</DialogTitle>
                          <DialogDescription>ID: {selectedComplaint?._id}</DialogDescription>
                        </DialogHeader>
                        {selectedComplaint && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">{selectedComplaint.title}</h4>
                              <p className="text-sm text-muted-foreground">{selectedComplaint.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                              <div>
                                <Label className="text-muted-foreground">Submitted By</Label>
                                <p className="font-medium">{selectedComplaint.userId?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{selectedComplaint.userId?.email}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Status</Label>
                                <Badge variant={getStatusColor(selectedComplaint.status)} className="mt-1">
                                  {selectedComplaint.status}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Created</Label>
                                <p className="font-medium">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                              </div>
                              {selectedComplaint.resolvedAt && (
                                <div>
                                  <Label className="text-muted-foreground">Resolved</Label>
                                  <p className="font-medium">{new Date(selectedComplaint.resolvedAt).toLocaleString()}</p>
                                </div>
                              )}
                            </div>

                            {selectedComplaint.status !== "resolved" && (
                              <div className="pt-4 border-t flex gap-3">
                                <Button 
                                  variant="hero" 
                                  onClick={() => handleResolve(selectedComplaint._id)}
                                  className="flex-1"
                                >
                                  Mark as Resolved
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
