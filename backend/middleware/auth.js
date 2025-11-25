import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const IOT_DEVICE_TOKEN = process.env.IOT_DEVICE_TOKEN;

// ❗ DO NOT THROW ERROR HERE
// ES modules import files before dotenv.config() runs
if (!JWT_SECRET) {
  console.log("⚠️ WARNING: JWT_SECRET not loaded yet. Make sure .env is correct.");
}

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const collectorOnly = (req, res, next) => {
  if (req.user.role !== "collector") {
    return res.status(403).json({ error: "Collector access required" });
  }
  next();
};

export const citizenOnly = (req, res, next) => {
  if (req.user.role !== "citizen") {
    return res.status(403).json({ error: "Citizen access required" });
  }
  next();
};

export const iotDeviceAuth = (req, res, next) => {
  const deviceToken =
    req.headers["x-device-token"] ||
    req.headers["authorization"]?.split(" ")[1];

  if (!deviceToken) {
    return res.status(401).json({
      error: "Device token required",
      hint: "Include x-device-token header or Authorization: Bearer <token>",
    });
  }

  if (deviceToken !== IOT_DEVICE_TOKEN) {
    return res.status(403).json({ error: "Invalid device token" });
  }

  next();
};
