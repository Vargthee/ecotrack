import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Truck, CreditCard, Trash2, Shield,
  Ban, CheckCircle, AlertTriangle, Star, MapPin, XCircle,
  TrendingUp, Activity, Banknote, FileCheck, Clock, Car, Route, UserCheck, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getBinStatus } from "@/data/mockData";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import { apiRequest } from "@/lib/queryClient";

const PLAN_AMOUNTS: Record<string, number> = { basic: 2000, pro: 5000, enterprise: 15000 };

type DbUser = { id: number; name: string; email: string; role: string; status: string; createdAt: string };
type DbBin = { id: string; location: string; lat: number; lng: number; fillLevel: number; lastCollected: string; type: string };
type DbReport = { id: string; userId?: number; type: string; description: string; lat: number; lng: number; status: string; createdAt: string };
type DbStats = {
  totalUsers: number; totalDrivers: number; totalBins: number; totalReports: number;
  pendingReports: number; totalTasks: number; completedTasks: number; pendingKyc: number;
  pickups: { pending: number; assigned: number; inProgress: number; completed: number; cancelled: number };
};
type SubWithUser = { id: number; userId: number; name: string; email: string; planType: string; status: string; billingCycle: string; nextBillingDate: string };
type KycEntry = { id: number; driverId: number; driverName: string; driverEmail: string; status: "pending" | "approved" | "rejected"; govtIdType?: string; vehicleMake?: string; vehicleModel?: string; vehicleYear?: string; vehiclePlate?: string; rejectionReason?: string; submittedAt?: string };
type PickupEntry = { id: number; userId: number; wasteType: string; status: string; driverId?: number; address?: string; notes?: string; createdAt: string; scheduledDate?: string; timeSlot?: string };
type AdminUserEntry = { id: number; name: string; email: string; role: string; status: string };

const userStatusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  suspended: "bg-warning/15 text-warning border-warning/30",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
};
const subStatusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  past_due: "bg-warning/15 text-warning border-warning/30",
  canceled: "bg-destructive/15 text-destructive border-destructive/30",
};
const planColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground border-border",
  pro: "bg-primary/15 text-primary border-primary/30",
  enterprise: "bg-accent text-accent-foreground border-accent-foreground/20",
};
const reportStatusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  resolved: "bg-success/15 text-success border-success/30",
};
const binFillColors: Record<string, string> = {
  green: "bg-success/15 text-success border-success/30",
  yellow: "bg-warning/15 text-warning border-warning/30",
  red: "bg-destructive/15 text-destructive border-destructive/30",
};

const AdminPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [assignDriverMap, setAssignDriverMap] = useState<Record<number, string>>({});

  // ── Real API queries ──────────────────────────────────────────────────────

  const { data: stats, isLoading: statsLoading } = useQuery<DbStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => apiRequest("GET", "/api/admin/stats"),
  });

  const { data: allAdminUsers = [], isLoading: usersLoading } = useQuery<AdminUserEntry[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users"),
  });

  const { data: binsData = [], isLoading: binsLoading } = useQuery<DbBin[]>({
    queryKey: ["/api/bins"],
    queryFn: () => apiRequest("GET", "/api/bins"),
  });

  const { data: reportsData = [], isLoading: reportsLoading } = useQuery<DbReport[]>({
    queryKey: ["/api/reports"],
    queryFn: () => apiRequest("GET", "/api/reports"),
  });

  const { data: allPickups = [], isLoading: pickupsLoading } = useQuery<PickupEntry[]>({
    queryKey: ["/api/pickups"],
    queryFn: () => apiRequest("GET", "/api/pickups"),
  });

  const { data: kycList = [], isLoading: kycLoading } = useQuery<KycEntry[]>({
    queryKey: ["/api/admin/kyc"],
    queryFn: () => apiRequest("GET", "/api/admin/kyc"),
  });

  const { data: subsData = [], isLoading: subsLoading } = useQuery<SubWithUser[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: () => apiRequest("GET", "/api/admin/subscriptions"),
  });

  const { data: analyticsData } = useQuery<{
    weeklyCollections: { day: string; pickups: number; completed: number }[];
  }>({
    queryKey: ["/api/analytics"],
    queryFn: () => apiRequest("GET", "/api/analytics"),
  });

  // ── Derived data ──────────────────────────────────────────────────────────

  const driverList = allAdminUsers.filter(u => u.role === "driver");
  const criticalBins = binsData.filter(b => getBinStatus(b.fillLevel) === "red");
  const pendingReports = reportsData.filter(r => r.status === "pending");
  const monthlyRevenue = subsData.filter(s => s.status === "active").reduce((sum, s) => sum + (PLAN_AMOUNTS[s.planType] ?? 0), 0);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${id}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.message ?? "Failed to update role"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/users/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast.success(`User ${vars.status === "active" ? "activated" : vars.status}`);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update status"),
  });

  const resetBinMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/bins/${id}/reset`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/bins"] }); toast.success("Bin marked as collected"); },
  });

  const deleteBinMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bins/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/bins"] }); toast.success("Bin removed"); },
  });

  const reportStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/reports/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/reports"] }); toast.success("Report status updated"); },
  });

  const assignMutation = useMutation({
    mutationFn: ({ pickupId, driverId }: { pickupId: number; driverId: number }) =>
      apiRequest("PATCH", `/api/pickups/${pickupId}/assign`, { driverId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/pickups"] });
      toast.success(`Pickup #${vars.pickupId} assigned to driver`);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (pickupId: number) => apiRequest("PATCH", `/api/pickups/${pickupId}/unassign`, {}),
    onSuccess: (_, pickupId) => {
      qc.invalidateQueries({ queryKey: ["/api/pickups"] });
      toast.success(`Pickup #${pickupId} unassigned`);
    },
  });

  const kycMutation = useMutation({
    mutationFn: ({ driverId, status, rejectionReason }: { driverId: number; status: "approved" | "rejected"; rejectionReason?: string }) =>
      apiRequest("PATCH", `/api/admin/kyc/${driverId}`, { status, rejectionReason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      toast.success(`KYC ${vars.status === "approved" ? "approved" : "rejected"} successfully`);
    },
  });

  const wasteLabel: Record<string, string> = { general: "🗑️ General", recycling: "♻️ Recycling", organic: "🌿 Organic", ewaste: "⚡ E-Waste" };
  const pickupStatusColor: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    assigned: "bg-warning/15 text-warning border-warning/30",
    in_progress: "bg-primary/15 text-primary border-primary/30",
    completed: "bg-success/15 text-success border-success/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user?.name}</span>
            </p>
          </div>
        </div>
        {(criticalBins.length > 0 || pendingReports.length > 0) && (
          <div className="flex items-center gap-2">
            {criticalBins.length > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse inline-block" />
                {criticalBins.length} critical bins
              </Badge>
            )}
            {pendingReports.length > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {pendingReports.length} pending reports
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          [1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />)
        ) : (
          <>
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} subtitle={`${stats?.totalDrivers ?? 0} drivers`} />
            <StatCard title="Active Drivers" value={stats?.totalDrivers ?? 0} icon={Truck} subtitle={`${stats?.pendingKyc ?? 0} KYC pending`} />
            <StatCard title="Subscribers" value={subsData.filter(s => s.status === "active").length} icon={CreditCard} subtitle={`${subsData.length} total`} />
            <StatCard title="Monthly Revenue" value={`₦${(monthlyRevenue / 1000).toFixed(0)}k`} icon={Banknote} subtitle="All plans combined" variant="primary" />
          </>
        )}
      </div>

      {/* Quick charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Weekly Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={analyticsData?.weeklyCollections ?? []}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [v, "Pickups"]}
                />
                <Line type="monotone" dataKey="pickups" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Pickup Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-2 pt-2">
                {[
                  { label: "Pending", count: stats.pickups.pending, color: "bg-warning" },
                  { label: "Assigned", count: stats.pickups.assigned, color: "bg-primary" },
                  { label: "In Progress", count: stats.pickups.inProgress, color: "bg-primary/70" },
                  { label: "Completed", count: stats.pickups.completed, color: "bg-success" },
                ].map(s => {
                  const total = Object.values(stats.pickups).reduce((a,b) => a+b, 0) || 1;
                  return (
                    <div key={s.label} className="flex items-center gap-3 text-sm">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{s.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.count / total) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono w-6 text-right shrink-0">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bin health summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bin Network Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: "Low (<50%)", count: binsData.filter(b => getBinStatus(b.fillLevel) === "green").length, textColor: "text-success" },
              { label: "Medium (50–80%)", count: binsData.filter(b => getBinStatus(b.fillLevel) === "yellow").length, textColor: "text-warning" },
              { label: "Critical (>80%)", count: binsData.filter(b => getBinStatus(b.fillLevel) === "red").length, textColor: "text-destructive" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-bold ${s.textColor}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {binsData.slice(0, 4).map(bin => {
              const st = getBinStatus(bin.fillLevel);
              return (
                <div key={bin.id} className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground w-40 truncate shrink-0">{bin.location}</p>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${st === "green" ? "bg-success" : st === "yellow" ? "bg-warning" : "bg-destructive"}`} style={{ width: `${bin.fillLevel}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right shrink-0">{bin.fillLevel}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 h-auto">
          <TabsTrigger value="users" className="text-xs"><Users className="h-3.5 w-3.5 mr-1 hidden md:inline" />Users</TabsTrigger>
          <TabsTrigger value="bins" className="text-xs"><Trash2 className="h-3.5 w-3.5 mr-1 hidden md:inline" />Bins</TabsTrigger>
          <TabsTrigger value="drivers" className="text-xs"><Truck className="h-3.5 w-3.5 mr-1 hidden md:inline" />Drivers</TabsTrigger>
          <TabsTrigger value="routes" className="text-xs relative">
            <Route className="h-3.5 w-3.5 mr-1 hidden md:inline" />Routes
            {allPickups.filter(p => p.status === "pending" && !p.driverId).length > 0 && (
              <span className="ml-1 h-4 w-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">
                {allPickups.filter(p => p.status === "pending" && !p.driverId).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs"><AlertTriangle className="h-3.5 w-3.5 mr-1 hidden md:inline" />Reports</TabsTrigger>
          <TabsTrigger value="subscribers" className="text-xs"><CreditCard className="h-3.5 w-3.5 mr-1 hidden md:inline" />Subs</TabsTrigger>
          <TabsTrigger value="kyc" className="text-xs">
            <FileCheck className="h-3.5 w-3.5 mr-1 hidden md:inline" />KYC
            {kycList.filter(k => k.status === "pending").length > 0 && (
              <span className="ml-1 h-4 w-4 rounded-full bg-warning text-warning-foreground text-[10px] flex items-center justify-center font-bold">
                {kycList.filter(k => k.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ── */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Management</CardTitle>
              <CardDescription>View, edit roles, suspend or ban accounts</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {usersLoading ? (
                <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAdminUsers.map(u => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell>
                          <Select value={u.role} onValueChange={val => roleMutation.mutate({ id: u.id, role: val })}
                            disabled={u.role === "admin"}>
                            <SelectTrigger className="w-24 h-8 text-xs" data-testid={`select-role-${u.id}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="driver">Driver</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={userStatusColors[u.status] ?? ""}>{u.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(u.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.role !== "admin" && (
                            <div className="flex gap-1 justify-end">
                              {u.status !== "active" && (
                                <Button size="sm" variant="ghost" className="h-7" onClick={() => statusMutation.mutate({ id: u.id, status: "active" })} title="Activate">
                                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                                </Button>
                              )}
                              {u.status !== "suspended" && (
                                <Button size="sm" variant="ghost" className="h-7" onClick={() => statusMutation.mutate({ id: u.id, status: "suspended" })} title="Suspend">
                                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                </Button>
                              )}
                              {u.status !== "banned" && (
                                <Button size="sm" variant="ghost" className="h-7" onClick={() => statusMutation.mutate({ id: u.id, status: "banned" })} title="Ban">
                                  <Ban className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Bins Tab ── */}
        <TabsContent value="bins">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bin Management</CardTitle>
              <CardDescription>Monitor fill levels, reset status, or decommission bins</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {binsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fill Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Collected</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {binsData.map(bin => {
                      const status = getBinStatus(bin.fillLevel);
                      return (
                        <TableRow key={bin.id} data-testid={`row-bin-${bin.id}`}>
                          <TableCell className="font-mono text-xs">{bin.id}</TableCell>
                          <TableCell className="font-medium">{bin.location}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize text-xs">{bin.type}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${status === "green" ? "bg-success" : status === "yellow" ? "bg-warning" : "bg-destructive"}`} style={{ width: `${bin.fillLevel}%` }} />
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">{bin.fillLevel}%</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className={binFillColors[status]}>{status}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{bin.lastCollected}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => resetBinMutation.mutate(bin.id)} disabled={resetBinMutation.isPending} title="Mark collected">
                                <CheckCircle className="h-3.5 w-3.5 text-success" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => deleteBinMutation.mutate(bin.id)} disabled={deleteBinMutation.isPending} title="Remove bin">
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Drivers Tab ── */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Driver Management</CardTitle>
              <CardDescription>Manage driver accounts and verification status</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {usersLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverList.map(driver => {
                      const kyc = kycList.find(k => k.driverId === driver.id);
                      return (
                        <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{driver.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{driver.email}</TableCell>
                          <TableCell>
                            {kyc ? (
                              <Badge variant="outline" className={
                                kyc.status === "approved" ? "bg-success/15 text-success border-success/30"
                                : kyc.status === "rejected" ? "bg-destructive/15 text-destructive border-destructive/30"
                                : "bg-warning/15 text-warning border-warning/30"
                              }>
                                {kyc.status}
                              </Badge>
                            ) : <span className="text-xs text-muted-foreground italic">No KYC</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {kyc?.vehicleMake ? (
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {kyc.vehicleMake} {kyc.vehicleModel}
                                {kyc.vehiclePlate && <span className="font-mono">· {kyc.vehiclePlate}</span>}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={userStatusColors[driver.status] ?? ""}>{driver.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {driver.status !== "active" && (
                                <Button size="sm" variant="ghost" className="h-7" onClick={() => statusMutation.mutate({ id: driver.id, status: "active" })} title="Activate">
                                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                                </Button>
                              )}
                              {driver.status !== "suspended" && (
                                <Button size="sm" variant="ghost" className="h-7" onClick={() => statusMutation.mutate({ id: driver.id, status: "suspended" })} title="Suspend">
                                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                </Button>
                              )}
                              {driver.status !== "banned" && (
                                <Button size="sm" variant="ghost" className="h-7" onClick={() => statusMutation.mutate({ id: driver.id, status: "banned" })} title="Ban">
                                  <Ban className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Routes / Pickup Assignment Tab ── */}
        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Route & Pickup Assignment</CardTitle>
                  <CardDescription>Assign pending pickup requests to available drivers</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                    {allPickups.filter(p => !p.driverId && p.status === "pending").length} unassigned
                  </Badge>
                  <Badge variant="outline" className="bg-success/15 text-success border-success/30">
                    {allPickups.filter(p => p.status === "completed").length} completed
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {pickupsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading pickups…</p>
              ) : allPickups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No pickup requests yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Waste Type</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Driver</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPickups.map(pickup => {
                      const assignedDriver = driverList.find(d => d.id === pickup.driverId);
                      return (
                        <TableRow key={pickup.id}>
                          <TableCell className="font-mono text-xs">#{pickup.id}</TableCell>
                          <TableCell className="text-sm">{wasteLabel[pickup.wasteType] ?? pickup.wasteType}</TableCell>
                          <TableCell className="text-sm max-w-[120px] truncate text-muted-foreground">
                            {pickup.address ?? <span className="italic text-muted-foreground/50">No address</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {pickup.scheduledDate ? (
                              <span>{pickup.scheduledDate} · {pickup.timeSlot ?? "any"}</span>
                            ) : (
                              <span className="italic">ASAP</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] capitalize ${pickupStatusColor[pickup.status] ?? ""}`}>
                              {pickup.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignedDriver ? (
                              <div className="flex items-center gap-1.5 text-sm">
                                <UserCheck className="h-3.5 w-3.5 text-success" />
                                <span>{assignedDriver.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {(pickup.status === "pending" || pickup.status === "assigned") ? (
                              <div className="flex items-center gap-2 justify-end">
                                <Select
                                  value={assignDriverMap[pickup.id] ?? (pickup.driverId ? String(pickup.driverId) : "")}
                                  onValueChange={v => setAssignDriverMap(prev => ({ ...prev, [pickup.id]: v }))}
                                >
                                  <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="Select driver" /></SelectTrigger>
                                  <SelectContent>
                                    {driverList.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" className="h-7 text-xs" disabled={!assignDriverMap[pickup.id] || assignMutation.isPending}
                                  onClick={() => { const dId = assignDriverMap[pickup.id]; if (dId) assignMutation.mutate({ pickupId: pickup.id, driverId: Number(dId) }); }}>
                                  <Route className="h-3 w-3 mr-1" /> Assign
                                </Button>
                                {pickup.driverId && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => unassignMutation.mutate(pickup.id)} disabled={unassignMutation.isPending}>
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Reports Tab ── */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Citizen Reports</CardTitle>
              <CardDescription>Review and triage submitted reports from the community</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {reportsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : reportsData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No reports yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportsData.map(report => (
                      <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                        <TableCell className="font-mono text-xs">{report.id}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{report.type.replace("_", " ")}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{report.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={reportStatusColors[report.status] ?? ""}>{report.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Select value={report.status} onValueChange={val => reportStatusMutation.mutate({ id: report.id, status: val })}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Subscribers Tab ── */}
        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Subscribers</CardTitle>
                  <CardDescription>All subscription plans and billing status</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">₦{monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {subsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Next Billing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subsData.map(sub => (
                      <TableRow key={sub.id} data-testid={`row-sub-${sub.id}`}>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{sub.email}</TableCell>
                        <TableCell><Badge variant="outline" className={`capitalize ${planColors[sub.planType] ?? ""}`}>{sub.planType}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={subStatusColors[sub.status] ?? ""}>{sub.status.replace("_", " ")}</Badge></TableCell>
                        <TableCell className="text-sm font-mono">₦{(PLAN_AMOUNTS[sub.planType] ?? 0).toLocaleString()}/mo</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{sub.nextBillingDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── KYC Tab ── */}
        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Driver KYC Verification</CardTitle>
                  <CardDescription>Review and approve driver identity & vehicle documents</CardDescription>
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">{kycList.filter(k => k.status === "pending").length} pending</Badge>
                  <Badge variant="outline" className="bg-success/15 text-success border-success/30">{kycList.filter(k => k.status === "approved").length} approved</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {kycLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading KYC submissions…</p>
              ) : kycList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No KYC submissions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>ID Type</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Plate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycList.map(k => (
                      <TableRow key={k.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{k.driverName}</p>
                            <p className="text-xs text-muted-foreground">{k.driverEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">{k.govtIdType?.replace("_", " ") ?? "—"}</TableCell>
                        <TableCell>
                          {k.vehicleMake ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Car className="h-3.5 w-3.5 text-muted-foreground" />
                              {k.vehicleMake} {k.vehicleModel} ({k.vehicleYear})
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{k.vehiclePlate ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            k.status === "approved" ? "bg-success/15 text-success border-success/30"
                            : k.status === "rejected" ? "bg-destructive/15 text-destructive border-destructive/30"
                            : "bg-warning/15 text-warning border-warning/30"
                          }>
                            {k.status === "pending" ? <Clock className="h-3 w-3 mr-1 inline" /> : k.status === "approved" ? <CheckCircle className="h-3 w-3 mr-1 inline" /> : <XCircle className="h-3 w-3 mr-1 inline" />}
                            {k.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {k.submittedAt ? new Date(k.submittedAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {k.status === "pending" ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Input placeholder="Rejection reason (optional)" className="h-7 text-xs w-44"
                                value={rejectReason[k.driverId] ?? ""}
                                onChange={e => setRejectReason(prev => ({ ...prev, [k.driverId]: e.target.value }))}
                              />
                              <Button size="sm" variant="outline" className="h-7 text-success border-success/30 hover:bg-success/10"
                                onClick={() => kycMutation.mutate({ driverId: k.driverId, status: "approved" })} disabled={kycMutation.isPending}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => kycMutation.mutate({ driverId: k.driverId, status: "rejected", rejectionReason: rejectReason[k.driverId] })} disabled={kycMutation.isPending}>
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                            </div>
                          ) : k.status === "rejected" && k.rejectionReason ? (
                            <span className="text-xs text-muted-foreground italic">{k.rejectionReason}</span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
