import { wasteBins, getBinStatus, getBinStatusLabel } from "@/data/mockData";
import { BinStatusBadge } from "./BinStatusBadge";
import { MapPin, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BinMapView() {
  const statusColors = {
    green: "border-success bg-success/10",
    yellow: "border-warning bg-warning/10",
    red: "border-destructive bg-destructive/10",
  };

  const dotColors = {
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bin Map</h2>
        <p className="text-sm text-muted-foreground">Real-time waste bin locations and fill levels</p>
      </div>

      {/* Map placeholder with bin visualization */}
      <Card className="overflow-hidden">
        <div className="relative h-[450px] bg-muted/30">
          {/* Grid-based map visualization */}
          <div className="absolute inset-0 p-6">
            <div className="relative h-full w-full rounded-lg border border-dashed border-border bg-background/50">
              {/* Grid lines */}
              <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Bin markers positioned on the map */}
              {wasteBins.map((bin, i) => {
                const status = getBinStatus(bin.fillLevel);
                const x = 8 + ((i % 5) * 20);
                const y = 15 + (Math.floor(i / 5) * 45);
                return (
                  <div
                    key={bin.id}
                    className="absolute group cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${statusColors[status]} transition-transform group-hover:scale-125`}>
                      <Trash2 className="h-4 w-4 text-foreground" />
                      {status === "red" && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive animate-pulse-slow" />
                      )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-12 z-10 hidden group-hover:block">
                      <div className="rounded-lg border bg-card p-2.5 shadow-lg text-xs whitespace-nowrap">
                        <p className="font-semibold text-card-foreground">{bin.id}</p>
                        <p className="text-muted-foreground">{bin.location}</p>
                        <div className="mt-1">
                          <BinStatusBadge fillLevel={bin.fillLevel} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="absolute bottom-3 left-3 text-[10px] text-muted-foreground font-mono">
                <MapPin className="inline h-3 w-3 mr-1" />
                Downtown District — 10 bins monitored
              </div>
            </div>
          </div>
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
