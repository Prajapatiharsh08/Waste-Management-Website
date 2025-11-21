import mongoose from 'mongoose';

const iotSchema = new mongoose.Schema({
  binId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', required: true },
  fillLevel: { type: Number, required: true, min: 0, max: 100 },
  temperature: { type: Number },
  humidity: { type: Number },
  gasLevel: { type: Number },
  battery: { type: Number, min: 0, max: 100 },
  signalStrength: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('IoT', iotSchema);
