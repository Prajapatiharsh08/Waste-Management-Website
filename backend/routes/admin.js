import express from 'express';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import Bin from '../models/Bin.js';
import Pickup from '../models/Pickup.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

const router = express.Router();

// Get admin statistics
router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
  try {
    const totalBins = await Bin.countDocuments();
    const activeBins = await Bin.countDocuments({ status: 'active' });
    const fullBins = await Bin.countDocuments({ status: 'full' });
    const totalPickups = await Pickup.countDocuments();
    const completedPickups = await Pickup.countDocuments({ status: 'completed' });
    const pendingPickups = await Pickup.countDocuments({ status: 'pending' });
    const activeComplaints = await Complaint.countDocuments({ status: 'pending' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const totalCitizens = await User.countDocuments({ role: 'citizen' });

    const recyclingRate = completedPickups > 0 
      ? (completedPickups / (totalPickups || 1) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        totalBins,
        activeBins,
        fullBins,
        totalPickups,
        completedPickups,
        pendingPickups,
        activeComplaints,
        resolvedComplaints,
        totalCitizens,
        recyclingRate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all bins with status (admin)
router.get('/bins/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const bins = await Bin.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all pickups (admin)
router.get('/pickups/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pickups = await Pickup.find().populate('citizenId').sort({ createdAt: -1 });
    res.json({ success: true, data: pickups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all complaints (admin)
router.get('/complaints/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('userId').sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard data (admin)
router.get('/dashboard', authenticateToken, adminOnly, async (req, res) => {
  try {
    const stats = await Bin.find();
    const pickups = await Pickup.find().populate('citizenId').limit(10);
    const complaints = await Complaint.find().populate('userId').limit(10);

    res.json({
      success: true,
      data: {
        bins: stats,
        recentPickups: pickups,
        recentComplaints: complaints
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
