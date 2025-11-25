const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>
  retry?: number
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

// Event emitter for 401 errors (token expiry)
export const tokenErrorEmitter = new EventTarget()
const TOKEN_ERROR_EVENT = new CustomEvent("tokenExpired")

const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken")
}

const getHeaders = (includeAuth = true): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (includeAuth) {
    const token = getAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

// Handle 401 errors - trigger logout globally
const handleUnauthorized = () => {
  localStorage.removeItem("authToken")
  localStorage.removeItem("user")
  tokenErrorEmitter.dispatchEvent(TOKEN_ERROR_EVENT)
  window.location.href = "/citizen-login" // Redirect to login
}

// Retry logic for failed requests
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const apiCall = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  includeAuth = true,
  retryCount = 0
)
: Promise<ApiResponse<T>> =>
{
  const url = `${API_BASE_URL}${endpoint}`
  const options: ApiOptions = {
    method,
    headers: getHeaders(includeAuth),
  }

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)

    if (response.status === 401) {
      handleUnauthorized()
      throw new Error("Session expired. Please login again.")
    }

    if (response.status === 429 && retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retryCount + 1))
      return apiCall(endpoint, method, body, includeAuth, retryCount + 1);
    }

    if (response.status === 500 && retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retryCount + 1))
      return apiCall(endpoint, method, body, includeAuth, retryCount + 1);
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`)
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error(`[v0] API Error (${endpoint}):`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

// Auth APIs
export const authAPI = {
  register: (userData: {
    name: string
    email: string
    phone: string
    address: string
    password: string
    role: "citizen" | "admin"
  }) => apiCall("/auth/register", "POST", userData, false),

  login: (email: string, password: string) => apiCall("/auth/login", "POST", { email, password }, false),

  getCurrentUser: () => apiCall("/auth/me", "GET"),

  logout: () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
  },
}

// Bins APIs
export const binsAPI = {
  getAllBins: () => apiCall("/bins/all", "GET"),
  getNearbyBins: (lat: number, lng: number) => apiCall(`/bins/nearby?lat=${lat}&lng=${lng}`, "GET"),
  getBinById: (id: string) => apiCall(`/bins/${id}`, "GET"),
  updateBinStatus: (id: string, status: unknown) => apiCall(`/bins/update-status/${id}`, "PUT", status),
  createBin: (binData: unknown) => apiCall("/bins/create", "POST", binData),
}

// Pickup APIs
export const pickupAPI = {
  requestPickup: (pickupData: unknown) => apiCall("/pickup/request", "POST", pickupData),
  getPickupStatus: (id: string) => apiCall(`/pickup/status/${id}`, "GET"),
  getAllPickups: () => apiCall("/pickup/all", "GET"),
  getUserPickups: (userId: string) => apiCall(`/pickup/user/${userId}`, "GET"),
  updatePickupStatus: (id: string, status: unknown) => apiCall(`/pickup/${id}`, "PUT", status),
}

// Complaints APIs
export const complaintsAPI = {
  fileComplaint: (complaintData: unknown) => apiCall("/complaints/new", "POST", complaintData),
  getUserComplaints: (userId: string) => apiCall(`/complaints/user/${userId}`, "GET"),
  getAllComplaints: () => apiCall("/complaints/all", "GET"),
  updateComplaintStatus: (id: string, status: unknown) => apiCall(`/complaints/${id}`, "PUT", status),
}

// Admin APIs
export const adminAPI = {
  getStats: () => apiCall("/admin/stats", "GET"),
  getDashboardData: () => apiCall("/admin/dashboard", "GET"),
  getAllBins: () => apiCall("/admin/bins/all", "GET"),
  getAllPickups: () => apiCall("/admin/pickups/all", "GET"),
  getAllComplaints: () => apiCall("/admin/complaints/all", "GET"),
}

// Collectors APIs
export const collectorsAPI = {
  getCollectors: () => apiCall("/collectors/all", "GET"),
  createCollector: (collectorData: unknown) => apiCall("/collectors/create", "POST", collectorData),
  updateCollector: (id: string, data: unknown) => apiCall(`/collectors/${id}`, "PUT", data),
  deleteCollector: (id: string) => apiCall(`/collectors/${id}`, "DELETE"),
}

// IoT APIs
export const iotAPI = {
  simulateBinStatus: () => apiCall("/iot/simulate", "POST", {}, true),
  getRealTimeData: () => apiCall("/iot/real-time", "GET"),
  updateBinIoT: (binId: string, data: unknown) => apiCall(`/iot/update/${binId}`, "PUT", data),
}

// Routes APIs
export const routesAPI = {
  getOptimizedRoute: () => apiCall("/routes/optimized", "GET"),
  getAllRoutes: () => apiCall("/routes/all", "GET"),
  createRoute: (routeData: unknown) => apiCall("/routes/create", "POST", routeData),
}
