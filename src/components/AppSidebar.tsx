import {
  Map, Truck, BarChart3, Leaf, Shield,
  FileCheck, LogOut, LayoutDashboard,
  Navigation, Wallet, Users, Award, FileText, CreditCard, Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
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

const userNavGroups = [
  {
    label: "My Space",
    items: [
      { title: "My Dashboard", url: "/user-dashboard", icon: LayoutDashboard },
      { title: "Eco Points", url: "/eco-points", icon: Award },
    ],
  },
  {
    label: "Services",
    items: [
      { title: "Bin Map", url: "/map", icon: Map },
      { title: "Reports", url: "/reports", icon: FileText },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Pricing", url: "/pricing", icon: Sparkles },
      { title: "Billing", url: "/billing", icon: CreditCard },
    ],
  },
];

const driverNavGroups = [
  {
    label: "My Work",
    items: [
      { title: "My Tasks", url: "/driver", icon: Truck },
      { title: "Route Map", url: "/map", icon: Navigation },
    ],
  },
  {
    label: "Driver",
    items: [
      { title: "Earnings & Stats", url: "/analytics", icon: Wallet },
      { title: "KYC Verification", url: "/driver/kyc", icon: FileCheck },
    ],
  },
];

const adminNavGroups = [
  {
    label: "System",
    items: [
      { title: "Admin Dashboard", url: "/admin", icon: Shield },
      { title: "Bin Map", url: "/map", icon: Map },
      { title: "System Analytics", url: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Users & Drivers", url: "/admin", icon: Users },
    ],
  },
];

const roleBadgeStyle: Record<string, string> = {
  user: "bg-primary/20 text-sidebar-primary",
  driver: "bg-warning/20 text-warning",
  admin: "bg-destructive/20 text-destructive",
};

const roleLabel: Record<string, string> = {
  user: "User",
  driver: "Driver",
  admin: "Admin",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { user, isAuthenticated, logout } = useAuth();
  const plan = PLAN_CONFIG[subscription.plan_type];

  const navGroups =
    user?.role === "admin"
      ? adminNavGroups
      : user?.role === "driver"
      ? driverNavGroups
      : userNavGroups;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent shrink-0">
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
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin" || item.url === "/"}
                        className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {!collapsed && isAuthenticated && (
          <div className="space-y-2">
            <div className="rounded-lg bg-sidebar-accent/50 p-3 space-y-1">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">{user?.email}</p>
              <Badge className={`${roleBadgeStyle[user?.role ?? "user"]} border-0 text-[10px] mt-1`}>
                {roleLabel[user?.role ?? "user"]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground justify-start"
              onClick={() => { logout(); navigate("/auth"); }}
              data-testid="button-signout"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        )}

        {collapsed && isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => { logout(); navigate("/auth"); }}
            data-testid="button-signout-collapsed"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}

        {!collapsed && user?.role === "user" && (
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/70">Current Plan</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="bg-primary/20 text-sidebar-primary text-[10px] border-0">{plan.name}</Badge>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{subscription.billing_cycle}</span>
            </div>
          </div>
        )}
        {!collapsed && user?.role === "admin" && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <p className="text-xs text-sidebar-foreground/70">Access Level</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="bg-destructive/20 text-destructive text-[10px] border-0">Full Access</Badge>
            </div>
          </div>
        )}
        {!collapsed && user?.role === "driver" && (
          <div className="rounded-lg bg-warning/10 p-3">
            <p className="text-xs text-sidebar-foreground/70">Driver Status</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="bg-warning/20 text-warning text-[10px] border-0">Active Driver</Badge>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
