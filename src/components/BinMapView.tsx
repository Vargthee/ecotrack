import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import { wasteBins, getBinStatus, getBinStatusLabel } from "@/data/mockData";
import { BinStatusBadge } from "./BinStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicCollectionAlerts } from "./DynamicCollectionAlerts";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

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
function optimizeRoute(bins: typeof wasteBins): [number, number][] {
  if (bins.length === 0) return [];
  const remaining = [...bins];
  const route: [number, number][] = [];
  let current = remaining.splice(0, 1)[0];
  route.push([current.lat, current.lng]);
  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].lat - current.lat, remaining[i].lng - current.lng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    current = remaining.splice(nearestIdx, 1)[0];
    route.push([current.lat, current.lng]);
  }
  return route;
}

export function BinMapView() {
  const dotColors = {
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-destructive",
  };

  const criticalRoute = useMemo(
    () => optimizeRoute(wasteBins.filter((b) => getBinStatus(b.fillLevel) === "red")),
    []
  );

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
