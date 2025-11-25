import mongoose from "mongoose"

const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  binId: { type: mongoose.Schema.Types.ObjectId, ref: "Bin" },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ["bin-damage", "bin-overflow", "service-quality", "other"], default: "other" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  status: { type: String, enum: ["pending", "acknowledged", "in-progress", "resolved", "closed"], default: "pending" },
  attachments: [{ type: String }], // URLs to images/files
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin assigned
  resolution: { type: String },
  resolutionImages: [{ type: String }],
  rating: { type: Number, min: 1, max: 5 }, // Citizen rating after resolution
  feedback: { type: String }, // Citizen feedback after resolution
  createdAt: { type: Date, default: Date.now },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
})

export default mongoose.model("Complaint", complaintSchema)
