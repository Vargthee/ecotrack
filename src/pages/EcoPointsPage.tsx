import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Leaf, Star, Gift, Zap, Trophy, TrendingUp, Recycle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const activityLog = [
  { id: "a1", action: "Completed pickup", points: 20, date: "Today, 2:30 PM" },
  { id: "a2", action: "Recycled e-waste", points: 35, date: "Yesterday, 11:00 AM" },
  { id: "a3", action: "Reported illegal dump", points: 15, date: "Mar 19, 9:45 AM" },
  { id: "a4", action: "Completed pickup", points: 20, date: "Mar 15, 3:15 PM" },
  { id: "a5", action: "Organic composting", points: 25, date: "Mar 10, 10:00 AM" },
];

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

const EcoPointsPage = () => {
  const [currentPoints, setCurrentPoints] = useState(280);
  const nextReward = 500;
  const totalEarned = 680;

  const handleRedeem = (reward: { name: string; cost: number }) => {
    setCurrentPoints((p) => p - reward.cost);
    toast.success(`Redeemed: ${reward.name}`, {
      description: `${reward.cost} eco points used. Benefit applied to your account.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Turn Waste Into Rewards</h1>
        <p className="text-sm text-muted-foreground">Earn points for every eco-friendly action</p>
      </div>

      {/* Points Balance */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <p className="text-5xl font-bold text-foreground">{currentPoints}</p>
            <p className="text-sm text-muted-foreground">Available Points</p>
            <Badge className="bg-primary/20 text-primary border-0">
              <TrendingUp className="h-3 w-3 mr-1" /> {totalEarned} total earned
            </Badge>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{currentPoints} / {nextReward} to next reward</span>
              <span>{Math.round((currentPoints / nextReward) * 100)}%</span>
            </div>
            <Progress value={(currentPoints / nextReward) * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
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
        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your eco-friendly actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityLog.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-0 font-mono">+{activity.points}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rewards */}
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
                  disabled={currentPoints < reward.cost}
                  className="shrink-0"
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
