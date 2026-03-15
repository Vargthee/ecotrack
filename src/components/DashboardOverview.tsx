import { wasteBins, analyticsData, driverTasks, getBinStatus } from "@/data/mockData";
import { StatCard } from "./StatCard";
import { BinStatusBadge } from "./BinStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Recycle, Leaf, AlertTriangle, TruckIcon, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function DashboardOverview() {
  const criticalBins = wasteBins.filter((b) => getBinStatus(b.fillLevel) === "red");
  const pendingTasks = driverTasks.filter((t) => !t.completed);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of city waste management — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Collected" value={`${analyticsData.totalTonnage}t`} subtitle="This month" icon={Trash2} trend={{ value: 8.2, label: "vs last month" }} />
        <StatCard title="Recycling Rate" value={`${analyticsData.recyclingRate}%`} subtitle={`Goal: ${analyticsData.recyclingGoal}%`} icon={Recycle} variant="primary" trend={{ value: 3.1, label: "improvement" }} />
        <StatCard title="CO₂ Saved" value={`${analyticsData.co2Saved}t`} subtitle="Route optimization" icon={Leaf} variant="success" trend={{ value: 12.4, label: "vs baseline" }} />
        <StatCard title="Critical Bins" value={criticalBins.length} subtitle="Need immediate pickup" icon={AlertTriangle} variant={criticalBins.length > 3 ? "destructive" : "warning"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Mini chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              This Week's Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analyticsData.weeklyTonnage}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="tonnage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Critical bins */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse-slow" />
              Critical Bins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalBins.map((bin) => (
              <div key={bin.id} className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">{bin.location}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    {bin.id} · {bin.type}
                  </p>
                </div>
                <BinStatusBadge fillLevel={bin.fillLevel} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
