import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Zap, Users, Wallet as WalletIcon, ShieldCheck, Flame, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currency, timeLeft, tournamentTypeLabel } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user, profile, loading } = useAuth();
  const isAuthed = !loading && !!user;

  const { data: tournaments } = useQuery({
    queryKey: ["home-tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .in("status", ["upcoming", "live"])
        .order("start_time", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [{ count: players }, { count: tours }, { data: prize }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tournaments").select("*", { count: "exact", head: true }),
        supabase.from("winners").select("prize"),
      ]);
      const total = (prize ?? []).reduce((s, r: any) => s + Number(r.prize || 0), 0);
      return { players: players ?? 0, tours: tours ?? 0, prize: total };
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mb-6 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
              <Flame className="mr-1 h-3 w-3" /> Live tournaments dropping every day
            </Badge>
            <h1 className="font-display text-5xl font-black leading-tight md:text-7xl">
              {isAuthed ? (
                <>Welcome back,<br/><span className="text-gradient">{profile?.game_name || profile?.full_name || "Champion"}.</span></>
              ) : (
                <>Enter the Arena. <br /><span className="text-gradient">Own the Leaderboard.</span></>
              )}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {isAuthed
                ? "Your dashboard, wallet, and active tournaments are one click away. Ready to drop?"
                : "MAMU HUB hosts daily Battle Royale and CS tournaments with real cash prizes, instant wallet payouts and a live leaderboard. Squad up. Show them who runs the lobby."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isAuthed ? (
                <>
                  <Button asChild size="lg" className="bg-gradient-primary glow hover:opacity-95">
                    <Link to="/dashboard">Go to Dashboard <ArrowRight className="ml-1 h-4 w-4"/></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/10 glass">
                    <Link to="/tournaments">Browse Tournaments</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-gradient-primary glow hover:opacity-95">
                    <Link to="/register">Create Account <ArrowRight className="ml-1 h-4 w-4"/></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/10 glass">
                    <Link to="/tournaments">Browse Tournaments</Link>
                  </Button>
                </>
              )}
            </div>

          </motion.div>

          <div className="mt-16 grid grid-cols-3 gap-4">
            <Stat label="Total Players" value={stats?.players.toLocaleString() ?? "—"} icon={Users}/>
            <Stat label="Tournaments" value={stats?.tours.toLocaleString() ?? "—"} icon={Trophy}/>
            <Stat label="Prize Paid" value={currency(stats?.prize ?? 0)} icon={WalletIcon}/>
          </div>
        </div>
      </section>

      {/* FEATURED TOURNAMENTS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Upcoming <span className="text-gradient">Tournaments</span></h2>
            <p className="mt-1 text-sm text-muted-foreground">Reserve your slot before it fills.</p>
          </div>
          <Button asChild variant="ghost" size="sm"><Link to="/tournaments">View all →</Link></Button>
        </div>
        {tournaments && tournaments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t: any) => (
              <motion.div key={t.id}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-5 transition-shadow hover:glow"
              >
                <div className="mb-3 flex items-start justify-between">
                  <Badge className="bg-accent/20 text-accent border-accent/30">{tournamentTypeLabel[t.type]}</Badge>
                  <span className="text-xs text-muted-foreground">Starts in {timeLeft(t.start_time)}</span>
                </div>
                <h3 className="font-display text-lg font-bold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description || t.map}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-white/5 p-2"><div className="text-xs text-muted-foreground">Entry</div><div className="text-sm font-bold">{currency(t.entry_fee)}</div></div>
                  <div className="rounded-md bg-white/5 p-2"><div className="text-xs text-muted-foreground">Prize</div><div className="text-sm font-bold text-accent">{currency(t.prize_pool)}</div></div>
                  <div className="rounded-md bg-white/5 p-2"><div className="text-xs text-muted-foreground">Slots</div><div className="text-sm font-bold">{t.filled_slots}/{t.max_slots}</div></div>
                </div>
                <Button asChild className="mt-4 w-full bg-gradient-primary hover:opacity-90">
                  <Link to="/tournaments/$id" params={{ id: t.id }}>Register</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            No live tournaments right now. Fresh matches drop every day — check back soon.
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center font-display text-3xl font-bold">Built for <span className="text-gradient">competitive players</span></h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Instant Wallet", body: "Deposit via UPI, withdraw within hours. Prizes credit automatically." },
            { icon: ShieldCheck, title: "Anti-Cheat", body: "Verified rooms with rotating IDs and passwords, revealed only near match time." },
            { icon: Trophy, title: "Real Prizes", body: "Every position pays. Per-kill bonuses. MVP rewards. No fluff." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <f.icon className="h-8 w-8 text-accent" />
              <h3 className="mt-3 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-10 text-center md:p-14">
          <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          <div className="relative">
            <h2 className="font-display text-3xl font-black md:text-4xl">{isAuthed ? "Your next win awaits." : "Ready to drop hot?"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{isAuthed ? "Jump straight into an active tournament or manage your wallet." : "Sign up in 30 seconds. Get ₹0 signup, entry fees start from just ₹10."}</p>
            <Button asChild size="lg" className="mt-6 bg-gradient-primary glow hover:opacity-95">
              {isAuthed ? <Link to="/tournaments">Browse Tournaments</Link> : <Link to="/register">Create Free Account</Link>}
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <div className="mt-2 font-display text-xl font-bold md:text-2xl">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
