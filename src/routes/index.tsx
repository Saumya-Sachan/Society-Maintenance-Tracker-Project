import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ShieldCheck, Sparkles, LineChart, MessageSquareText, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Society Maintenance Tracker — Modern operations for residential communities" },
      { name: "description", content: "Raise complaints, track resolutions in real time, and communicate with residents from one transparent platform." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Society Tracker</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/auth" search={{ mode: "signup" } as never}>Get started</Link>
          </Button>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15), transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Built for residential societies & gated communities
          </span>
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Transparent maintenance operations,<br className="hidden sm:block" /> from complaint to resolution.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/85">
            Give residents a clear channel to raise issues. Give admins the tools to prioritize, assign,
            and resolve them — with a full audit trail every step of the way.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="bg-white text-primary shadow-lg hover:bg-white/90">
              <Link to="/auth" search={{ mode: "signup" } as never}>
                Create your account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: MessageSquareText, title: "Raise & track complaints",
              body: "Residents log issues with photos, category, and location. Every status change is timestamped and visible." },
            { icon: ShieldCheck, title: "Admin accountability",
              body: "Assign priorities, monitor overdue tickets, and communicate resolutions — all from one dashboard." },
            { icon: LineChart, title: "Insight, not noise",
              body: "Category breakdowns, monthly trends, and overdue alerts surface what needs attention right now." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="surface-card hover-lift p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 rounded-3xl border border-border bg-surface p-8 shadow-sm lg:grid-cols-2 lg:p-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Everything a well-run society needs</h2>
            <p className="mt-3 text-muted-foreground">
              Purpose-built workflows for the recurring realities of residential maintenance —
              plumbing leaks, lift breakdowns, security incidents, and community notices.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Plumbing","Electrical","Cleaning","Security","Parking","Lift","Water Supply","Gardening","Common Area"].map((c) => (
                <span key={c} className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-sm text-foreground/80">{c}</span>
              ))}
            </div>
          </div>
          <ul className="space-y-4">
            {[
              "Role-based access for residents and administrators",
              "Photo uploads with in-browser lightbox preview",
              "Visual complaint timeline with actor & timestamps",
              "Overdue detection with configurable thresholds",
              "Notice board with important-flag pinning",
              "Analytics: status, category, priority, monthly trends",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <span className="text-foreground/90">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Society Maintenance Tracker.</p>
          <p className="text-xs text-muted-foreground">Built for transparent, accountable community operations.</p>
        </div>
      </footer>
    </div>
  );
}
