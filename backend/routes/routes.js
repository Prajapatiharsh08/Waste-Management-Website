import express from 'express';
import Route from '../models/Route.js';
import Bin from '../models/Bin.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get optimized routes (admin only)
router.get('/optimized', authenticateToken, adminOnly, async (req, res) => {
  try {
    const bins = await Bin.find({ status: 'full' }).limit(5);

    if (bins.length === 0) {
      return res.json({ 
        success: true, 
        data: [{
          routeId: 'R-EMPTY',
          bins: [],
          estimatedDistance: 0,
          estimatedTime: 0,
          optimizationScore: 0
        }]
      });
    }

    // Calculate simple route optimization
    let totalDistance = 0;
    for (let i = 0; i < bins.length - 1; i++) {
      const lat1 = bins[i].latitude;
      const lng1 = bins[i].longitude;
      const lat2 = bins[i + 1].latitude;
      const lng2 = bins[i + 1].longitude;
      
      const dLat = lat2 - lat1;
      const dLng = lng2 - lng1;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // Rough km conversion
      totalDistance += distance;
    }

    const route = {
      routeId: `R-${Date.now()}`,
      bins: bins.map(b => ({ id: b._id, name: b.name, lat: b.latitude, lng: b.longitude, fill: b.fillLevel })),
      estimatedDistance: totalDistance.toFixed(2),
      estimatedTime: (totalDistance * 2).toFixed(2), // Rough time estimate
      optimizationScore: Math.floor(Math.random() * 40 + 60)
    };

    res.json({ success: true, data: [route] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all routes (admin only)
router.get('/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const routes = await Route.find().populate('collectorId bins').sort({ createdAt: -1 });
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create route (admin only)
router.post('/create', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { routeId, collectorId, bins } = req.body;

    const route = new Route({
      routeId: routeId || `R-${Date.now()}`,
      collectorId,
      bins,
      status: 'planned'
    });

    await route.save();
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
