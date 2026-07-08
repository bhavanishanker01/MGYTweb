import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trophy } from "lucide-react";
import { currency } from "@/lib/format";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({ meta: [{ title: "Leaderboard — MAMU HUB" }, { name: "description", content: "Top MAMU HUB players ranked by wins, kills, MVPs and prize earnings." }] }),
});

function LeaderboardPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["lb"],
    queryFn: async () => (await supabase.from("leaderboard").select("*").order("points", { ascending: false }).limit(100)).data ?? [],
  });

  const rows = (data ?? []).filter((r: any) =>
    !q || (r.name || "").toLowerCase().includes(q.toLowerCase()) || (r.uid || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <SiteHeader/>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="text-center">
          <Trophy className="mx-auto h-10 w-10 text-primary"/>
          <h1 className="mt-2 font-display text-4xl font-black"><span className="text-gradient">Leaderboard</span></h1>
          <p className="mt-1 text-muted-foreground">Ranked by tournament points. Top 100.</p>
        </div>

        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search player or UID..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9"/>
          </div>
        </div>

        <Card className="glass mt-4 border-white/5">
          <CardContent className="p-0">
            {isLoading && <div className="p-6 space-y-2">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-12"/>)}</div>}
            {!isLoading && rows.length === 0 && <p className="p-12 text-center text-muted-foreground">No results.</p>}
            <ul className="divide-y divide-white/5">
              {rows.map((r: any, i: number) => (
                <li key={r.user_id} className="flex items-center gap-4 p-3 md:p-4">
                  <div className={`grid h-8 w-8 place-items-center rounded-md font-display font-bold ${i < 3 ? "bg-gradient-primary text-primary-foreground glow" : "bg-white/5 text-muted-foreground"}`}>{i+1}</div>
                  <Avatar className="h-10 w-10 border border-primary/30">
                    <AvatarImage src={r.avatar_url}/>
                    <AvatarFallback className="bg-secondary text-xs">{(r.name || "M").slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.uid}</div>
                  </div>
                  <div className="hidden gap-6 text-center text-xs md:flex">
                    <Cell label="Matches" v={r.matches}/>
                    <Cell label="Wins" v={r.wins}/>
                    <Cell label="Kills" v={r.kills}/>
                    <Cell label="MVP" v={r.mvps}/>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-primary">{r.points} pts</div>
                    <div className="text-xs text-muted-foreground">{currency(r.total_prize)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <SiteFooter/>
    </div>
  );
}
function Cell({ label, v }: { label: string; v: number }) {
  return <div><div className="text-muted-foreground">{label}</div><div className="font-bold">{v ?? 0}</div></div>;
}
