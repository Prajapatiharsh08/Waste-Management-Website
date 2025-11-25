import express from "express"
import Complaint from "../models/Complaint.js"
import { authenticateToken, adminOnly, citizenOnly } from "../middleware/auth.js"

const router = express.Router()

/* ==================== CITIZEN COMPLAINT CREATION ==================== */

/**
 * POST /api/complaints/new
 * Create new complaint (citizen)
 */
router.post("/new", authenticateToken, citizenOnly, async (req, res) => {
  try {
    const { title, description, category, binId, location, attachments } = req.body

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" })
    }

    const complaint = new Complaint({
      userId: req.user.id,
      binId: binId || null,
      title,
      description,
      category: category || "other",
      priority: "medium",
      status: "pending",
      attachments: attachments || [],
      location: location || {},
      createdAt: new Date(),
    })

    await complaint.save()
    await complaint.populate("userId", "name email phone")

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully",
      data: complaint,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/* ==================== CITIZEN COMPLAINT TRACKING ==================== */

/**
 * GET /api/complaints/user
 * Get citizen's own complaints
 */
router.get("/user", authenticateToken, citizenOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id })
      .populate("binId", "binId name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: complaints,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/complaints/:id
 * Get complaint details
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("binId", "binId name latitude longitude")
      .populate("assignedTo", "name email")

    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" })
    }

    // Check authorization - citizen can only view their own, admin can view all
    if (req.user.role === "citizen" && complaint.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to view this complaint" })
    }

    res.json({ success: true, data: complaint })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/complaints/:id/feedback
 * Submit feedback and rating after resolution (citizen)
 */
router.put("/:id/feedback", authenticateToken, citizenOnly, async (req, res) => {
  try {
    const { rating, feedback } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" })
    }

    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" })
    }

    if (complaint.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    if (complaint.status !== "resolved") {
      return res.status(400).json({ error: "Can only rate resolved complaints" })
    }

    complaint.rating = rating
    complaint.feedback = feedback || ""
    complaint.status = "closed"
    complaint.closedAt = new Date()
    await complaint.save()

    res.json({
      success: true,
      message: "Thank you for your feedback",
      data: complaint,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/* ==================== ADMIN COMPLAINT MANAGEMENT ==================== */

/**
 * GET /api/complaints/all
 * Get all complaints (admin only)
 */
router.get("/all", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status, priority, category } = req.query
    const query = {}

    if (status) query.status = status
    if (priority) query.priority = priority
    if (category) query.category = category

    const complaints = await Complaint.find(query)
      .populate("userId", "name email phone")
      .populate("binId", "binId name")
      .populate("assignedTo", "name email")
      .sort({ priority: -1, createdAt: -1 })

    res.json({ success: true, data: complaints })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/complaints/:id/acknowledge
 * Acknowledge complaint (admin)
 */
router.put("/:id/acknowledge", authenticateToken, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: "acknowledged",
        acknowledgedAt: new Date(),
      },
      { new: true },
    ).populate("userId", "name email")

    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" })
    }

    res.json({
      success: true,
      message: "Complaint acknowledged",
      data: complaint,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/complaints/:id/assign
 * Assign complaint to staff member (admin)
 */
router.put("/:id/assign", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { assignedToId, priority } = req.body

    if (!assignedToId) {
      return res.status(400).json({ error: "assignedToId required" })
    }

    const updateData = {
      assignedTo: assignedToId,
      status: "in-progress",
    }

    if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
      updateData.priority = priority
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("userId", "name email")
      .populate("assignedTo", "name email")

    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" })
    }

    res.json({
      success: true,
      message: "Complaint assigned",
      data: complaint,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/complaints/:id/resolve
 * Mark complaint as resolved with solution (admin)
 */
router.put("/:id/resolve", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { resolution, resolutionImages } = req.body

    if (!resolution) {
      return res.status(400).json({ error: "Resolution description required" })
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolution,
        resolutionImages: resolutionImages || [],
        resolvedAt: new Date(),
      },
      { new: true },
    )
      .populate("userId", "name email")
      .populate("assignedTo", "name email")

    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" })
    }

    res.json({
      success: true,
      message: "Complaint resolved. Awaiting citizen feedback.",
      data: complaint,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/complaints/:id/priority
 * Update complaint priority (admin)
 */
router.put("/:id/priority", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { priority } = req.body

    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority level" })
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { priority }, { new: true })

    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" })
    }

    res.json({ success: true, data: complaint })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/complaints/:id
 * Delete complaint (admin only)
 */
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id)
    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" })
    }
    res.json({ success: true, message: "Complaint deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/* ==================== ANALYTICS & REPORTING ==================== */

/**
 * GET /api/complaints/stats
 * Get complaint statistics (admin only)
 */
router.get("/stats", authenticateToken, adminOnly, async (req, res) => {
  try {
    const allComplaints = await Complaint.find()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentComplaints = allComplaints.filter((c) => c.createdAt > oneWeekAgo)

    const stats = {
      totalComplaints: allComplaints.length,
      pendingComplaints: allComplaints.filter((c) => c.status === "pending").length,
      inProgressComplaints: allComplaints.filter((c) => c.status === "in-progress").length,
      resolvedComplaints: allComplaints.filter((c) => c.status === "resolved").length,
      closedComplaints: allComplaints.filter((c) => c.status === "closed").length,
      averageResolutionTime: calculateAverageResolutionTime(allComplaints),
      averageSatisfactionRating: calculateAverageSatisfactionRating(allComplaints),
      complaintsByCategory: groupByCategory(allComplaints),
      complaintsByPriority: groupByPriority(allComplaints),
      recentComplaints: recentComplaints.length,
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * Helper function: Calculate average resolution time in hours
 */
function calculateAverageResolutionTime(complaints) {
  const resolved = complaints.filter((c) => c.resolvedAt && c.createdAt)
  if (resolved.length === 0) return 0

  const totalTime = resolved.reduce((sum, c) => {
    return sum + (c.resolvedAt - c.createdAt) / (1000 * 60 * 60)
  }, 0)

  return (totalTime / resolved.length).toFixed(2)
}

/**
 * Helper function: Calculate average satisfaction rating
 */
function calculateAverageSatisfactionRating(complaints) {
  const rated = complaints.filter((c) => c.rating)
  if (rated.length === 0) return 0

  const totalRating = rated.reduce((sum, c) => sum + c.rating, 0)
  return (totalRating / rated.length).toFixed(2)
}

/**
 * Helper function: Group complaints by category
 */
function groupByCategory(complaints) {
  return {
    "bin-damage": complaints.filter((c) => c.category === "bin-damage").length,
    "bin-overflow": complaints.filter((c) => c.category === "bin-overflow").length,
    "service-quality": complaints.filter((c) => c.category === "service-quality").length,
    other: complaints.filter((c) => c.category === "other").length,
  }
}

/**
 * Helper function: Group complaints by priority
 */
function groupByPriority(complaints) {
  return {
    low: complaints.filter((c) => c.priority === "low").length,
    medium: complaints.filter((c) => c.priority === "medium").length,
    high: complaints.filter((c) => c.priority === "high").length,
    urgent: complaints.filter((c) => c.priority === "urgent").length,
  }
}

export default router
