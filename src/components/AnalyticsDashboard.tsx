import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StatCard } from "./StatCard";
import { Trash2, Recycle, Leaf, TruckIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

type AdminAnalytics = {
  weeklyCollections: { day: string; pickups: number; completed: number }[];
  binFillDistribution: { level: string; count: number; fill: string }[];
  tasksByWasteType: { name: string; count: number; fill: string }[];
  summary: { completedTasks: number; recyclingRate: number; activeDrivers: number; totalBins: number; co2Saved: number; binsServiced: number };
};

export function AnalyticsDashboard() {
  const { data, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/analytics"],
    queryFn: () => apiRequest("GET", "/api/analytics"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Waste collection performance metrics</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const { summary, weeklyCollections, binFillDistribution, tasksByWasteType } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">Waste collection performance metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks Completed"
          value={summary.completedTasks}
          subtitle="All time"
          icon={Trash2}
          variant="default"
        />
        <StatCard
          title="Recycling Rate"
          value={`${summary.recyclingRate}%`}
          subtitle="of completed tasks"
          icon={Recycle}
          trend={{ value: summary.recyclingRate, label: "recycling share" }}
          variant="primary"
        />
        <StatCard
          title="CO₂ Saved"
          value={`${summary.co2Saved}t`}
          subtitle="Via proper disposal"
          icon={Leaf}
          variant="success"
        />
        <StatCard
          title="Active Drivers"
          value={summary.activeDrivers}
          subtitle={`${summary.totalBins} bins monitored`}
          icon={TruckIcon}
          variant="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Weekly Pickups (last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyCollections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="pickups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Pickups" />
                <Bar dataKey="completed" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Bin Fill Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={binFillDistribution}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {binFillDistribution.map((entry, i) => (
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
            Completed Tasks by Waste Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tasksByWasteType} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={80} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tasks">
                {tasksByWasteType.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
