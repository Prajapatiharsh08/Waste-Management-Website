import express from 'express';
import Pickup from '../models/Pickup.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Request pickup (citizen)
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const pickup = new Pickup({
      citizenId: req.user.id,
      location: {
        latitude: latitude || 0,
        longitude: longitude || 0,
        address: address || 'Current Location'
      },
      status: 'pending',
      createdAt: new Date()
    });

    await pickup.save();
    res.status(201).json({ success: true, data: pickup });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pickup status
router.get('/status/:id', authenticateToken, async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate('citizenId');
    if (!pickup) {
      return res.status(404).json({ success: false, error: 'Pickup not found' });
    }
    res.json({ success: true, data: pickup });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user pickups
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const pickups = await Pickup.find({ citizenId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: pickups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all pickups (admin only)
router.get('/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pickups = await Pickup.find().populate('citizenId').sort({ createdAt: -1 });
    res.json({ success: true, data: pickups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update pickup status (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'assigned', 'on-way', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      {
        status,
        completedAt: status === 'completed' ? new Date() : null
      },
      { new: true }
    ).populate('citizenId');

    if (!pickup) {
      return res.status(404).json({ success: false, error: 'Pickup not found' });
    }

    res.json({ success: true, data: pickup });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
