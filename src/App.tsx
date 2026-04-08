import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { FloatingChatbot } from "@/components/FloatingChatbot";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const DriverPage = lazy(() => import("./pages/DriverPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const EcoPointsPage = lazy(() => import("./pages/EcoPointsPage"));
const DriverKYCPage = lazy(() => import("./pages/DriverKYCPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <AppLayout />;
}

function AuthGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <AuthPage />;
  if (user?.role === "driver") return <Navigate to="/driver" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/user-dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthGuard />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/driver" element={<DriverPage />} />
                  <Route path="/driver/kyc" element={<DriverKYCPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/user-dashboard" element={<UserDashboard />} />
                  <Route path="/eco-points" element={<EcoPointsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <FloatingChatbot />
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
