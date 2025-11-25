export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export interface ErrorResponse {
  code: string
  message: string
  statusCode: number
  timestamp: string
}

export const parseError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "An unexpected error occurred"
}

export const handleApiError = (status: number, data: any): string => {
  if (status === 400) {
    return data.message || "Invalid request"
  }
  if (status === 401) {
    return "Unauthorized - Please login again"
  }
  if (status === 403) {
    return "Forbidden - You don't have permission"
  }
  if (status === 404) {
    return "Not found"
  }
  if (status === 429) {
    return "Too many requests - Please wait"
  }
  if (status === 500) {
    return "Server error - Please try again later"
  }
  return "An error occurred"
}

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes("fetch") || error.message.includes("network")
  }
  return false
}

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403
  }
  return false
}
