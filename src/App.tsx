import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AppLayout } from "@/components/AppLayout";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

const LandingPage    = lazy(() => import("./pages/LandingPage"));
const MapPage        = lazy(() => import("./pages/MapPage"));
const AnalyticsPage  = lazy(() => import("./pages/AnalyticsPage"));
const DriverPage     = lazy(() => import("./pages/DriverPage"));
const ReportsPage    = lazy(() => import("./pages/ReportsPage"));
const PricingPage    = lazy(() => import("./pages/PricingPage"));
const BillingPage    = lazy(() => import("./pages/BillingPage"));
const AdminPage      = lazy(() => import("./pages/AdminPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AuthPage       = lazy(() => import("./pages/AuthPage"));
const UserDashboard  = lazy(() => import("./pages/UserDashboard"));
const EcoPointsPage  = lazy(() => import("./pages/EcoPointsPage"));
const DriverKYCPage  = lazy(() => import("./pages/DriverKYCPage"));
const FloatingChatbot = lazy(() => import("./components/FloatingChatbot").then(m => ({ default: m.FloatingChatbot })));
const NotFound       = lazy(() => import("./pages/NotFound"));

/* ── Skeleton fallbacks ── */
function BarsSkeleton() {
  return (
    <div className="space-y-4 p-1 animate-fade-in">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="skeleton h-40 rounded-xl" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="skeleton h-52 rounded-xl" />
        <div className="skeleton h-52 rounded-xl" />
      </div>
    </div>
  );
}
function MapSkeleton() {
  return (
    <div className="space-y-4 p-1 animate-fade-in">
      <div className="skeleton h-8 w-56" />
      <div className="skeleton h-[480px] rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
    </div>
  );
}
function CardsSkeleton() {
  return (
    <div className="space-y-4 p-1 animate-fade-in">
      <div className="skeleton h-8 w-40" />
      <div className="grid gap-4 md:grid-cols-2">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
      </div>
    </div>
  );
}
function ListSkeleton() {
  return (
    <div className="space-y-3 p-1 animate-fade-in">
      <div className="skeleton h-8 w-44" />
      {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  );
}
function SpinnerOnly() {
  return (
    <div className="flex items-center justify-center h-[50vh] animate-fade-in">
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
    </div>
  );
}

/* ── Role-based route guards ── */
function UserOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "driver") return <Navigate to="/driver" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
function DriverOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "user") return <Navigate to="/user-dashboard" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RealtimeSetup() {
  useRealtimeEvents();
  return null;
}

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SpinnerOnly />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <AppLayout />;
}

function AuthGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <SpinnerOnly />;
  if (!isAuthenticated) return <AuthPage />;
  if (user?.role === "driver") return <Navigate to="/driver" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/user-dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <NotificationsProvider>
          <SubscriptionProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RealtimeSetup />
              <Routes>
                <Route path="/" element={<Suspense fallback={<SpinnerOnly />}><LandingPage /></Suspense>} />
                <Route path="/auth" element={<Suspense fallback={<SpinnerOnly />}><AuthGuard /></Suspense>} />
                <Route path="/admin/login" element={<Suspense fallback={<SpinnerOnly />}><AdminLoginPage /></Suspense>} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/user-dashboard" element={<UserOnlyRoute><Suspense fallback={<BarsSkeleton />}><UserDashboard /></Suspense></UserOnlyRoute>} />
                  <Route path="/eco-points"     element={<UserOnlyRoute><Suspense fallback={<CardsSkeleton />}><EcoPointsPage /></Suspense></UserOnlyRoute>} />
                  <Route path="/map"            element={<Suspense fallback={<MapSkeleton />}><MapPage /></Suspense>} />
                  <Route path="/analytics"      element={<Suspense fallback={<BarsSkeleton />}><AnalyticsPage /></Suspense>} />
                  <Route path="/driver"         element={<DriverOnlyRoute><Suspense fallback={<ListSkeleton />}><DriverPage /></Suspense></DriverOnlyRoute>} />
                  <Route path="/driver/kyc"     element={<DriverOnlyRoute><Suspense fallback={<CardsSkeleton />}><DriverKYCPage /></Suspense></DriverOnlyRoute>} />
                  <Route path="/reports"        element={<Suspense fallback={<ListSkeleton />}><ReportsPage /></Suspense>} />
                  <Route path="/pricing"        element={<UserOnlyRoute><Suspense fallback={<CardsSkeleton />}><PricingPage /></Suspense></UserOnlyRoute>} />
                  <Route path="/billing"        element={<UserOnlyRoute><Suspense fallback={<CardsSkeleton />}><BillingPage /></Suspense></UserOnlyRoute>} />
                  <Route path="/admin"          element={<AdminOnlyRoute><Suspense fallback={<BarsSkeleton />}><AdminPage /></Suspense></AdminOnlyRoute>} />
                </Route>
                <Route path="*" element={<Suspense fallback={<SpinnerOnly />}><NotFound /></Suspense>} />
              </Routes>
              <Suspense fallback={null}>
                <FloatingChatbot />
              </Suspense>
            </BrowserRouter>
          </SubscriptionProvider>
        </NotificationsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
