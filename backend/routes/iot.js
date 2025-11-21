import express from 'express';
import Bin from '../models/Bin.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Simulate IoT bin status update (admin only)
router.post('/simulate', authenticateToken, adminOnly, async (req, res) => {
  try {
    const bins = await Bin.find();
    
    for (const bin of bins) {
      // Simulate fillLevel increase
      bin.fillLevel = Math.min(100, bin.fillLevel + Math.random() * 15);
      
      // Update status based on fill level
      if (bin.fillLevel >= 85) {
        bin.status = 'full';
      } else if (bin.fillLevel < 50) {
        bin.status = 'active';
      } else {
        bin.status = 'active';
      }

      // Simulate temperature variation
      bin.temperature = 20 + Math.random() * 15;

      // Simulate battery drain
      bin.battery = Math.max(0, bin.battery - Math.random() * 2);

      bin.lastUpdated = new Date();
      await bin.save();
    }

    res.json({ success: true, message: 'IoT simulation completed', updatedCount: bins.length, data: bins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get real-time IoT data (admin only)
router.get('/real-time', authenticateToken, adminOnly, async (req, res) => {
  try {
    const bins = await Bin.find().sort({ lastUpdated: -1 });
    res.json({ success: true, data: bins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update specific bin IoT data (admin only)
router.put('/update/:binId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { fillLevel, temperature, battery, status } = req.body;

    const updateData = {};
    if (fillLevel !== undefined) updateData.fillLevel = Math.min(100, Math.max(0, fillLevel));
    if (temperature !== undefined) updateData.temperature = temperature;
    if (battery !== undefined) updateData.battery = Math.min(100, Math.max(0, battery));
    if (status !== undefined) updateData.status = status;
    updateData.lastUpdated = new Date();

    const bin = await Bin.findByIdAndUpdate(req.params.binId, updateData, { new: true });
    
    if (!bin) {
      return res.status(404).json({ success: false, error: 'Bin not found' });
    }

    res.json({ success: true, data: bin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
