import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useInView } from "@/hooks/use-in-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  Leaf,
  Truck,
  BarChart3,
  MapPin,
  ArrowRight,
  Recycle,
  ShieldCheck,
  Zap,
  Users,
  TrendingUp,
  CheckCircle2,
  Star,
  Clock,
  Phone,
  ChevronRight,
  Wallet,
  Bell,
} from "lucide-react";

/* ── scroll-triggered fade + slide up ── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/* ── decorative floating dot ── */
const Dot = ({ className }: { className: string }) => (
  <div className={`absolute rounded-full opacity-[0.15] pointer-events-none ${className}`} />
);

/* ── mock phone card ── */
const AppMockup = () => (
  <div className="relative w-full max-w-xs mx-auto">
    <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-3xl scale-110" />
    <div className="relative bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-primary px-5 pt-5 pb-8">
        <div className="flex items-center justify-between text-primary-foreground/80 text-xs mb-4">
          <span>9:41 AM</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-primary-foreground/60" />
            <div className="w-3 h-1.5 rounded-sm bg-primary-foreground/60" />
            <div className="w-3 h-1.5 rounded-sm bg-primary-foreground/40" />
          </div>
        </div>
        <p className="text-primary-foreground/70 text-xs">Good morning,</p>
        <p className="text-primary-foreground font-semibold text-base">Amaka 👋</p>
      </div>
      <div className="px-4 -mt-4 pb-5 space-y-3">
        <div className="bg-accent rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Eco Points</p>
            <p className="text-xl font-bold text-primary">1,240 pts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="bg-primary rounded-2xl p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-foreground/70">Next pickup</p>
              <p className="font-semibold text-sm">Schedule Now</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="border border-border rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Active Pickup</span>
            <Badge className="text-xs px-2 py-0 bg-accent text-primary border-0">En Route</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Truck className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Emeka Okafor</p>
              <p className="text-xs text-muted-foreground">Arriving in ~8 min</p>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-primary" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-xl p-2.5 flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">3 alerts</span>
          </div>
          <div className="flex-1 bg-muted rounded-xl p-2.5 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Bin map</span>
          </div>
          <div className="flex-1 bg-muted rounded-xl p-2.5 flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Points</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════ */
const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  /* nav scroll shadow */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* hero entrance — mount-triggered */
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/user-dashboard" replace />;
  }

  const heroBase =
    "transition-[opacity,transform] duration-700 ease-out";
  const heroIn = heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>

      {/* ══ NAV ══ */}
      <header
        className={`sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-md" : "shadow-none"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">EcoTrack</span>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] px-2 py-0 border-primary/30 text-primary bg-accent ml-1">
              Plateau State
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle collapsed className="text-muted-foreground hover:text-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate("/auth")}
              data-testid="link-sign-in"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="gap-1.5 font-semibold transition-transform active:scale-95"
              onClick={() => navigate("/auth")}
              data-testid="link-get-started"
            >
              Get Started <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </nav>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,hsl(113,30%,92%)_0%,transparent_70%)]" />
        <Dot className="w-64 h-64 bg-primary top-0 -right-20" />
        <Dot className="w-40 h-40 bg-primary bottom-0 left-10" />
        <Dot className="w-20 h-20 bg-primary top-40 left-1/3" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* left copy — staggered on mount */}
            <div className="space-y-7">
              <div className={`${heroBase} ${heroIn}`} style={{ transitionDelay: "0ms" }}>
                <div className="inline-flex items-center gap-2 bg-accent border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Now live in Plateau State, Nigeria
                </div>
              </div>

              <div className={`${heroBase} ${heroIn} space-y-4`} style={{ transitionDelay: "80ms" }}>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-foreground">
                  Jos Deserves{" "}
                  <span className="text-primary">a Cleaner</span>{" "}
                  <span className="block">Tomorrow.</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
                  EcoTrack is Plateau State's smart waste management platform — connecting residents, drivers, and city administrators to make Jos clean, efficient, and green.
                </p>
              </div>

              <div className={`${heroBase} ${heroIn} flex items-center gap-3`} style={{ transitionDelay: "160ms" }}>
                <div className="flex -space-x-2">
                  {["A", "B", "C", "D"].map((l, i) => (
                    <div
                      key={l}
                      className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                      style={{ backgroundColor: `hsl(113, ${28 + i * 5}%, ${22 + i * 5}%)` }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">12,000+</span> Jos residents already on board
                </p>
              </div>

              <div className={`${heroBase} ${heroIn} flex flex-col sm:flex-row gap-3 pt-1`} style={{ transitionDelay: "240ms" }}>
                <Button
                  size="lg"
                  className="gap-2 font-semibold text-base px-7 shadow-lg shadow-primary/20 transition-transform active:scale-95 hover:shadow-primary/30 hover:shadow-xl"
                  onClick={() => navigate("/auth")}
                  data-testid="hero-cta-user"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 font-semibold text-base px-7 transition-transform active:scale-95"
                  onClick={() => navigate("/auth")}
                  data-testid="hero-cta-driver"
                >
                  <Truck className="h-4 w-4" />
                  Earn as a Driver
                </Button>
              </div>

              <div className={`${heroBase} ${heroIn} flex flex-wrap gap-4 pt-2`} style={{ transitionDelay: "320ms" }}>
                {[
                  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "KYC-verified drivers" },
                  { icon: <Clock className="h-3.5 w-3.5" />, label: "Same-day pickups" },
                  { icon: <Phone className="h-3.5 w-3.5" />, label: "No app download needed" },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-primary">{t.icon}</span>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* right mockup */}
            <div
              className={`flex justify-center lg:justify-end ${heroBase}`}
              style={{ transitionDelay: "200ms", transitionDuration: "900ms" }}
            >
              {heroReady && (
                <div className={`transition-[opacity,transform] duration-900 ease-out ${heroReady ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}>
                  <AppMockup />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y border-border bg-card">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
          <FadeUp>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
              {[
                { value: "12,000+", label: "Plateau Residents", sub: "across Jos LGA" },
                { value: "840+", label: "Active Drivers", sub: "verified & onboarded" },
                { value: "98%", label: "Collection Rate", sub: "on-time pickups" },
                { value: "₦4.5M+", label: "Driver Earnings", sub: "paid out monthly" },
              ].map((s) => (
                <div key={s.label} className="space-y-0.5">
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {s.value}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ PROBLEM → SOLUTION ══ */}
      <section className="py-20 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeUp>
              <div className="space-y-5">
                <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 text-xs">
                  The Problem in Jos
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                  Overflowing bins.<br />
                  Missed pickups.<br />
                  <span className="text-muted-foreground font-normal">Sound familiar?</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Across Bukuru, Rayfield, Dadin Kowa, and beyond — irregular waste collection is a daily frustration for Plateau State residents.
                </p>
                <div className="space-y-3">
                  {[
                    "No way to know when the truck is coming",
                    "Drivers working without routes or structure",
                    "City authorities blind to bin overflow hotspots",
                    "Residents with no incentive to sort waste properly",
                  ].map((p) => (
                    <div key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✕</div>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={120}>
              <div className="space-y-5">
                <Badge variant="outline" className="border-primary/30 text-primary bg-accent text-xs">
                  The EcoTrack Solution
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                  One platform.<br />
                  Every stakeholder.<br />
                  <span className="text-primary">All connected.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  EcoTrack gives residents real-time pickups, drivers a structured earning system, and city administrators the analytics dashboard they need.
                </p>
                <div className="space-y-3">
                  {[
                    "Request pickup and track it live on your phone",
                    "Drivers get tasks, routes, and real ₦ earnings",
                    "Admin dashboard with bin health maps and reports",
                    "Eco points system that rewards good behaviour",
                  ].map((s) => (
                    <div key={s} className="flex items-start gap-3 text-sm text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {s}
                    </div>
                  ))}
                </div>
                <Button className="gap-2 mt-2 transition-transform active:scale-95" onClick={() => navigate("/auth")} data-testid="problem-cta">
                  Start Now — It's Free <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ ROLE CARDS ══ */}
      <section className="py-20 px-5 sm:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">Built for every role in Jos</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-base">
              Whether you live in Rayfield or drive routes through Angwan Rogo — EcoTrack works for you.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Residents */}
            <FadeUp delay={0}>
              <div className="group rounded-2xl border border-border bg-card p-8 space-y-6 hover:shadow-xl hover:-translate-y-1.5 transition-[transform,box-shadow] duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-sm">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">For Residents</p>
                  <h3 className="text-xl font-bold mb-2">Jos Households</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Schedule waste pickups from your home in Bukuru, Vom, or Barkin Ladi — earn eco points every time you do.
                  </p>
                </div>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {["Request same-day or scheduled pickups", "Earn eco points on every collection", "Find nearest waste bins on the map", "Track your driver in real time"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full gap-2 transition-transform active:scale-95" onClick={() => navigate("/auth")} data-testid="card-cta-user">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </FadeUp>

            {/* Drivers */}
            <FadeUp delay={100}>
              <div className="group rounded-2xl bg-primary text-primary-foreground p-8 space-y-6 hover:shadow-xl hover:-translate-y-1.5 transition-[transform,box-shadow] duration-300 relative overflow-hidden h-full">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
                <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-primary-foreground/5" />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                      <Truck className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs font-semibold">
                      Top Earners
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-foreground/70 mb-1 uppercase tracking-wider">For Drivers</p>
                  <h3 className="text-xl font-bold mb-2">Plateau Waste Drivers</h3>
                  <p className="text-sm text-primary-foreground/80 leading-relaxed">
                    Turn your vehicle into real income. Accept pickup tasks near you, complete them, and get paid in Naira — no middle-man.
                  </p>
                </div>
                <div className="bg-primary-foreground/10 rounded-xl p-4 space-y-1">
                  <p className="text-xs text-primary-foreground/60 font-medium">Average driver earns</p>
                  <p className="text-2xl font-extrabold">₦75,000 <span className="text-base font-normal text-primary-foreground/70">/ month</span></p>
                  <p className="text-xs text-primary-foreground/60">based on 25 tasks/week in Jos</p>
                </div>
                <ul className="space-y-2.5 text-sm text-primary-foreground/80">
                  {["Accept tasks near your location", "Real-time navigation to pickups", "Weekly earnings & bonus tracker", "Verified badge builds trust"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary-foreground/60 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" className="w-full gap-2 font-semibold transition-transform active:scale-95" onClick={() => navigate("/auth")} data-testid="card-cta-driver">
                  Start Earning Today <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </FadeUp>

            {/* Admins */}
            <FadeUp delay={200}>
              <div className="group rounded-2xl border border-border bg-card p-8 space-y-6 hover:shadow-xl hover:-translate-y-1.5 transition-[transform,box-shadow] duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">For City Officials</p>
                  <h3 className="text-xl font-bold mb-2">Plateau Administrators</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A command centre for Plateau State's waste infrastructure — real-time bin maps, driver oversight, and revenue analytics.
                  </p>
                </div>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {["Live bin health map across LGAs", "Driver onboarding & KYC review", "Revenue and collection reports", "Subscriber & user management"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" disabled data-testid="card-cta-admin">
                  By Invitation Only
                </Button>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-20 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">Up and running in 3 steps</h2>
            <p className="text-muted-foreground">No stress. No long forms. Start in minutes.</p>
          </FadeUp>

          <div className="relative">
            <div className="absolute top-12 left-[calc(16.67%+1px)] right-[calc(16.67%+1px)] h-px bg-border hidden sm:block" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
              {[
                { step: "01", icon: <Users className="h-6 w-6" />, title: "Sign up in 60 seconds", desc: "Pick your role — resident or driver — enter your phone number and basic details." },
                { step: "02", icon: <MapPin className="h-6 w-6" />, title: "Request or accept a pickup", desc: "Residents choose waste type and set location. Nearby drivers get notified instantly." },
                { step: "03", icon: <TrendingUp className="h-6 w-6" />, title: "Get rewarded", desc: "Residents earn eco points. Drivers earn Naira. Every pickup makes Jos cleaner." },
              ].map((item, i) => (
                <FadeUp key={item.step} delay={i * 100}>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="relative w-24 h-24 rounded-3xl bg-accent flex flex-col items-center justify-center shadow-sm z-10">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-widest">{item.step}</span>
                      <div className="text-primary mt-0.5">{item.icon}</div>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-20 px-5 sm:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold">What Jos residents are saying</h2>
            <p className="text-muted-foreground">Real stories from people in Plateau State</p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Blessing Musa", location: "Rayfield, Jos South", role: "Resident",
                initials: "BM", rating: 5,
                quote: "Before EcoTrack, I never knew when the truck would come. Now I request a pickup at 7am and it's done by noon. The eco points are a nice bonus too!",
              },
              {
                name: "Emeka Okafor", location: "Bukuru, Jos South", role: "Driver · 3 months",
                initials: "EO", rating: 5,
                quote: "I was just driving without direction before. Now I open the app, see jobs near me, and I made over ₦72,000 last month just doing pickups in the morning.",
              },
              {
                name: "Hajiya Fatima", location: "Dadin Kowa, Jos North", role: "Resident",
                initials: "HF", rating: 5,
                quote: "My children complained about waste every week. Since we joined EcoTrack, our street is cleaner and my daughter loves checking the eco points. Very good app.",
              },
            ].map((t, i) => (
              <FadeUp key={t.name} delay={i * 80}>
                <div className="bg-card rounded-2xl border border-border p-6 space-y-4 hover:shadow-md transition-shadow duration-300 h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location} · {t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-20 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">Packed with tools that actually work</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Every feature is built around the real challenges of waste management in Nigerian cities.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Zap className="h-5 w-5" />, title: "Real-time pickup tracking", desc: "Watch your driver move toward you live on the map. No more guessing." },
              { icon: <MapPin className="h-5 w-5" />, title: "Bin finder for Jos", desc: "Locate the closest public waste bin in your area with one tap." },
              { icon: <TrendingUp className="h-5 w-5" />, title: "Naira earnings dashboard", desc: "Drivers see daily, weekly, and monthly earnings in ₦ — task by task." },
              { icon: <ShieldCheck className="h-5 w-5" />, title: "Driver KYC verification", desc: "Every driver is screened and verified before going live on the platform." },
              { icon: <BarChart3 className="h-5 w-5" />, title: "Admin analytics", desc: "Bin health heatmaps, collection rates, and revenue breakdowns for city officials." },
              { icon: <Recycle className="h-5 w-5" />, title: "Eco points & rewards", desc: "Residents earn points for every responsible disposal. Redeem for local perks." },
            ].map((f, i) => (
              <FadeUp key={f.title} delay={i * 60}>
                <div className="flex gap-4 p-5 rounded-2xl border border-border bg-card hover:shadow-sm hover:border-primary/20 transition-[box-shadow,border-color] duration-300 h-full">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-primary flex-shrink-0">
                    {f.icon}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">{f.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DRIVER EARNINGS ══ */}
      <section className="py-16 px-5 sm:px-8 bg-accent border-y border-primary/10">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="rounded-3xl bg-primary p-8 sm:p-12 text-primary-foreground relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary-foreground/5" />
              <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-primary-foreground/5" />
              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge className="bg-primary-foreground/15 text-primary-foreground border-0 text-xs">For Plateau Drivers</Badge>
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                    Turn your truck into a ₦75,000/month income
                  </h2>
                  <p className="text-primary-foreground/80 text-sm leading-relaxed">
                    Plateau State waste drivers on EcoTrack complete an average of 20 tasks per week — earning real Naira paid directly to them.
                  </p>
                  <Button
                    variant="secondary"
                    className="gap-2 font-semibold mt-2 transition-transform active:scale-95"
                    onClick={() => navigate("/auth")}
                    data-testid="driver-earnings-cta"
                  >
                    Start Earning <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Avg. per task", value: "₦750" },
                    { label: "Tasks/week", value: "~25" },
                    { label: "Monthly take-home", value: "₦75k+" },
                    { label: "Bonus on 30+ tasks", value: "₦3,000" },
                  ].map((s) => (
                    <div key={s.label} className="bg-primary-foreground/10 rounded-2xl p-4 space-y-1">
                      <p className="text-lg sm:text-xl font-extrabold">{s.value}</p>
                      <p className="text-xs text-primary-foreground/70">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="py-24 px-5 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background" />
        <Dot className="w-80 h-80 bg-primary -top-20 -right-20" />
        <Dot className="w-48 h-48 bg-primary -bottom-10 left-10" />
        <FadeUp className="relative max-w-2xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mx-auto">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            A cleaner Plateau State <br />
            <span className="text-primary">starts with you.</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Join 12,000+ Jos residents and 840+ drivers making Plateau State's waste management smarter, every single day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="gap-2 px-10 text-base font-semibold shadow-lg shadow-primary/20 transition-transform active:scale-95 hover:shadow-primary/30 hover:shadow-xl"
              onClick={() => navigate("/auth")}
              data-testid="final-cta-user"
            >
              Get Started — It's Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 px-10 text-base font-semibold transition-transform active:scale-95"
              onClick={() => navigate("/auth")}
              data-testid="final-cta-driver"
            >
              <Truck className="h-4 w-4" />
              Become a Driver
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">No app download required · Free to join · Cancel anytime</p>
        </FadeUp>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Leaf className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">EcoTrack</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Plateau State's smart waste management platform. Serving Jos, Bukuru, Barkin Ladi, Vom and beyond.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <button onClick={() => navigate("/auth")} className="hover:text-primary transition-colors">Sign In</button>
                <button onClick={() => navigate("/auth")} className="hover:text-primary transition-colors">Register</button>
                <button onClick={() => navigate("/auth")} className="hover:text-primary transition-colors">Drivers</button>
              </div>
              <p className="text-xs text-muted-foreground">© 2025 EcoTrack Nigeria. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
