import { LayoutDashboard, Map, Truck, BarChart3, AlertTriangle, Leaf, CreditCard, Sparkles, Shield, User, Award, FileCheck, LogIn, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription, PLAN_CONFIG } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Bin Map", url: "/map", icon: Map },
  { title: "Analytics", url: "/analytics", icon: BarChart3, requiredTier: "pro" as const },
  { title: "Reports", url: "/reports", icon: AlertTriangle },
  { title: "Admin Panel", url: "/admin", icon: Shield },
];

const userNavItems = [
  { title: "My Dashboard", url: "/user-dashboard", icon: User },
  { title: "Eco Points", url: "/eco-points", icon: Award },
];

const driverNavItems = [
  { title: "Driver Tasks", url: "/driver", icon: Truck, requiredTier: "pro" as const },
  { title: "KYC Verification", url: "/driver/kyc", icon: FileCheck },
];

const billingItems = [
  { title: "Pricing", url: "/pricing", icon: Sparkles },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription, canAccessRoute } = useSubscription();
  const { user, isAuthenticated, logout } = useAuth();
  const plan = PLAN_CONFIG[subscription.plan_type];

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
            <Leaf className="h-5 w-5 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-semibold text-sidebar-primary">EcoTrack</h1>
              <p className="text-xs text-sidebar-foreground/60">Waste Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const locked = !canAccessRoute(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${locked ? "opacity-50" : ""}`}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && (
                          <span className="flex items-center gap-2">
                            {item.title}
                            {locked && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-sidebar-foreground/30 text-sidebar-foreground/60">PRO</Badge>}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        {isAuthenticated && user?.role === "user" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
              My Account
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Driver Section */}
        {isAuthenticated && user?.role === "driver" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
              Driver
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {driverNavItems.map((item) => {
                  const locked = item.requiredTier && !canAccessRoute(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${locked ? "opacity-50" : ""}`}
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center gap-2">
                              {item.title}
                              {locked && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-sidebar-foreground/30 text-sidebar-foreground/60">PRO</Badge>}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Always show driver/user nav for non-authenticated */}
        {!isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
              User & Driver
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[...userNavItems, ...driverNavItems].map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Billing */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {billingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {/* Auth Button */}
        {!collapsed && (
          isAuthenticated ? (
            <div className="space-y-2">
              <div className="rounded-lg bg-sidebar-accent/50 p-3">
                <p className="text-xs text-sidebar-foreground/70">{user?.name}</p>
                <Badge className="bg-primary/20 text-sidebar-primary text-[10px] mt-1 capitalize">{user?.role}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
                onClick={() => { logout(); navigate("/"); }}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="h-4 w-4 mr-2" /> Sign In
            </Button>
          )
        )}

        {!collapsed && (
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/70">Current Plan</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="bg-primary/20 text-sidebar-primary text-[10px]">{plan.name}</Badge>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{subscription.billing_cycle}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
