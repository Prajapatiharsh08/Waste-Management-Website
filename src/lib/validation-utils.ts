/**
 * Validation & Formatting Utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s+\-()]{10,}$/
  return phoneRegex.test(phone)
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function formatBattery(battery: number): string {
  if (battery > 75) return "Excellent"
  if (battery > 50) return "Good"
  if (battery > 25) return "Low"
  return "Critical"
}

export function getBatteryColor(battery: number): string {
  if (battery > 75) return "text-green-600"
  if (battery > 50) return "text-blue-600"
  if (battery > 25) return "text-yellow-600"
  return "text-red-600"
}

export function formatFillLevel(fillLevel: number): string {
  return `${Math.round(fillLevel)}%`
}

export function getFillLevelColor(fillLevel: number): string {
  if (fillLevel < 50) return "bg-green-500"
  if (fillLevel < 75) return "bg-yellow-500"
  if (fillLevel < 90) return "bg-orange-500"
  return "bg-red-500"
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  }

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval)
    if (interval >= 1) {
      return `${interval} ${name}${interval > 1 ? "s" : ""} ago`
    }
  }

  return "Just now"
}
