import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, dt, tournamentTypeLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/registrations")({
  component: RegPage,
  head: () => ({ meta: [{ title: "My Registrations — MAMU HUB" }] }),
});

function RegPage() {
  const { user } = useAuth();
  const { data: regs } = useQuery({
    queryKey: ["all-regs", user?.id],
    queryFn: async () => (await supabase.from("tournament_registrations").select("*, tournaments(*)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen">
      <SiteHeader/>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">My <span className="text-gradient">Registrations</span></h1>
        <div className="mt-6 space-y-3">
          {regs?.length === 0 && <Card className="glass border-white/5"><CardContent className="p-10 text-center text-muted-foreground">You haven't joined any tournaments yet.</CardContent></Card>}
          {regs?.map((r: any) => (
            <Card key={r.id} className="glass border-white/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-accent/20 text-accent border-accent/30">{tournamentTypeLabel[r.tournaments.type]}</Badge>
                    <span className="font-semibold">{r.tournaments.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Slot #{r.slot_number} · {dt(r.tournaments.start_time)} · Paid {currency(r.paid_amount)}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="border-white/10"><Link to="/tournaments/$id" params={{ id: r.tournament_id }}>View</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <SiteFooter/>
    </div>
  );
}
