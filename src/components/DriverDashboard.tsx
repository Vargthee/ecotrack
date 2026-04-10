import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BinStatusBadge } from "./BinStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle2, Circle, Clock, MapPin, Truck, Banknote,
  TrendingUp, Navigation, Flame, Star, Package, CheckCheck,
  AlertCircle, Play, Map, CalendarClock, Inbox
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RechartTooltip } from "recharts";
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

const JOS_CENTER: [number, number] = [9.8965, 8.8583];
const DRIVER_START: [number, number] = [9.9050, 8.8950];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const weeklyData = [
  { day: "Mon", amount: 4200 },
  { day: "Tue", amount: 5600 },
  { day: "Wed", amount: 3600 },
  { day: "Thu", amount: 6000 },
  { day: "Fri", amount: 4800 },
  { day: "Sat", amount: 2600 },
];

type Task = {
  id: string; binId: string; location: string; fillLevel: number;
  priority: "high" | "medium" | "low"; completed: boolean;
  estimatedTime: string; wasteType: string; earning: number;
  lat?: number; lng?: number;
};

type Pickup = {
  id: number; userId: number; wasteType: string;
  status: string; driverId?: number; notes?: string;
  address?: string; createdAt: string;
};

type Bin = { id: string; location: string; lat: number; lng: number; fillLevel: number; type: string };

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function createDriverIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#16a34a;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.4)">🚛</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
  });
}

function createPickupIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#2563eb;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">📦</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  });
}

function RouteMap({ tasks, pickups, bins }: { tasks: Task[]; pickups: Pickup[]; bins: Bin[] }) {
  const [driverPos, setDriverPos] = useState<[number, number]>(DRIVER_START);
  const [progress, setProgress] = useState(0);
  const markerRef = useState<L.Marker | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = (p + 0.003) % 1;
        // Driver patrols around Jos center
        const angle = next * Math.PI * 2;
        const lat = JOS_CENTER[0] + Math.sin(angle) * 0.02;
        const lng = JOS_CENTER[1] + Math.cos(angle) * 0.025;
        setDriverPos([lat, lng]);
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Build pending bin positions for route
  const pendingBins = bins.filter((b) => b.fillLevel > 60)
    .sort((a, b) => b.fillLevel - a.fillLevel)
    .slice(0, 6);
  const routePositions: [number, number][] = [
    driverPos,
    ...pendingBins.map((b) => [b.lat, b.lng] as [number, number]),
  ];

  const assignedPickups = pickups.filter((p) => p.status === "assigned" || p.status === "in_progress");

  return (
    <div className="h-[380px] rounded-xl overflow-hidden border relative">
      <MapContainer center={JOS_CENTER} zoom={13} className="h-full w-full z-0" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Route line */}
        {routePositions.length > 1 && (
          <Polyline positions={routePositions} pathOptions={{ color: "#16a34a", weight: 3, dashArray: "8 5", opacity: 0.7 }} />
        )}
        {/* Driver position */}
        <Marker position={driverPos} icon={createDriverIcon()}>
          <Popup><div className="text-xs font-semibold">Your position<br /><span className="text-muted-foreground">Moving to next stop</span></div></Popup>
        </Marker>
        {/* Bin markers */}
        {bins.map((bin) => {
          const fill = bin.fillLevel;
          const color = fill >= 80 ? "#ef4444" : fill >= 50 ? "#eab308" : "#22c55e";
          const isPending = pendingBins.some((b) => b.id === bin.id);
          return (
            <CircleMarker
              key={bin.id}
              center={[bin.lat, bin.lng]}
              radius={isPending ? 12 : 7}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: isPending ? 3 : 1 }}
            >
              <Popup>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{bin.id}</p>
                  <p>{bin.location}</p>
                  <p>Fill: <strong>{bin.fillLevel}%</strong></p>
                  <p className="capitalize">Type: {bin.type}</p>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]}>
                <span className="text-[10px]">{bin.location} — {bin.fillLevel}%</span>
              </Tooltip>
            </CircleMarker>
          );
        })}
        {/* User pickup request markers */}
        {assignedPickups.map((p, i) => {
          const lat = JOS_CENTER[0] + (Math.random() - 0.5) * 0.04;
          const lng = JOS_CENTER[1] + (Math.random() - 0.5) * 0.05;
          return (
            <Marker key={`pickup-${p.id}`} position={[lat, lng]} icon={createPickupIcon()}>
              <Popup>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">Pickup Request #{p.id}</p>
                  <p className="capitalize">{p.wasteType} waste</p>
                  {p.address && <p>{p.address}</p>}
                  <Badge className="text-[9px] mt-1">{p.status}</Badge>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 z-[400] bg-card/90 backdrop-blur-sm rounded-lg p-2 border shadow-sm space-y-1">
        <div className="flex items-center gap-1.5 text-[10px]"><div className="h-2.5 w-2.5 rounded-full bg-destructive" /><span>High fill (&gt;80%)</span></div>
        <div className="flex items-center gap-1.5 text-[10px]"><div className="h-2.5 w-2.5 rounded-full bg-warning" /><span>Med fill (50-80%)</span></div>
        <div className="flex items-center gap-1.5 text-[10px]"><div className="h-2.5 w-2.5 rounded-full bg-success" /><span>Low fill</span></div>
        <div className="flex items-center gap-1.5 text-[10px]"><span className="text-xs">📦</span><span>Pickup request</span></div>
      </div>
    </div>
  );
}

export function DriverDashboard() {
  const { user } = useAuth();
  const [shiftActive, setShiftActive] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: pickups = [], isLoading: pickupsLoading } = useQuery<Pickup[]>({ queryKey: ["/api/pickups"] });
  const { data: bins = [] } = useQuery<Bin[]>({ queryKey: ["/api/bins"] });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/tasks/${id}/complete`),
    onSuccess: (_, id) => {
      const task = tasks.find((t) => t.id === id);
      if (task) toast.success(`✅ Pickup done — +₦${task.earning.toLocaleString()} earned`, { description: task.location });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/tasks/${id}/uncomplete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/pickups/${id}/accept`),
    onSuccess: (_, id) => {
      toast.success("Job accepted! Navigate to the pickup location.", { description: `Pickup request #${id}` });
      queryClient.invalidateQueries({ queryKey: ["/api/pickups"] });
    },
    onError: () => toast.error("Failed to accept job"),
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/pickups/${id}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pickups"] }),
  });

  const completePickupMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/pickups/${id}/complete-pickup`),
    onSuccess: (_, id) => {
      toast.success("Pickup completed! The resident has been notified.");
      queryClient.invalidateQueries({ queryKey: ["/api/pickups"] });
    },
  });

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const todayEarnings = completedTasks.reduce((s, t) => s + t.earning, 0);
  const totalPossible = tasks.reduce((s, t) => s + t.earning, 0);

  const availableJobs = pickups.filter((p) => p.status === "pending");
  const myJobs = pickups.filter((p) => p.status === "assigned" || p.status === "in_progress");
  const completedJobs = pickups.filter((p) => p.status === "completed");

  const priorityColor: Record<string, string> = {
    high: "bg-destructive/10 text-destructive border-destructive/30",
    medium: "bg-warning/10 text-warning border-warning/30",
    low: "bg-success/10 text-success border-success/30",
  };

  const wasteTypeLabel: Record<string, string> = {
    general: "🗑️ General", recycling: "♻️ Recycling", organic: "🌿 Organic", ewaste: "⚡ E-Waste",
  };

  const pickupStatusColor: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    assigned: "bg-warning/15 text-warning",
    in_progress: "bg-primary/15 text-primary",
    completed: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
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
        <div className="flex items-center gap-2">
          {availableJobs.length > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] animate-pulse">
              {availableJobs.length} new job{availableJobs.length !== 1 ? "s" : ""}
            </Badge>
          )}
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
            ) : "Start Shift"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today's Earnings", value: `₦${todayEarnings.toLocaleString()}`, sub: `of ₦${totalPossible.toLocaleString()}`, icon: Banknote, color: "text-success" },
          { label: "Bin Pickups", value: `${completedTasks.length}/${tasks.length}`, sub: `${pendingTasks.length} remaining`, icon: Truck, color: "text-primary" },
          { label: "User Jobs", value: `${myJobs.length}`, sub: `${availableJobs.length} available`, icon: Package, color: "text-warning" },
          { label: "Route", value: `${Math.round(progress)}%`, sub: "completion", icon: TrendingUp, color: "text-primary" },
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

      {/* Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">Route Progress</p>
            <span className="text-2xl font-bold font-mono text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-primary/10 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          {progress === 100 && (
            <p className="mt-2 text-xs text-success font-medium flex items-center gap-1">
              <Star className="h-3 w-3" /> All bin pickups complete!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="tasks" className="text-[11px]">
            <Truck className="h-3.5 w-3.5 mr-1" />Tasks
          </TabsTrigger>
          <TabsTrigger value="inbox" className="text-[11px] relative">
            <Inbox className="h-3.5 w-3.5 mr-1" />Jobs
            {availableJobs.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{availableJobs.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="map" className="text-[11px]">
            <Map className="h-3.5 w-3.5 mr-1" />Map
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-[11px]">
            <CalendarClock className="h-3.5 w-3.5 mr-1" />Schedule
          </TabsTrigger>
        </TabsList>

        {/* ── TASKS TAB ── */}
        <TabsContent value="tasks" className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Today's Bin Pickups</h2>
            <Badge variant="outline" className="text-[10px]">{pendingTasks.length} pending</Badge>
          </div>
          {tasksLoading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}</div>
          ) : tasks.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><Truck className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No bin pickups assigned today</p></CardContent></Card>
          ) : (
            tasks.map((task, i) => (
              <Card
                key={task.id}
                className={cn("transition-all cursor-pointer hover:shadow-md border", task.completed && "opacity-55", !task.completed && task.priority === "high" && "border-destructive/20")}
                onClick={() => task.completed ? uncompleteMutation.mutate(task.id) : completeMutation.mutate(task.id)}
                data-testid={`card-task-${task.id}`}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="shrink-0">
                    {task.completed ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                      <p className={cn("text-sm font-medium text-foreground", task.completed && "line-through text-muted-foreground")}>{task.location}</p>
                      {!task.completed && task.priority === "high" && <Flame className="h-3.5 w-3.5 text-destructive shrink-0" />}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {task.binId}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.estimatedTime}</span>
                      <span>{wasteTypeLabel[task.wasteType] ?? task.wasteType}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <BinStatusBadge fillLevel={task.fillLevel} size="sm" />
                    <Badge variant="outline" className={`text-[9px] px-1.5 ${priorityColor[task.priority]}`}>{task.priority}</Badge>
                    <span className="text-[10px] font-mono text-success font-semibold">₦{task.earning.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Weekly chart */}
          <Card className="mt-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Weekly Earnings</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <RechartTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`₦${v.toLocaleString()}`, "Earnings"]} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-right text-muted-foreground">Week total: <span className="font-semibold text-foreground">₦{weeklyData.reduce((s, d) => s + d.amount, 0).toLocaleString()}</span></p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── JOB INBOX TAB ── */}
        <TabsContent value="inbox" className="mt-4 space-y-3">
          {/* Available jobs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Available Jobs</h2>
              <Badge variant="outline" className="text-[10px]">{availableJobs.length} open</Badge>
            </div>
            {pickupsLoading ? (
              <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />)}</div>
            ) : availableJobs.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground"><AlertCircle className="h-7 w-7 mx-auto mb-2 opacity-30" /><p className="text-sm">No available jobs right now</p><p className="text-xs mt-1">New requests will appear here</p></CardContent></Card>
            ) : (
              availableJobs.map((job) => (
                <Card key={job.id} className="border-warning/30 bg-warning/5" data-testid={`card-job-${job.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">#{job.id}</span>
                          <Badge className="bg-warning/20 text-warning border-0 text-[9px]">New Request</Badge>
                        </div>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {wasteTypeLabel[job.wasteType] ?? job.wasteType} Pickup
                        </p>
                        {job.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />{job.address}
                          </p>
                        )}
                        {job.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{job.notes}"</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(job.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-success hover:bg-success/90 text-success-foreground"
                          onClick={() => acceptMutation.mutate(job.id)}
                          disabled={acceptMutation.isPending}
                          data-testid={`button-accept-job-${job.id}`}
                        >
                          <CheckCheck className="h-3.5 w-3.5 mr-1" /> Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* My active jobs */}
          {myJobs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">My Active Jobs</h2>
              {myJobs.map((job) => (
                <Card key={job.id} className="border-primary/20" data-testid={`card-active-job-${job.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">#{job.id}</span>
                          <Badge className={cn("border-0 text-[9px]", pickupStatusColor[job.status])}>
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {wasteTypeLabel[job.wasteType] ?? job.wasteType} Pickup
                        </p>
                        {job.address && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{job.address}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {job.status === "assigned" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => startMutation.mutate(job.id)} disabled={startMutation.isPending}>
                            <Play className="h-3 w-3 mr-1" /> Start
                          </Button>
                        )}
                        {job.status === "in_progress" && (
                          <Button size="sm" className="h-8 text-xs bg-success hover:bg-success/90 text-success-foreground" onClick={() => completePickupMutation.mutate(job.id)} disabled={completePickupMutation.isPending}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── MAP TAB ── */}
        <TabsContent value="map" className="mt-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Your Route — Jos Central Zone</h2>
            <p className="text-xs text-muted-foreground mb-3">Live driver position · bin fill levels · assigned pickup requests</p>
            <RouteMap tasks={tasks} pickups={pickups} bins={bins} />
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Bins on route", value: bins.filter((b) => b.fillLevel > 60).length, color: "text-destructive" },
              { label: "Active requests", value: myJobs.length, color: "text-primary" },
              { label: "Area coverage", value: "Central Jos", color: "text-foreground" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Navigate button */}
          <Button
            className="w-full"
            onClick={() => {
              const url = `https://maps.google.com/maps?q=${JOS_CENTER[0]},${JOS_CENTER[1]}`;
              window.open(url, "_blank");
            }}
          >
            <Navigation className="h-4 w-4 mr-2" /> Open in Google Maps
          </Button>
        </TabsContent>

        {/* ── SCHEDULE TAB ── */}
        <TabsContent value="schedule" className="mt-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">All Requests</h2>
            <Badge variant="outline" className="text-[10px]">{pickups.length} total</Badge>
          </div>
          {pickupsLoading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}</div>
          ) : pickups.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground"><CalendarClock className="h-7 w-7 mx-auto mb-2 opacity-30" /><p className="text-sm">No requests yet</p></CardContent></Card>
          ) : (
            pickups.map((job) => (
              <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", {
                  "bg-muted-foreground": job.status === "pending",
                  "bg-warning": job.status === "assigned",
                  "bg-primary": job.status === "in_progress",
                  "bg-success": job.status === "completed",
                  "bg-destructive": job.status === "cancelled",
                })} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground capitalize">{wasteTypeLabel[job.wasteType] ?? job.wasteType} pickup</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {job.address && ` · ${job.address}`}
                  </p>
                </div>
                <Badge className={cn("border-0 text-[9px]", pickupStatusColor[job.status])}>
                  {job.status.replace("_", " ")}
                </Badge>
              </div>
            ))
          )}
          {/* Completed jobs summary */}
          {completedJobs.length > 0 && (
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCheck className="h-8 w-8 text-success shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{completedJobs.length} completed</p>
                  <p className="text-xs text-muted-foreground">User pickups you've finished today</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
