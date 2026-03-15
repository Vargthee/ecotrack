import { useState } from "react";
import { driverTasks, type DriverTask } from "@/data/mockData";
import { BinStatusBadge } from "./BinStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export function DriverTaskList() {
  const [tasks, setTasks] = useState<DriverTask[]>(driverTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Driver Tasks</h2>
        <p className="text-sm text-muted-foreground">Today's optimized collection route</p>
      </div>

      {/* Progress header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Route Progress</p>
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {tasks.length} pickups completed
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold font-mono text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Task list */}
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <Card
            key={task.id}
            className={cn(
              "transition-all cursor-pointer hover:shadow-md",
              task.completed && "opacity-60"
            )}
            onClick={() => toggleTask(task.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <button className="flex-shrink-0">
                {task.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <p className={cn("text-sm font-medium text-foreground", task.completed && "line-through")}>
                    {task.location}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {task.binId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.estimatedTime}
                  </span>
                </div>
              </div>

              <BinStatusBadge fillLevel={task.fillLevel} size="sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
