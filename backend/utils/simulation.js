import Bin from "../models/Bin.js"

// Simulate realistic sensor data with gradual changes
export async function simulateBinSensorData() {
  try {
    const bins = await Bin.find()

    for (const bin of bins) {
      // Simulate fill level with gradual increase
      const fillIncrease = Math.random() * 5 + 1 // 1-6% increase per cycle
      bin.fillLevel = Math.min(100, bin.fillLevel + fillIncrease)

      // Update status based on fill level
      if (bin.fillLevel >= 85) {
        bin.status = "full"
      } else if (bin.fillLevel >= 60) {
        bin.status = "active"
      } else {
        bin.status = "active"
      }

      // Simulate temperature with seasonal variation (20-35°C typical)
      const baseTemp = 25
      const variation = Math.sin(Date.now() / 3600000) * 5 // 12-hour cycle
      const randomVar = (Math.random() - 0.5) * 4
      bin.temperature = Math.round((baseTemp + variation + randomVar) * 10) / 10

      // Simulate battery drain
      const drainRate = Math.random() * 0.3 + 0.1 // 0.1-0.4% per cycle
      bin.battery = Math.max(0, bin.battery - drainRate)

      // Reset battery if it reaches 0 (simulates recharge)
      if (bin.battery < 5 && Math.random() < 0.1) {
        bin.battery = 100
      }

      bin.lastUpdated = new Date()
      await bin.save()
    }

    console.log(`[Simulation] Updated ${bins.length} bins at ${new Date().toISOString()}`)
    return bins.length
  } catch (error) {
    console.error("[Simulation Error]", error.message)
    throw error
  }
}

// Start periodic simulation
export function startSimulation(intervalMs = 5000) {
  console.log(`[Simulation] Starting simulation with ${intervalMs}ms interval`)
  const interval = setInterval(() => {
    simulateBinSensorData().catch((err) => console.error("[Simulation Failed]", err))
  }, intervalMs)

  // Return function to stop simulation
  return () => {
    clearInterval(interval)
    console.log("[Simulation] Stopped")
  }
}
