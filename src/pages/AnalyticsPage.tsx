import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { FeatureGate } from "@/components/FeatureGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import {
  Banknote, Truck, Star, TrendingUp, CheckCircle, Clock,
  Leaf, Recycle, Package, Award, BarChart3, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

const weeklyEarnings = [
  { day: "Mon", amount: 4200, tasks: 5 },
  { day: "Tue", amount: 5600, tasks: 7 },
  { day: "Wed", amount: 3600, tasks: 4 },
  { day: "Thu", amount: 6000, tasks: 8 },
  { day: "Fri", amount: 4800, tasks: 6 },
  { day: "Sat", amount: 2600, tasks: 3 },
  { day: "Sun", amount: 0, tasks: 0 },
];

const monthlyEarnings = [
  { month: "Jan", amount: 82000 },
  { month: "Feb", amount: 97000 },
  { month: "Mar", amount: 88500 },
  { month: "Apr", amount: 112000 },
];

const wasteTypeBreakdown = [
  { name: "General", count: 42, fill: "hsl(var(--primary))" },
  { name: "Recycling", count: 18, fill: "hsl(var(--success))" },
  { name: "Organic", count: 12, fill: "hsl(var(--warning))" },
  { name: "E-Waste", count: 5, fill: "hsl(var(--destructive))" },
];

const userEcoData = [
  { month: "Jan", points: 120, pickups: 3 },
  { month: "Feb", points: 240, pickups: 6 },
  { month: "Mar", points: 180, pickups: 5 },
  { month: "Apr", points: 340, pickups: 8 },
];

function DriverAnalytics() {
  const totalWeekly = weeklyEarnings.reduce((s, d) => s + d.amount, 0);
  const totalTasks = weeklyEarnings.reduce((s, d) => s + d.tasks, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Earnings & Performance</h2>
        <p className="text-sm text-muted-foreground">Your personal driver stats and earnings breakdown</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="This Week's Earnings"
          value={`₦${totalWeekly.toLocaleString()}`}
          subtitle="7-day total"
          icon={Banknote}
          trend={{ value: 12.3, label: "vs last week" }}
          variant="primary"
        />
        <StatCard
          title="Tasks Completed"
          value={String(totalTasks)}
          subtitle="This week"
          icon={CheckCircle}
          trend={{ value: 8.1, label: "vs last week" }}
          variant="success"
        />
        <StatCard
          title="Average Per Task"
          value={`₦${Math.round(totalWeekly / Math.max(totalTasks, 1)).toLocaleString()}`}
          subtitle="Earnings per pickup"
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="Rating"
          value="4.9"
          subtitle="Based on 77 reviews"
          icon={Star}
          variant="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Weekly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
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
                <Pie data={wasteTypeBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={48} stroke="hsl(var(--card))" strokeWidth={2}>
                  {wasteTypeBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Earnings Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyEarnings}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => [`₦${v.toLocaleString()}`, "Earnings"]}
              />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--success))" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Acceptance Rate", value: "94%", icon: Target, color: "text-success", sub: "of all offered jobs" },
          { label: "On-Time Rate", value: "98%", icon: Clock, color: "text-primary", sub: "pickups completed on time" },
          { label: "Total Pickups (All Time)", value: "347", icon: Truck, color: "text-warning", sub: "since joining" },
        ].map((stat) => (
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Eco Analytics</h2>
        <p className="text-sm text-muted-foreground">Your personal sustainability impact over time</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Eco Points Earned" value="880" subtitle="All time" icon={Award} trend={{ value: 18.2, label: "vs last month" }} variant="primary" />
        <StatCard title="Total Pickups" value="22" subtitle="Requests made" icon={Package} trend={{ value: 4.0, label: "vs last month" }} variant="success" />
        <StatCard title="Recycling Pickups" value="9" subtitle="Out of 22 total" icon={Recycle} variant="default" />
        <StatCard title="CO₂ Offset" value="14kg" subtitle="Estimated impact" icon={Leaf} variant="default" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Eco Points Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={userEcoData}>
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
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userEcoData}>
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

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Leaf className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Your Impact This Month</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've diverted an estimated <span className="font-medium text-foreground">14kg of CO₂</span> through proper waste disposal and recycling — equivalent to planting 1 tree.
              </p>
            </div>
            <Badge className="bg-success/15 text-success border-success/30 shrink-0 ml-auto">Green Hero</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const AnalyticsPage = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AnalyticsDashboard />;
  }

  if (user?.role === "driver") {
    return <DriverAnalytics />;
  }

  return (
    <FeatureGate requiredTier="pro" featureLabel="Personal Analytics">
      <UserAnalytics />
    </FeatureGate>
  );
};

export default AnalyticsPage;
