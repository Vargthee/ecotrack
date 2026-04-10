import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Camera, MapPin, Send, CheckCircle2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Report = {
  id: string;
  type: "illegal_dumping" | "overflowing_bin";
  description: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  status: "pending" | "in_progress" | "resolved";
  createdAt: string;
};

const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  resolved: "bg-success/10 text-success border-success/30",
};

const JOS_LOCATIONS: Record<string, [number, number]> = {
  "Terminus Market": [9.9167, 8.8903],
  "University of Jos": [9.9400, 8.8800],
  "Jos Main Market": [9.9220, 8.8950],
  "Bukuru": [9.7940, 8.8680],
  "Farin Gada": [9.9050, 8.9050],
};

export function CitizenReportForm() {
  const [type, setType] = useState<"illegal_dumping" | "overflowing_bin">("illegal_dumping");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const submitMutation = useMutation({
    mutationFn: (data: { type: string; description: string; lat: number; lng: number; photoUrl?: string }) =>
      apiRequest("POST", "/api/reports", data),
    onSuccess: () => {
      toast.success("Report Submitted!", {
        description: "Thank you! Your report has been received and will be reviewed shortly. You earned +15 eco points.",
      });
      setDescription("");
      setLocation("");
      setPhotoDataUrl(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eco-points"] });
    },
    onError: () => toast.error("Failed to submit report. Please try again."),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoDataUrl(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !location.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Try to match location to known coords, or use Jos center
    const knownEntry = Object.entries(JOS_LOCATIONS).find(([name]) =>
      location.toLowerCase().includes(name.toLowerCase())
    );
    const [lat, lng] = knownEntry ? knownEntry[1] : [9.8965 + (Math.random() - 0.5) * 0.05, 8.8583 + (Math.random() - 0.5) * 0.05];

    submitMutation.mutate({
      type,
      description: description.trim(),
      lat,
      lng,
      photoUrl: photoDataUrl ?? undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Citizen Reports</h2>
        <p className="text-sm text-muted-foreground">Report waste issues in your neighborhood and earn eco points</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Submit a Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Issue Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger data-testid="select-report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="illegal_dumping">🗑️ Illegal Dumping</SelectItem>
                    <SelectItem value="overflowing_bin">♻️ Overflowing Bin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder={type === "illegal_dumping"
                    ? "Describe the dumped items, approximate quantity..."
                    : "Describe how full the bin is, any smell or hazard..."}
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-report-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    className="pl-9"
                    placeholder="E.g. Near Terminus Market, Jos..."
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    data-testid="input-report-location"
                    list="jos-locations"
                  />
                  <datalist id="jos-locations">
                    {Object.keys(JOS_LOCATIONS).map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[10px] text-muted-foreground">Common locations: Terminus Market, University of Jos, Jos Main Market, Bukuru, Farin Gada</p>
              </div>

              {/* Photo upload */}
              <div className="space-y-2">
                <Label>Photo Evidence (optional)</Label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                  data-testid="input-report-photo"
                />
                {photoPreview ? (
                  <div className="relative group">
                    <img
                      src={photoPreview}
                      alt="Report preview"
                      className="w-full h-40 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => { setPhotoDataUrl(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                      Photo attached ✓
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50"
                    data-testid="button-upload-photo"
                  >
                    <div className="text-center">
                      <Camera className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">Tap to attach photo</p>
                      <p className="text-[10px] text-muted-foreground/60">Max 5MB · JPG, PNG, HEIC</p>
                    </div>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3 text-xs text-muted-foreground">
                <span className="text-primary font-semibold">+15 pts</span>
                <span>earned for each verified report</span>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
                data-testid="button-submit-report"
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Submit Report</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Reports</CardTitle>
              <Badge variant="outline" className="text-[10px]">{reports.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {reportsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />)}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reports yet. Be the first to report an issue!</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">
                          {report.type === "illegal_dumping" ? "🗑️" : "♻️"}
                        </span>
                        <p className="text-[10px] font-mono text-muted-foreground">{report.id}</p>
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-2">{report.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize shrink-0", statusStyles[report.status])}>
                      {report.status.replace("_", " ")}
                    </span>
                  </div>
                  {report.photoUrl && (
                    <img
                      src={report.photoUrl}
                      alt="Report photo"
                      className="w-full h-28 object-cover rounded-md border border-border"
                    />
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{report.lat.toFixed(4)}°N, {report.lng.toFixed(4)}°E</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
