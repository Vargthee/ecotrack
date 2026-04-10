import { useAuth } from "@/contexts/AuthContext";
import { CitizenReportForm } from "@/components/CitizenReportForm";
import { Navigate } from "react-router-dom";

const ReportsPage = () => {
  const { user } = useAuth();
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <CitizenReportForm />;
};

export default ReportsPage;
