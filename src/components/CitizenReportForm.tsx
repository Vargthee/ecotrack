import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Camera, MapPin, Send, CheckCircle2 } from "lucide-react";
import { citizenReports } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function CitizenReportForm() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({
      title: "Report Submitted",
      description: "Thank you! Your report has been received and will be reviewed shortly.",
    });
    setTimeout(() => setSubmitted(false), 3000);
  };

  const statusStyles = {
    pending: "bg-warning/10 text-warning border-warning/30",
    in_progress: "bg-primary/10 text-primary border-primary/30",
    resolved: "bg-success/10 text-success border-success/30",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Citizen Reports</h2>
        <p className="text-sm text-muted-foreground">Report waste issues in your neighborhood</p>
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
                <Label htmlFor="type">Issue Type</Label>
                <Select defaultValue="illegal_dumping">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="illegal_dumping">Illegal Dumping</SelectItem>
                    <SelectItem value="overflowing_bin">Overflowing Bin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the issue..." rows={3} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="location" className="pl-9" placeholder="Address or coordinates" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo (optional)</Label>
                <div className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50">
                  <div className="text-center">
                    <Camera className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Click to upload</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitted}>
                {submitted ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Submitted
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {citizenReports.map((report) => (
              <div key={report.id} className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-muted-foreground">{report.id}</p>
                    <p className="text-sm font-medium text-foreground">{report.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                      statusStyles[report.status]
                    )}
                  >
                    {report.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
