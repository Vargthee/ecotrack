import { getDb } from "./db";

function db() {
  const d = getDb();
  if (!d) throw new Error("Database not available — set DATABASE_URL");
  return d;
}

import { eq, desc, sql, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  users, wasteBins, driverTasks, citizenReports, pickupRequests,
  ecoPointsLog, subscriptions, driverKyc, rateLimits,
  type User, type WasteBin, type DriverTask, type CitizenReport,
  type PickupRequest, type EcoPointsEntry, type Subscription, type DriverKyc,
} from "../shared/schema";

export type AdminAnalytics = {
  weeklyCollections: { day: string; pickups: number; completed: number }[];
  binFillDistribution: { level: string; count: number; fill: string }[];
  tasksByWasteType: { name: string; count: number; fill: string }[];
  summary: { completedTasks: number; recyclingRate: number; activeDrivers: number; totalBins: number; co2Saved: number; binsServiced: number };
};

export type DriverAnalytics = {
  dailyEarnings: { day: string; amount: number; tasks: number }[];
  tasksByWasteType: { name: string; count: number; fill: string }[];
  weeklyTotal: number; weeklyTasks: number;
  completedCount: number; totalCount: number; totalEarnings: number;
};

export type UserAnalytics = {
  monthlyStats: { month: string; points: number; pickups: number }[];
  totalPoints: number; totalPickups: number; recyclingPickups: number; co2Offset: number;
};

export type SubWithUser = {
  id: number; userId: number; name: string; email: string;
  planType: string; status: string; billingCycle: string;
  nextBillingDate: string; startedAt: string;
};

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(name: string, email: string, password: string, role?: "user" | "driver" | "admin"): Promise<User>;
  verifyPassword(plain: string, hash: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: "user" | "driver" | "admin"): Promise<User>;
  updateUserStatus(id: number, status: "active" | "suspended" | "banned"): Promise<User>;
  updateUserProfile(id: number, data: { name?: string; phone?: string }): Promise<User>;
  changePassword(id: number, newPassword: string): Promise<void>;

  // Bins
  getAllBins(): Promise<WasteBin[]>;
  getBinById(id: string): Promise<WasteBin | undefined>;
  createBin(data: { id: string; location: string; lat: number; lng: number; fillLevel?: number; lastCollected: string; type: "general" | "recycling" | "organic" }): Promise<WasteBin>;
  updateBinFillLevel(id: string, fillLevel: number): Promise<WasteBin>;
  resetBin(id: string): Promise<WasteBin>;
  deleteBin(id: string): Promise<void>;

  // Driver Tasks
  getTasksByDriver(driverId: number): Promise<DriverTask[]>;
  getAllTasks(): Promise<DriverTask[]>;
  createTask(data: { id: string; binId: string; driverId?: number; location: string; fillLevel: number; priority: "high" | "medium" | "low"; estimatedTime: string; wasteType: "general" | "recycling" | "organic" | "ewaste"; earning: number }): Promise<DriverTask>;
  completeTask(id: string, driverId: number): Promise<DriverTask>;
  uncompleteTask(id: string): Promise<DriverTask>;
  getDriverEarnings(driverId: number): Promise<{ total: number; thisWeek: number; taskCount: number; completedCount: number }>;

  // Citizen Reports
  getAllReports(): Promise<CitizenReport[]>;
  getReportsByUser(userId: number): Promise<CitizenReport[]>;
  createReport(data: { userId?: number; type: "illegal_dumping" | "overflowing_bin"; description: string; lat: number; lng: number; photoUrl?: string }): Promise<CitizenReport>;
  updateReportStatus(id: string, status: "pending" | "in_progress" | "resolved"): Promise<CitizenReport>;

  // Pickup Requests
  getPickupsByUser(userId: number): Promise<PickupRequest[]>;
  getAllPickups(): Promise<PickupRequest[]>;
  getPickupById(id: number): Promise<PickupRequest | undefined>;
  createPickup(userId: number, wasteType: string, address?: string, notes?: string, scheduledDate?: string, timeSlot?: string): Promise<PickupRequest>;
  updatePickupStatus(id: number, status: string, driverId?: number | null): Promise<PickupRequest>;
  getPickupStats(): Promise<{ pending: number; assigned: number; inProgress: number; completed: number; cancelled: number }>;

  // Eco Points
  getPointsByUser(userId: number): Promise<number>;
  getPointsLog(userId: number): Promise<EcoPointsEntry[]>;
  addPoints(userId: number, action: string, points: number): Promise<EcoPointsEntry>;
  deductPoints(userId: number, action: string, points: number): Promise<EcoPointsEntry>;
  getLeaderboard(limit?: number): Promise<{ userId: number; name: string; total: number }[]>;

  // Subscriptions
  getSubscriptionByUser(userId: number): Promise<Subscription | undefined>;
  upsertSubscription(userId: number, data: Partial<Omit<Subscription, "id" | "userId" | "createdAt">>): Promise<Subscription>;
  getAllSubscriptionsWithUsers(): Promise<SubWithUser[]>;

  // KYC
  getKycByDriver(driverId: number): Promise<DriverKyc | undefined>;
  getAllKyc(): Promise<(DriverKyc & { driverName: string; driverEmail: string })[]>;
  upsertKyc(driverId: number, data: Partial<Omit<DriverKyc, "id" | "driverId" | "createdAt">>): Promise<DriverKyc>;
  updateKycStatus(driverId: number, status: "approved" | "rejected", rejectionReason?: string): Promise<DriverKyc>;

  // Rate Limiting
  checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean>;

  // Analytics
  getAdminAnalytics(): Promise<AdminAnalytics>;
  getDriverAnalytics(driverId: number): Promise<DriverAnalytics>;
  getUserAnalytics(userId: number): Promise<UserAnalytics>;
}

class PostgresStorage implements IStorage {
  async getUserByEmail(email: string) {
    const [user] = await db().select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number) {
    const [user] = await db().select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(name: string, email: string, password: string, role: "user" | "driver" | "admin" = "user") {
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db().insert(users).values({ name, email, passwordHash, role }).returning();
    return user;
  }

  async verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  async getAllUsers() {
    return db().select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(id: number, role: "user" | "driver" | "admin") {
    const [user] = await db().update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserStatus(id: number, status: "active" | "suspended" | "banned") {
    const [user] = await db().update(users).set({ status }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserProfile(id: number, data: { name?: string; phone?: string }) {
    const [user] = await db().update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async changePassword(id: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db().update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  async getAllBins() {
    return db().select().from(wasteBins).orderBy(wasteBins.id);
  }

  async getBinById(id: string) {
    const [bin] = await db().select().from(wasteBins).where(eq(wasteBins.id, id));
    return bin;
  }

  async createBin(data: { id: string; location: string; lat: number; lng: number; fillLevel?: number; lastCollected: string; type: "general" | "recycling" | "organic" }) {
    const [bin] = await db().insert(wasteBins).values({ fillLevel: 0, ...data }).returning();
    return bin;
  }

  async updateBinFillLevel(id: string, fillLevel: number) {
    const [bin] = await db().update(wasteBins).set({ fillLevel }).where(eq(wasteBins.id, id)).returning();
    return bin;
  }

  async resetBin(id: string) {
    const today = new Date().toISOString().split("T")[0];
    const [bin] = await db().update(wasteBins).set({ fillLevel: 0, lastCollected: today }).where(eq(wasteBins.id, id)).returning();
    return bin;
  }

  async deleteBin(id: string) {
    await db().delete(wasteBins).where(eq(wasteBins.id, id));
  }

  async getTasksByDriver(driverId: number) {
    return db().select().from(driverTasks).where(eq(driverTasks.driverId, driverId)).orderBy(desc(driverTasks.createdAt));
  }

  async getAllTasks() {
    return db().select().from(driverTasks).orderBy(desc(driverTasks.createdAt));
  }

  async createTask(data: { id: string; binId: string; driverId?: number; location: string; fillLevel: number; priority: "high" | "medium" | "low"; estimatedTime: string; wasteType: "general" | "recycling" | "organic" | "ewaste"; earning: number }) {
    const [task] = await db().insert(driverTasks).values({ ...data, completed: false }).returning();
    return task;
  }

  async completeTask(id: string, driverId: number) {
    const [task] = await db().update(driverTasks)
      .set({ completed: true, driverId })
      .where(eq(driverTasks.id, id))
      .returning();
    return task;
  }

  async uncompleteTask(id: string) {
    const [task] = await db().update(driverTasks).set({ completed: false }).where(eq(driverTasks.id, id)).returning();
    return task;
  }

  async getDriverEarnings(driverId: number) {
    const tasks = await db().select().from(driverTasks)
      .where(and(eq(driverTasks.driverId, driverId), eq(driverTasks.completed, true)));

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekTasks = tasks.filter(t => new Date(t.createdAt) >= weekAgo);

    return {
      total: tasks.reduce((sum, t) => sum + t.earning, 0),
      thisWeek: thisWeekTasks.reduce((sum, t) => sum + t.earning, 0),
      taskCount: await db().select({ count: sql<number>`count(*)` }).from(driverTasks).where(eq(driverTasks.driverId, driverId)).then(r => Number(r[0]?.count ?? 0)),
      completedCount: tasks.length,
    };
  }

  async getAllReports() {
    return db().select().from(citizenReports).orderBy(desc(citizenReports.createdAt));
  }

  async getReportsByUser(userId: number) {
    return db().select().from(citizenReports).where(eq(citizenReports.userId, userId)).orderBy(desc(citizenReports.createdAt));
  }

  async createReport(data: { userId?: number; type: "illegal_dumping" | "overflowing_bin"; description: string; lat: number; lng: number; photoUrl?: string }) {
    const id = `RPT-${Date.now()}`;
    const [report] = await db().insert(citizenReports).values({ id, ...data }).returning();
    return report;
  }

  async updateReportStatus(id: string, status: "pending" | "in_progress" | "resolved") {
    const [report] = await db().update(citizenReports).set({ status }).where(eq(citizenReports.id, id)).returning();
    return report;
  }

  async getPickupsByUser(userId: number) {
    return db().select().from(pickupRequests).where(eq(pickupRequests.userId, userId)).orderBy(desc(pickupRequests.createdAt));
  }

  async getAllPickups() {
    return db().select().from(pickupRequests).orderBy(desc(pickupRequests.createdAt));
  }

  async getPickupById(id: number) {
    const [pickup] = await db().select().from(pickupRequests).where(eq(pickupRequests.id, id));
    return pickup;
  }

  async createPickup(userId: number, wasteType: string, address?: string, notes?: string, scheduledDate?: string, timeSlot?: string) {
    const [pickup] = await db().insert(pickupRequests)
      .values({ userId, wasteType: wasteType as any, address, notes, scheduledDate, timeSlot })
      .returning();
    return pickup;
  }

  async updatePickupStatus(id: number, status: string, driverId?: number | null) {
    const update: Record<string, unknown> = { status: status as any };
    if (driverId !== undefined) update.driverId = driverId ?? null;
    const [pickup] = await db().update(pickupRequests)
      .set(update as any)
      .where(eq(pickupRequests.id, id))
      .returning();
    return pickup;
  }

  async getPickupStats() {
    const all = await db().select().from(pickupRequests);
    return {
      pending: all.filter(p => p.status === "pending").length,
      assigned: all.filter(p => p.status === "assigned").length,
      inProgress: all.filter(p => p.status === "in_progress").length,
      completed: all.filter(p => p.status === "completed").length,
      cancelled: all.filter(p => p.status === "cancelled").length,
    };
  }

  async getPointsByUser(userId: number) {
    const result = await db().select({ total: sql<number>`COALESCE(SUM(${ecoPointsLog.points}), 0)` })
      .from(ecoPointsLog).where(eq(ecoPointsLog.userId, userId));
    return Number(result[0]?.total ?? 0);
  }

  async getPointsLog(userId: number) {
    return db().select().from(ecoPointsLog).where(eq(ecoPointsLog.userId, userId)).orderBy(desc(ecoPointsLog.createdAt)).limit(20);
  }

  async addPoints(userId: number, action: string, points: number) {
    const [entry] = await db().insert(ecoPointsLog).values({ userId, action, points: Math.abs(points) }).returning();
    return entry;
  }

  async deductPoints(userId: number, action: string, points: number) {
    const [entry] = await db().insert(ecoPointsLog).values({ userId, action, points: -Math.abs(points) }).returning();
    return entry;
  }

  async getLeaderboard(limit = 10) {
    const rows = await db()
      .select({
        userId: ecoPointsLog.userId,
        name: users.name,
        total: sql<number>`COALESCE(SUM(${ecoPointsLog.points}), 0)`,
      })
      .from(ecoPointsLog)
      .innerJoin(users, eq(ecoPointsLog.userId, users.id))
      .where(ne(users.role, "admin"))
      .groupBy(ecoPointsLog.userId, users.name)
      .orderBy(desc(sql`SUM(${ecoPointsLog.points})`))
      .limit(limit);
    return rows.map(r => ({ userId: r.userId, name: r.name, total: Number(r.total) }));
  }

  async getSubscriptionByUser(userId: number) {
    const [sub] = await db().select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async upsertSubscription(userId: number, data: Partial<Omit<Subscription, "id" | "userId" | "createdAt">>) {
    const today = new Date().toISOString().split("T")[0];
    const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const existing = await this.getSubscriptionByUser(userId);

    if (existing) {
      const [sub] = await db().update(subscriptions).set(data).where(eq(subscriptions.userId, userId)).returning();
      return sub;
    }

    const [sub] = await db().insert(subscriptions).values({
      userId,
      planType: "basic",
      status: "active",
      billingCycle: "monthly",
      nextBillingDate: nextBilling,
      startedAt: today,
      ...data,
    }).returning();
    return sub;
  }

  async getAllSubscriptionsWithUsers(): Promise<SubWithUser[]> {
    const rows = await db().select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      name: users.name,
      email: users.email,
      planType: subscriptions.planType,
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      nextBillingDate: subscriptions.nextBillingDate,
      startedAt: subscriptions.startedAt,
    }).from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt));
    return rows.map(r => ({ ...r, planType: r.planType as string, status: r.status as string, billingCycle: r.billingCycle as string }));
  }

  async getKycByDriver(driverId: number) {
    const [kyc] = await db().select().from(driverKyc).where(eq(driverKyc.driverId, driverId));
    return kyc;
  }

  async getAllKyc() {
    const rows = await getDb()
      .select({
        kyc: driverKyc,
        driverName: users.name,
        driverEmail: users.email,
      })
      .from(driverKyc)
      .innerJoin(users, eq(driverKyc.driverId, users.id))
      .orderBy(desc(driverKyc.submittedAt));
    return rows.map((r) => ({ ...r.kyc, driverName: r.driverName, driverEmail: r.driverEmail }));
  }

  async upsertKyc(driverId: number, data: Partial<Omit<DriverKyc, "id" | "driverId" | "createdAt">>) {
    const existing = await this.getKycByDriver(driverId);
    if (existing) {
      const [kyc] = await db().update(driverKyc)
        .set({ ...data, submittedAt: new Date() })
        .where(eq(driverKyc.driverId, driverId))
        .returning();
      return kyc;
    }
    const [kyc] = await db().insert(driverKyc)
      .values({ driverId, status: "pending", ...data })
      .returning();
    return kyc;
  }

  async updateKycStatus(driverId: number, status: "approved" | "rejected", rejectionReason?: string) {
    const [kyc] = await db().update(driverKyc)
      .set({ status, rejectionReason: rejectionReason ?? null, reviewedAt: new Date() })
      .where(eq(driverKyc.driverId, driverId))
      .returning();
    return kyc;
  }

  async checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
    try {
      const now = new Date();
      const resetAt = new Date(now.getTime() + windowMs);
      const [existing] = await db().select().from(rateLimits).where(eq(rateLimits.key, key));

      if (!existing || existing.resetAt < now) {
        if (existing) {
          await db().update(rateLimits).set({ count: 1, resetAt }).where(eq(rateLimits.key, key));
        } else {
          await db().insert(rateLimits).values({ key, count: 1, resetAt });
        }
        return true;
      }

      if (existing.count >= max) return false;
      await db().update(rateLimits).set({ count: existing.count + 1 }).where(eq(rateLimits.key, key));
      return true;
    } catch {
      return true;
    }
  }

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const [allBins, allTasks, allUsers] = await Promise.all([
      db().select().from(wasteBins),
      db().select().from(driverTasks),
      db().select().from(users),
    ]);

    const pickupRows = await db().select({
      day: sql<string>`DATE(${pickupRequests.createdAt})::text`,
      total: sql<number>`COUNT(*)::int`,
      completed: sql<number>`COUNT(*) FILTER (WHERE ${pickupRequests.status} = 'completed')::int`,
    }).from(pickupRequests)
      .where(sql`${pickupRequests.createdAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${pickupRequests.createdAt})`)
      .orderBy(sql`DATE(${pickupRequests.createdAt})`);

    const weeklyCollections: { day: string; pickups: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const found = pickupRows.find(r => r.day === dayStr);
      weeklyCollections.push({ day: label, pickups: found ? Number(found.total) : 0, completed: found ? Number(found.completed) : 0 });
    }

    const binFillDistribution = [
      { level: "Low", count: allBins.filter(b => b.fillLevel < 50).length, fill: "hsl(var(--success))" },
      { level: "Medium", count: allBins.filter(b => b.fillLevel >= 50 && b.fillLevel < 80).length, fill: "hsl(var(--warning))" },
      { level: "High", count: allBins.filter(b => b.fillLevel >= 80).length, fill: "hsl(var(--destructive))" },
    ];

    const wasteTypes = ["general", "recycling", "organic", "ewaste"];
    const wasteColors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];
    const tasksByWasteType = wasteTypes.map((wt, i) => ({
      name: wt.charAt(0).toUpperCase() + wt.slice(1),
      count: allTasks.filter(t => t.wasteType === wt && t.completed).length,
      fill: wasteColors[i],
    }));

    const completedTasks = allTasks.filter(t => t.completed).length;
    const recyclingTasks = allTasks.filter(t => t.completed && t.wasteType === "recycling").length;
    const recyclingRate = completedTasks > 0 ? Math.round((recyclingTasks / completedTasks) * 100) : 0;

    return {
      weeklyCollections,
      binFillDistribution,
      tasksByWasteType,
      summary: {
        completedTasks,
        recyclingRate,
        activeDrivers: allUsers.filter(u => u.role === "driver").length,
        totalBins: allBins.length,
        co2Saved: parseFloat((completedTasks * 0.05).toFixed(1)),
        binsServiced: completedTasks,
      },
    };
  }

  async getDriverAnalytics(driverId: number): Promise<DriverAnalytics> {
    const earningsRows = await db().select({
      day: sql<string>`DATE(${driverTasks.createdAt})::text`,
      amount: sql<number>`COALESCE(SUM(${driverTasks.earning}), 0)::int`,
      tasks: sql<number>`COUNT(*)::int`,
    }).from(driverTasks)
      .where(and(
        eq(driverTasks.driverId, driverId),
        eq(driverTasks.completed, true),
        sql`${driverTasks.createdAt} >= NOW() - INTERVAL '7 days'`,
      ))
      .groupBy(sql`DATE(${driverTasks.createdAt})`)
      .orderBy(sql`DATE(${driverTasks.createdAt})`);

    const dailyEarnings: { day: string; amount: number; tasks: number }[] = [];
    let weeklyTotal = 0;
    let weeklyTasks = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const found = earningsRows.find(r => r.day === dayStr);
      const amt = found ? Number(found.amount) : 0;
      const tks = found ? Number(found.tasks) : 0;
      dailyEarnings.push({ day: label, amount: amt, tasks: tks });
      weeklyTotal += amt;
      weeklyTasks += tks;
    }

    const allDriverTasks = await db().select().from(driverTasks).where(eq(driverTasks.driverId, driverId));
    const completedDriverTasks = allDriverTasks.filter(t => t.completed);

    const wasteTypes = ["general", "recycling", "organic", "ewaste"];
    const wasteColors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];
    const tasksByWasteType = wasteTypes.map((wt, i) => ({
      name: wt.charAt(0).toUpperCase() + wt.slice(1),
      count: completedDriverTasks.filter(t => t.wasteType === wt).length,
      fill: wasteColors[i],
    }));

    return {
      dailyEarnings,
      tasksByWasteType,
      weeklyTotal,
      weeklyTasks,
      completedCount: completedDriverTasks.length,
      totalCount: allDriverTasks.length,
      totalEarnings: completedDriverTasks.reduce((s, t) => s + t.earning, 0),
    };
  }

  async getUserAnalytics(userId: number): Promise<UserAnalytics> {
    const [totalPoints, allPickups] = await Promise.all([
      this.getPointsByUser(userId),
      db().select().from(pickupRequests).where(eq(pickupRequests.userId, userId)),
    ]);

    const pointsRows = await db().select({
      month: sql<string>`TO_CHAR(${ecoPointsLog.createdAt}, 'Mon')`,
      monthNum: sql<number>`EXTRACT(MONTH FROM ${ecoPointsLog.createdAt})::int`,
      yearNum: sql<number>`EXTRACT(YEAR FROM ${ecoPointsLog.createdAt})::int`,
      points: sql<number>`COALESCE(SUM(CASE WHEN ${ecoPointsLog.points} > 0 THEN ${ecoPointsLog.points} ELSE 0 END), 0)::int`,
    }).from(ecoPointsLog)
      .where(and(
        eq(ecoPointsLog.userId, userId),
        sql`${ecoPointsLog.createdAt} >= NOW() - INTERVAL '6 months'`,
      ))
      .groupBy(
        sql`TO_CHAR(${ecoPointsLog.createdAt}, 'Mon')`,
        sql`EXTRACT(MONTH FROM ${ecoPointsLog.createdAt})`,
        sql`EXTRACT(YEAR FROM ${ecoPointsLog.createdAt})`,
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${ecoPointsLog.createdAt})`,
        sql`EXTRACT(MONTH FROM ${ecoPointsLog.createdAt})`,
      );

    const pickupRows = await db().select({
      month: sql<string>`TO_CHAR(${pickupRequests.createdAt}, 'Mon')`,
      monthNum: sql<number>`EXTRACT(MONTH FROM ${pickupRequests.createdAt})::int`,
      yearNum: sql<number>`EXTRACT(YEAR FROM ${pickupRequests.createdAt})::int`,
      pickups: sql<number>`COUNT(*)::int`,
    }).from(pickupRequests)
      .where(and(
        eq(pickupRequests.userId, userId),
        sql`${pickupRequests.createdAt} >= NOW() - INTERVAL '6 months'`,
      ))
      .groupBy(
        sql`TO_CHAR(${pickupRequests.createdAt}, 'Mon')`,
        sql`EXTRACT(MONTH FROM ${pickupRequests.createdAt})`,
        sql`EXTRACT(YEAR FROM ${pickupRequests.createdAt})`,
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${pickupRequests.createdAt})`,
        sql`EXTRACT(MONTH FROM ${pickupRequests.createdAt})`,
      );

    const months = new Set([...pointsRows.map(r => `${r.yearNum}-${r.monthNum}`), ...pickupRows.map(r => `${r.yearNum}-${r.monthNum}`)]);
    const monthlyStats = Array.from(months).sort().map(key => {
      const [, monthNum] = key.split("-").map(Number);
      const pr = pointsRows.find(r => `${r.yearNum}-${r.monthNum}` === key);
      const pk = pickupRows.find(r => `${r.yearNum}-${r.monthNum}` === key);
      const d = new Date();
      d.setMonth(monthNum - 1);
      return {
        month: d.toLocaleDateString("en-US", { month: "short" }),
        points: pr ? Number(pr.points) : 0,
        pickups: pk ? Number(pk.pickups) : 0,
      };
    });

    const recyclingPickups = allPickups.filter(p => p.wasteType === "recycling").length;
    const co2Offset = parseFloat((allPickups.filter(p => p.status === "completed").length * 0.65).toFixed(1));

    return {
      monthlyStats,
      totalPoints,
      totalPickups: allPickups.length,
      recyclingPickups,
      co2Offset,
    };
  }
}

export const storage = new PostgresStorage();

// Periodically clean expired rate limit entries
setInterval(async () => {
  try {
    await storage.checkRateLimit("__cleanup__", 999999, 1); // dummy call to ensure DB is available
    const { getDb } = await import("./db");
    getDb()?.execute(sql`DELETE FROM rate_limits WHERE reset_at < NOW()`).catch(() => {});
  } catch {}
}, 60 * 60 * 1000);
