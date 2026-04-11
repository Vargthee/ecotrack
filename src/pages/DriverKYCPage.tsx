import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Car, Camera, CheckCircle, Clock, XCircle, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type KYCStatus = "pending" | "approved" | "rejected";

interface KYCData {
  govtIdType: string;
  govtIdUrl: string;
  licenseUrl: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  profilePhotoUrl: string;
}

interface KycRecord {
  id: number;
  driverId: number;
  status: KYCStatus;
  govtIdType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehiclePlate?: string;
  rejectionReason?: string;
  submittedAt?: string;
}

const statusConfig: Record<KYCStatus, { label: string; color: string; icon: typeof CheckCircle; description: string }> = {
  pending: {
    label: "Under Review",
    color: "bg-warning/15 text-warning border-warning/30",
    icon: Clock,
    description: "Your documents are being reviewed. This usually takes 24–48 hours. You'll be notified once a decision is made.",
  },
  approved: {
    label: "Verified",
    color: "bg-success/15 text-success border-success/30",
    icon: CheckCircle,
    description: "Congratulations! Your identity and vehicle have been verified. You can now accept pickup requests.",
  },
  rejected: {
    label: "Rejected",
    color: "bg-destructive/15 text-destructive border-destructive/30",
    icon: XCircle,
    description: "Some documents need attention. Please review the reason below and re-submit.",
  },
};

const DriverKYCPage = () => {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [formMode, setFormMode] = useState(false);
  const [data, setData] = useState<KYCData>({
    govtIdType: "", govtIdUrl: "", licenseUrl: "",
    vehicleMake: "", vehicleModel: "", vehicleYear: "", vehiclePlate: "", profilePhotoUrl: "",
  });

  const { data: kycRecord, isLoading } = useQuery<KycRecord | null>({
    queryKey: ["/api/driver/kyc"],
    queryFn: () => fetch("/api/driver/kyc", { credentials: "include" }).then((r) => r.json()),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: Partial<KYCData>) =>
      fetch("/api/driver/kyc", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/driver/kyc"] });
      setFormMode(false);
      toast.success("KYC documents submitted! We'll review them within 24–48 hours.");
    },
    onError: () => toast.error("Submission failed. Please try again."),
  });

  const steps = [
    { title: "Government ID", description: "Upload a valid government-issued ID", icon: FileText },
    { title: "Driver's License", description: "Upload your driver's license", icon: FileText },
    { title: "Vehicle Details", description: "Enter your vehicle information", icon: Car },
    { title: "Profile Photo", description: "Upload a clear profile photo", icon: Camera },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const handleFileSelect = (field: keyof KYCData) => {
    const names: Record<string, string> = {
      govtIdUrl: "government_id", licenseUrl: "drivers_license", profilePhotoUrl: "profile_photo",
    };
    setData((prev) => ({ ...prev, [field]: `${names[field] ?? field}_${Date.now()}.jpg` }));
    toast.success("File selected successfully");
  };

  const handleSubmit = () => {
    if (!data.govtIdType) { toast.error("Please select an ID type"); return; }
    if (!data.govtIdUrl) { toast.error("Please upload your Government ID"); return; }
    if (!data.licenseUrl) { toast.error("Please upload your Driver's License"); return; }
    if (!data.vehicleMake || !data.vehicleModel || !data.vehicleYear || !data.vehiclePlate) {
      toast.error("Please complete all vehicle details"); return;
    }
    if (!data.profilePhotoUrl) { toast.error("Please upload your profile photo"); return; }
    submitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const status = kycRecord?.status;
  const hasSubmitted = !!kycRecord && !formMode;

  if (hasSubmitted && status) {
    const config = statusConfig[status];
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Driver Verification (KYC)</h1>
          <p className="text-sm text-muted-foreground">Identity and vehicle verification</p>
        </div>
        <Card>
          <CardContent className="p-8 space-y-5">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                status === "approved" ? "bg-success/15" : status === "rejected" ? "bg-destructive/15" : "bg-warning/15"
              }`}>
                <config.icon className={`h-8 w-8 ${
                  status === "approved" ? "text-success" : status === "rejected" ? "text-destructive" : "text-warning"
                }`} />
              </div>
              <Badge variant="outline" className={config.color}>{config.label}</Badge>
              <p className="text-sm text-muted-foreground max-w-xs">{config.description}</p>
            </div>

            {status === "rejected" && kycRecord.rejectionReason && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Rejection Reason</p>
                <p className="text-sm text-foreground">{kycRecord.rejectionReason}</p>
              </div>
            )}

            {kycRecord.vehicleMake && (
              <div className="rounded-lg bg-muted/40 border border-border/40 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submitted Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">ID Type:</span> <span className="font-medium capitalize">{kycRecord.govtIdType?.replace("_", " ")}</span></div>
                  <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{kycRecord.vehicleMake} {kycRecord.vehicleModel}</span></div>
                  <div><span className="text-muted-foreground">Year:</span> <span className="font-medium">{kycRecord.vehicleYear}</span></div>
                  <div><span className="text-muted-foreground">Plate:</span> <span className="font-mono font-medium">{kycRecord.vehiclePlate}</span></div>
                </div>
                {kycRecord.submittedAt && (
                  <p className="text-xs text-muted-foreground pt-1">Submitted {new Date(kycRecord.submittedAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</p>
                )}
              </div>
            )}

            {status === "rejected" && (
              <Button className="w-full" onClick={() => { setFormMode(true); setStep(0); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Re-submit Documents
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Driver Verification (KYC)</h1>
        <p className="text-sm text-muted-foreground">Complete all steps to start accepting pickups</p>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
            </div>
            <div>
              <CardTitle className="text-lg">{steps[step].title}</CardTitle>
              <CardDescription>{steps[step].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">ID Type</Label>
                <Select value={data.govtIdType} onValueChange={(v) => setData((p) => ({ ...p, govtIdType: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">International Passport</SelectItem>
                    <SelectItem value="national_id">National ID Card (NIN)</SelectItem>
                    <SelectItem value="voters_card">Permanent Voter's Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleFileSelect("govtIdUrl")}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {data.govtIdUrl ? "✓ ID document uploaded" : "Click to upload ID document"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF — max 5MB</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleFileSelect("licenseUrl")}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                {data.licenseUrl ? "✓ License uploaded" : "Click to upload driver's license"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Valid Nigerian driver's license (front &amp; back)</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Make</Label>
                  <Input placeholder="e.g. Toyota" value={data.vehicleMake} onChange={(e) => setData((p) => ({ ...p, vehicleMake: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model</Label>
                  <Input placeholder="e.g. Hilux" value={data.vehicleModel} onChange={(e) => setData((p) => ({ ...p, vehicleModel: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Year</Label>
                  <Input placeholder="e.g. 2022" value={data.vehicleYear} onChange={(e) => setData((p) => ({ ...p, vehicleYear: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Plate Number</Label>
                  <Input placeholder="e.g. ABC-123-XY" value={data.vehiclePlate} onChange={(e) => setData((p) => ({ ...p, vehiclePlate: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleFileSelect("profilePhotoUrl")}
            >
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                {data.profilePhotoUrl ? "✓ Photo uploaded" : "Click to upload profile photo"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Clear face photo against plain background</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting…" : "Submit for Review"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverKYCPage;
