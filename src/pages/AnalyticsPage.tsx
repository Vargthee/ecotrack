import { FeatureGate } from "@/components/FeatureGate";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

const AnalyticsPage = () => (
  <FeatureGate requiredTier="pro" featureLabel="Advanced Analytics">
    <AnalyticsDashboard />
  </FeatureGate>
);

export default AnalyticsPage;
