import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Leaf, User, Truck, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";

const roles: {
  id: UserRole;
  label: string;
  sublabel: string;
  icon: typeof User;
  cta: string;
  ctaVariant: "default" | "outline" | "destructive";
  iconBg: string;
  iconColor: string;
}[] = [
  {
    id: "user",
    label: "Continue as User",
    sublabel: "Request pickups, track waste, earn eco points",
    icon: User,
    cta: "Get Started",
    ctaVariant: "default",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    id: "driver",
    label: "Become a Driver",
    sublabel: "Pick up waste, earn money, make an impact",
    icon: Truck,
    cta: "Join as Driver",
    ctaVariant: "outline",
    iconBg: "bg-accent",
    iconColor: "text-accent-foreground",
  },
  {
    id: "admin",
    label: "Admin Portal",
    sublabel: "System management, users, bins & analytics",
    icon: Shield,
    cta: "Admin Login",
    ctaVariant: "destructive",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
];

const redirectFor: Record<UserRole, string> = {
  user: "/user-dashboard",
  driver: "/driver",
  admin: "/admin",
};

const AuthPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const selectedDef = roles.find((r) => r.id === selectedRole);

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to EcoTrack</h1>
            <p className="text-muted-foreground">How would you like to continue?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card
                key={role.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/40 hover:-translate-y-1"
                onClick={() => setSelectedRole(role.id)}
                data-testid={`card-role-${role.id}`}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`mx-auto w-14 h-14 rounded-full ${role.iconBg} flex items-center justify-center`}>
                    <role.icon className={`h-7 w-7 ${role.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{role.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{role.sublabel}</p>
                  </div>
                  <Button className="w-full" variant={role.ctaVariant} size="sm">
                    {role.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Demo:{" "}
            <span className="font-mono">user@ecotrack.com / user123</span>
            {" · "}
            <span className="font-mono">driver@ecotrack.com / driver123</span>
            {" · "}
            <span className="font-mono">admin@ecotrack.com / admin123</span>
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let success: boolean;
      if (mode === "login") {
        success = await login(email, password, selectedRole);
      } else {
        success = await register(name, email, password, selectedRole);
      }
      if (success) {
        toast.success(`Welcome! Signed in as ${selectedRole}`);
        navigate(redirectFor[selectedRole]);
      } else {
        toast.error(selectedRole === "admin" ? "Invalid admin credentials" : "Invalid credentials");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg relative">
        <CardHeader className="text-center space-y-2 pt-8">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-3 top-3 text-muted-foreground"
            onClick={() => setSelectedRole(null)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className={`mx-auto w-14 h-14 rounded-full ${selectedDef?.iconBg} flex items-center justify-center`}>
            {selectedDef && <selectedDef.icon className={`h-7 w-7 ${selectedDef.iconColor}`} />}
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Sign In" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {selectedRole === "admin"
              ? "Admin access — credentials required"
              : mode === "login"
              ? `Sign in as ${selectedRole === "user" ? "a user" : "a driver"}`
              : `Register as ${selectedRole === "user" ? "a user" : "a driver"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && selectedRole !== "admin" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  data-testid="input-name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              variant={selectedRole === "admin" ? "destructive" : "default"}
              disabled={loading}
              data-testid="button-submit"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>

            {selectedRole !== "admin" && (
              <p className="text-sm text-center text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                >
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
