import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true },
  collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collector' },
  bins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bin' }],
  status: { type: String, enum: ['planned', 'in-progress', 'completed'], default: 'planned' },
  estimatedDistance: { type: Number },
  actualDistance: { type: Number },
  startTime: { type: Date },
  endTime: { type: Date },
  optimizationScore: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Route', routeSchema);
