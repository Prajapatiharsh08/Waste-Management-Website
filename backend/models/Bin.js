import mongoose from 'mongoose';

const binSchema = new mongoose.Schema({
  binId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  fillLevel: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['active', 'full', 'maintenance'], default: 'active' },
  lastUpdated: { type: Date, default: Date.now },
  temperature: { type: Number, default: 25 },
  battery: { type: Number, default: 100, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Bin', binSchema);
