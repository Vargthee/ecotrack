import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "driver") return <Navigate to="/driver" replace />;
  return <Navigate to="/user-dashboard" replace />;
};

export default Index;
