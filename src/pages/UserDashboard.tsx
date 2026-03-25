import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Leaf, Bell, Star, Truck, Calendar,
  CheckCircle, Package, TrendingUp, Award, Recycle,
  MapPin, Clock, ChevronRight, Zap, TriangleAlert
} from "lucide-react";
import { toast } from "sonner";
import { wasteBins, getBinStatus } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { BinStatusBadge } from "@/components/BinStatusBadge";

const mockPickupHistory = [
  { id: "p1", date: "Mar 20, 2026", type: "General Waste", status: "completed" as const, ecoPoints: 20, driver: "Ibrahim M." },
  { id: "p2", date: "Mar 15, 2026", type: "Recyclables", status: "completed" as const, ecoPoints: 35, driver: "Chukwu O." },
  { id: "p3", date: "Mar 10, 2026", type: "Organic Waste", status: "completed" as const, ecoPoints: 25, driver: "Musa A." },
  { id: "p4", date: "Mar 25, 2026", type: "E-Waste", status: "scheduled" as const, ecoPoints: 0, driver: "—" },
];

const mockNotifications = [
  { id: "n1", message: "Your pickup is on the way!", time: "2 min ago", read: false, type: "pickup" },
  { id: "n2", message: "You earned 20 eco points!", time: "1 hour ago", read: false, type: "points" },
  { id: "n3", message: "Weekly eco report is ready", time: "1 day ago", read: true, type: "info" },
];

const wasteTypes = [
  { id: "general", label: "General", icon: Package, color: "bg-muted" },
  { id: "recycling", label: "Recycling", icon: Recycle, color: "bg-primary/10" },
  { id: "organic", label: "Organic", icon: Leaf, color: "bg-success/10" },
  { id: "ewaste", label: "E-Waste", icon: Zap, color: "bg-warning/10" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState("general");
  const [requesting, setRequesting] = useState(false);

  const ecoPoints = 280;
  const nextReward = 500;
  const nearbyBins = wasteBins.slice(0, 3);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleRequestPickup = async () => {
    setRequesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRequesting(false);
    toast.success("Pickup request submitted!", {
      description: `A driver will be assigned for your ${selectedWasteType} pickup shortly.`,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            data-testid="button-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          {showNotifications && (
            <Card className="absolute right-0 top-12 w-72 z-50 shadow-xl border">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 p-3 pt-0">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-lg text-xs ${n.read ? "bg-muted/50" : "bg-primary/5 border border-primary/10"}`}
                  >
                    <p className="font-medium text-foreground">{n.message}</p>
                    <p className="text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Eco Points Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/30 to-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Leaf className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Eco Points</p>
                <p className="text-4xl font-bold text-foreground leading-none mt-1">{ecoPoints}</p>
                <p className="text-xs text-muted-foreground mt-1">{nextReward - ecoPoints} pts to next reward</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge className="bg-primary/20 text-primary border-0 block">
                <Star className="h-3 w-3 mr-1 inline" /> Green Hero
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => navigate("/eco-points")}
                data-testid="button-view-rewards"
              >
                View Rewards
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={(ecoPoints / nextReward) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Request Pickup */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Request a Pickup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {wasteTypes.map((wt) => (
              <button
                key={wt.id}
                data-testid={`button-waste-${wt.id}`}
                onClick={() => setSelectedWasteType(wt.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedWasteType === wt.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`h-9 w-9 rounded-lg ${wt.color} flex items-center justify-center`}>
                  <wt.icon className="h-4 w-4 text-foreground" />
                </div>
                <span className="text-[11px] font-medium text-foreground">{wt.label}</span>
              </button>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold shadow"
            onClick={handleRequestPickup}
            disabled={requesting}
            data-testid="button-request-pickup"
          >
            {requesting ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" /> Requesting…</>
            ) : (
              <><Truck className="h-5 w-5 mr-2" /> Request Pickup</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Pickups", value: "12", icon: Package, color: "text-primary" },
          { label: "Waste Recycled", value: "45kg", icon: Recycle, color: "text-success" },
          { label: "CO₂ Saved", value: "18kg", icon: Leaf, color: "text-primary" },
          { label: "Rewards Earned", value: "3", icon: Award, color: "text-warning" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pickup History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Pickup History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockPickupHistory.map((pickup) => (
              <div
                key={pickup.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40"
                data-testid={`card-pickup-${pickup.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${pickup.status === "completed" ? "bg-success/10" : "bg-warning/10"}`}>
                    {pickup.status === "completed"
                      ? <CheckCircle className="h-4 w-4 text-success" />
                      : <Calendar className="h-4 w-4 text-warning" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{pickup.type}</p>
                    <p className="text-[10px] text-muted-foreground">{pickup.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${pickup.status === "completed" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}`}
                  >
                    {pickup.status}
                  </Badge>
                  {pickup.ecoPoints > 0 && (
                    <p className="text-[10px] text-primary mt-0.5 font-medium">+{pickup.ecoPoints} pts</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Nearby Bins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Nearby Bins
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7 px-2"
                onClick={() => navigate("/map")}
                data-testid="button-view-map"
              >
                View Map <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nearbyBins.map((bin) => {
              const status = getBinStatus(bin.fillLevel);
              return (
                <div
                  key={bin.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20"
                  data-testid={`card-bin-${bin.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${status === "green" ? "bg-success" : status === "yellow" ? "bg-warning" : "bg-destructive"}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{bin.location}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{bin.type}</p>
                    </div>
                  </div>
                  <BinStatusBadge fillLevel={bin.fillLevel} size="sm" />
                </div>
              );
            })}
            {wasteBins.some((b) => getBinStatus(b.fillLevel) === "red") && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Some bins in your area need urgent pickup</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
