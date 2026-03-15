export interface WasteBin {
  id: string;
  location: string;
  lat: number;
  lng: number;
  fillLevel: number; // 0-100
  lastCollected: string;
  type: "general" | "recycling" | "organic";
}

export interface DriverTask {
  id: string;
  binId: string;
  location: string;
  fillLevel: number;
  priority: "high" | "medium" | "low";
  completed: boolean;
  estimatedTime: string;
}

export interface CitizenReport {
  id: string;
  type: "illegal_dumping" | "overflowing_bin";
  description: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  status: "pending" | "in_progress" | "resolved";
  createdAt: string;
}

export const wasteBins: WasteBin[] = [
  { id: "BIN-001", location: "Main St & 1st Ave", lat: 40.7128, lng: -74.006, fillLevel: 85, lastCollected: "2026-03-14", type: "general" },
  { id: "BIN-002", location: "Oak Park Entrance", lat: 40.7148, lng: -74.003, fillLevel: 42, lastCollected: "2026-03-14", type: "recycling" },
  { id: "BIN-003", location: "City Hall Plaza", lat: 40.7138, lng: -74.008, fillLevel: 91, lastCollected: "2026-03-13", type: "general" },
  { id: "BIN-004", location: "River Walk South", lat: 40.7108, lng: -74.001, fillLevel: 67, lastCollected: "2026-03-14", type: "organic" },
  { id: "BIN-005", location: "Market Square", lat: 40.7158, lng: -74.009, fillLevel: 23, lastCollected: "2026-03-15", type: "recycling" },
  { id: "BIN-006", location: "School District #4", lat: 40.7118, lng: -74.011, fillLevel: 95, lastCollected: "2026-03-12", type: "general" },
  { id: "BIN-007", location: "Library Corner", lat: 40.7168, lng: -74.005, fillLevel: 55, lastCollected: "2026-03-14", type: "recycling" },
  { id: "BIN-008", location: "Central Station", lat: 40.7098, lng: -74.007, fillLevel: 78, lastCollected: "2026-03-13", type: "general" },
  { id: "BIN-009", location: "Sports Complex", lat: 40.7178, lng: -74.002, fillLevel: 12, lastCollected: "2026-03-15", type: "organic" },
  { id: "BIN-010", location: "Hospital Zone", lat: 40.7088, lng: -74.004, fillLevel: 88, lastCollected: "2026-03-12", type: "general" },
];

export const driverTasks: DriverTask[] = wasteBins
  .filter((b) => b.fillLevel > 70)
  .sort((a, b) => b.fillLevel - a.fillLevel)
  .map((b) => ({
    id: `TASK-${b.id}`,
    binId: b.id,
    location: b.location,
    fillLevel: b.fillLevel,
    priority: b.fillLevel > 85 ? "high" : "medium",
    completed: false,
    estimatedTime: `${Math.round(5 + Math.random() * 15)} min`,
  }));

export const citizenReports: CitizenReport[] = [
  { id: "RPT-001", type: "illegal_dumping", description: "Large pile of construction debris near park entrance", lat: 40.7135, lng: -74.005, status: "pending", createdAt: "2026-03-14T10:30:00" },
  { id: "RPT-002", type: "overflowing_bin", description: "Bin overflowing near school, bad smell", lat: 40.7120, lng: -74.010, status: "in_progress", createdAt: "2026-03-14T14:15:00" },
  { id: "RPT-003", type: "illegal_dumping", description: "Mattress and furniture dumped on sidewalk", lat: 40.7155, lng: -74.008, status: "resolved", createdAt: "2026-03-13T09:00:00" },
];

export const analyticsData = {
  totalTonnage: 1247,
  recyclingRate: 34.2,
  recyclingGoal: 50,
  co2Saved: 89.5,
  binsServiced: 156,
  activeDrivers: 12,
  weeklyTonnage: [
    { day: "Mon", tonnage: 180, recycling: 62 },
    { day: "Tue", tonnage: 195, recycling: 71 },
    { day: "Wed", tonnage: 210, recycling: 68 },
    { day: "Thu", tonnage: 175, recycling: 59 },
    { day: "Fri", tonnage: 220, recycling: 82 },
    { day: "Sat", tonnage: 140, recycling: 45 },
    { day: "Sun", tonnage: 127, recycling: 38 },
  ],
  fillDistribution: [
    { level: "Low (<50%)", count: 3, fill: "hsl(142, 71%, 45%)" },
    { level: "Medium (50-80%)", count: 3, fill: "hsl(38, 92%, 50%)" },
    { level: "High (>80%)", count: 4, fill: "hsl(0, 72%, 51%)" },
  ],
};

export function getBinStatus(fillLevel: number): "green" | "yellow" | "red" {
  if (fillLevel < 50) return "green";
  if (fillLevel <= 80) return "yellow";
  return "red";
}

export function getBinStatusLabel(fillLevel: number): string {
  if (fillLevel < 50) return "Low";
  if (fillLevel <= 80) return "Medium";
  return "Full";
}
