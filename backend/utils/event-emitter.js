/**
 * Event Emitter for Real-time Updates
 * Can be used with WebSocket integration for instant notifications
 */

import EventEmitter from "events"

class SystemEventEmitter extends EventEmitter {
  // Bin events
  emitBinUpdate(bin) {
    this.emit("bin:update", { timestamp: Date.now(), data: bin })
  }

  emitBinFull(bin) {
    this.emit("bin:full", { timestamp: Date.now(), data: bin })
  }

  // Pickup events
  emitPickupCreated(pickup) {
    this.emit("pickup:created", { timestamp: Date.now(), data: pickup })
  }

  emitPickupStatusChange(pickup, oldStatus, newStatus) {
    this.emit("pickup:status-changed", {
      timestamp: Date.now(),
      data: pickup,
      oldStatus,
      newStatus,
    })
  }

  // Collector events
  emitCollectorLocationUpdate(collector) {
    this.emit("collector:location-update", { timestamp: Date.now(), data: collector })
  }

  emitCollectorStatusChange(collector, newStatus) {
    this.emit("collector:status-changed", { timestamp: Date.now(), data: collector, newStatus })
  }

  // Complaint events
  emitComplaintCreated(complaint) {
    this.emit("complaint:created", { timestamp: Date.now(), data: complaint })
  }

  emitComplaintResolved(complaint) {
    this.emit("complaint:resolved", { timestamp: Date.now(), data: complaint })
  }

  // Route events
  emitRouteStarted(route) {
    this.emit("route:started", { timestamp: Date.now(), data: route })
  }

  emitRouteCompleted(route) {
    this.emit("route:completed", { timestamp: Date.now(), data: route })
  }

  // Get all event types
  getEventTypes() {
    return [
      "bin:update",
      "bin:full",
      "pickup:created",
      "pickup:status-changed",
      "collector:location-update",
      "collector:status-changed",
      "complaint:created",
      "complaint:resolved",
      "route:started",
      "route:completed",
    ]
  }
}

export const systemEventEmitter = new SystemEventEmitter()
export default systemEventEmitter
