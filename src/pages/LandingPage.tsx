import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Truck,
  BarChart3,
  MapPin,
  Star,
  ArrowRight,
  Recycle,
  ShieldCheck,
  Zap,
  Users,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/user-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">EcoTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} data-testid="link-sign-in">
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate("/auth")} data-testid="link-get-started">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/60 via-background to-background pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="border-primary/30 text-primary bg-accent px-4 py-1 text-sm font-medium">
            <Recycle className="h-3.5 w-3.5 mr-1.5" />
            Smarter waste, greener cities
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
            Waste management
            <span className="block text-primary">built for everyone</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            EcoTrack connects residents, waste drivers, and city administrators on one platform — making waste collection efficient, transparent, and rewarding.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" className="gap-2 px-8" onClick={() => navigate("/auth")} data-testid="hero-cta-user">
              Start as a Resident
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8" onClick={() => navigate("/auth")} data-testid="hero-cta-driver">
              <Truck className="h-4 w-4" />
              Join as a Driver
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "12,000+", label: "Active Users" },
            { value: "840+", label: "Drivers Onboarded" },
            { value: "98%", label: "Collection Rate" },
            { value: "₦4.2M", label: "Driver Earnings Paid" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-primary" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold">Built for every role</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you're a resident, a driver, or managing a city's waste network — EcoTrack has a tailored experience for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Residents */}
            <div className="rounded-2xl border border-border bg-card p-8 space-y-5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Residents</h3>
                <p className="text-sm text-muted-foreground">Schedule pickups, track your collection status, and earn eco points for sustainable choices.</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Request pickups on demand", "Earn & redeem eco points", "Find nearby waste bins", "Real-time status tracking"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate("/auth")} data-testid="card-cta-user">Get Started Free</Button>
            </div>

            {/* Drivers */}
            <div className="rounded-2xl border border-primary/30 bg-primary text-primary-foreground p-8 space-y-5 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs">Most Popular</Badge>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Drivers</h3>
                <p className="text-sm text-primary-foreground/80">Take on collection tasks in your area, manage your shift, and track your earnings in naira.</p>
              </div>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                {["Accept nearby pickup tasks", "Track earnings in ₦ Naira", "Manage shift hours", "Weekly earnings summary"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground/60 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="w-full" onClick={() => navigate("/auth")} data-testid="card-cta-driver">Join as a Driver</Button>
            </div>

            {/* Admins */}
            <div className="rounded-2xl border border-border bg-card p-8 space-y-5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">City Admins</h3>
                <p className="text-sm text-muted-foreground">Monitor bin health, manage drivers, review analytics, and keep the whole city running clean.</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Real-time bin health map", "Driver & user management", "Revenue & collection reports", "Subscriber management"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" disabled data-testid="card-cta-admin">Admin Access (Invite Only)</Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to a cleaner neighbourhood</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Users className="h-6 w-6" />, step: "1", title: "Create your account", desc: "Sign up as a resident or driver in under a minute. No credit card required." },
              { icon: <MapPin className="h-6 w-6" />, step: "2", title: "Schedule a pickup", desc: "Choose your waste type, set your address, and request a collection at your convenience." },
              { icon: <Star className="h-6 w-6" />, step: "3", title: "Earn eco points", desc: "Every pickup earns you points redeemable for rewards. Drivers earn ₦ per completed task." },
            ].map((item) => (
              <div key={item.step} className="space-y-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-primary relative">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Powerful features that make waste management effortless for the whole community.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Zap className="h-5 w-5" />, title: "Real-time tracking", desc: "Follow your pickup from request to completion with live status updates." },
              { icon: <MapPin className="h-5 w-5" />, title: "Bin finder map", desc: "Locate the nearest waste bins on an interactive map, right from the app." },
              { icon: <TrendingUp className="h-5 w-5" />, title: "Earnings dashboard", desc: "Drivers see daily, weekly, and monthly earnings broken down by task." },
              { icon: <ShieldCheck className="h-5 w-5" />, title: "Driver KYC verification", desc: "All drivers are verified for safety before they can accept tasks." },
              { icon: <BarChart3 className="h-5 w-5" />, title: "Analytics & reports", desc: "Admins access collection rates, revenue trends, and bin health reports." },
              { icon: <Recycle className="h-5 w-5" />, title: "Eco points rewards", desc: "Residents earn points on every pickup, redeemable for sustainability rewards." },
            ].map((feat) => (
              <div key={feat.title} className="flex gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary flex-shrink-0">
                  {feat.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{feat.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-7">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready for a cleaner city?</h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Join thousands of residents and drivers already using EcoTrack to make waste management smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" className="gap-2 px-8" onClick={() => navigate("/auth")} data-testid="footer-cta-user">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/auth")} data-testid="footer-cta-driver">
              <Truck className="h-4 w-4" />
              Join as a Driver
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="h-4 w-4 text-primary" />
            <span>© 2025 EcoTrack. All rights reserved.</span>
          </div>
          <p className="text-xs text-muted-foreground">Making waste management smarter, one pickup at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
