import { getDb } from "./db";
import bcrypt from "bcryptjs";
import {
  users, wasteBins, driverTasks, citizenReports,
  pickupRequests, ecoPointsLog, subscriptions, driverKyc,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function seedDatabase() {
  if (!db) { console.log("[seed] No DB — skipping"); return; }

  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) { console.log("[seed] Data already present — skipping"); return; }

  console.log("[seed] Seeding demo data…");

  // ─── USERS ─────────────────────────────────────────────────────────────────
  const [admin] = await db.insert(users).values({
    name: "Plateau Admin",
    email: "admin@ecotrack.com",
    passwordHash: await hash("admin123"),
    role: "admin",
    phone: "+234 800 111 0001",
  }).returning();

  const [driver1] = await db.insert(users).values({
    name: "Chukwudi Eze",
    email: "driver@ecotrack.com",
    passwordHash: await hash("driver123"),
    role: "driver",
    phone: "+234 803 291 4455",
  }).returning();

  const [driver2] = await db.insert(users).values({
    name: "Ibrahim Musa",
    email: "ibrahim.musa@ecotrack.com",
    passwordHash: await hash("driver123"),
    role: "driver",
    phone: "+234 806 178 3321",
  }).returning();

  const [driver3] = await db.insert(users).values({
    name: "Solomon Danjuma",
    email: "solomon.danjuma@ecotrack.com",
    passwordHash: await hash("driver123"),
    role: "driver",
    phone: "+234 809 447 6612",
  }).returning();

  const [user1] = await db.insert(users).values({
    name: "Amaka Obi",
    email: "user@ecotrack.com",
    passwordHash: await hash("user123"),
    role: "user",
    phone: "+234 812 334 5566",
  }).returning();

  const [user2] = await db.insert(users).values({
    name: "Halima Sule",
    email: "halima.sule@ecotrack.com",
    passwordHash: await hash("user123"),
    role: "user",
    phone: "+234 817 229 0043",
  }).returning();

  const [user3] = await db.insert(users).values({
    name: "Emeka Nwosu",
    email: "emeka.nwosu@ecotrack.com",
    passwordHash: await hash("user123"),
    role: "user",
    phone: "+234 808 551 2290",
  }).returning();

  const [user4] = await db.insert(users).values({
    name: "Fatima Abdullahi",
    email: "fatima.abdullahi@ecotrack.com",
    passwordHash: await hash("user123"),
    role: "user",
    phone: "+234 705 334 8812",
  }).returning();

  const [user5] = await db.insert(users).values({
    name: "Daniel Lalong",
    email: "daniel.lalong@ecotrack.com",
    passwordHash: await hash("user123"),
    role: "user",
    phone: "+234 902 119 7745",
  }).returning();

  console.log("[seed] Users created");

  // ─── WASTE BINS ────────────────────────────────────────────────────────────
  await db.insert(wasteBins).values([
    { id: "BIN-001", location: "Terminus Market, Jos", lat: 9.9167, lng: 8.8903, fillLevel: 85, lastCollected: "2026-04-06", type: "general" },
    { id: "BIN-002", location: "University of Jos Gate", lat: 9.9400, lng: 8.8800, fillLevel: 42, lastCollected: "2026-04-08", type: "recycling" },
    { id: "BIN-003", location: "Jos Main Market", lat: 9.9220, lng: 8.8950, fillLevel: 91, lastCollected: "2026-04-05", type: "general" },
    { id: "BIN-004", location: "Bukuru Roundabout", lat: 9.7940, lng: 8.8680, fillLevel: 67, lastCollected: "2026-04-07", type: "organic" },
    { id: "BIN-005", location: "Farin Gada, Jos", lat: 9.9050, lng: 8.9050, fillLevel: 23, lastCollected: "2026-04-09", type: "recycling" },
    { id: "BIN-006", location: "Angwan Rogo, Jos", lat: 9.8900, lng: 8.8600, fillLevel: 95, lastCollected: "2026-04-04", type: "general" },
    { id: "BIN-007", location: "Hill Station Junction", lat: 9.9300, lng: 8.9100, fillLevel: 55, lastCollected: "2026-04-07", type: "recycling" },
    { id: "BIN-008", location: "Bauchi Road, Jos", lat: 9.9350, lng: 8.9200, fillLevel: 78, lastCollected: "2026-04-06", type: "general" },
    { id: "BIN-009", location: "Hwolshe, Jos South", lat: 9.8200, lng: 8.8400, fillLevel: 14, lastCollected: "2026-04-09", type: "organic" },
    { id: "BIN-010", location: "Plateau Specialist Hospital", lat: 9.9100, lng: 8.8750, fillLevel: 88, lastCollected: "2026-04-04", type: "general" },
    { id: "BIN-011", location: "NASCO Ceramics Road", lat: 9.8750, lng: 8.8950, fillLevel: 60, lastCollected: "2026-04-07", type: "recycling" },
    { id: "BIN-012", location: "Rayfield Resort Area", lat: 9.9480, lng: 8.8650, fillLevel: 33, lastCollected: "2026-04-08", type: "organic" },
  ]);

  console.log("[seed] Waste bins created");

  // ─── DRIVER TASKS ──────────────────────────────────────────────────────────
  await db.insert(driverTasks).values([
    { id: "TASK-001", binId: "BIN-006", driverId: driver1.id, location: "Angwan Rogo, Jos", fillLevel: 95, priority: "high", completed: true, estimatedTime: "8 min", wasteType: "general", earning: 850 },
    { id: "TASK-002", binId: "BIN-003", driverId: driver1.id, location: "Jos Main Market", fillLevel: 91, priority: "high", completed: true, estimatedTime: "12 min", wasteType: "general", earning: 850 },
    { id: "TASK-003", binId: "BIN-010", driverId: driver1.id, location: "Plateau Specialist Hospital", fillLevel: 88, priority: "high", completed: false, estimatedTime: "10 min", wasteType: "general", earning: 800 },
    { id: "TASK-004", binId: "BIN-001", driverId: driver1.id, location: "Terminus Market, Jos", fillLevel: 85, priority: "high", completed: false, estimatedTime: "7 min", wasteType: "general", earning: 800 },
    { id: "TASK-005", binId: "BIN-008", driverId: driver2.id, location: "Bauchi Road, Jos", fillLevel: 78, priority: "medium", completed: true, estimatedTime: "15 min", wasteType: "general", earning: 650 },
    { id: "TASK-006", binId: "BIN-004", driverId: driver2.id, location: "Bukuru Roundabout", fillLevel: 67, priority: "medium", completed: false, estimatedTime: "20 min", wasteType: "organic", earning: 600 },
    { id: "TASK-007", binId: "BIN-011", driverId: driver2.id, location: "NASCO Ceramics Road", fillLevel: 60, priority: "medium", completed: false, estimatedTime: "18 min", wasteType: "recycling", earning: 600 },
    { id: "TASK-008", binId: "BIN-007", driverId: driver3.id, location: "Hill Station Junction", fillLevel: 55, priority: "medium", completed: true, estimatedTime: "11 min", wasteType: "recycling", earning: 600 },
  ]);

  console.log("[seed] Driver tasks created");

  // ─── PICKUP REQUESTS ───────────────────────────────────────────────────────
  await db.insert(pickupRequests).values([
    { userId: user1.id, wasteType: "recycling", status: "completed", driverId: driver1.id, address: "14 Dogon Dutse St, Jos", notes: "Cardboard boxes and plastic bottles" },
    { userId: user1.id, wasteType: "general", status: "completed", driverId: driver1.id, address: "14 Dogon Dutse St, Jos", notes: null },
    { userId: user1.id, wasteType: "organic", status: "in_progress", driverId: driver2.id, address: "14 Dogon Dutse St, Jos", notes: "Kitchen waste, please bring bags" },
    { userId: user1.id, wasteType: "ewaste", status: "pending", driverId: null, address: "14 Dogon Dutse St, Jos", notes: "Old laptops and phone chargers" },
    { userId: user2.id, wasteType: "general", status: "completed", driverId: driver2.id, address: "7 Tafawa Balewa Way, Jos", notes: null },
    { userId: user2.id, wasteType: "recycling", status: "assigned", driverId: driver1.id, address: "7 Tafawa Balewa Way, Jos", notes: "Glass bottles and aluminium cans" },
    { userId: user3.id, wasteType: "general", status: "completed", driverId: driver1.id, address: "23 Ahmadu Bello Way, Jos", notes: null },
    { userId: user3.id, wasteType: "organic", status: "pending", driverId: null, address: "23 Ahmadu Bello Way, Jos", notes: "Garden clippings" },
    { userId: user4.id, wasteType: "ewaste", status: "completed", driverId: driver3.id, address: "5 Rwang Pam St, Jos", notes: "Television and microwave" },
    { userId: user5.id, wasteType: "general", status: "pending", driverId: null, address: "88 Miango Road, Bukuru", notes: null },
  ]);

  console.log("[seed] Pickup requests created");

  // ─── CITIZEN REPORTS ───────────────────────────────────────────────────────
  await db.insert(citizenReports).values([
    { id: "RPT-001", userId: user1.id, type: "illegal_dumping", description: "Large pile of construction debris dumped near Gada Biyu park entrance, blocking the path", lat: 9.9161, lng: 8.8920, status: "in_progress" },
    { id: "RPT-002", userId: user2.id, type: "overflowing_bin", description: "Bin outside NECO House has been overflowing for 3 days — bad smell affecting offices", lat: 9.9215, lng: 8.8948, status: "pending" },
    { id: "RPT-003", userId: user3.id, type: "illegal_dumping", description: "Old mattresses and furniture dumped on sidewalk along Yakubu Gowon Way", lat: 9.9305, lng: 8.9108, status: "resolved" },
    { id: "RPT-004", userId: user4.id, type: "overflowing_bin", description: "Bin near ECWA Good Women Hospital overflowing — health hazard for patients", lat: 9.9080, lng: 8.8740, status: "pending" },
    { id: "RPT-005", userId: user1.id, type: "illegal_dumping", description: "Bags of household refuse dumped in drainage channel behind Terminus Market", lat: 9.9175, lng: 8.8915, status: "pending" },
  ]);

  console.log("[seed] Citizen reports created");

  // ─── ECO POINTS ────────────────────────────────────────────────────────────
  const pointsData = [
    // user1 (Pro subscriber) — active eco participant
    { userId: user1.id, action: "Welcome bonus", points: 50 },
    { userId: user1.id, action: "Requested pickup", points: 10 },
    { userId: user1.id, action: "Pickup completed", points: 20 },
    { userId: user1.id, action: "Requested pickup", points: 10 },
    { userId: user1.id, action: "Pickup completed", points: 20 },
    { userId: user1.id, action: "Submitted report", points: 15 },
    { userId: user1.id, action: "Recycling drop-off", points: 30 },
    { userId: user1.id, action: "Requested pickup", points: 10 },
    { userId: user1.id, action: "Pickup completed", points: 20 },
    { userId: user1.id, action: "Submitted report", points: 15 },
    { userId: user1.id, action: "Monthly eco challenge", points: 100 },
    // user2
    { userId: user2.id, action: "Welcome bonus", points: 50 },
    { userId: user2.id, action: "Requested pickup", points: 10 },
    { userId: user2.id, action: "Pickup completed", points: 20 },
    { userId: user2.id, action: "Submitted report", points: 15 },
    { userId: user2.id, action: "Recycling drop-off", points: 30 },
    // user3
    { userId: user3.id, action: "Welcome bonus", points: 50 },
    { userId: user3.id, action: "Requested pickup", points: 10 },
    { userId: user3.id, action: "Pickup completed", points: 20 },
    // user4
    { userId: user4.id, action: "Welcome bonus", points: 50 },
    { userId: user4.id, action: "Requested pickup", points: 10 },
    { userId: user4.id, action: "Pickup completed", points: 20 },
    { userId: user4.id, action: "E-waste special reward", points: 50 },
    // user5
    { userId: user5.id, action: "Welcome bonus", points: 50 },
    { userId: user5.id, action: "Requested pickup", points: 10 },
    // drivers also earn points from completing tasks
    { userId: driver1.id, action: "Welcome bonus", points: 50 },
    { userId: driver1.id, action: "Completed pickup", points: 20 },
    { userId: driver1.id, action: "Completed pickup", points: 20 },
    { userId: driver2.id, action: "Welcome bonus", points: 50 },
    { userId: driver2.id, action: "Completed pickup", points: 15 },
    { userId: driver3.id, action: "Welcome bonus", points: 50 },
    { userId: driver3.id, action: "Completed pickup", points: 15 },
  ];

  await db.insert(ecoPointsLog).values(pointsData);

  console.log("[seed] Eco points created");

  // ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];

  await db.insert(subscriptions).values([
    { userId: user1.id, planType: "pro", status: "active", billingCycle: "monthly", nextBillingDate: nextMonth, startedAt: "2026-01-11" },
    { userId: user2.id, planType: "enterprise", status: "active", billingCycle: "yearly", nextBillingDate: nextYear, startedAt: "2026-02-01" },
    { userId: user3.id, planType: "basic", status: "active", billingCycle: "monthly", nextBillingDate: nextMonth, startedAt: "2026-03-15" },
    { userId: user4.id, planType: "pro", status: "active", billingCycle: "yearly", nextBillingDate: nextYear, startedAt: "2026-01-20" },
    { userId: user5.id, planType: "basic", status: "active", billingCycle: "monthly", nextBillingDate: nextMonth, startedAt: today },
    // Drivers also get a subscription entry (basic/no-cost — needed for FK)
    { userId: driver1.id, planType: "basic", status: "active", billingCycle: "monthly", nextBillingDate: nextMonth, startedAt: "2026-01-05" },
    { userId: driver2.id, planType: "basic", status: "active", billingCycle: "monthly", nextBillingDate: nextMonth, startedAt: "2026-02-12" },
    { userId: driver3.id, planType: "basic", status: "active", billingCycle: "monthly", nextBillingDate: nextMonth, startedAt: "2026-03-01" },
  ]);

  console.log("[seed] Subscriptions created");

  // ─── KYC ───────────────────────────────────────────────────────────────────
  await db.insert(driverKyc).values([
    {
      driverId: driver1.id,
      status: "approved",
      govtIdType: "national_id",
      govtIdUrl: "govt_id_driver1.jpg",
      licenseUrl: "license_driver1.jpg",
      vehicleMake: "Toyota",
      vehicleModel: "Hilux",
      vehicleYear: "2020",
      vehiclePlate: "JOS-421-AE",
      profilePhotoUrl: "photo_driver1.jpg",
      submittedAt: new Date("2026-01-07"),
      reviewedAt: new Date("2026-01-09"),
    },
    {
      driverId: driver2.id,
      status: "pending",
      govtIdType: "voters_card",
      govtIdUrl: "govt_id_driver2.jpg",
      licenseUrl: "license_driver2.jpg",
      vehicleMake: "Nissan",
      vehicleModel: "Pickup D22",
      vehicleYear: "2019",
      vehiclePlate: "BK-112-MH",
      profilePhotoUrl: "photo_driver2.jpg",
      submittedAt: new Date("2026-04-08"),
      reviewedAt: null,
    },
    {
      driverId: driver3.id,
      status: "rejected",
      govtIdType: "passport",
      govtIdUrl: "govt_id_driver3.jpg",
      licenseUrl: "license_driver3.jpg",
      vehicleMake: "Mitsubishi",
      vehicleModel: "L200",
      vehicleYear: "2017",
      vehiclePlate: "JOS-889-BC",
      profilePhotoUrl: "photo_driver3.jpg",
      rejectionReason: "Driver's license photo is blurry and unreadable. Please resubmit a clear, high-resolution image.",
      submittedAt: new Date("2026-03-20"),
      reviewedAt: new Date("2026-03-22"),
    },
  ]);

  console.log("[seed] KYC records created");
  console.log("[seed] ✅ Demo data seeded successfully!");
  console.log("[seed] Credentials:");
  console.log("[seed]   admin@ecotrack.com / admin123");
  console.log("[seed]   driver@ecotrack.com / driver123  (KYC approved)");
  console.log("[seed]   user@ecotrack.com / user123      (Pro plan)");
}
