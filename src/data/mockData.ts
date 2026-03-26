export interface WasteBin {
  id: string;
  location: string;
  lat: number;
  lng: number;
  fillLevel: number;
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
  wasteType: "general" | "recycling" | "organic";
  earning: number;
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

export interface DriverEarning {
  day: string;
  amount: number;
  pickups: number;
}

export const wasteBins: WasteBin[] = [
  { id: "BIN-001", location: "Terminus Market, Jos", lat: 9.9167, lng: 8.8903, fillLevel: 85, lastCollected: "2026-03-14", type: "general" },
  { id: "BIN-002", location: "University of Jos Gate", lat: 9.9400, lng: 8.8800, fillLevel: 42, lastCollected: "2026-03-14", type: "recycling" },
  { id: "BIN-003", location: "Jos Main Market", lat: 9.9220, lng: 8.8950, fillLevel: 91, lastCollected: "2026-03-13", type: "general" },
  { id: "BIN-004", location: "Bukuru Roundabout", lat: 9.7940, lng: 8.8680, fillLevel: 67, lastCollected: "2026-03-14", type: "organic" },
  { id: "BIN-005", location: "Farin Gada, Jos", lat: 9.9050, lng: 8.9050, fillLevel: 23, lastCollected: "2026-03-15", type: "recycling" },
  { id: "BIN-006", location: "Angwan Rogo, Jos", lat: 9.8900, lng: 8.8600, fillLevel: 95, lastCollected: "2026-03-12", type: "general" },
  { id: "BIN-007", location: "Hill Station Junction, Jos", lat: 9.9300, lng: 8.9100, fillLevel: 55, lastCollected: "2026-03-14", type: "recycling" },
  { id: "BIN-008", location: "Bauchi Road, Jos", lat: 9.9350, lng: 8.9200, fillLevel: 78, lastCollected: "2026-03-13", type: "general" },
  { id: "BIN-009", location: "Hwolshe, Jos South", lat: 9.8200, lng: 8.8400, fillLevel: 12, lastCollected: "2026-03-15", type: "organic" },
  { id: "BIN-010", location: "Plateau Specialist Hospital", lat: 9.9100, lng: 8.8750, fillLevel: 88, lastCollected: "2026-03-12", type: "general" },
];

export const driverTasks: DriverTask[] = wasteBins
  .filter((b) => b.fillLevel > 70)
  .sort((a, b) => b.fillLevel - a.fillLevel)
  .map((b, i) => ({
    id: `TASK-${b.id}`,
    binId: b.id,
    location: b.location,
    fillLevel: b.fillLevel,
    priority: b.fillLevel > 85 ? "high" : "medium",
    completed: i >= 4,
    estimatedTime: `${Math.round(5 + (i * 3))} min`,
    wasteType: b.type,
    earning: b.fillLevel > 85 ? 800 : 600,
  }));

export const citizenReports: CitizenReport[] = [
  { id: "RPT-001", type: "illegal_dumping", description: "Large pile of construction debris near park entrance", lat: 9.916, lng: 8.892, status: "pending", createdAt: "2026-03-14T10:30:00" },
  { id: "RPT-002", type: "overflowing_bin", description: "Bin overflowing near school, bad smell", lat: 9.921, lng: 8.895, status: "in_progress", createdAt: "2026-03-14T14:15:00" },
  { id: "RPT-003", type: "illegal_dumping", description: "Mattress and furniture dumped on sidewalk", lat: 9.930, lng: 8.910, status: "resolved", createdAt: "2026-03-13T09:00:00" },
];

export const driverWeeklyEarnings: DriverEarning[] = [
  { day: "Mon", amount: 4200, pickups: 6 },
  { day: "Tue", amount: 5600, pickups: 8 },
  { day: "Wed", amount: 3600, pickups: 5 },
  { day: "Thu", amount: 6000, pickups: 9 },
  { day: "Fri", amount: 4800, pickups: 7 },
  { day: "Sat", amount: 2600, pickups: 4 },
  { day: "Sun", amount: 0, pickups: 0 },
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
