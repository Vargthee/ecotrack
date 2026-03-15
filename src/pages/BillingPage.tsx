import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSubscription, PLAN_CONFIG } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { CreditCard, Calendar, Receipt, ArrowUpRight, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

const mockInvoices = [
  { id: "INV-003", date: "2026-03-01", amount: 25000, status: "paid" },
  { id: "INV-002", date: "2026-02-01", amount: 25000, status: "paid" },
  { id: "INV-001", date: "2026-01-01", amount: 5000, status: "paid" },
];

export default function BillingPage() {
  const { subscription, changeBillingCycle } = useSubscription();
  const plan = PLAN_CONFIG[subscription.plan_type];
  const navigate = useNavigate();

  const currentPrice = subscription.billing_cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

  const handleMockCheckout = () => {
    toast({
      title: "Mock Checkout",
      description: "In production, this would redirect to Stripe/LemonSqueezy. Payment simulated ✓",
    });
  };

  const toggleBilling = () => {
    const newCycle = subscription.billing_cycle === "monthly" ? "yearly" : "monthly";
    changeBillingCycle(newCycle);
    toast({
      title: "Billing cycle updated",
      description: `Switched to ${newCycle} billing.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Plan & Billing</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and view invoices</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {plan.name} Plan
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </div>
              <Badge variant={subscription.status === "active" ? "default" : "destructive"} className="capitalize">
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Current Price</p>
                <p className="mt-1 text-xl font-bold text-foreground">{formatNaira(currentPrice)}<span className="text-sm font-normal text-muted-foreground">/{subscription.billing_cycle === "monthly" ? "mo" : "yr"}</span></p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Next Billing</p>
                <p className="mt-1 text-xl font-bold text-foreground">{new Date(subscription.next_billing_date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> Billing Cycle</p>
                <p className="mt-1 text-xl font-bold capitalize text-foreground">{subscription.billing_cycle}</p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/pricing")}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Change Plan
              </Button>
              <Button variant="outline" onClick={toggleBilling}>
                Switch to {subscription.billing_cycle === "monthly" ? "Yearly (Save 20%)" : "Monthly"}
              </Button>
              <Button onClick={handleMockCheckout}>
                <CreditCard className="mr-2 h-4 w-4" />
                Update Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Plan Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Smart Bins</span>
                <span className="font-medium text-foreground">
                  {typeof plan.features.maxBins === "number" ? `1 / ${plan.features.maxBins}` : "∞ Unlimited"}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: typeof plan.features.maxBins === "number" ? `${(1 / plan.features.maxBins) * 100}%` : "15%" }}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route Optimization</span>
                <Badge variant={plan.features.routeOptimization ? "default" : "secondary"} className="text-[10px]">
                  {plan.features.routeOptimization ? "Enabled" : "Locked"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analytics</span>
                <span className="font-medium capitalize text-foreground">{plan.features.analytics}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CO₂ Reports</span>
                <Badge variant={plan.features.co2Reports ? "default" : "secondary"} className="text-[10px]">
                  {plan.features.co2Reports ? "Enabled" : "Locked"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fleet Management</span>
                <Badge variant={plan.features.fleetManagement ? "default" : "secondary"} className="text-[10px]">
                  {plan.features.fleetManagement ? "Enabled" : "Locked"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{formatNaira(inv.amount)}</span>
                  <Badge variant="outline" className="text-success border-success/30 text-[10px]">Paid</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleMockCheckout}>
            Download All Invoices
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
