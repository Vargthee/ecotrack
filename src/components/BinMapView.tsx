import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { wasteBins, getBinStatus, getBinStatusLabel } from "@/data/mockData";
import { BinStatusBadge } from "./BinStatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Clock, Route } from "lucide-react";
import { DynamicCollectionAlerts } from "./DynamicCollectionAlerts";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

function createNumberIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#ef4444;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${n}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Center of Jos, Plateau State
const JOS_CENTER: [number, number] = [9.8965, 8.8583];
const JOS_BOUNDS: [[number, number], [number, number]] = [
  [9.75, 8.80],
  [9.97, 8.95],
];

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(JOS_BOUNDS, { padding: [30, 30] });
  }, [map]);
  return null;
}

// Nearest-neighbor greedy route for critical bins
import type { WasteBin } from "@/data/mockData";
function optimizeRoute(bins: WasteBin[]): WasteBin[] {
  if (bins.length === 0) return [];
  const remaining = [...bins];
  const ordered: WasteBin[] = [];
  let current = remaining.splice(0, 1)[0];
  ordered.push(current);
  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].lat - current.lat, remaining[i].lng - current.lng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    current = remaining.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }
  return ordered;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function BinMapView() {
  const dotColors = {
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-destructive",
  };

  const criticalBins = useMemo(
    () => optimizeRoute(wasteBins.filter((b) => getBinStatus(b.fillLevel) === "red")),
    []
  );
  const criticalRoute: [number, number][] = criticalBins.map((b) => [b.lat, b.lng]);

  const routeStats = useMemo(() => {
    if (criticalRoute.length < 2) return { stops: criticalBins.length, distanceKm: 0, timeMin: 0 };
    let totalKm = 0;
    for (let i = 1; i < criticalRoute.length; i++) {
      totalKm += haversineKm(criticalRoute[i - 1], criticalRoute[i]);
    }
    // ~20 km/h avg urban speed + 5 min per stop for collection
    const driveMin = (totalKm / 20) * 60;
    const collectionMin = criticalBins.length * 5;
    return { stops: criticalBins.length, distanceKm: totalKm, timeMin: Math.round(driveMin + collectionMin) };
  }, [criticalBins, criticalRoute]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bin Map — Jos, Plateau State</h2>
        <p className="text-sm text-muted-foreground">Real-time waste bin locations across Jos and Bukuru</p>
      </div>

      <DynamicCollectionAlerts />

      {/* Leaflet Map */}
      <Card className="overflow-hidden">
        <div className="h-[500px] w-full">
          <MapContainer
            center={JOS_CENTER}
            zoom={13}
            className="h-full w-full z-0"
            scrollWheelZoom={true}
            maxBounds={JOS_BOUNDS}
            minZoom={11}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds />
            {criticalRoute.length > 1 && (
              <Polyline
                positions={criticalRoute}
                pathOptions={{
                  color: "hsl(var(--destructive))",
                  weight: 3,
                  dashArray: "8, 6",
                  opacity: 0.85,
                }}
              />
            )}
            {criticalBins.map((bin, i) => (
              <Marker key={`step-${bin.id}`} position={[bin.lat, bin.lng]} icon={createNumberIcon(i + 1)}>
                <Tooltip direction="top" offset={[0, -14]} permanent={false}>
                  <span className="text-xs font-semibold">Stop {i + 1}: {bin.location}</span>
                </Tooltip>
              </Marker>
            ))}
            {wasteBins.map((bin) => {
              const status = getBinStatus(bin.fillLevel);
              return (
                <CircleMarker
                  key={bin.id}
                  center={[bin.lat, bin.lng]}
                  radius={status === "red" ? 12 : 9}
                  pathOptions={{
                    color: STATUS_COLORS[status],
                    fillColor: STATUS_COLORS[status],
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[150px]">
                      <p className="font-bold text-sm">{bin.id}</p>
                      <p className="text-muted-foreground">{bin.location}</p>
                      <p>Fill Level: <strong>{bin.fillLevel}%</strong> — {getBinStatusLabel(bin.fillLevel)}</p>
                      <p>Type: <span className="capitalize">{bin.type}</span></p>
                      <p>Last Collected: {bin.lastCollected}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      {/* Legend and bin list */}
      <div className="grid gap-4 md:grid-cols-3">
        {(["green", "yellow", "red"] as const).map((status) => {
          const bins = wasteBins.filter((b) => getBinStatus(b.fillLevel) === status);
          const labels = { green: "Low Fill (<50%)", yellow: "Medium (50-80%)", red: "High (>80%)" };
          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColors[status]}`} />
                  {labels[status]}
                  <span className="ml-auto font-mono text-muted-foreground">{bins.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bins.map((bin) => (
                  <div key={bin.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{bin.location}</span>
                    <span className="font-mono font-medium">{bin.fillLevel}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
