import { useEffect, useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { wasteBins, WasteBin } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, Truck, CheckCircle2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PickupRequest {
  bin: WasteBin;
  triggeredAt: string;
  status: "pending" | "dispatched" | "completed";
}

const DYNAMIC_THRESHOLD = 85;

export function DynamicCollectionAlerts() {
  const { features, subscription } = useSubscription();
  const navigate = useNavigate();
  const hasDynamic = features.dynamicCollection;

  const eligibleBins = wasteBins.filter((b) => b.fillLevel >= DYNAMIC_THRESHOLD);

  const [requests, setRequests] = useState<PickupRequest[]>([]);

  // Auto-trigger pickup requests for bins at 85%+
  useEffect(() => {
    if (!hasDynamic) return;
    const newRequests = eligibleBins
      .filter((bin) => !requests.some((r) => r.bin.id === bin.id))
      .map((bin) => ({
        bin,
        triggeredAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
        status: "pending" as const,
      }));

    if (newRequests.length > 0) {
      setRequests((prev) => [...prev, ...newRequests]);
      newRequests.forEach((r) => {
        toast.info(`Dynamic Collection triggered for ${r.bin.location}`, {
          description: `Fill level at ${r.bin.fillLevel}% — Pickup request created`,
          icon: <Zap className="h-4 w-4" />,
        });
      });
    }
  }, [hasDynamic]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDispatch = (binId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.bin.id === binId ? { ...r, status: "dispatched" } : r))
    );
    toast.success("Driver dispatched!", { description: `Pickup en route for ${binId}` });
  };

  if (!hasDynamic) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">Dynamic Collection</p>
              <p className="text-xs text-muted-foreground">
                Auto-trigger pickups when bins hit {DYNAMIC_THRESHOLD}% — available on Pro & Enterprise
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
            Upgrade
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">Dynamic Collection Active</p>
            <p className="text-xs text-muted-foreground">
              No bins above {DYNAMIC_THRESHOLD}% threshold — all clear
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-warning" />
          Dynamic Collection Alerts
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {requests.filter((r) => r.status === "pending").length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.bin.id}
            className="flex items-center justify-between rounded-lg border bg-card p-3"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-4 w-4 ${req.status === "dispatched" ? "text-success" : "text-destructive"}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">{req.bin.location}</p>
                <p className="text-[10px] text-muted-foreground">
                  {req.bin.id} · {req.bin.fillLevel}% full · Triggered at {req.triggeredAt}
                </p>
              </div>
            </div>
            {req.status === "pending" ? (
              <Button
                size="sm"
                variant="default"
                className="text-xs h-7"
                onClick={() => handleDispatch(req.bin.id)}
              >
                <Truck className="mr-1 h-3 w-3" />
                Dispatch
              </Button>
            ) : (
              <Badge className="bg-success/10 text-success border-success/30 text-[10px]">
                <Truck className="mr-1 h-3 w-3" />
                Dispatched
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
