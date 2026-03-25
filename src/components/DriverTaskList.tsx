import { useState } from "react";
import { driverTasks, driverWeeklyEarnings, type DriverTask } from "@/data/mockData";
import { BinStatusBadge } from "./BinStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle2, Circle, Clock, MapPin, Truck, Banknote,
  TrendingUp, Navigation, Flame, Star
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const RATE_PER_KM = 120;
const SHIFT_KM = 34.2;

export function DriverTaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DriverTask[]>(driverTasks);
  const [shiftActive, setShiftActive] = useState(true);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, completed: !t.completed };
        if (next.completed) {
          toast.success(`Pickup complete — +₦${next.earning.toLocaleString()} earned`, {
            description: next.location,
          });
        }
        return next;
      })
    );
  };

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const todayEarnings = completedTasks.reduce((sum, t) => sum + t.earning, 0);
  const totalPossible = tasks.reduce((sum, t) => sum + t.earning, 0);

  const priorityColor: Record<string, string> = {
    high: "bg-destructive/10 text-destructive border-destructive/30",
    medium: "bg-warning/10 text-warning border-warning/30",
    low: "bg-success/10 text-success border-success/30",
  };

  const wasteTypeLabel: Record<string, string> = {
    general: "General",
    recycling: "Recycling",
    organic: "Organic",
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(" ")[0] || "Driver"} 🚛
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button
          variant={shiftActive ? "default" : "outline"}
          size="sm"
          data-testid="button-shift-toggle"
          onClick={() => {
            setShiftActive(!shiftActive);
            toast(shiftActive ? "Shift ended. Great work!" : "Shift started. Stay safe!", {
              icon: shiftActive ? "🏁" : "🚛",
            });
          }}
          className={shiftActive ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
        >
          {shiftActive ? (
            <><span className="h-2 w-2 rounded-full bg-success-foreground animate-pulse mr-2 inline-block" />On Shift</>
          ) : (
            "Start Shift"
          )}
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Today's Earnings",
            value: `₦${todayEarnings.toLocaleString()}`,
            sub: `of ₦${totalPossible.toLocaleString()} possible`,
            icon: Banknote,
            color: "text-success",
          },
          {
            label: "Pickups Done",
            value: `${completedTasks.length}/${tasks.length}`,
            sub: `${pendingTasks.length} remaining`,
            icon: Truck,
            color: "text-primary",
          },
          {
            label: "Distance",
            value: `${SHIFT_KM} km`,
            sub: `₦${RATE_PER_KM}/km rate`,
            icon: Navigation,
            color: "text-primary",
          },
          {
            label: "Performance",
            value: `${Math.round(progress)}%`,
            sub: "route completion",
            icon: TrendingUp,
            color: "text-warning",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
              <p className="text-xl font-bold text-foreground leading-tight">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground/60">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Route Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Route Progress</p>
                <p className="text-xs text-muted-foreground">
                  {completedTasks.length} of {tasks.length} pickups completed today
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono text-primary">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-success font-medium">
              <Star className="h-3.5 w-3.5" />
              All pickups complete — excellent work!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Today's Pickups</h2>
          <Badge variant="outline" className="text-[10px]">
            {pendingTasks.length} pending
          </Badge>
        </div>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <Card
              key={task.id}
              className={cn(
                "transition-all cursor-pointer hover:shadow-md border",
                task.completed && "opacity-55",
                !task.completed && task.priority === "high" && "border-destructive/20"
              )}
              onClick={() => toggleTask(task.id)}
              data-testid={`card-task-${task.id}`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                    <p className={cn("text-sm font-medium text-foreground", task.completed && "line-through text-muted-foreground")}>
                      {task.location}
                    </p>
                    {!task.completed && task.priority === "high" && (
                      <Flame className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {task.binId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {task.estimatedTime}
                    </span>
                    <span className="capitalize">{wasteTypeLabel[task.wasteType] ?? task.wasteType}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <BinStatusBadge fillLevel={task.fillLevel} size="sm" />
                  <Badge variant="outline" className={`text-[9px] px-1.5 ${priorityColor[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  <span className="text-[10px] font-mono text-success font-semibold">
                    ₦{task.earning.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly Earnings Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Weekly Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={driverWeeklyEarnings}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: number) => [`₦${v.toLocaleString()}`, "Earnings"]}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>This week total</span>
            <span className="font-semibold text-foreground font-mono">
              ₦{driverWeeklyEarnings.reduce((s, d) => s + d.amount, 0).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
