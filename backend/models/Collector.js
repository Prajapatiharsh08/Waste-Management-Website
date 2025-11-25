import mongoose from "mongoose"

const collectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String },
  status: { type: String, enum: ["active", "inactive", "on-duty", "on-break"], default: "active" },
  vehicleId: { type: String },
  vehicleType: { type: String, enum: ["truck", "van", "auto", "bicycle"], default: "truck" },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    lastUpdated: { type: Date },
  },
  assignedBins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bin" }],
  currentRoute: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
  pickupsCompleted: { type: Number, default: 0 },
  binsCollectedToday: { type: Number, default: 0 },
  averageRating: { type: Number, default: 5, min: 1, max: 5 },
  totalRatings: { type: Number, default: 0 },
  distanceTraveledToday: { type: Number, default: 0 },
  routeStartTime: { type: Date },
  routeEndTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date },
})

export default mongoose.model("Collector", collectorSchema)
