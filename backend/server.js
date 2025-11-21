import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import binRoutes from './routes/bins.js';
import pickupRoutes from './routes/pickups.js';
import complaintRoutes from './routes/complaints.js';
import adminRoutes from './routes/admin.js';
import iotRoutes from './routes/iot.js';
import routeRoutes from './routes/routes.js';
import collectorRoutes from './routes/collectors.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-waste')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/bins', binRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/collectors', collectorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: '✅ Backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
});
