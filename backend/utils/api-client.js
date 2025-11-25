/**
 * Frontend API Client Utility
 * Use this in React components for seamless API integration
 *
 * Usage:
 * import { apiClient } from '@/utils/api-client';
 * const bins = await apiClient.get('/bins/all');
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = null
  }

  setToken(token) {
    this.token = token
  }

  getHeaders(isIoT = false) {
    const headers = {
      "Content-Type": "application/json",
    }

    if (isIoT) {
      headers["x-device-token"] = process.env.NEXT_PUBLIC_IOT_DEVICE_TOKEN || ""
    } else if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  async request(method, endpoint, data = null, isIoT = false) {
    try {
      const url = `${this.baseURL}${endpoint}`
      const options = {
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

  get(endpoint) {
    return this.request("GET", endpoint)
  }

  post(endpoint, data) {
    return this.request("POST", endpoint, data)
  }

  put(endpoint, data) {
    return this.request("PUT", endpoint, data)
  }

  delete(endpoint) {
    return this.request("DELETE", endpoint)
  }

  // IoT device update
  async iotUpdate(binId, sensorData) {
    return this.post(
      "/iot/bins/update",
      {
        binId,
        ...sensorData,
      },
      true,
    )
  }

  // Auth endpoints
  async register(userData) {
    return this.post("/auth/register", userData)
  }

  async login(email, password) {
    const response = await this.post("/auth/login", { email, password })
    if (response.token) {
      this.setToken(response.token)
    }
    return response
  }

  async getCurrentUser() {
    return this.get("/auth/me")
  }

  // Bins endpoints
  async getAllBins() {
    return this.get("/bins/all")
  }

  async getNearbyBins(lat, lng) {
    return this.get(`/bins/nearby?lat=${lat}&lng=${lng}`)
  }

  async createBin(binData) {
    return this.post("/bins/create", binData)
  }

  async getBinDetails(binId) {
    return this.get(`/bins/${binId}`)
  }

  // Pickup endpoints
  async requestPickup(latitude, longitude, address) {
    return this.post("/pickup/request", {
      latitude,
      longitude,
      address,
    })
  }

  async getPickupStatus(pickupId) {
    return this.get(`/pickup/status/${pickupId}`)
  }

  async getUserPickups(userId) {
    return this.get(`/pickup/user/${userId}`)
  }

  // Collector endpoints
  async getAllCollectors() {
    return this.get("/collectors/all")
  }

  async createCollector(collectorData) {
    return this.post("/collectors/create", collectorData)
  }

  // Admin endpoints
  async getAdminStats() {
    return this.get("/admin/stats")
  }

  async getAdminDashboard() {
    return this.get("/admin/dashboard")
  }

  async getIoTRealTime() {
    return this.get("/iot/real-time")
  }

  async simulateIoT() {
    return this.post("/iot/test/simulate-all", {})
  }
}

export const apiClient = new APIClient()

// Export as singleton
export default apiClient
