import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Car, Camera, CheckCircle, Clock, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type KYCStatus = "pending" | "approved" | "rejected" | "not_started";

interface KYCData {
  idFile: string;
  licenseFile: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  photoFile: string;
}

const statusConfig: Record<KYCStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground", icon: Clock },
  pending: { label: "Under Review", color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  approved: { label: "Approved", color: "bg-success/15 text-success border-success/30", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
};

const DriverKYCPage = () => {
  const [step, setStep] = useState(0);
  const [kycStatus, setKycStatus] = useState<KYCStatus>("not_started");
  const [data, setData] = useState<KYCData>({
    idFile: "", licenseFile: "", vehicleMake: "", vehicleModel: "", vehicleYear: "", vehiclePlate: "", photoFile: "",
  });

  const steps = [
    { title: "Government ID", description: "Upload a valid government-issued ID", icon: FileText },
    { title: "Driver's License", description: "Upload your driver's license", icon: FileText },
    { title: "Vehicle Details", description: "Enter your vehicle information", icon: Car },
    { title: "Profile Photo", description: "Upload a clear profile photo", icon: Camera },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const handleFileSelect = (field: keyof KYCData) => {
    setData((prev) => ({ ...prev, [field]: `file_${Date.now()}.jpg` }));
    toast.success("File selected successfully");
  };

  const handleSubmit = () => {
    setKycStatus("pending");
    toast.success("KYC documents submitted! We'll review them within 24-48 hours.");
  };

  if (kycStatus !== "not_started") {
    const config = statusConfig[kycStatus];
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Driver Verification</h1>
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <config.icon className="h-8 w-8" />
            </div>
            <Badge variant="outline" className={config.color}>{config.label}</Badge>
            <p className="text-sm text-muted-foreground">
              {kycStatus === "pending" && "Your documents are being reviewed. This usually takes 24-48 hours."}
              {kycStatus === "approved" && "Congratulations! You're verified and ready to accept pickups."}
              {kycStatus === "rejected" && "Some documents need attention. Please re-submit."}
            </p>
            {kycStatus === "rejected" && (
              <Button onClick={() => { setKycStatus("not_started"); setStep(0); }}>Re-submit Documents</Button>
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

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* Current Step */}
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
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleFileSelect("idFile")}>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">{data.idFile ? "✓ File uploaded" : "Click to upload ID"}</p>
                <p className="text-xs text-muted-foreground mt-1">Passport, National ID, or Voter's Card</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleFileSelect("licenseFile")}>
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{data.licenseFile ? "✓ File uploaded" : "Click to upload license"}</p>
              <p className="text-xs text-muted-foreground mt-1">Valid driver's license (front & back)</p>
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
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleFileSelect("photoFile")}>
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{data.photoFile ? "✓ Photo uploaded" : "Click to upload photo"}</p>
              <p className="text-xs text-muted-foreground mt-1">Clear face photo against plain background</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Submit for Review</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverKYCPage;
