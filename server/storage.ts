import { getDb } from "./db";

function db() {
  const d = getDb();
  if (!d) throw new Error("Database not available — set DATABASE_URL");
  return d;
}

import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  users, wasteBins, driverTasks, citizenReports, pickupRequests,
  ecoPointsLog, subscriptions, driverKyc,
  type User, type WasteBin, type DriverTask, type CitizenReport,
  type PickupRequest, type EcoPointsEntry, type Subscription, type DriverKyc,
} from "../shared/schema";

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(name: string, email: string, password: string, role?: "user" | "driver" | "admin"): Promise<User>;
  verifyPassword(plain: string, hash: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: "user" | "driver" | "admin"): Promise<User>;
  updateUserStatus(id: number, status: "active" | "suspended" | "banned"): Promise<void>;

  // Bins
  getAllBins(): Promise<WasteBin[]>;
  getBinById(id: string): Promise<WasteBin | undefined>;
  updateBinFillLevel(id: string, fillLevel: number): Promise<WasteBin>;
  resetBin(id: string): Promise<WasteBin>;
  deleteBin(id: string): Promise<void>;

  // Driver Tasks
  getTasksByDriver(driverId: number): Promise<DriverTask[]>;
  getAllTasks(): Promise<DriverTask[]>;
  completeTask(id: string, driverId: number): Promise<DriverTask>;
  uncompleteTask(id: string): Promise<DriverTask>;

  // Citizen Reports
  getAllReports(): Promise<CitizenReport[]>;
  getReportsByUser(userId: number): Promise<CitizenReport[]>;
  createReport(data: { userId?: number; type: "illegal_dumping" | "overflowing_bin"; description: string; lat: number; lng: number; photoUrl?: string }): Promise<CitizenReport>;
  updateReportStatus(id: string, status: "pending" | "in_progress" | "resolved"): Promise<CitizenReport>;

  // Pickup Requests
  getPickupsByUser(userId: number): Promise<PickupRequest[]>;
  getAllPickups(): Promise<PickupRequest[]>;
  createPickup(userId: number, wasteType: string, address?: string, notes?: string): Promise<PickupRequest>;
  updatePickupStatus(id: number, status: string, driverId?: number): Promise<PickupRequest>;

  // Eco Points
  getPointsByUser(userId: number): Promise<number>;
  getPointsLog(userId: number): Promise<EcoPointsEntry[]>;
  addPoints(userId: number, action: string, points: number): Promise<EcoPointsEntry>;
  deductPoints(userId: number, action: string, points: number): Promise<EcoPointsEntry>;

  // Subscriptions
  getSubscriptionByUser(userId: number): Promise<Subscription | undefined>;
  upsertSubscription(userId: number, data: Partial<Omit<Subscription, "id" | "userId" | "createdAt">>): Promise<Subscription>;

  // KYC
  getKycByDriver(driverId: number): Promise<DriverKyc | undefined>;
  getAllKyc(): Promise<(DriverKyc & { driverName: string; driverEmail: string })[]>;
  upsertKyc(driverId: number, data: Partial<Omit<DriverKyc, "id" | "driverId" | "createdAt">>): Promise<DriverKyc>;
  updateKycStatus(driverId: number, status: "approved" | "rejected", rejectionReason?: string): Promise<DriverKyc>;
}

class PostgresStorage implements IStorage {
  async getUserByEmail(email: string) {
    const [user] = await getDb().select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number) {
    const [user] = await getDb().select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(name: string, email: string, password: string, role: "user" | "driver" | "admin" = "user") {
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await getDb().insert(users).values({ name, email, passwordHash, role }).returning();
    return user;
  }

  async verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  async getAllUsers() {
    return getDb().select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(id: number, role: "user" | "driver" | "admin") {
    const [user] = await getDb().update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserStatus(_id: number, _status: string) {
    // Status stored in memory for demo (would be a DB field in full prod)
  }

  async getAllBins() {
    return getDb().select().from(wasteBins).orderBy(wasteBins.id);
  }

  async getBinById(id: string) {
    const [bin] = await getDb().select().from(wasteBins).where(eq(wasteBins.id, id));
    return bin;
  }

  async updateBinFillLevel(id: string, fillLevel: number) {
    const [bin] = await getDb().update(wasteBins).set({ fillLevel }).where(eq(wasteBins.id, id)).returning();
    return bin;
  }

  async resetBin(id: string) {
    const today = new Date().toISOString().split("T")[0];
    const [bin] = await getDb().update(wasteBins).set({ fillLevel: 0, lastCollected: today }).where(eq(wasteBins.id, id)).returning();
    return bin;
  }

  async deleteBin(id: string) {
    await getDb().delete(wasteBins).where(eq(wasteBins.id, id));
  }

  async getTasksByDriver(driverId: number) {
    return getDb().select().from(driverTasks).where(eq(driverTasks.driverId, driverId)).orderBy(desc(driverTasks.createdAt));
  }

  async getAllTasks() {
    return getDb().select().from(driverTasks).orderBy(desc(driverTasks.createdAt));
  }

  async completeTask(id: string, driverId: number) {
    const [task] = await getDb().update(driverTasks)
      .set({ completed: true, driverId })
      .where(eq(driverTasks.id, id))
      .returning();
    return task;
  }

  async uncompleteTask(id: string) {
    const [task] = await getDb().update(driverTasks).set({ completed: false }).where(eq(driverTasks.id, id)).returning();
    return task;
  }

  async getAllReports() {
    return getDb().select().from(citizenReports).orderBy(desc(citizenReports.createdAt));
  }

  async getReportsByUser(userId: number) {
    return getDb().select().from(citizenReports).where(eq(citizenReports.userId, userId)).orderBy(desc(citizenReports.createdAt));
  }

  async createReport(data: { userId?: number; type: "illegal_dumping" | "overflowing_bin"; description: string; lat: number; lng: number; photoUrl?: string }) {
    const id = `RPT-${Date.now()}`;
    const [report] = await getDb().insert(citizenReports).values({ id, ...data }).returning();
    return report;
  }

  async updateReportStatus(id: string, status: "pending" | "in_progress" | "resolved") {
    const [report] = await getDb().update(citizenReports).set({ status }).where(eq(citizenReports.id, id)).returning();
    return report;
  }

  async getPickupsByUser(userId: number) {
    return getDb().select().from(pickupRequests).where(eq(pickupRequests.userId, userId)).orderBy(desc(pickupRequests.createdAt));
  }

  async getAllPickups() {
    return getDb().select().from(pickupRequests).orderBy(desc(pickupRequests.createdAt));
  }

  async createPickup(userId: number, wasteType: string, address?: string, notes?: string) {
    const [pickup] = await getDb().insert(pickupRequests)
      .values({ userId, wasteType: wasteType as any, address, notes })
      .returning();
    return pickup;
  }

  async updatePickupStatus(id: number, status: string, driverId?: number | null) {
    const update: Record<string, unknown> = { status: status as any };
    if (driverId !== undefined) update.driverId = driverId ?? null;
    const [pickup] = await getDb().update(pickupRequests)
      .set(update as any)
      .where(eq(pickupRequests.id, id))
      .returning();
    return pickup;
  }

  async getPointsByUser(userId: number) {
    const result = await getDb().select({ total: sql<number>`COALESCE(SUM(${ecoPointsLog.points}), 0)` })
      .from(ecoPointsLog).where(eq(ecoPointsLog.userId, userId));
    return Number(result[0]?.total ?? 0);
  }

  async getPointsLog(userId: number) {
    return getDb().select().from(ecoPointsLog).where(eq(ecoPointsLog.userId, userId)).orderBy(desc(ecoPointsLog.createdAt)).limit(20);
  }

  async addPoints(userId: number, action: string, points: number) {
    const [entry] = await getDb().insert(ecoPointsLog).values({ userId, action, points: Math.abs(points) }).returning();
    return entry;
  }

  async deductPoints(userId: number, action: string, points: number) {
    const [entry] = await getDb().insert(ecoPointsLog).values({ userId, action, points: -Math.abs(points) }).returning();
    return entry;
  }

  async getSubscriptionByUser(userId: number) {
    const [sub] = await getDb().select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async upsertSubscription(userId: number, data: Partial<Omit<Subscription, "id" | "userId" | "createdAt">>) {
    const today = new Date().toISOString().split("T")[0];
    const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const existing = await this.getSubscriptionByUser(userId);

    if (existing) {
      const [sub] = await getDb().update(subscriptions).set(data).where(eq(subscriptions.userId, userId)).returning();
      return sub;
    }

    const [sub] = await getDb().insert(subscriptions).values({
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

  async getKycByDriver(driverId: number) {
    const [kyc] = await getDb().select().from(driverKyc).where(eq(driverKyc.driverId, driverId));
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
      const [kyc] = await getDb().update(driverKyc)
        .set({ ...data, submittedAt: new Date() })
        .where(eq(driverKyc.driverId, driverId))
        .returning();
      return kyc;
    }
    const [kyc] = await getDb().insert(driverKyc)
      .values({ driverId, status: "pending", ...data })
      .returning();
    return kyc;
  }

  async updateKycStatus(driverId: number, status: "approved" | "rejected", rejectionReason?: string) {
    const [kyc] = await getDb().update(driverKyc)
      .set({ status, rejectionReason: rejectionReason ?? null, reviewedAt: new Date() })
      .where(eq(driverKyc.driverId, driverId))
      .returning();
    return kyc;
  }
}

export const storage = new PostgresStorage();
