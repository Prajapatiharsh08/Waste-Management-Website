/**
 * Polling Endpoints for Real-time Data
 * Provides efficient polling for frontend applications
 */

import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import pollingService from "../utils/polling-service.js"
import Bin from "../models/Bin.js"
import Pickup from "../models/Pickup.js"
import Complaint from "../models/Complaint.js"
import Collector from "../models/Collector.js"
import Route from "../models/Route.js"

const router = express.Router()

/* ==================== POLLING ENDPOINTS ==================== */

/**
 * GET /api/polling/bins
 * Poll for updated bin data
 */
router.get("/bins", async (req, res) => {
  try {
    const force = req.query.force === "true"
    const bins = await pollingService.getBinsCache(force)

    res.json({
      success: true,
      data: bins,
      timestamp: Date.now(),
      cacheHit: !force,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/polling/bins/nearby?lat=X&lng=Y
 * Poll for nearby bins
 */
router.get("/bins/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng required" })
    }

    const force = req.query.force === "true"
    const bins = await pollingService.getNearbyBinsCache(Number.parseFloat(lat), Number.parseFloat(lng), force)

    res.json({
      success: true,
      data: bins,
      timestamp: Date.now(),
      count: bins.length,
      cacheHit: !force,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/polling/pickups
 * Poll for citizen pickups (requires auth)
 */
router.get("/pickups", authenticateToken, async (req, res) => {
  try {
    const force = req.query.force === "true"
    const pickups = await pollingService.getPickupsCache(req.user.id, force)

    res.json({
      success: true,
      data: pickups,
      timestamp: Date.now(),
      cacheHit: !force,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/polling/complaints
 * Poll for citizen complaints (requires auth)
 */
router.get("/complaints", authenticateToken, async (req, res) => {
  try {
    const force = req.query.force === "true"
    const complaints = await pollingService.getComplaintsCache(req.user.id, force)

    res.json({
      success: true,
      data: complaints,
      timestamp: Date.now(),
      cacheHit: !force,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/polling/admin/dashboard
 * Poll for admin dashboard data
 */
router.get("/admin/dashboard", authenticateToken, async (req, res) => {
  try {
    const [bins, pickups, complaints, collectors, routes] = await Promise.all([
      Bin.find().lean(),
      Pickup.find().lean(),
      Complaint.find().lean(),
      Collector.find().lean(),
      Route.find().lean(),
    ])

    const stats = {
      bins: {
        total: bins.length,
        full: bins.filter((b) => b.status === "full").length,
        active: bins.filter((b) => b.status === "active").length,
        maintenance: bins.filter((b) => b.status === "maintenance").length,
        averageFill: (bins.reduce((sum, b) => sum + b.fillLevel, 0) / (bins.length || 1)).toFixed(2),
      },
      pickups: {
        total: pickups.length,
        pending: pickups.filter((p) => p.status === "pending").length,
        assigned: pickups.filter((p) => p.status === "assigned").length,
        completed: pickups.filter((p) => p.status === "completed").length,
      },
      complaints: {
        total: complaints.length,
        pending: complaints.filter((c) => c.status === "pending").length,
        resolved: complaints.filter((c) => c.status === "resolved").length,
      },
      collectors: {
        total: collectors.length,
        active: collectors.filter((c) => c.status === "on-duty").length,
      },
      routes: {
        total: routes.length,
        inProgress: routes.filter((r) => r.status === "in-progress").length,
        completed: routes.filter((r) => r.status === "completed").length,
      },
    }

    res.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/polling/collector/status
 * Poll collector route and bin status
 */
router.get("/collector/status", authenticateToken, async (req, res) => {
  try {
    const collector = await Collector.findById(req.user.id).populate("currentRoute").populate("assignedBins").lean()

    res.json({
      success: true,
      data: {
        status: collector.status,
        currentRoute: collector.currentRoute,
        assignedBins: collector.assignedBins,
        pickupsCompleted: collector.pickupsCompleted,
        binsCollectedToday: collector.binsCollectedToday,
        location: collector.currentLocation,
        lastUpdated: collector.lastActive,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/polling/cache-stats
 * Get polling service cache statistics (admin only)
 */
router.get("/cache-stats", authenticateToken, async (req, res) => {
  try {
    const stats = pollingService.getCacheStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/polling/cache-clear
 * Clear cache (admin only)
 */
router.post("/cache-clear", authenticateToken, async (req, res) => {
  try {
    const { key } = req.body
    pollingService.clearCache(key)
    res.json({ success: true, message: "Cache cleared" })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
