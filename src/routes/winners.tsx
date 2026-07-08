import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { currency, dt } from "@/lib/format";
import { Crown } from "lucide-react";

export const Route = createFileRoute("/winners")({
  component: Winners,
  head: () => ({ meta: [
    { title: "Winners — MAMU HUB" },
    { name: "description", content: "Meet the champions of MAMU HUB tournaments and their prize haul." },
  ]}),
});

function Winners() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["winners"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("winners")
        .select("id, tournament_id, user_id, position, prize, image_url, avatar_url, player_name, ff_uid, tournament_title, published_at, created_at")
        .order("published_at", { ascending: false })
        .limit(60);
      return rows ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("winners-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "winners" },
        () => qc.invalidateQueries({ queryKey: ["winners"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="min-h-screen">
      <SiteHeader/>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <Crown className="mx-auto h-10 w-10 text-accent"/>
          <h1 className="mt-2 font-display text-4xl font-black">Hall of <span className="text-gradient">Champions</span></h1>
          <p className="mt-1 text-muted-foreground">Legends who bagged the biggest prizes.</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({length: 6}).map((_,i) => <Skeleton key={i} className="h-64 rounded-2xl"/>)}
          {!isLoading && data?.length === 0 && (
            <Card className="glass col-span-full border-white/5">
              <CardContent className="p-12 text-center text-muted-foreground">No winners posted yet.</CardContent>
            </Card>
          )}
          {data?.map((w: any, i: number) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass overflow-hidden border-white/5 hover:glow-accent">
                {w.image_url && <img src={w.image_url} alt="" loading="lazy" decoding="async" className="h-40 w-full object-cover"/>}
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-accent/40">
                      <AvatarImage src={w.avatar_url ?? undefined}/>
                      <AvatarFallback className="bg-gradient-primary">{(w.player_name || "P").slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-display font-bold truncate">{w.player_name}</div>
                      <div className="text-xs text-muted-foreground truncate">FF UID: {w.ff_uid ?? "—"}</div>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                      <div className="text-xs uppercase text-muted-foreground">#{w.position}</div>
                      <div className="font-display text-lg font-black text-gradient">{currency(w.prize)}</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-md bg-white/5 p-2 text-xs">
                    <div className="font-semibold">{w.tournament_title}</div>
                    <div className="text-muted-foreground">Published {dt(w.published_at ?? w.created_at)}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <SiteFooter/>
    </div>
  );
}
