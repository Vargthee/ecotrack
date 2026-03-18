import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AppLayout } from "@/components/AppLayout";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const MapPage = lazy(() => import("./pages/MapPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const DriverPage = lazy(() => import("./pages/DriverPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/driver" element={<DriverPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
