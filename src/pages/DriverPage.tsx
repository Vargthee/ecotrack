import { FeatureGate } from "@/components/FeatureGate";
import { DriverTaskList } from "@/components/DriverTaskList";

const DriverPage = () => (
  <FeatureGate requiredTier="pro" featureLabel="Route Optimization & Driver Tasks">
    <DriverTaskList />
  </FeatureGate>
);

export default DriverPage;
