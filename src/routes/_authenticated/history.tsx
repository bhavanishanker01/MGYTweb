import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Trophy, Target, Crown, Sparkles } from "lucide-react";
import { currency, dt, tournamentTypeLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "Match History — MAMU HUB" }, { name: "description", content: "All your MAMU HUB tournaments, results, kills, and prizes." }] }),
});

function HistoryPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["match-history", uid],
    enabled: !!uid,
    queryFn: async () => {
      const [{ data: regs }, { data: results }] = await Promise.all([
        supabase
          .from("tournament_registrations")
          .select("id, tournament_id, created_at, paid_amount, tournaments(id,title,type,start_time,status,map,mode,prize_pool)")
          .eq("user_id", uid!)
          .order("created_at", { ascending: false }),
        supabase
          .from("match_results")
          .select("tournament_id, position, kills, points, prize, mvp")
          .eq("user_id", uid!),
      ]);
      const rMap = new Map((results ?? []).map((r: any) => [r.tournament_id, r]));
      return (regs ?? []).map((r: any) => ({ ...r, result: rMap.get(r.tournament_id) }));
    },
  });

  const rows = data ?? [];
  const totals = rows.reduce(
    (acc, r: any) => {
      if (r.result) {
        acc.matches += 1;
        acc.kills += r.result.kills || 0;
        acc.prize += Number(r.result.prize || 0);
        if (r.result.position === 1) acc.wins += 1;
        if (r.result.mvp) acc.mvps += 1;
      }
      return acc;
    },
    { matches: 0, kills: 0, prize: 0, wins: 0, mvps: 0 }
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="text-center">
          <History className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-2 font-display text-4xl font-black">
            <span className="text-gradient">Match History</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Every tournament you've played on MAMU HUB.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Matches" value={totals.matches} icon={Trophy} />
          <Stat label="Wins" value={totals.wins} icon={Crown} />
          <Stat label="Kills" value={totals.kills} icon={Target} />
          <Stat label="MVPs" value={totals.mvps} icon={Sparkles} />
          <Stat label="Total Prize" value={currency(totals.prize)} icon={Trophy} />
        </div>

        <div className="mt-6 space-y-3">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}

          {!isLoading && rows.length === 0 && (
            <Card className="glass border-white/5">
              <CardContent className="p-10 text-center">
                <History className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 font-semibold">No matches yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once you register and play a tournament, your history shows up here.
                </p>
                <Link
                  to="/tournaments"
                  className="mt-4 inline-block rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow"
                >
                  Browse tournaments
                </Link>
              </CardContent>
            </Card>
          )}

          {rows.map((r: any) => {
            const t = r.tournaments;
            const res = r.result;
            const played = !!res;
            const cancelled = t?.status === "cancelled";
            return (
              <Card key={r.id} className="glass border-white/5">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-display text-lg font-bold">{t?.title || "Tournament"}</h3>
                        {res?.mvp && (
                          <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">
                            <Sparkles className="mr-1 h-3 w-3" /> MVP
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dt(t?.start_time)} · {tournamentTypeLabel[t?.type] ?? t?.type}
                        {t?.map ? ` · ${t.map}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-white/10">
                        Registered
                      </Badge>
                      <Badge
                        className={
                          cancelled
                            ? "border-destructive/30 bg-destructive/15 text-destructive"
                            : played
                            ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                            : t?.status === "live"
                            ? "border-primary/30 bg-primary/20 text-primary"
                            : "border-white/10 bg-white/5 text-muted-foreground"
                        }
                      >
                        {cancelled ? "Cancelled" : played ? "Completed" : t?.status === "live" ? "Live" : t?.status === "completed" ? "Awaiting result" : "Upcoming"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Cell label="Position" value={played ? (res.position ? `#${res.position}` : "—") : "—"} />
                    <Cell label="Kills" value={played ? res.kills ?? 0 : "—"} />
                    <Cell label="Points" value={played ? res.points ?? 0 : "—"} />
                    <Cell label="Prize" value={played ? currency(res.prize || 0) : "—"} highlight={played && Number(res.prize) > 0} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <Card className="glass border-white/5">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-primary ring-1 ring-white/10">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-lg font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Cell({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={"mt-0.5 font-display text-base font-bold " + (highlight ? "text-gradient" : "")}>{value}</div>
    </div>
  );
}
