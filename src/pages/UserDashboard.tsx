import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Leaf, MapPin, Clock, Bell, Star, Truck, Calendar,
  CheckCircle, Package, TrendingUp, Award, LogOut
} from "lucide-react";
import { toast } from "sonner";

const mockPickupHistory = [
  { id: "p1", date: "2026-03-20", type: "General Waste", status: "completed" as const, ecoPoints: 20 },
  { id: "p2", date: "2026-03-15", type: "Recyclables", status: "completed" as const, ecoPoints: 35 },
  { id: "p3", date: "2026-03-10", type: "Organic", status: "completed" as const, ecoPoints: 25 },
  { id: "p4", date: "2026-03-22", type: "E-Waste", status: "scheduled" as const, ecoPoints: 0 },
];

const mockNotifications = [
  { id: "n1", message: "Your pickup is on the way!", time: "2 min ago", read: false },
  { id: "n2", message: "You earned 20 eco points!", time: "1 hour ago", read: false },
  { id: "n3", message: "Weekly report is ready", time: "1 day ago", read: true },
];

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const ecoPoints = 280;
  const nextReward = 500;

  const handleRequestPickup = () => {
    toast.success("Pickup request submitted! A driver will be assigned shortly.", {
      description: "You'll receive a notification when a driver is on the way.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.name?.split(" ")[0] || "User"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">Manage your waste pickups and earn rewards</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="outline" size="icon" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="h-4 w-4" />
            </Button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {mockNotifications.filter((n) => !n.read).length}
            </span>
            {showNotifications && (
              <Card className="absolute right-0 top-12 w-72 z-50 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  {mockNotifications.map((n) => (
                    <div key={n.id} className={`p-2 rounded-lg text-xs ${n.read ? "bg-muted/50" : "bg-primary/5 border border-primary/10"}`}>
                      <p className="font-medium text-foreground">{n.message}</p>
                      <p className="text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Eco Points Highlight */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/30 to-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eco Points</p>
                <p className="text-3xl font-bold text-foreground">{ecoPoints}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-primary/20 text-primary border-0">
                <Star className="h-3 w-3 mr-1" /> Green Hero
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{ecoPoints} / {nextReward} to next reward</span>
              <span>{Math.round((ecoPoints / nextReward) * 100)}%</span>
            </div>
            <Progress value={(ecoPoints / nextReward) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <Button size="lg" className="w-full text-lg h-14 shadow-lg" onClick={handleRequestPickup}>
        <Truck className="h-5 w-5 mr-2" /> Request Pickup
      </Button>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Total Pickups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">45kg</p>
            <p className="text-xs text-muted-foreground">Waste Recycled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">3</p>
            <p className="text-xs text-muted-foreground">Rewards Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Leaf className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">18kg</p>
            <p className="text-xs text-muted-foreground">CO₂ Saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Pickup History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Pickup History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockPickupHistory.map((pickup) => (
            <div key={pickup.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${pickup.status === "completed" ? "bg-success/10" : "bg-warning/10"}`}>
                  {pickup.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Calendar className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{pickup.type}</p>
                  <p className="text-xs text-muted-foreground">{pickup.date}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={pickup.status === "completed" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}>
                  {pickup.status}
                </Badge>
                {pickup.ecoPoints > 0 && (
                  <p className="text-xs text-primary mt-1">+{pickup.ecoPoints} pts</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
