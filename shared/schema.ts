import { pgTable, serial, text, integer, boolean, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["user", "driver", "admin"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "approved", "rejected"]);
export const binTypeEnum = pgEnum("bin_type", ["general", "recycling", "organic"]);
export const taskPriorityEnum = pgEnum("task_priority", ["high", "medium", "low"]);
export const wasteTypeEnum = pgEnum("waste_type", ["general", "recycling", "organic", "ewaste"]);
export const reportTypeEnum = pgEnum("report_type", ["illegal_dumping", "overflowing_bin"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "in_progress", "resolved"]);
export const planTierEnum = pgEnum("plan_tier", ["basic", "pro", "enterprise"]);
export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "yearly"]);
export const subStatusEnum = pgEnum("sub_status", ["active", "canceled", "past_due"]);
export const pickupStatusEnum = pgEnum("pickup_status", ["pending", "assigned", "in_progress", "completed", "cancelled"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wasteBins = pgTable("waste_bins", {
  id: text("id").primaryKey(),
  location: text("location").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  fillLevel: integer("fill_level").notNull().default(0),
  lastCollected: text("last_collected").notNull(),
  type: binTypeEnum("type").notNull().default("general"),
});

export const driverTasks = pgTable("driver_tasks", {
  id: text("id").primaryKey(),
  binId: text("bin_id").notNull().references(() => wasteBins.id),
  driverId: integer("driver_id").references(() => users.id),
  location: text("location").notNull(),
  fillLevel: integer("fill_level").notNull(),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  estimatedTime: text("estimated_time").notNull(),
  wasteType: wasteTypeEnum("waste_type").notNull().default("general"),
  earning: integer("earning").notNull().default(600),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const citizenReports = pgTable("citizen_reports", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: reportTypeEnum("type").notNull(),
  description: text("description").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  photoUrl: text("photo_url"),
  status: reportStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pickupRequests = pgTable("pickup_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  wasteType: wasteTypeEnum("waste_type").notNull().default("general"),
  status: pickupStatusEnum("status").notNull().default("pending"),
  driverId: integer("driver_id").references(() => users.id),
  notes: text("notes"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ecoPointsLog = pgTable("eco_points_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const driverKyc = pgTable("driver_kyc", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => users.id).unique(),
  status: kycStatusEnum("status").notNull().default("pending"),
  govtIdType: text("govt_id_type"),
  govtIdUrl: text("govt_id_url"),
  licenseUrl: text("license_url"),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehicleYear: text("vehicle_year"),
  vehiclePlate: text("vehicle_plate"),
  profilePhotoUrl: text("profile_photo_url"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  planType: planTierEnum("plan_type").notNull().default("basic"),
  status: subStatusEnum("status").notNull().default("active"),
  billingCycle: billingCycleEnum("billing_cycle").notNull().default("monthly"),
  nextBillingDate: text("next_billing_date").notNull(),
  startedAt: text("started_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertBinSchema = createInsertSchema(wasteBins);
export const insertTaskSchema = createInsertSchema(driverTasks).omit({ createdAt: true });
export const insertReportSchema = createInsertSchema(citizenReports).omit({ createdAt: true });
export const insertPickupSchema = createInsertSchema(pickupRequests).omit({ id: true, createdAt: true });
export const insertEcoPointSchema = createInsertSchema(ecoPointsLog).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertKycSchema = createInsertSchema(driverKyc).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WasteBin = typeof wasteBins.$inferSelect;
export type DriverTask = typeof driverTasks.$inferSelect;
export type CitizenReport = typeof citizenReports.$inferSelect;
export type PickupRequest = typeof pickupRequests.$inferSelect;
export type EcoPointsEntry = typeof ecoPointsLog.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type DriverKyc = typeof driverKyc.$inferSelect;
