import express from 'express';
import Collector from '../models/Collector.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all collectors (admin only)
router.get('/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const collectors = await Collector.find().sort({ createdAt: -1 });
    res.json({ success: true, data: collectors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create collector (admin only)
router.post('/create', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, vehicleId } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone required" });
    }

    const existingCollector = await Collector.findOne({ email });
    if (existingCollector) {
      return res.status(400).json({ error: "Collector with this email already exists" });
    }

    const collector = new Collector({
      name,
      email,
      phone,
      vehicleId: vehicleId || `VH-${Date.now()}`,
      status: 'active'
    });

    await collector.save();
    res.status(201).json({ success: true, data: collector });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update collector status (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status, currentLocation } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (currentLocation !== undefined) updateData.currentLocation = currentLocation;

    const collector = await Collector.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!collector) {
      return res.status(404).json({ success: false, error: 'Collector not found' });
    }

    res.json({ success: true, data: collector });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete collector (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const collector = await Collector.findByIdAndDelete(req.params.id);
    if (!collector) {
      return res.status(404).json({ success: false, error: 'Collector not found' });
    }
    res.json({ success: true, message: 'Collector deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
