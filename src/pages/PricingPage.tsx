import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Zap, Building2, Globe } from "lucide-react";
import { useSubscription, PLAN_CONFIG, type PlanTier, type BillingCycle } from "@/contexts/SubscriptionContext";
import { toast } from "@/hooks/use-toast";

const tierIcons = { basic: Zap, pro: Building2, enterprise: Globe };

function formatNaira(naira: number) {
  return `₦${naira.toLocaleString("en-NG")}`;
}

const featureRows: { label: string; key: string; basic: string; pro: string; enterprise: string }[] = [
  { label: "Bin Monitoring", key: "bins", basic: "1 Bin", pro: "Up to 10", enterprise: "Unlimited" },
  { label: "Route Optimization", key: "route", basic: "—", pro: "✓", enterprise: "✓" },
  { label: "Impact Analytics", key: "analytics", basic: "Basic", pro: "Detailed", enterprise: "Custom Exports" },
  { label: "CO₂ Reports", key: "co2", basic: "—", pro: "✓", enterprise: "✓" },
  { label: "Fleet Management", key: "fleet", basic: "—", pro: "—", enterprise: "✓" },
  { label: "Dynamic Collection", key: "dynamic", basic: "—", pro: "✓ (85% trigger)", enterprise: "✓ (85% trigger)" },
  { label: "Pickup Schedule", key: "pickup", basic: "Monthly", pro: "Bi-weekly / On-demand", enterprise: "Unlimited" },
  { label: "Illegal Dumping Reports", key: "dumping", basic: "✓", pro: "✓", enterprise: "✓" },
  { label: "Custom API Access", key: "api", basic: "—", pro: "—", enterprise: "✓" },
  { label: "Priority Support", key: "support", basic: "—", pro: "—", enterprise: "✓" },
];

export default function PricingPage() {
  const { subscription, changePlan } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription.billing_cycle);
  const navigate = useNavigate();

  const handleSelectPlan = (tier: PlanTier) => {
    changePlan(tier);
    toast({
      title: "Plan updated!",
      description: `You're now on the ${PLAN_CONFIG[tier].name} plan.`,
    });
    navigate("/billing");
  };

  const tiers = (["basic", "pro", "enterprise"] as const);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Choose Your Plan</h2>
        <p className="mt-2 text-muted-foreground">Smart waste management for Plateau State, Nigeria</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <Switch checked={billingCycle === "yearly"} onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")} />
          <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly <Badge variant="secondary" className="ml-1 text-[10px]">Save 20%</Badge>
          </span>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const config = PLAN_CONFIG[tier];
          const Icon = tierIcons[tier];
          const price = billingCycle === "monthly" ? config.monthlyPrice : config.yearlyPrice;
          const isCurrent = subscription.plan_type === tier;
          const isPopular = tier === "pro";

          return (
            <Card key={tier} className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{config.name}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{formatNaira(price)}</span>
                  <span className="text-sm text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                </div>
                <ul className="space-y-2.5 text-left text-sm">
                  {featureRows.map((row) => {
                    const val = row[tier];
                    const available = val !== "—";
                    return (
                      <li key={row.key} className="flex items-start gap-2">
                        {available ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={available ? "text-foreground" : "text-muted-foreground/60"}>
                          {row.label}: <span className="font-medium">{val === "✓" ? "Included" : val === "—" ? "Not included" : val}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(tier)}
                >
                  {isCurrent ? "Current Plan" : `Select ${config.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium text-muted-foreground">Feature</th>
                  {tiers.map((t) => (
                    <th key={t} className="py-3 text-center font-medium text-foreground">{PLAN_CONFIG[t].name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row) => (
                  <tr key={row.key} className="border-b last:border-0">
                    <td className="py-3 text-muted-foreground">{row.label}</td>
                    {tiers.map((t) => {
                      const val = row[t];
                      return (
                        <td key={t} className="py-3 text-center">
                          {val === "✓" ? <Check className="mx-auto h-4 w-4 text-success" /> : val === "—" ? <X className="mx-auto h-4 w-4 text-muted-foreground/30" /> : <span className="font-medium text-foreground">{val}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
