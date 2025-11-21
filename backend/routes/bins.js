import express from 'express';
import Bin from '../models/Bin.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all bins (public)
router.get('/all', async (req, res) => {
  try {
    const bins = await Bin.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create bin (admin only)
router.post('/create', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { binId, name, latitude, longitude } = req.body;

    if (!binId || !name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingBin = await Bin.findOne({ binId });
    if (existingBin) {
      return res.status(400).json({ error: "Bin ID already exists" });
    }

    const bin = new Bin({
      binId,
      name,
      latitude,
      longitude,
      fillLevel: 0,
      temperature: 25,
      battery: 100,
      status: 'active'
    });

    await bin.save();
    res.status(201).json({ success: true, data: bin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bin by ID
router.get('/:id', async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ success: false, error: 'Bin not found' });
    }
    res.json({ success: true, data: bin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update bin status (admin only)
router.put('/update-status/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { fillLevel, status, temperature, battery } = req.body;

    const updateData = {};
    if (fillLevel !== undefined) updateData.fillLevel = fillLevel;
    if (status !== undefined) updateData.status = status;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (battery !== undefined) updateData.battery = battery;
    updateData.lastUpdated = new Date();

    const bin = await Bin.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!bin) {
      return res.status(404).json({ success: false, error: 'Bin not found' });
    }

    res.json({ success: true, data: bin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete bin (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const bin = await Bin.findByIdAndDelete(req.params.id);
    if (!bin) {
      return res.status(404).json({ success: false, error: 'Bin not found' });
    }
    res.json({ success: true, message: 'Bin deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get nearby bins (public)
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Find bins within 5km (roughly 0.045 degrees)
    const bins = await Bin.find({
      latitude: { $gte: latitude - 0.045, $lte: latitude + 0.045 },
      longitude: { $gte: longitude - 0.045, $lte: longitude + 0.045 }
    }).sort({
      fillLevel: 1
    });

    res.json({ success: true, data: bins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
