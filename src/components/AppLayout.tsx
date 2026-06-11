import { memo, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) main.scrollTop = 0;
  }, [pathname]);
  return null;
}

function PageTransition() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter h-full">
      <Outlet />
    </div>
  );
}

export const AppLayout = memo(function AppLayout() {
  return (
    <SidebarProvider>
      <ScrollToTop />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 shrink-0 shadow-sm">
            <SidebarTrigger className="mr-3 transition-transform active:scale-90" />
            <span className="text-sm font-medium text-muted-foreground truncate flex-1">EcoTrack Waste Management</span>
            <NotificationBell />
          </header>
          <main
            id="main-content"
            className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth"
            style={{ scrollBehavior: "smooth" }}
          >
            <PageTransition />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
});
