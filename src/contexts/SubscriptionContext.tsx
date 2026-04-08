import React, { createContext, useContext, useState, useCallback } from "react";

export type PlanTier = "basic" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "yearly";

export interface Subscription {
  plan_type: PlanTier;
  status: "active" | "canceled" | "past_due";
  billing_cycle: BillingCycle;
  next_billing_date: string;
  started_at: string;
}

export interface PlanFeatures {
  maxBins: number | "unlimited";
  routeOptimization: boolean;
  analytics: "basic" | "detailed" | "custom";
  co2Reports: boolean;
  fleetManagement: boolean;
  customApi: boolean;
  prioritySupport: boolean;
  pickupType: string;
  notifications: string;
  exports: boolean;
  illegalDumpingReports: boolean;
  dynamicCollection: boolean;
}

export const PLAN_CONFIG: Record<PlanTier, { name: string; description: string; monthlyPrice: number; yearlyPrice: number; features: PlanFeatures }> = {
  basic: {
    name: "Basic",
    description: "Residential & Small Business",
    monthlyPrice: 5000,
    yearlyPrice: 48000,
    features: {
      maxBins: 1,
      routeOptimization: false,
      analytics: "basic",
      co2Reports: false,
      fleetManagement: false,
      customApi: false,
      prioritySupport: false,
      pickupType: "Monthly schedule",
      notifications: "Email",
      exports: false,
      illegalDumpingReports: true,
      dynamicCollection: false,
    },
  },
  pro: {
    name: "Professional",
    description: "Industrial & Commercial",
    monthlyPrice: 15000,
    yearlyPrice: 144000,
    features: {
      maxBins: 10,
      routeOptimization: true,
      analytics: "detailed",
      co2Reports: true,
      fleetManagement: false,
      customApi: false,
      prioritySupport: false,
      pickupType: "Bi-weekly / On-demand",
      notifications: "Email + SMS",
      exports: true,
      illegalDumpingReports: true,
      dynamicCollection: true,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "Municipal & City-wide",
    monthlyPrice: 85000,
    yearlyPrice: 816000,
    features: {
      maxBins: "unlimited",
      routeOptimization: true,
      analytics: "custom",
      co2Reports: true,
      fleetManagement: true,
      customApi: true,
      prioritySupport: true,
      pickupType: "Unlimited / Dynamic",
      notifications: "Email + SMS + Push",
      exports: true,
      illegalDumpingReports: true,
      dynamicCollection: true,
    },
  },
};

interface SubscriptionContextValue {
  subscription: Subscription;
  features: PlanFeatures;
  changePlan: (tier: PlanTier) => void;
  changeBillingCycle: (cycle: BillingCycle) => void;
  hasFeature: (feature: keyof PlanFeatures) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function getStoredSubscription(): Subscription {
  try {
    const stored = localStorage.getItem("ecotrack_subscription");
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    plan_type: "basic",
    status: "active",
    billing_cycle: "monthly",
    next_billing_date: "2026-04-15",
    started_at: "2026-03-01",
  };
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription>(getStoredSubscription);

  const features = PLAN_CONFIG[subscription.plan_type].features;

  const changePlan = useCallback((tier: PlanTier) => {
    const updated = { ...subscription, plan_type: tier };
    setSubscription(updated);
    localStorage.setItem("ecotrack_subscription", JSON.stringify(updated));
  }, [subscription]);

  const changeBillingCycle = useCallback((cycle: BillingCycle) => {
    const updated = { ...subscription, billing_cycle: cycle };
    setSubscription(updated);
    localStorage.setItem("ecotrack_subscription", JSON.stringify(updated));
  }, [subscription]);

  const hasFeature = useCallback((feature: keyof PlanFeatures) => {
    const val = features[feature];
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val > 0;
    if (val === "unlimited") return true;
    return !!val;
  }, [features]);

  const canAccessRoute = useCallback((route: string) => {
    const restrictedRoutes: Record<string, PlanTier[]> = {
      "/analytics": ["pro", "enterprise"],
      "/driver": ["pro", "enterprise"],
    };
    const allowed = restrictedRoutes[route];
    if (!allowed) return true;
    return allowed.includes(subscription.plan_type);
  }, [subscription.plan_type]);

  return (
    <SubscriptionContext.Provider value={{ subscription, features, changePlan, changeBillingCycle, hasFeature, canAccessRoute }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
