import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Leaf, Bell, Star, Truck, Calendar,
  CheckCircle, Package, TrendingUp, Award, Recycle,
  MapPin, Clock, ChevronRight, Zap, TriangleAlert
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BinStatusBadge } from "@/components/BinStatusBadge";
import { PickupTrackerCard } from "@/components/PickupTrackerCard";

type Bin = { id: string; location: string; fillLevel: number; type: string };
type Pickup = { id: number; wasteType: string; status: string; createdAt: string };
type PointsData = { balance: number; log: { id: number; action: string; points: number }[] };


const wasteTypes = [
  { id: "general", label: "General", icon: Package, color: "bg-muted" },
  { id: "recycling", label: "Recycling", icon: Recycle, color: "bg-primary/10" },
  { id: "organic", label: "Organic", icon: Leaf, color: "bg-success/10" },
  { id: "ewaste", label: "E-Waste", icon: Zap, color: "bg-warning/10" },
];

function getBinStatus(fillLevel: number) {
  if (fillLevel >= 80) return "red";
  if (fillLevel >= 50) return "yellow";
  return "green";
}

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
  const [trackedPickup, setTrackedPickup] = useState<{ id: number; wasteType: string } | null>(null);

  const { data: binsData = [], isLoading: binsLoading } = useQuery<Bin[]>({ queryKey: ["/api/bins"] });
  const { data: pickupsData = [], isLoading: pickupsLoading } = useQuery<Pickup[]>({ queryKey: ["/api/pickups"] });
  const { data: pointsData, isLoading: pointsLoading } = useQuery<PointsData>({ queryKey: ["/api/eco-points"] });

  const ecoPoints = pointsData?.balance ?? 0;
  const nextReward = 500;
  const nearbyBins = binsData.slice(0, 3);

  const notifications = [
    ...pickupsData
      .filter((p) => p.status === "in_progress" || p.status === "assigned")
      .map((p) => ({
        id: `pickup-${p.id}`,
        message: p.status === "in_progress" ? "Your pickup is in progress!" : "A driver has been assigned to your pickup.",
        time: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        read: false,
      })),
    ...(pointsData?.log.slice(0, 2) ?? []).map((entry) => ({
      id: `points-${entry.id}`,
      message: `+${entry.points} pts — ${entry.action}`,
      time: "",
      read: true,
    })),
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const pickupMutation = useMutation({
    mutationFn: () => apiRequest<{ id: number; wasteType: string }>("POST", "/api/pickups", { wasteType: selectedWasteType }),
    onSuccess: (pickup) => {
      toast.success("Pickup request submitted! +10 eco points", {
        description: `A driver will be assigned for your ${selectedWasteType} pickup shortly.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pickups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eco-points"] });
      setTrackedPickup({ id: pickup.id, wasteType: pickup.wasteType ?? selectedWasteType });
    },
    onError: () => toast.error("Failed to submit pickup request"),
  });

  const completedPickups = pickupsData.filter((p) => p.status === "completed");
  const pendingPickups = pickupsData.filter((p) => p.status === "pending");

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
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-2.5 rounded-lg text-xs ${n.read ? "bg-muted/50" : "bg-primary/5 border border-primary/10"}`}>
                      <p className="font-medium text-foreground">{n.message}</p>
                      {n.time && <p className="text-muted-foreground mt-0.5">{n.time}</p>}
                    </div>
                  ))
                )}
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
                {pointsLoading ? (
                  <Skeleton className="h-10 w-20 mt-1" />
                ) : (
                  <p className="text-4xl font-bold text-foreground leading-none mt-1" data-testid="text-dashboard-points">{ecoPoints}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{Math.max(nextReward - ecoPoints, 0)} pts to next reward</p>
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
            <Progress value={Math.min((ecoPoints / nextReward) * 100, 100)} className="h-2" />
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
            onClick={() => pickupMutation.mutate()}
            disabled={pickupMutation.isPending}
            data-testid="button-request-pickup"
          >
            {pickupMutation.isPending ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" /> Requesting…</>
            ) : (
              <><Truck className="h-5 w-5 mr-2" /> Request Pickup</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Pickup Tracker - shown after requesting */}
      {trackedPickup && (
        <PickupTrackerCard
          pickupId={trackedPickup.id}
          wasteType={trackedPickup.wasteType}
          onClose={() => setTrackedPickup(null)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pickupsLoading || pointsLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4 text-center"><Skeleton className="h-5 w-5 mx-auto mb-2 rounded" /><Skeleton className="h-7 w-10 mx-auto mb-1" /><Skeleton className="h-3 w-16 mx-auto" /></CardContent></Card>
          ))
        ) : (
          [
            { label: "Total Pickups", value: String(pickupsData.length || 0), icon: Package, color: "text-primary" },
            { label: "Completed", value: String(completedPickups.length || 0), icon: Recycle, color: "text-success" },
            { label: "Eco Points", value: String(ecoPoints), icon: Leaf, color: "text-primary" },
            { label: "Pending", value: String(pendingPickups.length || 0), icon: Award, color: "text-warning" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))
        )}
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
            {pickupsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : pickupsData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pickups yet. Request your first one!</p>
            ) : (
              pickupsData.slice(0, 4).map((pickup) => (
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
                      <p className="text-xs font-medium text-foreground capitalize">{pickup.wasteType}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(pickup.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${pickup.status === "completed" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}`}
                  >
                    {pickup.status}
                  </Badge>
                </div>
              ))
            )}
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
            {binsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : nearbyBins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No bins nearby.</p>
            ) : null}
            {!binsLoading && nearbyBins.map((bin) => {
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
            {binsData.some((b) => getBinStatus(b.fillLevel) === "red") && (
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
