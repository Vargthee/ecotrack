import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AppLayout } from "@/components/AppLayout";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

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
const FloatingChatbot = lazy(() => import("./components/FloatingChatbot").then(m => ({ default: m.FloatingChatbot })));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageSkeleton() {
  return (
    <div className="space-y-5 p-1">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  );
}

function FullPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-3 w-64">
        <Skeleton className="h-8 w-40 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto" />
        <Skeleton className="h-10 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  useRealtimeEvents();
  if (isLoading) return <FullPageSkeleton />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <AppLayout />;
}

function AuthGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <FullPageSkeleton />;
  if (!isAuthenticated) return <AuthPage />;
  if (user?.role === "driver") return <Navigate to="/driver" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/user-dashboard" replace />;
}

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
  if (user?.role === "user") return <Navigate to="/user-dashboard" replace />;
  if (user?.role === "driver") return <Navigate to="/driver" replace />;
  return <>{children}</>;
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
            <Suspense fallback={<FullPageSkeleton />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthGuard />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/map" element={<Suspense fallback={<PageSkeleton />}><MapPage /></Suspense>} />
                  <Route path="/analytics" element={<Suspense fallback={<PageSkeleton />}><AnalyticsPage /></Suspense>} />
                  <Route path="/driver" element={<DriverOnlyRoute><Suspense fallback={<PageSkeleton />}><DriverPage /></Suspense></DriverOnlyRoute>} />
                  <Route path="/driver/kyc" element={<DriverOnlyRoute><Suspense fallback={<PageSkeleton />}><DriverKYCPage /></Suspense></DriverOnlyRoute>} />
                  <Route path="/reports" element={<Suspense fallback={<PageSkeleton />}><ReportsPage /></Suspense>} />
                  <Route path="/pricing" element={<UserOnlyRoute><Suspense fallback={<PageSkeleton />}><PricingPage /></Suspense></UserOnlyRoute>} />
                  <Route path="/billing" element={<UserOnlyRoute><Suspense fallback={<PageSkeleton />}><BillingPage /></Suspense></UserOnlyRoute>} />
                  <Route path="/admin" element={<AdminOnlyRoute><Suspense fallback={<PageSkeleton />}><AdminPage /></Suspense></AdminOnlyRoute>} />
                  <Route path="/user-dashboard" element={<UserOnlyRoute><Suspense fallback={<PageSkeleton />}><UserDashboard /></Suspense></UserOnlyRoute>} />
                  <Route path="/eco-points" element={<UserOnlyRoute><Suspense fallback={<PageSkeleton />}><EcoPointsPage /></Suspense></UserOnlyRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
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
