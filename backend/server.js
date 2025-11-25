import dotenv from "dotenv";
dotenv.config({ path: "./.env" });   // <<< LOAD ENV FIRST

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import binRoutes from "./routes/bins.js";
import pickupRoutes from "./routes/pickups.js";
import complaintRoutes from "./routes/complaints.js";
import adminRoutes from "./routes/admin.js";
import iotRoutes from "./routes/iot.js";
import routeRoutes from "./routes/routes.js";
import collectorRoutes from "./routes/collectors.js";
import pollingRoutes from "./routes/polling.js";

import { startSimulation } from "./utils/simulation.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
    ],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/smart-waste")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/pickup", pickupRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/collectors", collectorRoutes);
app.use("/api/polling", pollingRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "✅ Backend is running",
    timestamp: new Date(),
    simulationEnabled: process.env.ENABLE_SIMULATION === "true",
  });
});

let stopSimulation;
if (process.env.ENABLE_SIMULATION === "true") {
  setTimeout(() => {
    stopSimulation = startSimulation(
      Number.parseInt(process.env.SIMULATION_INTERVAL || "5000", 10)
    );
  }, 2000);
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  if (process.env.ENABLE_SIMULATION === "true") {
    console.log("🤖 IoT Simulation: ENABLED");
  }
});

process.on("SIGTERM", () => {
  if (stopSimulation) stopSimulation();
  process.exit(0);
});
