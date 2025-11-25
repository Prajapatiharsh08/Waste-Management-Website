import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"

import Home from "./pages/Home"
import CitizenLogin from "./pages/CitizenLogin"
import CitizenRegister from "./pages/CitizenRegister"
import CitizenDashboard from "./pages/CitizenDashboard"
import Education from "./pages/Education"
import AdminLogin from "./pages/AdminLogin"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminBins from "./pages/admin/Bins"
import AdminRoutes from "./pages/admin/Routes"
import AdminCollectors from "./pages/admin/Collectors"
import AdminComplaints from "./pages/admin/Complaints"
import AdminIoTData from "./pages/admin/IoTDashboard"
import NotFound from "./pages/NotFound"
import BinMap from "./pages/BinMap"
import CollectorLogin from "./pages/CollectorLogin"
import CollectorDashboard from "./pages/collector/Dashboard"
import ComplaintForm from "./pages/citizen/ComplaintForm"
import PickupTracking from "./pages/citizen/PickupTracking"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/citizen-login" element={<CitizenLogin />} />
            <Route path="/citizen-register" element={<CitizenRegister />} />
            <Route path="/education" element={<Education />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/collector-login" element={<CollectorLogin />} />

            {/* Citizen-only routes */}
            <Route
              path="/citizen-dashboard"
              element={
                <ProtectedRoute requiredRole="citizen">
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/complaints"
              element={
                <ProtectedRoute requiredRole="citizen">
                  <ComplaintForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/pickups"
              element={
                <ProtectedRoute requiredRole="citizen">
                  <PickupTracking />
                </ProtectedRoute>
              }
            />

            {/* Bin map: login required, role agnostic */}
            <Route
              path="/bin-map"
              element={
                <ProtectedRoute>
                  <BinMap />
                </ProtectedRoute>
              }
            />

            {/* Admin-only routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bins"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminBins />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/routes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/collectors"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCollectors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminComplaints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/iot-data"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminIoTData />
                </ProtectedRoute>
              }
            />

            {/* Collector-only routes */}
            <Route
              path="/collector/dashboard"
              element={
                <ProtectedRoute requiredRole="collector">
                  <CollectorDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
