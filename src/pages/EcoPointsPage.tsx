import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Leaf, Star, Gift, Zap, Trophy, TrendingUp, Recycle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const rewards = [
  { id: "r1", name: "Free Pickup", cost: 500, icon: Recycle, description: "Redeem for one free pickup" },
  { id: "r2", name: "10% Discount", cost: 300, icon: Gift, description: "10% off your next subscription" },
  { id: "r3", name: "Eco Warrior Badge", cost: 200, icon: ShieldCheck, description: "Exclusive profile badge" },
  { id: "r4", name: "Priority Service", cost: 800, icon: Zap, description: "Priority driver assignment for 1 week" },
];

const badges = [
  { name: "Green Starter", earned: true, icon: Leaf },
  { name: "Recycler Pro", earned: true, icon: Recycle },
  { name: "Eco Hero", earned: false, icon: Trophy },
  { name: "Planet Saver", earned: false, icon: Star },
];

type PointsData = { balance: number; log: { id: number; action: string; points: number; createdAt: string }[] };

const EcoPointsPage = () => {
  const { data, isLoading } = useQuery<PointsData>({
    queryKey: ["/api/eco-points"],
  });

  const currentPoints = data?.balance ?? 0;
  const totalEarned = data?.log.reduce((s, e) => s + (e.points > 0 ? e.points : 0), 0) ?? 0;
  const nextReward = 500;

  const redeemMutation = useMutation({
    mutationFn: ({ rewardName, cost }: { rewardName: string; cost: number }) =>
      apiRequest("POST", "/api/eco-points/redeem", { rewardName, cost }),
    onSuccess: (_data, vars) => {
      toast.success(`Redeemed: ${vars.rewardName}`, {
        description: `${vars.cost} eco points used. Benefit applied to your account.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/eco-points"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Redemption failed");
    },
  });

  const handleRedeem = (reward: { name: string; cost: number }) => {
    redeemMutation.mutate({ rewardName: reward.name, cost: reward.cost });
  };

  function formatDate(str: string) {
    try {
      return format(new Date(str), "MMM d, h:mm a");
    } catch {
      return str;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Turn Waste Into Rewards</h1>
        <p className="text-sm text-muted-foreground">Earn points for every eco-friendly action</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            {isLoading ? (
              <div className="h-12 w-24 mx-auto bg-muted/40 rounded animate-pulse" />
            ) : (
              <p className="text-5xl font-bold text-foreground" data-testid="text-eco-points">{currentPoints}</p>
            )}
            <p className="text-sm text-muted-foreground">Available Points</p>
            <Badge className="bg-primary/20 text-primary border-0">
              <TrendingUp className="h-3 w-3 mr-1" /> {totalEarned} total earned
            </Badge>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{currentPoints} / {nextReward} to next reward</span>
              <span>{Math.min(Math.round((currentPoints / nextReward) * 100), 100)}%</span>
            </div>
            <Progress value={Math.min((currentPoints / nextReward) * 100, 100)} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {badges.map((badge) => (
            <Card key={badge.name} className={badge.earned ? "border-primary/30" : "opacity-50"}>
              <CardContent className="p-4 text-center">
                <badge.icon className={`h-8 w-8 mx-auto mb-2 ${badge.earned ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-xs font-medium text-foreground">{badge.name}</p>
                {badge.earned && <Badge variant="outline" className="text-[10px] mt-1 bg-success/10 text-success border-success/30">Earned</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your eco-friendly actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-muted/40 animate-pulse" />)}
              </div>
            ) : data?.log.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet — request a pickup to earn points!</p>
            ) : (
              data?.log.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                  </div>
                  <Badge className={entry.points >= 0 ? "bg-primary/10 text-primary border-0 font-mono" : "bg-destructive/10 text-destructive border-0 font-mono"}>
                    {entry.points >= 0 ? "+" : ""}{entry.points}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Redeem Rewards</CardTitle>
            <CardDescription>Spend your eco points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <reward.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{reward.name}</p>
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                </div>
                <Button
                  size="sm"
                  variant={currentPoints >= reward.cost ? "default" : "outline"}
                  disabled={currentPoints < reward.cost || redeemMutation.isPending}
                  className="shrink-0"
                  data-testid={`button-redeem-${reward.id}`}
                  onClick={() => handleRedeem(reward)}
                >
                  {reward.cost} pts
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EcoPointsPage;
