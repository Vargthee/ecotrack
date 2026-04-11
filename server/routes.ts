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

export function registerRoutes(app: Express) {

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

  app.post("/api/auth/register", async (req, res) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["user", "driver"]).default("user"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { name, email, password, role } = parsed.data;

    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user = await storage.createUser(name, email, password, role);

    // Provision default subscription
    const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await storage.upsertSubscription(user.id, { planType: "basic", status: "active", billingCycle: "monthly", nextBillingDate: nextBilling, startedAt: new Date().toISOString().split("T")[0] });

    // Give 50 welcome points for users
    if (role === "user") await storage.addPoints(user.id, "Welcome bonus", 50);

    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  app.post("/api/auth/login", async (req, res) => {
    const schema = z.object({ email: z.string().email(), password: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const user = await storage.getUserByEmail(parsed.data.email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

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
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  });

  // ─── BINS ─────────────────────────────────────────────────────────────────

  app.get("/api/bins", requireAuth, async (_req, res) => {
    const bins = await storage.getAllBins();
    res.json(bins);
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

  app.patch("/api/tasks/:id/complete", requireAuth, async (req, res) => {
    const task = await storage.completeTask(req.params.id, req.session.userId!);
    // Award eco points to driver
    await storage.addPoints(req.session.userId!, "Completed pickup", task.earning > 700 ? 20 : 15);
    res.json(task);
  });

  app.patch("/api/tasks/:id/uncomplete", requireAuth, async (req, res) => {
    const task = await storage.uncompleteTask(req.params.id);
    res.json(task);
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
    // Reward points for reporting
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
    // Drivers and admins get all pickups; users get their own
    if (user.role === "driver" || user.role === "admin") {
      const pickups = await storage.getAllPickups();
      res.json(pickups);
    } else {
      const pickups = await storage.getPickupsByUser(req.session.userId!);
      res.json(pickups);
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

  app.patch("/api/pickups/:id/accept", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user || user.role !== "driver") return res.status(403).json({ error: "Drivers only" });
    const pickup = await storage.updatePickupStatus(Number(req.params.id), "assigned", user.id);
    res.json(pickup);
  });

  app.patch("/api/pickups/:id/start", requireAuth, async (req, res) => {
    const pickup = await storage.updatePickupStatus(Number(req.params.id), "in_progress");
    res.json(pickup);
  });

  app.patch("/api/pickups/:id/complete-pickup", requireAuth, async (req, res) => {
    const pickup = await storage.updatePickupStatus(Number(req.params.id), "completed");
    if (pickup.userId) {
      await storage.addPoints(pickup.userId, "Pickup completed", 20);
    }
    res.json(pickup);
  });

  app.patch("/api/pickups/:id/cancel", requireAuth, async (req, res) => {
    const pickup = await storage.updatePickupStatus(Number(req.params.id), "cancelled");
    res.json(pickup);
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
    res.json(allUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    const { role } = req.body;
    const user = await storage.updateUserRole(Number(req.params.id), role);
    res.json({ id: user.id, name: user.name, role: user.role });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const [allUsers, allBins, allReports, allTasks, allKyc] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllBins(),
      storage.getAllReports(),
      storage.getAllTasks(),
      storage.getAllKyc(),
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
