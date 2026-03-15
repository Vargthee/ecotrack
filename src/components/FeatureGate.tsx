import { useSubscription, PLAN_CONFIG, type PlanTier } from "@/contexts/SubscriptionContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  requiredTier: PlanTier;
  featureLabel: string;
  children: React.ReactNode;
}

const tierOrder: PlanTier[] = ["basic", "pro", "enterprise"];

export function FeatureGate({ requiredTier, featureLabel, children }: FeatureGateProps) {
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  const currentIdx = tierOrder.indexOf(subscription.plan_type);
  const requiredIdx = tierOrder.indexOf(requiredTier);

  if (currentIdx >= requiredIdx) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{featureLabel}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This feature requires the <span className="font-medium text-primary">{PLAN_CONFIG[requiredTier].name}</span> plan or higher.
        </p>
        <Button className="mt-4" onClick={() => navigate("/pricing")}>
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  );
}
