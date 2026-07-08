import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { currency, dt, timeLeft, tournamentTypeLabel } from "@/lib/format";
import { Trophy, Wallet, Bell, ListChecks, Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — MAMU HUB" }] }),
});

function Dashboard() {
  const { user, profile } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["my-wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    }, enabled: !!user,
  });

  const { data: regs, isLoading: rl } = useQuery({
    queryKey: ["my-upcoming", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournament_registrations")
        .select("*, tournaments(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    }, enabled: !!user,
  });

  const { data: notifs } = useQuery({
    queryKey: ["my-notifs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    }, enabled: !!user,
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome back, <span className="text-gradient">{profile?.game_name || profile?.full_name || "Player"}</span></h1>
            <p className="text-sm text-muted-foreground">UID: {profile?.uid}</p>
          </div>
          <Button asChild className="bg-gradient-primary glow"><Link to="/tournaments">Find matches</Link></Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Wallet Balance" value={currency(wallet?.balance ?? 0)} icon={Wallet} accent/>
          <StatCard label="My Registrations" value={String(regs?.length ?? 0)} icon={ListChecks}/>
          <StatCard label="Unread Alerts" value={String(notifs?.filter((n:any) => !n.is_read).length ?? 0)} icon={Bell}/>
          <StatCard label="Player UID" value={profile?.uid ?? "—"} icon={Trophy}/>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="glass border-white/5 lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-display">Your Tournaments</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/registrations">See all</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {rl && Array.from({ length: 3 }).map((_,i) => <Skeleton key={i} className="h-20 rounded-lg"/>)}
              {!rl && regs?.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                  You haven't joined any tournaments yet. <Link to="/tournaments" className="text-primary">Browse →</Link>
                </div>
              )}
              {regs?.map((r: any) => (
                <Link key={r.id} to="/tournaments/$id" params={{ id: r.tournament_id }}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent/20 text-accent border-accent/30">{tournamentTypeLabel[r.tournaments.type]}</Badge>
                      <span className="font-semibold">{r.tournaments.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Slot #{r.slot_number} · {dt(r.tournaments.start_time)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Starts in</div>
                    <div className="font-bold text-primary">{timeLeft(r.tournaments.start_time)}</div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="glass border-white/5">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-display">Notifications</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/notifications">All</Link></Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifs?.length === 0 && <p className="text-sm text-muted-foreground">All caught up. 🎯</p>}
              {notifs?.map((n:any) => (
                <div key={n.id} className="rounded-md bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Flame className="h-3 w-3 text-primary"/>{n.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: boolean }) {
  return (
    <Card className={`glass border-white/5 ${accent ? "glow" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`}/>
        </div>
        <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
