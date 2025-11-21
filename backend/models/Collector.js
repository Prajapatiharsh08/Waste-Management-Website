import mongoose from 'mongoose';

const collectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'on-duty'], default: 'active' },
  vehicleId: { type: String },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  assignedBins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bin' }],
  pickupsCompleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Collector', collectorSchema);
