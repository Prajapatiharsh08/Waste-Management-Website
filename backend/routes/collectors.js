import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import Collector from "../models/Collector.js"
import Route from "../models/Route.js"
import Bin from "../models/Bin.js"
import { authenticateToken, adminOnly, collectorOnly } from "../middleware/auth.js"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

/* ==================== COLLECTOR AUTHENTICATION ==================== */

/**
 * POST /api/collectors/auth/register
 * Register a new collector account
 */
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password, vehicleId, vehicleType } = req.body

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "Name, email, phone, and password required" })
    }

    const existingCollector = await Collector.findOne({ email })
    if (existingCollector) {
      return res.status(400).json({ error: "Collector with this email already exists" })
    }

    const hashed = await bcrypt.hash(password, 10)

    const collector = new Collector({
      name,
      email,
      phone,
      password: hashed,
      vehicleId: vehicleId || `VH-${Date.now()}`,
      vehicleType: vehicleType || "truck",
      status: "active",
    })

    await collector.save()

    const token = jwt.sign({ id: collector._id, role: "collector", email: collector.email }, JWT_SECRET, {
      expiresIn: "24h",
    })

    res.status(201).json({
      success: true,
      user: {
        id: collector._id,
        name: collector.name,
        email: collector.email,
        role: "collector",
      },
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/collectors/auth/login
 * Collector login
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    const collector = await Collector.findOne({ email })
    if (!collector) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const isMatch = await bcrypt.compare(password, collector.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const token = jwt.sign({ id: collector._id, role: "collector", email: collector.email }, JWT_SECRET, {
      expiresIn: "24h",
    })

    collector.lastActive = new Date()
    await collector.save()

    res.json({
      success: true,
      user: {
        id: collector._id,
        name: collector.name,
        email: collector.email,
        status: collector.status,
        role: "collector",
      },
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/* ==================== COLLECTOR PROFILE & STATUS ==================== */

/**
 * GET /api/collectors/profile
 * Get collector's own profile
 */
router.get("/profile", authenticateToken, collectorOnly, async (req, res) => {
  try {
    const collector = await Collector.findById(req.user.id).populate("assignedBins").populate("currentRoute")

    if (!collector) {
      return res.status(404).json({ success: false, error: "Collector not found" })
    }

    res.json({
      success: true,
      data: {
        id: collector._id,
        name: collector.name,
        email: collector.email,
        phone: collector.phone,
        status: collector.status,
        vehicleId: collector.vehicleId,
        vehicleType: collector.vehicleType,
        currentLocation: collector.currentLocation,
        assignedBins: collector.assignedBins.length,
        pickupsCompleted: collector.pickupsCompleted,
        binsCollectedToday: collector.binsCollectedToday,
        averageRating: collector.averageRating,
        distanceTraveledToday: collector.distanceTraveledToday,
        currentRoute: collector.currentRoute,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/collectors/update-location
 * Update collector's current location (real-time)
 */
router.put("/update-location", authenticateToken, collectorOnly, async (req, res) => {
  try {
    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Latitude and longitude required" })
    }

    const collector = await Collector.findByIdAndUpdate(
      req.user.id,
      {
        currentLocation: {
          latitude,
          longitude,
          lastUpdated: new Date(),
        },
        lastActive: new Date(),
      },
      { new: true },
    )

    res.json({
      success: true,
      data: {
        currentLocation: collector.currentLocation,
        lastUpdated: collector.lastActive,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/collectors/update-status
 * Update collector's duty status
 */
router.put("/update-status", authenticateToken, collectorOnly, async (req, res) => {
  try {
    const { status } = req.body

    if (!["active", "inactive", "on-duty", "on-break"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    // Track route timing
    const updateData = {
      status,
      lastActive: new Date(),
    }

    if (status === "on-duty") {
      updateData.routeStartTime = new Date()
      updateData.binsCollectedToday = 0
      updateData.distanceTraveledToday = 0
    } else if (status === "inactive") {
      updateData.routeEndTime = new Date()
    }

    const collector = await Collector.findByIdAndUpdate(req.user.id, updateData, { new: true })

    res.json({
      success: true,
      data: {
        status: collector.status,
        routeStartTime: collector.routeStartTime,
        routeEndTime: collector.routeEndTime,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/* ==================== ROUTE & BIN MANAGEMENT ==================== */

/**
 * GET /api/collectors/assigned-route
 * Get collector's current assigned route
 */
router.get("/assigned-route", authenticateToken, collectorOnly, async (req, res) => {
  try {
    const collector = await Collector.findById(req.user.id).populate({
      path: "currentRoute",
      populate: { path: "bins" },
    })

    if (!collector || !collector.currentRoute) {
      return res.json({
        success: true,
        data: null,
        message: "No route currently assigned",
      })
    }

    res.json({
      success: true,
      data: collector.currentRoute,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/collectors/assigned-bins
 * Get all bins assigned to collector
 */
router.get("/assigned-bins", authenticateToken, collectorOnly, async (req, res) => {
  try {
    const collector = await Collector.findById(req.user.id).populate("assignedBins")

    res.json({
      success: true,
      data: collector.assignedBins.map((bin) => ({
        id: bin._id,
        binId: bin.binId,
        name: bin.name,
        latitude: bin.latitude,
        longitude: bin.longitude,
        fillLevel: bin.fillLevel,
        status: bin.status,
        temperature: bin.temperature,
        battery: bin.battery,
        lastUpdated: bin.lastUpdated,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/collectors/bin/:binId/mark-collected
 * Mark a bin as collected/visited
 */
router.put("/bin/:binId/mark-collected", authenticateToken, collectorOnly, async (req, res) => {
  try {
    const { distance } = req.body

    const bin = await Bin.findById(req.params.binId)
    if (!bin) {
      return res.status(404).json({ success: false, error: "Bin not found" })
    }

    // Update bin status
    bin.fillLevel = 0
    bin.status = "active"
    bin.lastUpdated = new Date()
    await bin.save()

    // Update collector stats
    const collector = await Collector.findByIdAndUpdate(
      req.user.id,
      {
        $inc: {
          pickupsCompleted: 1,
          binsCollectedToday: 1,
          distanceTraveledToday: distance || 0,
        },
      },
      { new: true },
    )

    res.json({
      success: true,
      message: "Bin marked as collected",
      data: {
        bin: bin.binId,
        pickupsCompleted: collector.pickupsCompleted,
        binsCollectedToday: collector.binsCollectedToday,
        distanceTraveledToday: collector.distanceTraveledToday,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/collectors/complete-route
 * Mark route as completed
 */
router.post("/complete-route", authenticateToken, collectorOnly, async (req, res) => {
  try {
    const collector = await Collector.findById(req.user.id).populate("currentRoute")

    if (!collector.currentRoute) {
      return res.status(400).json({ error: "No active route to complete" })
    }

    const route = await Route.findByIdAndUpdate(
      collector.currentRoute._id,
      {
        status: "completed",
        endTime: new Date(),
      },
      { new: true },
    )

    // Clear route assignment
    await Collector.findByIdAndUpdate(req.user.id, {
      currentRoute: null,
      routeEndTime: new Date(),
    })

    res.json({
      success: true,
      message: "Route completed successfully",
      data: route,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/* ==================== ADMIN COLLECTOR MANAGEMENT ==================== */

/**
 * GET /api/collectors/all
 * Get all collectors (admin only)
 */
router.get("/all", authenticateToken, adminOnly, async (req, res) => {
  try {
    const collectors = await Collector.find().populate("currentRoute").sort({ createdAt: -1 })

    res.json({
      success: true,
      data: collectors.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        vehicleId: c.vehicleId,
        vehicleType: c.vehicleType,
        currentLocation: c.currentLocation,
        pickupsCompleted: c.pickupsCompleted,
        averageRating: c.averageRating,
        lastActive: c.lastActive,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/collectors/create
 * Create new collector (admin only)
 */
router.post("/create", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, password, vehicleId, vehicleType } = req.body

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone required" })
    }

    const existingCollector = await Collector.findOne({ email })
    if (existingCollector) {
      return res.status(400).json({ error: "Collector with this email already exists" })
    }

    const hashed = password ? await bcrypt.hash(password, 10) : null

    const collector = new Collector({
      name,
      email,
      phone,
      password: hashed,
      vehicleId: vehicleId || `VH-${Date.now()}`,
      vehicleType: vehicleType || "truck",
      status: "active",
    })

    await collector.save()
    res.status(201).json({ success: true, data: collector })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/collectors/:id
 * Update collector details (admin only)
 */
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status, vehicleType, currentRoute } = req.body

    const updateData = {}
    if (status) updateData.status = status
    if (vehicleType) updateData.vehicleType = vehicleType
    if (currentRoute !== undefined) updateData.currentRoute = currentRoute

    const collector = await Collector.findByIdAndUpdate(req.params.id, updateData, { new: true })

    if (!collector) {
      return res.status(404).json({ success: false, error: "Collector not found" })
    }

    res.json({ success: true, data: collector })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/collectors/:id
 * Delete collector (admin only)
 */
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const collector = await Collector.findByIdAndDelete(req.params.id)
    if (!collector) {
      return res.status(404).json({ success: false, error: "Collector not found" })
    }
    res.json({ success: true, message: "Collector deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/collectors/stats
 * Get collector performance statistics (admin only)
 */
router.get("/stats", authenticateToken, adminOnly, async (req, res) => {
  try {
    const collectors = await Collector.find()

    const stats = {
      totalCollectors: collectors.length,
      activeCollectors: collectors.filter((c) => c.status === "on-duty").length,
      totalPickupsCompleted: collectors.reduce((sum, c) => sum + c.pickupsCompleted, 0),
      averageRating: (collectors.reduce((sum, c) => sum + c.averageRating, 0) / (collectors.length || 1)).toFixed(2),
      collectorDetails: collectors.map((c) => ({
        name: c.name,
        email: c.email,
        status: c.status,
        pickupsCompleted: c.pickupsCompleted,
        averageRating: c.averageRating,
        distanceTraveledToday: c.distanceTraveledToday,
      })),
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
