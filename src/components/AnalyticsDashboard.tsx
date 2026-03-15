import { analyticsData } from "@/data/mockData";
import { StatCard } from "./StatCard";
import { Trash2, Recycle, Leaf, TruckIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">Waste collection performance metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Collected"
          value={`${analyticsData.totalTonnage}t`}
          subtitle="This month"
          icon={Trash2}
          trend={{ value: 8.2, label: "vs last month" }}
          variant="default"
        />
        <StatCard
          title="Recycling Rate"
          value={`${analyticsData.recyclingRate}%`}
          subtitle={`Goal: ${analyticsData.recyclingGoal}%`}
          icon={Recycle}
          trend={{ value: 3.1, label: "improvement" }}
          variant="primary"
        />
        <StatCard
          title="CO₂ Saved"
          value={`${analyticsData.co2Saved}t`}
          subtitle="Via route optimization"
          icon={Leaf}
          trend={{ value: 12.4, label: "vs baseline" }}
          variant="success"
        />
        <StatCard
          title="Active Drivers"
          value={analyticsData.activeDrivers}
          subtitle={`${analyticsData.binsServiced} bins serviced`}
          icon={TruckIcon}
          variant="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Weekly Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData.weeklyTonnage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="tonnage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total (t)" />
                <Bar dataKey="recycling" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Recycling (t)" />
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
                  data={analyticsData.fillDistribution}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {analyticsData.fillDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
