import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, dt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payments")({
  component: MyPayments,
  head: () => ({ meta: [{ title: "My Payments — MAMU HUB" }] }),
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={cn("capitalize", map[s] ?? "bg-white/5")}>{s}</Badge>;
}

function MyPayments() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: pays } = await supabase.from("payments" as any)
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      const ids = Array.from(new Set((pays ?? []).map((p: any) => p.tournament_id)));
      if (!ids.length) return [];
      const { data: tours } = await supabase.from("tournaments").select("id, title").in("id", ids);
      const byId = new Map((tours ?? []).map((t: any) => [t.id, t]));
      return (pays ?? []).map((p: any) => ({ ...p, tournament: byId.get(p.tournament_id) }));
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold">My <span className="text-gradient">Payments</span></h1>
        </div>

        {(!data || data.length === 0) ? (
          <Card className="glass border-white/5"><CardContent className="p-10 text-center text-sm text-muted-foreground">You haven't submitted any tournament payments yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {data.map((p: any) => <PaymentRow key={p.id} p={p} />)}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function PaymentRow({ p }: { p: any }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    if (!p.screenshot_url) return;
    supabase.storage.from("payment-proofs").createSignedUrl(p.screenshot_url, 60 * 60).then(({ data }) => {
      setThumb(data?.signedUrl ?? null);
    });
  }, [p.screenshot_url]);

  return (
    <Card className="glass border-white/5">
      <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 sm:p-5">
        <a href={thumb ?? "#"} target="_blank" rel="noopener noreferrer" className="block h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
          {thumb ? <img src={thumb} alt="Payment proof" className="h-full w-full object-cover" /> : null}
        </a>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{p.tournament?.title ?? "Tournament"}</span>
            {statusBadge(p.status)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Submitted {dt(p.created_at)}</p>
          {p.status === "rejected" && p.rejection_reason && (
            <p className="mt-1 text-xs text-destructive">Reason: {p.rejection_reason}</p>
          )}
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-bold">{currency(p.amount)}</div>
          {p.status === "pending" && (
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link to="/tournaments/$id" params={{ id: p.tournament_id }}>View</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
