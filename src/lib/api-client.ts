/**
 * Frontend API Client Utility
 * Provides type-safe API integration with automatic token management
 *
 * Usage in React Components:
 * import { apiClient } from '@/lib/api-client';
 * const bins = await apiClient.bins.getNearby(latitude, longitude);
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  role: "citizen" | "collector" | "admin"
}

export interface Bin {
  _id: string
  binId: string
  name: string
  latitude: number
  longitude: number
  fillLevel: number
  status: "active" | "full" | "maintenance"
  temperature: number
  battery: number
  lastUpdated: string
}

export interface Pickup {
  _id: string
  citizenId: string
  location: { latitude: number; longitude: number; address?: string }
  status: "pending" | "assigned" | "on-way" | "completed"
  createdAt: string
  completedAt?: string
}

export interface Collector {
  _id: string
  name: string
  email: string
  status: "active" | "inactive" | "on-duty" | "on-break"
  currentLocation: { latitude: number; longitude: number }
  pickupsCompleted: number
  averageRating: number
}

export interface Route {
  _id: string
  routeId: string
  collectorId: string
  bins: string[]
  status: "planned" | "in-progress" | "completed"
  estimatedDistance: number
  actualDistance?: number
  startTime?: string
  endTime?: string
}

export interface Complaint {
  _id: string
  userId: string
  title: string
  description: string
  status: "pending" | "acknowledged" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: "bin-damage" | "bin-overflow" | "service-quality" | "other"
  createdAt: string
  resolvedAt?: string
  rating?: number
}

class APIClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    this.loadToken()
  }

  private loadToken() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private getHeaders(isIoT = false): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (isIoT) {
      headers["x-device-token"] = process.env.NEXT_PUBLIC_IOT_DEVICE_TOKEN || ""
    } else if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  private async request<T>(method: string, endpoint: string, data: any = null, isIoT = false): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const options: RequestInit = {
        method,
        headers: this.getHeaders(isIoT),
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(url, options)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error(`[API Error] ${method} ${endpoint}:`, error)
      throw error
    }
  }

  // ==================== Authentication ====================

  auth = {
    register: (userData: {
      name: string
      email: string
      phone: string
      address: string
      password: string
    }) => this.request<{ user: AuthUser; token: string }>("POST", "/auth/register", userData),

    login: async (email: string, password: string) => {
      const response = await this.request<{ user: AuthUser; token: string }>("POST", "/auth/login", { email, password })
      if (response.data?.token) {
        this.setToken(response.data.token)
      }
      return response
    },

    getCurrentUser: () => this.request<AuthUser>("GET", "/auth/me"),

    logout: () => {
      this.clearToken()
      return { success: true, message: "Logged out" }
    },
  }

  // ==================== Bins ====================

  bins = {
    getAll: () => this.request<Bin[]>("GET", "/bins/all"),

    getById: (id: string) => this.request<Bin>("GET", `/bins/${id}`),

    getNearby: (lat: number, lng: number) => this.request<Bin[]>("GET", `/bins/nearby?lat=${lat}&lng=${lng}`),

    create: (binData: Omit<Bin, "_id" | "createdAt">) => this.request<Bin>("POST", "/bins/create", binData),

    updateStatus: (id: string, status: string, fillLevel?: number) =>
      this.request<Bin>("PUT", `/bins/update-status/${id}`, {
        status,
        fillLevel,
      }),

    delete: (id: string) => this.request("DELETE", `/bins/${id}`),
  }

  // ==================== Pickups ====================

  pickups = {
    request: (latitude: number, longitude: number, address?: string) =>
      this.request<Pickup>("POST", "/pickup/request", {
        latitude,
        longitude,
        address,
      }),

    getStatus: (id: string) => this.request<Pickup>("GET", `/pickup/status/${id}`),

    getUserPickups: (userId: string) => this.request<Pickup[]>("GET", `/pickup/user/${userId}`),

    getAll: () => this.request<Pickup[]>("GET", "/pickup/all"),

    updateStatus: (id: string, status: string) => this.request<Pickup>("PUT", `/pickup/${id}`, { status }),
  }

  // ==================== Complaints ====================

  complaints = {
    create: (data: {
      title: string
      description: string
      category?: string
      binId?: string
      attachments?: string[]
    }) => this.request<Complaint>("POST", "/complaints/new", data),

    getUserComplaints: () => this.request<Complaint[]>("GET", "/complaints/user"),

    getById: (id: string) => this.request<Complaint>("GET", `/complaints/${id}`),

    submitFeedback: (id: string, rating: number, feedback: string) =>
      this.request<Complaint>("PUT", `/complaints/${id}/feedback`, { rating, feedback }),

    getAll: () => this.request<Complaint[]>("GET", "/complaints/all"),

    acknowledge: (id: string) => this.request<Complaint>("PUT", `/complaints/${id}/acknowledge`, {}),

    assign: (id: string, assignedToId: string, priority?: string) =>
      this.request<Complaint>("PUT", `/complaints/${id}/assign`, { assignedToId, priority }),

    resolve: (id: string, resolution: string, resolutionImages?: string[]) =>
      this.request<Complaint>("PUT", `/complaints/${id}/resolve`, {
        resolution,
        resolutionImages,
      }),
  }

  // ==================== Collectors ====================

  collectors = {
    register: (data: {
      name: string
      email: string
      phone: string
      password: string
      vehicleId?: string
      vehicleType?: string
    }) => this.request<{ user: AuthUser; token: string }>("POST", "/collectors/auth/register", data),

    login: async (email: string, password: string) => {
      const response = await this.request<{ user: AuthUser; token: string }>("POST", "/collectors/auth/login", {
        email,
        password,
      })
      if (response.data?.token) {
        this.setToken(response.data.token)
      }
      return response
    },

    getProfile: () => this.request<Collector>("GET", "/collectors/profile"),

    updateLocation: (latitude: number, longitude: number) =>
      this.request("PUT", "/collectors/update-location", { latitude, longitude }),

    updateStatus: (status: string) => this.request("PUT", "/collectors/update-status", { status }),

    getAssignedRoute: () => this.request<Route>("GET", "/collectors/assigned-route"),

    getAssignedBins: () => this.request<Bin[]>("GET", "/collectors/assigned-bins"),

    markBinCollected: (binId: string, distance?: number) =>
      this.request("PUT", `/collectors/bin/${binId}/mark-collected`, { distance }),

    completeRoute: () => this.request<Route>("POST", "/collectors/complete-route", {}),

    getAll: () => this.request<Collector[]>("GET", "/collectors/all"),

    create: (data: Partial<Collector>) => this.request<Collector>("POST", "/collectors/create", data),
  }

  // ==================== Routes ====================

  routes = {
    getOptimized: () => this.request<any>("GET", "/routes/optimized"),

    getAll: () => this.request<Route[]>("GET", "/routes/all"),

    getById: (id: string) => this.request<Route>("GET", `/routes/${id}`),

    create: (data: Partial<Route>) => this.request<Route>("POST", "/routes/create", data),

    updateStatus: (id: string, status: string, actualDistance?: number) =>
      this.request<Route>("PUT", `/routes/${id}`, { status, actualDistance }),

    delete: (id: string) => this.request("DELETE", `/routes/${id}`),
  }

  // ==================== Admin ====================

  admin = {
    getStats: () => this.request<any>("GET", "/admin/stats"),

    getDashboard: () => this.request<any>("GET", "/admin/dashboard"),

    getIoTRealTime: () => this.request<any>("GET", "/iot/real-time"),

    simulateIoT: () => this.request("POST", "/iot/test/simulate-all", {}),

    getCollectorStats: () => this.request<any>("GET", "/collectors/stats"),

    getRouteStats: () => this.request<any>("GET", "/routes/stats"),

    getComplaintStats: () => this.request<any>("GET", "/complaints/stats"),
  }

  // ==================== Polling ====================

  polling = {
    getBins: (force = false) => this.request<Bin[]>("GET", `/polling/bins?force=${force}`),

    getNearbyBins: (lat: number, lng: number, force = false) =>
      this.request<Bin[]>("GET", `/polling/bins/nearby?lat=${lat}&lng=${lng}&force=${force}`),

    getPickups: (force = false) => this.request<Pickup[]>("GET", `/polling/pickups?force=${force}`),

    getComplaints: (force = false) => this.request<Complaint[]>("GET", `/polling/complaints?force=${force}`),

    getAdminDashboard: () => this.request<any>("GET", "/polling/admin/dashboard"),

    getCollectorStatus: () => this.request<any>("GET", "/polling/collector/status"),

    getCacheStats: () => this.request<any>("GET", "/polling/cache-stats"),

    clearCache: (key?: string) => this.request("POST", "/polling/cache-clear", { key }),
  }

  // ==================== IoT ====================

  iot = {
    updateBin: (binId: string, sensorData: any) =>
      this.request("POST", "/iot/bins/update", { binId, ...sensorData }, true),

    getBinHistory: (binId: string) => this.request<any[]>("GET", `/iot/bins/${binId}/history`),

    getHealth: () => this.request<any>("GET", "/iot/health"),
  }
}

export const apiClient = new APIClient()
export default apiClient
