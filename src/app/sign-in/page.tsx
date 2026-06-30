import { SignInForm } from "@/components/auth/sign-in-form"
import Image from "next/image"

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex overflow-hidden bg-background">

      {/* ── Ambient mesh background ─────────────────── */}
      <div className="pointer-events-none absolute inset-0 mesh-bg" />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-mesh" />
      <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 rounded-full bg-secondary/10 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-cyan-500/8 blur-3xl animate-float" />

      {/* ── Left — Login panel ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 pb-24 lg:pb-10 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-slide-up">

          {/* Logo + Brand */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl animate-glow" />
              <div className="relative h-20 w-20 mx-auto rounded-3xl border border-primary/20 bg-card shadow-2xl overflow-hidden">
                <Image
                  src="/bs.jpg"
                  alt="Bin Sultan Logo"
                  fill
                  className="object-cover"
                  priority
                  quality={100}
                  sizes="80px"
                />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gradient-animated tracking-tight">
                Bin Sultan ERP
              </h1>
              <p className="mt-1 text-sm text-muted-foreground font-medium tracking-wide uppercase">
                Fabrics Management System
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="relative rounded-3xl overflow-hidden">
            {/* Card glow border */}
            <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-primary/40 via-transparent to-secondary/40">
              <div className="h-full w-full rounded-3xl bg-card/95" />
            </div>

            <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border/60">
              <SignInForm />
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            Protected by enterprise-grade security
            <span className="mx-2 text-border">•</span>
            <span className="text-primary font-medium">LabridTech</span>
          </p>
        </div>
      </div>

      {/* ── Right — Feature showcase ─────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Deep gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#0a1628]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.25),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.18),_transparent_50%)]" />

        {/* Animated grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-20 right-20 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl animate-float" />
        <div className="absolute bottom-32 left-16 w-56 h-56 rounded-full bg-purple-500/10 blur-2xl animate-float-slow" />
        <div className="absolute top-1/2 right-10 w-24 h-24 rounded-full bg-cyan-400/10 blur-xl animate-orbit" style={{ animationDelay: "-3s" }} />

        {/* Content */}
        <div className="relative z-10 flex h-full w-full items-center justify-center p-12">
          <div className="max-w-lg space-y-10 text-white">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Trusted by leading fabric businesses
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-5xl font-extrabold leading-[1.15] tracking-tight">
                Beautifully crafted{" "}
                <span
                  className="block"
                  style={{
                    background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #22d3ee 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ERP experience
                </span>
              </h2>
              <p className="text-lg text-slate-300/80 leading-relaxed">
                Streamline purchasing, inventory, sales, and reporting — all in one
                clean, professional platform built for speed and scale.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "24/7", label: "Visibility" },
                { value: "100%", label: "Centralized" },
                { value: "∞", label: "Scalable" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="feature-card text-center"
                >
                  <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                  <div className="mt-1 text-xs font-medium text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                { icon: "🛒", label: "Point of Sale System", desc: "Fast, intuitive checkout" },
                { icon: "📦", label: "Inventory Control", desc: "Real-time stock tracking" },
                { icon: "📊", label: "Analytics & Reports", desc: "Data-driven decisions" },
                { icon: "👥", label: "Multi-role Access", desc: "Admin & cashier controls" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="feature-card flex items-center gap-4"
                >
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{f.label}</div>
                    <div className="text-xs text-slate-400">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Powered-by badge ─────────────────────────── */}
      <div className="absolute bottom-4 left-0 right-0 lg:bottom-6 lg:right-6 lg:left-auto z-20">
        <div className="mx-auto lg:mx-0 w-fit flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 backdrop-blur-md px-4 py-2 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Powered by</span>
          <span className="text-xs font-bold text-foreground">LabridTech</span>
        </div>
      </div>
    </div>
  )
}
