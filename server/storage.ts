import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  users, wasteBins, driverTasks, citizenReports, pickupRequests,
  ecoPointsLog, subscriptions,
  type User, type WasteBin, type DriverTask, type CitizenReport,
  type PickupRequest, type EcoPointsEntry, type Subscription,
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
}

class PostgresStorage implements IStorage {
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(name: string, email: string, password: string, role: "user" | "driver" | "admin" = "user") {
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ name, email, passwordHash, role }).returning();
    return user;
  }

  async verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  async getAllUsers() {
    return db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(id: number, role: "user" | "driver" | "admin") {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserStatus(_id: number, _status: string) {
    // Status stored in memory for demo (would be a DB field in full prod)
  }

  async getAllBins() {
    return db.select().from(wasteBins).orderBy(wasteBins.id);
  }

  async getBinById(id: string) {
    const [bin] = await db.select().from(wasteBins).where(eq(wasteBins.id, id));
    return bin;
  }

  async updateBinFillLevel(id: string, fillLevel: number) {
    const [bin] = await db.update(wasteBins).set({ fillLevel }).where(eq(wasteBins.id, id)).returning();
    return bin;
  }

  async resetBin(id: string) {
    const today = new Date().toISOString().split("T")[0];
    const [bin] = await db.update(wasteBins).set({ fillLevel: 0, lastCollected: today }).where(eq(wasteBins.id, id)).returning();
    return bin;
  }

  async deleteBin(id: string) {
    await db.delete(wasteBins).where(eq(wasteBins.id, id));
  }

  async getTasksByDriver(driverId: number) {
    return db.select().from(driverTasks).where(eq(driverTasks.driverId, driverId)).orderBy(desc(driverTasks.createdAt));
  }

  async getAllTasks() {
    return db.select().from(driverTasks).orderBy(desc(driverTasks.createdAt));
  }

  async completeTask(id: string, driverId: number) {
    const [task] = await db.update(driverTasks)
      .set({ completed: true, driverId })
      .where(eq(driverTasks.id, id))
      .returning();
    return task;
  }

  async uncompleteTask(id: string) {
    const [task] = await db.update(driverTasks).set({ completed: false }).where(eq(driverTasks.id, id)).returning();
    return task;
  }

  async getAllReports() {
    return db.select().from(citizenReports).orderBy(desc(citizenReports.createdAt));
  }

  async getReportsByUser(userId: number) {
    return db.select().from(citizenReports).where(eq(citizenReports.userId, userId)).orderBy(desc(citizenReports.createdAt));
  }

  async createReport(data: { userId?: number; type: "illegal_dumping" | "overflowing_bin"; description: string; lat: number; lng: number; photoUrl?: string }) {
    const id = `RPT-${Date.now()}`;
    const [report] = await db.insert(citizenReports).values({ id, ...data }).returning();
    return report;
  }

  async updateReportStatus(id: string, status: "pending" | "in_progress" | "resolved") {
    const [report] = await db.update(citizenReports).set({ status }).where(eq(citizenReports.id, id)).returning();
    return report;
  }

  async getPickupsByUser(userId: number) {
    return db.select().from(pickupRequests).where(eq(pickupRequests.userId, userId)).orderBy(desc(pickupRequests.createdAt));
  }

  async getAllPickups() {
    return db.select().from(pickupRequests).orderBy(desc(pickupRequests.createdAt));
  }

  async createPickup(userId: number, wasteType: string, address?: string, notes?: string) {
    const [pickup] = await db.insert(pickupRequests)
      .values({ userId, wasteType: wasteType as any, address, notes })
      .returning();
    return pickup;
  }

  async updatePickupStatus(id: number, status: string, driverId?: number) {
    const [pickup] = await db.update(pickupRequests)
      .set({ status: status as any, ...(driverId ? { driverId } : {}) })
      .where(eq(pickupRequests.id, id))
      .returning();
    return pickup;
  }

  async getPointsByUser(userId: number) {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${ecoPointsLog.points}), 0)` })
      .from(ecoPointsLog).where(eq(ecoPointsLog.userId, userId));
    return Number(result[0]?.total ?? 0);
  }

  async getPointsLog(userId: number) {
    return db.select().from(ecoPointsLog).where(eq(ecoPointsLog.userId, userId)).orderBy(desc(ecoPointsLog.createdAt)).limit(20);
  }

  async addPoints(userId: number, action: string, points: number) {
    const [entry] = await db.insert(ecoPointsLog).values({ userId, action, points: Math.abs(points) }).returning();
    return entry;
  }

  async deductPoints(userId: number, action: string, points: number) {
    const [entry] = await db.insert(ecoPointsLog).values({ userId, action, points: -Math.abs(points) }).returning();
    return entry;
  }

  async getSubscriptionByUser(userId: number) {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async upsertSubscription(userId: number, data: Partial<Omit<Subscription, "id" | "userId" | "createdAt">>) {
    const today = new Date().toISOString().split("T")[0];
    const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const existing = await this.getSubscriptionByUser(userId);

    if (existing) {
      const [sub] = await db.update(subscriptions).set(data).where(eq(subscriptions.userId, userId)).returning();
      return sub;
    }

    const [sub] = await db.insert(subscriptions).values({
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
}

export const storage = new PostgresStorage();
