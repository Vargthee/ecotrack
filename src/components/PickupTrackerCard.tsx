import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Truck, Star, Navigation, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const JOS_CENTER: [number, number] = [9.8965, 8.8583];

// Simulated driver start positions in Jos
const DRIVER_STARTS: [number, number][] = [
  [9.9167, 8.8903],
  [9.9400, 8.8800],
  [9.8200, 8.8400],
  [9.9050, 8.9050],
];

function createDriverIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#16a34a;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4)">🚛</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#2563eb;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4)">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function AnimatedDriver({ pos, userPos }: { pos: [number, number]; userPos: [number, number] }) {
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    }
  }, [pos]);

  return (
    <Marker ref={markerRef} position={pos} icon={createDriverIcon()}>
      <Popup>
        <div className="text-xs font-medium">Ibrahim Musa (Driver)<br />En route to your location</div>
      </Popup>
    </Marker>
  );
}

const STAGES = [
  { label: "Assigned", color: "bg-muted text-muted-foreground", eta: 8 },
  { label: "En Route", color: "bg-warning/20 text-warning", eta: 5 },
  { label: "Nearby", color: "bg-primary/20 text-primary", eta: 2 },
  { label: "Arrived", color: "bg-success/20 text-success", eta: 0 },
];

type Props = {
  pickupId: number;
  wasteType: string;
  onClose?: () => void;
};

export function PickupTrackerCard({ pickupId, wasteType, onClose }: Props) {
  const startIdx = pickupId % DRIVER_STARTS.length;
  const driverStart = DRIVER_STARTS[startIdx];

  const [progress, setProgress] = useState(0);
  const [driverPos, setDriverPos] = useState<[number, number]>(driverStart);
  const [stageIdx, setStageIdx] = useState(0);
  const [eta, setEta] = useState(8);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 0.008, 1);
        const newLat = lerp(driverStart[0], JOS_CENTER[0], next);
        const newLng = lerp(driverStart[1], JOS_CENTER[1], next);
        setDriverPos([newLat, newLng]);
        setEta(Math.max(0, Math.round(8 * (1 - next))));

        if (next < 0.3) setStageIdx(0);
        else if (next < 0.6) setStageIdx(1);
        else if (next < 0.9) setStageIdx(2);
        else setStageIdx(3);

        return next;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const stage = STAGES[stageIdx];
  const arrived = stageIdx === 3;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Tracking Your Pickup
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-[10px] border-0", stage.color)}>
              {stage.label}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {/* Driver info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg shrink-0">🧑🏾</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Ibrahim Musa</p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Star className="h-3 w-3 text-warning fill-warning" />
              <span>4.9 · 342 pickups · EcoTrack Verified</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {!arrived && (
              <div className="flex items-center gap-1 text-primary font-bold text-sm">
                <Clock className="h-3.5 w-3.5" />
                {eta} min
              </div>
            )}
            {arrived && <span className="text-success text-sm font-bold">Here!</span>}
          </div>
        </div>

        {/* Map */}
        <div className="h-[200px] rounded-xl overflow-hidden border relative">
          <MapContainer
            center={JOS_CENTER}
            zoom={13}
            className="h-full w-full z-0"
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution=""
            />
            <AnimatedDriver pos={driverPos} userPos={JOS_CENTER} />
            <Marker position={JOS_CENTER} icon={createUserIcon()}>
              <Popup><div className="text-xs">Your Location</div></Popup>
            </Marker>
          </MapContainer>
          {/* ETA overlay */}
          <div className="absolute top-2 left-2 z-[400] bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 border shadow-sm">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {arrived ? "Driver arrived!" : `ETA: ${eta} min`}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Route to you</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Stage steps */}
        <div className="flex items-center gap-0">
          {STAGES.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1">
              <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border-2 transition-all", i <= stageIdx ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border")}>
                {i < stageIdx ? "✓" : i + 1}
              </div>
              <div className="flex-1 mx-1">
                <p className={cn("text-[9px] text-center font-medium transition-colors", i <= stageIdx ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
                {i < STAGES.length - 1 && (
                  <div className={cn("h-px w-full mt-1 transition-colors", i < stageIdx ? "bg-primary" : "bg-border")} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Rating (show after arrival) */}
        {arrived && (
          <div className="p-3 rounded-xl border bg-success/5 border-success/20 space-y-2">
            <p className="text-xs font-medium text-foreground text-center">Pickup complete! Rate your experience</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="text-xl">
                  <Star className={cn("h-6 w-6 transition-colors", s <= rating ? "text-warning fill-warning" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <Button size="sm" className="w-full h-8 text-xs" onClick={onClose}>
                Submit Rating
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="capitalize">📦 {wasteType} waste pickup</span>
          <span>ID #{pickupId}</span>
        </div>
      </CardContent>
    </Card>
  );
}
