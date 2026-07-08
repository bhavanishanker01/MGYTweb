import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currency, dt, timeLeft, tournamentTypeLabel } from "@/lib/format";
import { Users } from "lucide-react";

export const Route = createFileRoute("/tournaments/")({
  component: TournamentList,
  head: () => ({ meta: [{ title: "Tournaments — MAMU HUB" }, { name: "description", content: "Browse live and upcoming BR & CS esports tournaments with real cash prizes." }] }),
});

function TournamentList() {
  const [filter, setFilter] = useState<"all" | "br_solo" | "br_duo" | "br_squad" | "cs_squad">("all");
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("tournaments-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" },
        () => qc.invalidateQueries({ queryKey: ["tournaments"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const { data, isLoading } = useQuery({
    queryKey: ["tournaments", filter],
    queryFn: async () => {
      let q = supabase.from("tournaments").select("*").order("start_time", { ascending: true });
      if (filter !== "all") q = q.eq("type", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-4xl font-black">All <span className="text-gradient">Tournaments</span></h1>
        <p className="mt-1 text-muted-foreground">Register early — slots fill fast.</p>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mt-6">
          <TabsList className="bg-white/5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="br_solo">BR Solo</TabsTrigger>
            <TabsTrigger value="br_duo">BR Duo</TabsTrigger>
            <TabsTrigger value="br_squad">BR Squad</TabsTrigger>
            <TabsTrigger value="cs_squad">CS Squad</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_,i) => <Skeleton key={i} className="h-72 rounded-2xl"/>)}
          {!isLoading && data?.length === 0 && (
            <Card className="glass col-span-full border-white/5"><CardContent className="p-12 text-center text-muted-foreground">No tournaments match this filter yet.</CardContent></Card>
          )}
          {data?.map((t: any) => (
            <motion.div key={t.id} whileHover={{ y: -4 }} className="glass overflow-hidden rounded-2xl">
              {t.banner_url && <img src={t.banner_url} alt="" loading="lazy" decoding="async" className="h-32 w-full object-cover"/>}
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Badge className="bg-accent/20 text-accent border-accent/30">{tournamentTypeLabel[t.type]}</Badge>
                  <Badge variant={t.status === "live" ? "default" : "outline"} className="capitalize">{t.status}</Badge>
                </div>
                <h3 className="font-display text-lg font-bold">{t.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{dt(t.start_time)} · in {timeLeft(t.start_time)}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-white/5 p-2"><div className="text-muted-foreground">Entry</div><div className="text-sm font-bold">{currency(t.entry_fee)}</div></div>
                  <div className="rounded-md bg-white/5 p-2"><div className="text-muted-foreground">Prize</div><div className="text-sm font-bold text-accent">{currency(t.prize_pool)}</div></div>
                  <div className="rounded-md bg-white/5 p-2"><div className="text-muted-foreground">Slots</div><div className="text-sm font-bold flex items-center justify-center gap-1"><Users className="h-3 w-3"/>{t.filled_slots}/{t.max_slots}</div></div>
                </div>
                <Button asChild className="mt-4 w-full bg-gradient-primary hover:opacity-90" disabled={t.registration_open === false}>
                  <Link to="/tournaments/$id" params={{ id: t.id }}>{t.registration_open === false ? "Registration Closed" : "View & Register"}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
