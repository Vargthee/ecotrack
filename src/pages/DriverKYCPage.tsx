import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, Car, Camera, CheckCircle, Clock, XCircle,
  ArrowRight, ArrowLeft, RefreshCw, FileImage, AlertCircle, Loader2, Eye
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

interface UploadState {
  uploading: boolean;
  previewUrl?: string;
  fileName?: string;
  fileSize?: string;
  error?: string;
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadZoneProps {
  field: keyof KYCData;
  label: string;
  hint: string;
  accept: string;
  icon?: typeof Upload;
  uploadState: UploadState;
  onUpload: (field: keyof KYCData, file: File) => Promise<void>;
}

function FileUploadZone({ field, label, hint, accept, icon: Icon = Upload, uploadState, onUpload }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("File too large — maximum size is 5MB");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WebP and PDF files are allowed");
      return;
    }
    onUpload(field, file);
  }, [field, onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isUploaded = !uploadState.uploading && !!uploadState.previewUrl && !uploadState.error;
  const isImage = uploadState.previewUrl && !uploadState.previewUrl.endsWith(".pdf");

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        aria-label={label}
      />
      <div
        onClick={() => !uploadState.uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all select-none",
          !uploadState.uploading && "cursor-pointer",
          dragOver && "border-primary bg-primary/5 scale-[1.01]",
          isUploaded && "border-success/40 bg-success/5",
          uploadState.error && "border-destructive/40 bg-destructive/5",
          !dragOver && !isUploaded && !uploadState.error && !uploadState.uploading && "border-border hover:border-primary/50 hover:bg-muted/30",
          uploadState.uploading && "border-primary/30 bg-primary/5"
        )}
      >
        {uploadState.uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
            <p className="text-sm font-medium text-primary">Uploading…</p>
            <p className="text-xs text-muted-foreground">{uploadState.fileName}</p>
          </div>
        ) : isUploaded ? (
          <div className="space-y-2">
            {isImage ? (
              <img
                src={uploadState.previewUrl}
                alt="Uploaded file preview"
                className="h-20 w-auto mx-auto rounded-md object-cover border border-border shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-7 w-7 text-primary" />
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
              <p className="text-sm font-medium text-success">Uploaded successfully</p>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[200px] mx-auto">{uploadState.fileName}</p>
            {uploadState.fileSize && (
              <p className="text-[10px] text-muted-foreground">{uploadState.fileSize}</p>
            )}
            <p className="text-[10px] text-primary hover:underline cursor-pointer mt-1">Click to replace</p>
          </div>
        ) : uploadState.error ? (
          <div className="space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm font-medium text-destructive">Upload failed</p>
            <p className="text-xs text-muted-foreground">{uploadState.error}</p>
            <p className="text-xs text-primary hover:underline cursor-pointer">Click to try again</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Icon className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70 mt-1">
              <FileImage className="h-3 w-3" />
              <span>JPG, PNG, WebP or PDF — max 5MB</span>
            </div>
          </div>
        )}
      </div>

      {isUploaded && uploadState.previewUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground w-full"
          onClick={(e) => {
            e.stopPropagation();
            window.open(uploadState.previewUrl, "_blank");
          }}
        >
          <Eye className="h-3 w-3 mr-1" /> View uploaded file
        </Button>
      )}
    </div>
  );
}

const DriverKYCPage = () => {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [formMode, setFormMode] = useState(false);
  const [data, setData] = useState<KYCData>({
    govtIdType: "", govtIdUrl: "", licenseUrl: "",
    vehicleMake: "", vehicleModel: "", vehicleYear: "", vehiclePlate: "", profilePhotoUrl: "",
  });
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({
    govtIdUrl: { uploading: false },
    licenseUrl: { uploading: false },
    profilePhotoUrl: { uploading: false },
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

  const handleUpload = useCallback(async (field: keyof KYCData, file: File) => {
    setUploadStates((prev) => ({
      ...prev,
      [field]: { uploading: true, fileName: file.name },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const result = await res.json();

      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? result.url : undefined;

      setUploadStates((prev) => ({
        ...prev,
        [field]: {
          uploading: false,
          previewUrl: result.url,
          fileName: file.name,
          fileSize: formatFileSize(result.size),
        },
      }));

      setData((prev) => ({ ...prev, [field]: result.url }));
      toast.success(`${file.name} uploaded`, { description: formatFileSize(result.size) });
    } catch (err: any) {
      setUploadStates((prev) => ({
        ...prev,
        [field]: { uploading: false, error: err.message ?? "Upload failed" },
      }));
      toast.error("Upload failed", { description: err.message });
    }
  }, []);

  const steps = [
    { title: "Government ID", description: "Upload a valid government-issued ID", icon: FileText },
    { title: "Driver's License", description: "Upload your driver's license", icon: FileText },
    { title: "Vehicle Details", description: "Enter your vehicle information", icon: Car },
    { title: "Profile Photo", description: "Upload a clear profile photo", icon: Camera },
  ];

  const progress = ((step + 1) / steps.length) * 100;

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

  const isAnyUploading = Object.values(uploadStates).some((s) => s.uploading);

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
              <FileUploadZone
                field="govtIdUrl"
                label="Click to upload ID document"
                hint="Drag & drop or click to browse"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                icon={Upload}
                uploadState={uploadStates.govtIdUrl}
                onUpload={handleUpload}
              />
            </div>
          )}

          {step === 1 && (
            <FileUploadZone
              field="licenseUrl"
              label="Click to upload driver's license"
              hint="Valid Nigerian driver's license (front & back)"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              icon={Upload}
              uploadState={uploadStates.licenseUrl}
              onUpload={handleUpload}
            />
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
            <FileUploadZone
              field="profilePhotoUrl"
              label="Click to upload profile photo"
              hint="Clear face photo against plain background"
              accept="image/jpeg,image/png,image/webp"
              icon={Camera}
              uploadState={uploadStates.profilePhotoUrl}
              onUpload={handleUpload}
            />
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0 || isAnyUploading}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={isAnyUploading}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending || isAnyUploading}>
                {submitMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                ) : "Submit for Review"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverKYCPage;
