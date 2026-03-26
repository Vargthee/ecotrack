export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "driver" | "admin";
  status: "active" | "suspended" | "banned";
  joinedAt: string;
  lastActive: string;
}

export interface AdminDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehiclePlate: string;
  status: "on_duty" | "off_duty" | "on_leave";
  completedTasks: number;
  rating: number;
  assignedZone: string;
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  plan: "basic" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due";
  startedAt: string;
  nextBilling: string;
  amountNgn: number;
}

export const adminUsers: AdminUser[] = [
  { id: "USR-001", name: "Amina Bello", email: "amina@example.com", role: "user", status: "active", joinedAt: "2025-11-10", lastActive: "2026-03-17" },
  { id: "USR-002", name: "Chukwudi Eze", email: "chukwudi@example.com", role: "driver", status: "active", joinedAt: "2025-12-05", lastActive: "2026-03-18" },
  { id: "USR-003", name: "Fatima Yusuf", email: "fatima@example.com", role: "admin", status: "active", joinedAt: "2025-08-20", lastActive: "2026-03-18" },
  { id: "USR-004", name: "Ibrahim Musa", email: "ibrahim@example.com", role: "user", status: "suspended", joinedAt: "2026-01-15", lastActive: "2026-02-28" },
  { id: "USR-005", name: "Grace Okonkwo", email: "grace@example.com", role: "user", status: "active", joinedAt: "2026-02-01", lastActive: "2026-03-16" },
  { id: "USR-006", name: "Tunde Adeyemi", email: "tunde@example.com", role: "driver", status: "active", joinedAt: "2025-10-20", lastActive: "2026-03-18" },
  { id: "USR-007", name: "Hauwa Sani", email: "hauwa@example.com", role: "user", status: "banned", joinedAt: "2026-01-08", lastActive: "2026-02-10" },
  { id: "USR-008", name: "Emeka Nwosu", email: "emeka@example.com", role: "user", status: "active", joinedAt: "2026-03-01", lastActive: "2026-03-17" },
];

export const adminDrivers: AdminDriver[] = [
  { id: "DRV-001", name: "Chukwudi Eze", email: "chukwudi@example.com", phone: "+234 812 345 6789", vehiclePlate: "JOS-234-AB", status: "on_duty", completedTasks: 347, rating: 4.8, assignedZone: "Jos North" },
  { id: "DRV-002", name: "Tunde Adeyemi", email: "tunde@example.com", phone: "+234 803 456 7890", vehiclePlate: "JOS-567-CD", status: "on_duty", completedTasks: 289, rating: 4.6, assignedZone: "Jos South" },
  { id: "DRV-003", name: "Musa Abdullahi", email: "musa@example.com", phone: "+234 805 678 9012", vehiclePlate: "JOS-891-EF", status: "off_duty", completedTasks: 412, rating: 4.9, assignedZone: "Bukuru" },
  { id: "DRV-004", name: "Daniel Okoro", email: "daniel@example.com", phone: "+234 816 789 0123", vehiclePlate: "JOS-012-GH", status: "on_leave", completedTasks: 156, rating: 4.3, assignedZone: "Jos Central" },
];

export const subscribers: Subscriber[] = [
  { id: "SUB-001", name: "Amina Bello", email: "amina@example.com", plan: "basic", status: "active", startedAt: "2026-01-01", amountNgn: 2500, nextBilling: "2026-04-01" },
  { id: "SUB-002", name: "Grace Okonkwo", email: "grace@example.com", plan: "pro", status: "active", startedAt: "2026-02-01", amountNgn: 15000, nextBilling: "2026-04-01" },
  { id: "SUB-003", name: "Emeka Nwosu", email: "emeka@example.com", plan: "enterprise", status: "active", startedAt: "2026-03-01", amountNgn: 85000, nextBilling: "2026-04-01" },
  { id: "SUB-004", name: "Ibrahim Musa", email: "ibrahim@example.com", plan: "basic", status: "past_due", startedAt: "2025-12-15", amountNgn: 2500, nextBilling: "2026-03-15" },
  { id: "SUB-005", name: "Hauwa Sani", email: "hauwa@example.com", plan: "pro", status: "canceled", startedAt: "2025-11-01", amountNgn: 15000, nextBilling: "—" },
  { id: "SUB-006", name: "Plateau State Govt", email: "plateau@gov.ng", plan: "enterprise", status: "active", startedAt: "2025-09-01", amountNgn: 85000, nextBilling: "2026-04-01" },
];

export const adminStats = {
  totalUsers: 8,
  activeUsers: 6,
  totalDrivers: 4,
  driversOnDuty: 2,
  totalSubscribers: 6,
  activeSubscribers: 4,
  monthlyRevenue: 487500,
  totalBins: 10,
  pendingReports: 1,
};
