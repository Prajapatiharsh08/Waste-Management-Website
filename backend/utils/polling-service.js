/**
 * Polling Service for Real-time Updates
 * Provides scheduled data refresh mechanisms for different user types
 */

import Bin from "../models/Bin.js"
import Pickup from "../models/Pickup.js"
import Complaint from "../models/Complaint.js"

class PollingService {
  constructor() {
    this.activePolls = new Map()
    this.cacheStore = new Map()
    this.cacheTTL = 30000 // 30 seconds default
  }

  /**
   * Get or fetch bins with caching
   */
  async getBinsCache(force = false) {
    const cacheKey = "bins-all"
    const cached = this.cacheStore.get(cacheKey)

    if (cached && !force && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const bins = await Bin.find().lean()
    this.cacheStore.set(cacheKey, { data: bins, timestamp: Date.now() })
    return bins
  }

  /**
   * Get nearby bins for citizen with caching
   */
  async getNearbyBinsCache(lat, lng, force = false) {
    const cacheKey = `bins-nearby-${lat}-${lng}`
    const cached = this.cacheStore.get(cacheKey)

    if (cached && !force && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const bins = await Bin.find({
      latitude: { $gte: lat - 0.045, $lte: lat + 0.045 },
      longitude: { $gte: lng - 0.045, $lte: lng + 0.045 },
    }).lean()

    this.cacheStore.set(cacheKey, { data: bins, timestamp: Date.now() })
    return bins
  }

  /**
   * Get pickups with status caching
   */
  async getPickupsCache(userId, force = false) {
    const cacheKey = `pickups-${userId}`
    const cached = this.cacheStore.get(cacheKey)

    if (cached && !force && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const pickups = await Pickup.find({ citizenId: userId }).lean()
    this.cacheStore.set(cacheKey, { data: pickups, timestamp: Date.now() })
    return pickups
  }

  /**
   * Get complaints with caching
   */
  async getComplaintsCache(userId, force = false) {
    const cacheKey = `complaints-${userId}`
    const cached = this.cacheStore.get(cacheKey)

    if (cached && !force && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const complaints = await Complaint.find({ userId }).lean()
    this.cacheStore.set(cacheKey, { data: complaints, timestamp: Date.now() })
    return complaints
  }

  /**
   * Clear specific cache or all caches
   */
  clearCache(key = null) {
    if (key) {
      this.cacheStore.delete(key)
    } else {
      this.cacheStore.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedItems: this.cacheStore.size,
      activePolls: this.activePolls.size,
      cacheSize: new Blob([JSON.stringify(Array.from(this.cacheStore.entries()))]).size,
    }
  }
}

export const pollingService = new PollingService()
export default pollingService
