import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WebP and PDF files are allowed"));
  },
});

// ─── SIMPLE IN-MEMORY RATE LIMITER ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: "Too many requests. Please wait before trying again." });
    }
    next();
  };
}

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 10 * 60 * 1000);

// ─── AUTH MIDDLEWARE ────────────────────────────────────────────────────────

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

function requireDriver(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  if (req.session.role !== "driver" && req.session.role !== "admin") {
    return res.status(403).json({ error: "Drivers only" });
  }
  next();
}

const authRateLimit = rateLimit(10, 15 * 60 * 1000); // 10 attempts per 15 minutes
const MAX_PASSWORD_LENGTH = 72;

export function registerRoutes(app: Express) {

  // ─── SESSION SECRET GUARD ──────────────────────────────────────────────────

  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    console.error("[SECURITY] SESSION_SECRET env var is not set in production. Refusing to start.");
    process.exit(1);
  }

  // ─── FILE UPLOAD ───────────────────────────────────────────────────────────

  app.post("/api/upload", requireAuth, (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
        return res.status(400).json({ error: err.message });
      }
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
    });
  });

  // ─── AUTH ─────────────────────────────────────────────────────────────────

  app.post("/api/auth/register", authRateLimit, async (req, res) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6).max(MAX_PASSWORD_LENGTH),
      role: z.enum(["user", "driver"]).default("user"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { name, email, password, role } = parsed.data;

    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user = await storage.createUser(name, email, password, role);

    const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await storage.upsertSubscription(user.id, { planType: "basic", status: "active", billingCycle: "monthly", nextBillingDate: nextBilling, startedAt: new Date().toISOString().split("T")[0] });

    if (role === "user") await storage.addPoints(user.id, "Welcome bonus", 50);

    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().max(MAX_PASSWORD_LENGTH),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const user = await storage.getUserByEmail(parsed.data.email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (user.status === "suspended") return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    if (user.status === "banned") return res.status(403).json({ error: "Your account has been permanently banned." });

    const ok = await storage.verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status });
  });

  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().max(20).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    if (!parsed.data.name && !parsed.data.phone) return res.status(400).json({ error: "No fields to update" });

    const user = await storage.updateUserProfile(req.session.userId!, parsed.data);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  });

  app.post("/api/auth/change-password", requireAuth, authRateLimit, async (req, res) => {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6).max(MAX_PASSWORD_LENGTH),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ error: "User not found" });

    const ok = await storage.verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    await storage.changePassword(req.session.userId!, parsed.data.newPassword);
    res.json({ ok: true });
  });

  // ─── BINS ─────────────────────────────────────────────────────────────────

  app.get("/api/bins", requireAuth, async (_req, res) => {
    const bins = await storage.getAllBins();
    res.json(bins);
  });

  app.post("/api/bins", requireAdmin, async (req, res) => {
    const schema = z.object({
      id: z.string().min(1),
      location: z.string().min(2),
      lat: z.number(),
      lng: z.number(),
      fillLevel: z.number().int().min(0).max(100).optional(),
      lastCollected: z.string(),
      type: z.enum(["general", "recycling", "organic"]).default("general"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const existing = await storage.getBinById(parsed.data.id);
    if (existing) return res.status(409).json({ error: "A bin with that ID already exists" });

    const bin = await storage.createBin(parsed.data);
    res.status(201).json(bin);
  });

  app.patch("/api/bins/:id/reset", requireAdmin, async (req, res) => {
    const bin = await storage.resetBin(req.params.id);
    res.json(bin);
  });

  app.patch("/api/bins/:id", requireAdmin, async (req, res) => {
    const { fillLevel } = req.body;
    const bin = await storage.updateBinFillLevel(req.params.id, fillLevel);
    res.json(bin);
  });

  app.delete("/api/bins/:id", requireAdmin, async (req, res) => {
    await storage.deleteBin(req.params.id);
    res.json({ ok: true });
  });

  // ─── DRIVER TASKS ─────────────────────────────────────────────────────────

  app.get("/api/tasks", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ error: "User not found" });
    const tasks = user.role === "admin"
      ? await storage.getAllTasks()
      : await storage.getTasksByDriver(user.id);
    res.json(tasks);
  });

  app.post("/api/tasks", requireAdmin, async (req, res) => {
    const schema = z.object({
      id: z.string().min(1),
      binId: z.string().min(1),
      driverId: z.number().int().positive().optional(),
      location: z.string().min(2),
      fillLevel: z.number().int().min(0).max(100),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
      estimatedTime: z.string().min(1),
      wasteType: z.enum(["general", "recycling", "organic", "ewaste"]).default("general"),
      earning: z.number().int().positive(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const bin = await storage.getBinById(parsed.data.binId);
    if (!bin) return res.status(404).json({ error: "Bin not found" });

    const task = await storage.createTask(parsed.data);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id/complete", requireDriver, async (req, res) => {
    const tasks = await storage.getAllTasks();
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Drivers can only complete tasks assigned to them; admins can complete any
    if (req.session.role === "driver" && task.driverId !== req.session.userId) {
      return res.status(403).json({ error: "You can only complete your own tasks" });
    }

    const updated = await storage.completeTask(req.params.id, req.session.userId!);
    await storage.addPoints(req.session.userId!, "Completed pickup", task.earning > 700 ? 20 : 15);
    res.json(updated);
  });

  app.patch("/api/tasks/:id/uncomplete", requireAuth, async (req, res) => {
    const task = await storage.uncompleteTask(req.params.id);
    res.json(task);
  });

  // ─── DRIVER EARNINGS ──────────────────────────────────────────────────────

  app.get("/api/driver/earnings", requireDriver, async (req, res) => {
    const earnings = await storage.getDriverEarnings(req.session.userId!);
    res.json(earnings);
  });

  // ─── CITIZEN REPORTS ──────────────────────────────────────────────────────

  app.get("/api/reports", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ error: "User not found" });
    const reports = (user.role === "admin" || user.role === "driver")
      ? await storage.getAllReports()
      : await storage.getReportsByUser(user.id);
    res.json(reports);
  });

  app.post("/api/reports", requireAuth, async (req, res) => {
    const schema = z.object({
      type: z.enum(["illegal_dumping", "overflowing_bin"]),
      description: z.string().min(5),
      lat: z.number().default(9.9167),
      lng: z.number().default(8.8903),
      photoUrl: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const report = await storage.createReport({ userId: req.session.userId!, ...parsed.data });
    await storage.addPoints(req.session.userId!, "Submitted report", 15);
    res.json(report);
  });

  app.patch("/api/reports/:id", requireAdmin, async (req, res) => {
    const { status } = req.body;
    const report = await storage.updateReportStatus(req.params.id, status);
    res.json(report);
  });

  // ─── PICKUP REQUESTS ──────────────────────────────────────────────────────

  app.get("/api/pickups", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role === "driver" || user.role === "admin") {
      res.json(await storage.getAllPickups());
    } else {
      res.json(await storage.getPickupsByUser(req.session.userId!));
    }
  });

  app.post("/api/pickups", requireAuth, async (req, res) => {
    const schema = z.object({
      wasteType: z.string().default("general"),
      address: z.string().optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { wasteType, address, notes } = parsed.data;
    const pickup = await storage.createPickup(req.session.userId!, wasteType, address, notes);
    await storage.addPoints(req.session.userId!, "Requested pickup", 10);
    res.json(pickup);
  });

  app.patch("/api/pickups/:id/accept", requireDriver, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user || user.role !== "driver") return res.status(403).json({ error: "Drivers only" });
    const pickup = await storage.updatePickupStatus(Number(req.params.id), "assigned", user.id);
    res.json(pickup);
  });

  app.patch("/api/pickups/:id/start", requireDriver, async (req, res) => {
    const pickup = await storage.getPickupById(Number(req.params.id));
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });

    if (req.session.role === "driver" && pickup.driverId !== req.session.userId) {
      return res.status(403).json({ error: "You are not assigned to this pickup" });
    }

    const updated = await storage.updatePickupStatus(Number(req.params.id), "in_progress");
    res.json(updated);
  });

  app.patch("/api/pickups/:id/complete-pickup", requireDriver, async (req, res) => {
    const pickup = await storage.getPickupById(Number(req.params.id));
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });

    if (req.session.role === "driver" && pickup.driverId !== req.session.userId) {
      return res.status(403).json({ error: "You are not assigned to this pickup" });
    }

    const updated = await storage.updatePickupStatus(Number(req.params.id), "completed");
    if (updated.userId) {
      await storage.addPoints(updated.userId, "Pickup completed", 20);
    }
    res.json(updated);
  });

  app.patch("/api/pickups/:id/cancel", requireAuth, async (req, res) => {
    const pickup = await storage.getPickupById(Number(req.params.id));
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });

    const isOwner = pickup.userId === req.session.userId;
    const isAssignedDriver = pickup.driverId === req.session.userId;
    const isAdmin = req.session.role === "admin";

    if (!isOwner && !isAssignedDriver && !isAdmin) {
      return res.status(403).json({ error: "You cannot cancel this pickup" });
    }

    const updated = await storage.updatePickupStatus(Number(req.params.id), "cancelled");
    res.json(updated);
  });

  app.patch("/api/pickups/:id/assign", requireAdmin, async (req, res) => {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: "driverId required" });
    const pickup = await storage.updatePickupStatus(Number(req.params.id), "assigned", Number(driverId));
    res.json(pickup);
  });

  app.patch("/api/pickups/:id/unassign", requireAdmin, async (req, res) => {
    const pickup = await storage.updatePickupStatus(Number(req.params.id), "pending", undefined);
    res.json(pickup);
  });

  // ─── ECO POINTS ───────────────────────────────────────────────────────────

  app.get("/api/eco-points", requireAuth, async (req, res) => {
    const [balance, log] = await Promise.all([
      storage.getPointsByUser(req.session.userId!),
      storage.getPointsLog(req.session.userId!),
    ]);
    res.json({ balance, log });
  });

  app.get("/api/eco-points/leaderboard", requireAuth, async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const leaderboard = await storage.getLeaderboard(limit);
    res.json(leaderboard);
  });

  app.post("/api/eco-points/redeem", requireAuth, async (req, res) => {
    const schema = z.object({ rewardName: z.string(), cost: z.number().positive() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const balance = await storage.getPointsByUser(req.session.userId!);
    if (balance < parsed.data.cost) return res.status(400).json({ error: "Insufficient points" });

    const entry = await storage.deductPoints(req.session.userId!, `Redeemed: ${parsed.data.rewardName}`, parsed.data.cost);
    const newBalance = await storage.getPointsByUser(req.session.userId!);
    res.json({ entry, newBalance });
  });

  // ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────

  app.get("/api/subscription", requireAuth, async (req, res) => {
    let sub = await storage.getSubscriptionByUser(req.session.userId!);
    if (!sub) {
      const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      sub = await storage.upsertSubscription(req.session.userId!, {
        planType: "basic", status: "active", billingCycle: "monthly",
        nextBillingDate: nextBilling, startedAt: new Date().toISOString().split("T")[0],
      });
    }
    res.json(sub);
  });

  app.patch("/api/subscription", requireAuth, async (req, res) => {
    const schema = z.object({
      planType: z.enum(["basic", "pro", "enterprise"]).optional(),
      billingCycle: z.enum(["monthly", "yearly"]).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const sub = await storage.upsertSubscription(req.session.userId!, parsed.data as any);
    res.json(sub);
  });

  // ─── DRIVER KYC ───────────────────────────────────────────────────────────

  app.get("/api/driver/kyc", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user || user.role !== "driver") return res.status(403).json({ error: "Drivers only" });
    const kyc = await storage.getKycByDriver(req.session.userId!);
    res.json(kyc ?? null);
  });

  app.post("/api/driver/kyc", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user || user.role !== "driver") return res.status(403).json({ error: "Drivers only" });
    const schema = z.object({
      govtIdType: z.string().optional(),
      govtIdUrl: z.string().optional(),
      licenseUrl: z.string().optional(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      vehicleYear: z.string().optional(),
      vehiclePlate: z.string().optional(),
      profilePhotoUrl: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const kyc = await storage.upsertKyc(req.session.userId!, { ...parsed.data, status: "pending" });
    res.json(kyc);
  });

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      status: u.status, createdAt: u.createdAt,
    })));
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    const { role } = req.body;
    const user = await storage.updateUserRole(Number(req.params.id), role);
    res.json({ id: user.id, name: user.name, role: user.role });
  });

  app.patch("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
    const schema = z.object({ status: z.enum(["active", "suspended", "banned"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const targetUser = await storage.getUserById(Number(req.params.id));
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    if (targetUser.role === "admin") return res.status(403).json({ error: "Cannot change status of admin accounts" });

    const user = await storage.updateUserStatus(Number(req.params.id), parsed.data.status);
    res.json({ id: user.id, name: user.name, status: user.status });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const [allUsers, allBins, allReports, allTasks, allKyc, pickupStats] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllBins(),
      storage.getAllReports(),
      storage.getAllTasks(),
      storage.getAllKyc(),
      storage.getPickupStats(),
    ]);
    res.json({
      totalUsers: allUsers.filter((u) => u.role === "user").length,
      totalDrivers: allUsers.filter((u) => u.role === "driver").length,
      totalBins: allBins.length,
      totalReports: allReports.length,
      pendingReports: allReports.filter((r) => r.status === "pending").length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter((t) => t.completed).length,
      pendingKyc: allKyc.filter((k) => k.status === "pending").length,
      pickups: pickupStats,
    });
  });

  app.get("/api/admin/kyc", requireAdmin, async (_req, res) => {
    const kycs = await storage.getAllKyc();
    res.json(kycs);
  });

  app.patch("/api/admin/kyc/:driverId", requireAdmin, async (req, res) => {
    const schema = z.object({
      status: z.enum(["approved", "rejected"]),
      rejectionReason: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const kyc = await storage.updateKycStatus(
      Number(req.params.driverId),
      parsed.data.status,
      parsed.data.rejectionReason,
    );
    res.json(kyc);
  });
}
