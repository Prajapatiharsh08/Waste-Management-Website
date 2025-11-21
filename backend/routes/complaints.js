import express from 'express';
import Complaint from '../models/Complaint.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Create complaint (citizen)
router.post('/new', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    const complaint = new Complaint({
      userId: req.user.id,
      title,
      description,
      status: 'pending',
      createdAt: new Date()
    });

    await complaint.save();
    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user complaints
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all complaints (admin only)
router.get('/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('userId').sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resolve complaint (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('userId');

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
