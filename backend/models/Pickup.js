import mongoose from 'mongoose';

const pickupSchema = new mongoose.Schema({
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String }
  },
  status: { type: String, enum: ['pending', 'assigned', 'on-way', 'completed'], default: 'pending' },
  estimatedTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export default mongoose.model('Pickup', pickupSchema);
