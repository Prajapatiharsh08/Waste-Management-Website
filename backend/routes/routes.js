import express from "express"
import Route from "../models/Route.js"
import Bin from "../models/Bin.js"
import Collector from "../models/Collector.js"
import { authenticateToken, adminOnly } from "../middleware/auth.js"

const router = express.Router()

/* ==================== ROUTE OPTIMIZATION & CREATION ==================== */

/**
 * GET /api/routes/optimized
 * Get optimized route for full bins (admin only)
 */
router.get("/optimized", authenticateToken, adminOnly, async (req, res) => {
  try {
    // Find full bins sorted by fill level
    const fullBins = await Bin.find({ status: "full" }).sort({ fillLevel: -1 }).limit(10)

    if (fullBins.length === 0) {
      return res.json({
        success: true,
        data: {
          routeId: "R-EMPTY",
          bins: [],
          estimatedDistance: 0,
          estimatedTime: 0,
          optimizationScore: 0,
          message: "No full bins to collect",
        },
      })
    }

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180)
      const dLng = (lng2 - lng1) * (Math.PI / 180)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // Simple TSP-like optimization
    let totalDistance = 0
    const optimizedBins = [fullBins[0]]
    const remaining = [...fullBins.slice(1)]

    while (remaining.length > 0) {
      const lastBin = optimizedBins[optimizedBins.length - 1]
      let nearestIdx = 0
      let nearestDistance = Number.POSITIVE_INFINITY

      remaining.forEach((bin, idx) => {
        const dist = calculateDistance(lastBin.latitude, lastBin.longitude, bin.latitude, bin.longitude)
        if (dist < nearestDistance) {
          nearestDistance = dist
          nearestIdx = idx
        }
      })

      totalDistance += nearestDistance
      optimizedBins.push(remaining[nearestIdx])
      remaining.splice(nearestIdx, 1)
    }

    const estimatedTime = (totalDistance * 2.5).toFixed(2) // 2.5 min per km
    const optimizationScore = Math.min(95, Math.round(100 - (totalDistance / fullBins.length) * 5))

    const route = {
      routeId: `R-${Date.now()}`,
      bins: optimizedBins.map((b) => ({
        id: b._id,
        binId: b.binId,
        name: b.name,
        latitude: b.latitude,
        longitude: b.longitude,
        fillLevel: b.fillLevel,
      })),
      estimatedDistance: totalDistance.toFixed(2),
      estimatedTime,
      optimizationScore,
      totalBins: optimizedBins.length,
    }

    res.json({ success: true, data: route })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/routes/create
 * Create new route (admin only)
 */
router.post("/create", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { routeId, collectorId, bins } = req.body

    if (!bins || bins.length === 0) {
      return res.status(400).json({ error: "At least one bin required" })
    }

    const route = new Route({
      routeId: routeId || `R-${Date.now()}`,
      collectorId,
      bins,
      status: "planned",
      startTime: null,
      createdAt: new Date(),
    })

    await route.save()

    // Assign route to collector
    if (collectorId) {
      await Collector.findByIdAndUpdate(collectorId, {
        currentRoute: route._id,
        assignedBins: bins,
        status: "on-duty",
      })
    }

    res.status(201).json({ success: true, data: route })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/routes/all
 * Get all routes (admin only)
 */
router.get("/all", authenticateToken, adminOnly, async (req, res) => {
  try {
    const routes = await Route.find()
      .populate("collectorId", "name email status")
      .populate("bins", "binId name fillLevel status")
      .sort({ createdAt: -1 })

    res.json({ success: true, data: routes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/routes/:id
 * Get route details (admin only)
 */
router.get("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate("collectorId").populate("bins")

    if (!route) {
      return res.status(404).json({ success: false, error: "Route not found" })
    }

    res.json({ success: true, data: route })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/routes/:id
 * Update route status (admin only)
 */
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status, actualDistance } = req.body

    if (!["planned", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const updateData = { status }
    if (status === "in-progress") updateData.startTime = new Date()
    if (status === "completed") {
      updateData.endTime = new Date()
      if (actualDistance) updateData.actualDistance = actualDistance
    }

    const route = await Route.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("collectorId")
      .populate("bins")

    if (!route) {
      return res.status(404).json({ success: false, error: "Route not found" })
    }

    res.json({ success: true, data: route })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/routes/:id
 * Delete route (admin only)
 */
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id)
    if (!route) {
      return res.status(404).json({ success: false, error: "Route not found" })
    }

    // Clear route assignment from collectors
    await Collector.updateMany({ currentRoute: req.params.id }, { currentRoute: null })

    res.json({ success: true, message: "Route deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/routes/stats
 * Get route performance statistics (admin only)
 */
router.get("/stats", authenticateToken, adminOnly, async (req, res) => {
  try {
    const routes = await Route.find()
    const completedRoutes = routes.filter((r) => r.status === "completed")

    const stats = {
      totalRoutes: routes.length,
      plannedRoutes: routes.filter((r) => r.status === "planned").length,
      inProgressRoutes: routes.filter((r) => r.status === "in-progress").length,
      completedRoutes: completedRoutes.length,
      averageDistance: (
        completedRoutes.reduce((sum, r) => sum + (r.actualDistance || 0), 0) / (completedRoutes.length || 1)
      ).toFixed(2),
      totalBinsCollected: completedRoutes.reduce((sum, r) => sum + r.bins.length, 0),
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
