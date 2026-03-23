import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Leaf, User, Truck, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to EcoTrack</h1>
            <p className="text-muted-foreground">How would you like to continue?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
              onClick={() => setSelectedRole("user")}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Continue as User</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Request pickups, track waste, earn eco points
                  </p>
                </div>
                <Button className="w-full">Get Started</Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
              onClick={() => setSelectedRole("driver")}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                  <Truck className="h-7 w-7 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Become a Driver</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pick up waste, earn money, make an impact
                  </p>
                </div>
                <Button variant="outline" className="w-full">Join as Driver</Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Demo: <span className="font-mono">user@ecotrack.com / user123</span> or <span className="font-mono">driver@ecotrack.com / driver123</span>
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
        toast.success(`Welcome! Logged in as ${selectedRole}`);
        navigate(selectedRole === "driver" ? "/driver" : "/user-dashboard");
      } else {
        toast.error("Invalid credentials");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={() => setSelectedRole(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            {selectedRole === "user" ? <User className="h-7 w-7 text-primary" /> : <Truck className="h-7 w-7 text-primary" />}
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Sign In" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? `Sign in as ${selectedRole === "user" ? "a user" : "a driver"}`
              : `Register as ${selectedRole === "user" ? "a user" : "a driver"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
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
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : mode === "login" ? "Sign In" : "Create Account"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" className="text-primary font-medium hover:underline" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
