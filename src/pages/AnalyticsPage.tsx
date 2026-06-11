import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { FeatureGate } from "@/components/FeatureGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import {
  Banknote, Truck, Star, TrendingUp, CheckCircle, Clock,
  Leaf, Recycle, Package, Award, Target, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

type DriverAnalytics = {
  dailyEarnings: { day: string; amount: number; tasks: number }[];
  tasksByWasteType: { name: string; count: number; fill: string }[];
  weeklyTotal: number; weeklyTasks: number;
  completedCount: number; totalCount: number; totalEarnings: number;
};

type UserAnalytics = {
  monthlyStats: { month: string; points: number; pickups: number }[];
  totalPoints: number; totalPickups: number; recyclingPickups: number; co2Offset: number;
};

function DriverAnalytics() {
  const { data, isLoading } = useQuery<DriverAnalytics>({
    queryKey: ["/api/analytics"],
    queryFn: () => apiRequest("GET", "/api/analytics"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Earnings & Performance</h2>
          <p className="text-sm text-muted-foreground">Your personal driver stats and earnings breakdown</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  const avgPerTask = data.weeklyTasks > 0 ? Math.round(data.weeklyTotal / data.weeklyTasks) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Earnings & Performance</h2>
        <p className="text-sm text-muted-foreground">Your personal driver stats and earnings breakdown</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="This Week's Earnings"
          value={`₦${data.weeklyTotal.toLocaleString()}`}
          subtitle="7-day total"
          icon={Banknote}
          variant="primary"
        />
        <StatCard
          title="Tasks This Week"
          value={String(data.weeklyTasks)}
          subtitle="Completed"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Average Per Task"
          value={`₦${avgPerTask.toLocaleString()}`}
          subtitle="Earnings per pickup"
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="All-Time Tasks"
          value={String(data.completedCount)}
          subtitle={`of ${data.totalCount} assigned`}
          icon={Truck}
          variant="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Weekly Earnings (last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.dailyEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [`₦${v.toLocaleString()}`, "Earnings"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Earnings (₦)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Waste Types Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.tasksByWasteType.filter(t => t.count > 0)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={48} stroke="hsl(var(--card))" strokeWidth={2}>
                  {data.tasksByWasteType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Earnings", value: `₦${data.totalEarnings.toLocaleString()}`, icon: Banknote, color: "text-success", sub: "all time" },
          { label: "Completed Tasks", value: String(data.completedCount), icon: CheckCircle, color: "text-primary", sub: "verified collections" },
          { label: "Completion Rate", value: data.totalCount > 0 ? `${Math.round((data.completedCount / data.totalCount) * 100)}%` : "—", icon: Target, color: "text-warning", sub: "of assigned tasks" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{stat.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UserAnalytics() {
  const { data, isLoading } = useQuery<UserAnalytics>({
    queryKey: ["/api/analytics"],
    queryFn: () => apiRequest("GET", "/api/analytics"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Eco Analytics</h2>
          <p className="text-sm text-muted-foreground">Your personal sustainability impact over time</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Eco Analytics</h2>
        <p className="text-sm text-muted-foreground">Your personal sustainability impact over time</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Eco Points Earned" value={String(data.totalPoints)} subtitle="All time" icon={Award} variant="primary" />
        <StatCard title="Total Pickups" value={String(data.totalPickups)} subtitle="Requests made" icon={Package} variant="success" />
        <StatCard title="Recycling Pickups" value={String(data.recyclingPickups)} subtitle={`of ${data.totalPickups} total`} icon={Recycle} variant="default" />
        <StatCard title="CO₂ Offset" value={`${data.co2Offset}kg`} subtitle="Estimated impact" icon={Leaf} variant="default" />
      </div>

      {data.monthlyStats.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Eco Points Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} name="Eco Points" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly Pickups</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="pickups" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Pickups" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No data yet. Request your first pickup to start tracking!</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Leaf className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Your Environmental Impact</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've diverted an estimated <span className="font-medium text-foreground">{data.co2Offset}kg of CO₂</span> through proper waste disposal — that's real impact for Jos.
              </p>
            </div>
            {data.totalPoints > 200 && <Badge className="bg-success/15 text-success border-success/30 shrink-0 ml-auto">Green Hero</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const AnalyticsPage = () => {
  const { user } = useAuth();

  if (user?.role === "admin") return <AnalyticsDashboard />;
  if (user?.role === "driver") return <DriverAnalytics />;

  return (
    <FeatureGate requiredTier="pro" featureLabel="Personal Analytics">
      <UserAnalytics />
    </FeatureGate>
  );
};

export default AnalyticsPage;
