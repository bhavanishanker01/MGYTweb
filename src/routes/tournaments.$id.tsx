import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { currency, dt, timeLeft, tournamentTypeLabel } from "@/lib/format";
import { Copy, Eye, EyeOff, Loader2, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/tournaments/$id")({
  component: TournamentDetail,
  head: () => ({ meta: [{ title: "Tournament — MAMU HUB" }] }),
});

function TournamentDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: t, isLoading } = useQuery({
    queryKey: ["tour", id],
    queryFn: async () => (await supabase.from("tournaments").select("*").eq("id", id).maybeSingle()).data,
  });

  const { data: myReg } = useQuery({
    queryKey: ["myReg", id, user?.id],
    queryFn: async () => user ? (await supabase.from("tournament_registrations").select("*").eq("tournament_id", id).eq("user_id", user.id).maybeSingle()).data : null,
    enabled: !!user,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => user ? (await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle()).data : null,
    enabled: !!user,
  });

  const { data: roomMeta } = useQuery({
    queryKey: ["roomMeta", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_room_meta" as any, { _tid: id });
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? null;
    },
    enabled: !!myReg,
  });

  const { data: room } = useQuery({
    queryKey: ["room", id, user?.id],
    queryFn: async () => (await supabase.from("rooms").select("*").eq("tournament_id", id).maybeSingle()).data,
    enabled: !!myReg && !!roomMeta?.reveal_at && new Date(roomMeta.reveal_at).getTime() <= Date.now(),
  });

  const { data: myPayment } = useQuery({
    queryKey: ["myPayment", id, user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("payments" as any).select("*").eq("tournament_id", id).eq("user_id", user!.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ffUid, setFfUid] = useState("");

  const openConfirm = () => {
    if (!user) { toast.info("Sign in to register"); navigate({ to: "/auth" }); return; }
    if (myReg) { toast.info("You are already registered."); return; }
    if (t && t.registration_open === false) { toast.error("Registration is closed for this tournament."); return; }
    setConfirmOpen(true);
  };

  const uidValid = /^\d{8,12}$/.test(ffUid.trim());
  const register = async () => {
    const uid = ffUid.trim();
    if (!/^\d{8,12}$/.test(uid)) { toast.error("Free Fire UID must be 8–12 digits."); return; }
    setConfirmOpen(false);
    setBusy(true);
    const { error } = await supabase.rpc("register_for_tournament" as any, { _tour_id: id, _ff_uid: uid });
    setBusy(false);
    if (error) {
      const msg = errorMsg(error.message);
      toast.error(msg);
      if (error.message.includes("insufficient_balance")) {
        setTimeout(() => navigate({ to: "/wallet" }), 600);
      }
      return;
    }
    toast.success("Registration confirmed! Your slot is locked in.");
    setFfUid("");
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["tour", id] }),
      qc.invalidateQueries({ queryKey: ["myReg", id, user?.id] }),
      qc.invalidateQueries({ queryKey: ["wallet", user?.id] }),
      qc.invalidateQueries({ queryKey: ["all-regs", user?.id] }),
      qc.invalidateQueries({ queryKey: ["room", id, user?.id] }),
    ]);
  };

  // Realtime: refresh slots + room the moment admin/anyone changes them
  useEffect(() => {
    const ch = supabase
      .channel(`tour-live-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments", filter: `id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["tour", id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `tournament_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["roomMeta", id, user?.id] });
          qc.invalidateQueries({ queryKey: ["room", id, user?.id] });
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_registrations", filter: `tournament_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["tour", id] });
          if (user) qc.invalidateQueries({ queryKey: ["myReg", id, user.id] });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, user?.id, qc]);

  // Auto-reveal: when countdown hits reveal_at, re-fetch the room row (RLS now allows it)
  const revealMs = roomMeta?.reveal_at ? new Date(roomMeta.reveal_at).getTime() : 0;
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    if (!revealMs) return;
    const iv = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, [revealMs]);
  useEffect(() => {
    if (revealMs && nowTs >= revealMs) {
      qc.invalidateQueries({ queryKey: ["room", id, user?.id] });
    }
  }, [revealMs, nowTs, id, user?.id, qc]);

  if (isLoading) return <FullShellLoading/>;
  if (!t) return <FullShellNotFound/>;

  const fillPct = (t.filled_slots / t.max_slots) * 100;
  const roomVisible = !!room && revealMs > 0 && nowTs >= revealMs;
  const countdown = revealMs > 0 && nowTs < revealMs ? formatCountdown(revealMs - nowTs) : "";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/tournaments" className="text-sm text-muted-foreground hover:text-foreground">← Back to tournaments</Link>

        <Card className="glass-strong mt-4 overflow-hidden border-white/5">
          {t.banner_url && <img src={t.banner_url} alt={t.title} loading="lazy" decoding="async" className="h-48 w-full object-cover md:h-64"/>}
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent/20 text-accent border-accent/30">{tournamentTypeLabel[t.type]}</Badge>
                  <Badge variant="outline" className="capitalize">{t.status}</Badge>
                </div>
                <h1 className="mt-2 font-display text-3xl font-black">{t.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{dt(t.start_time)} · starts in {timeLeft(t.start_time)}</p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase text-muted-foreground">Prize Pool</div>
                <div className="font-display text-3xl font-black text-gradient">{currency(t.prize_pool)}</div>
              </div>
            </div>

            {t.description && <p className="mt-4 text-sm text-muted-foreground">{t.description}</p>}

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Entry Fee" value={currency(t.entry_fee)} />
              <Stat label="Per Kill" value={currency(t.per_kill_prize ?? 0)} />
              <Stat label="Map" value={t.map ?? "TBA"} />
              <Stat label="Mode" value={t.mode ?? "Classic"} />
            </div>

            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1"><Users className="h-4 w-4"/>Slots</span>
                <span className="font-bold">{t.filled_slots}/{t.max_slots}</span>
              </div>
              <Progress value={fillPct} className="h-2"/>
            </div>

            <div className="mt-6">
              {myReg ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-green-500/10 p-4 ring-1 ring-green-500/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-green-400">
                        <Trophy className="h-4 w-4"/>Registration Confirmed — Slot #{myReg.slot_number}
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Registered</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Registered on {dt(myReg.created_at)} · Paid {currency(myReg.paid_amount)}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div className="text-sm font-semibold">🎯 Mission Panel</div>
                    {roomVisible ? (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <RoomField label="Room ID" value={room!.room_id} />
                        <RoomField label="Room Password" value={room!.room_password} obscured={!showPw} onToggle={() => setShowPw(!showPw)} />
                      </div>
                    ) : roomMeta?.reveal_at ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Room details will be available soon.</p>
                        <p className="text-xs">Reveal at <b>{dt(roomMeta.reveal_at)}</b></p>
                        {countdown && <div className="mt-2 font-display text-2xl font-black text-gradient tabular-nums">{countdown}</div>}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">Room details will be posted by admin before match time.</p>
                    )}
                  </div>
                  <Button asChild variant="outline" className="w-full border-white/10">
                    <Link to="/registrations">View all my registrations</Link>
                  </Button>
                </div>
              ) : (myPayment && (myPayment as any).status === "pending") ? (
                <div className="rounded-xl bg-yellow-500/10 p-4 ring-1 ring-yellow-500/30">
                  <div className="flex items-center gap-2 font-semibold text-yellow-300">
                    <Loader2 className="h-4 w-4 animate-spin" />Payment under review
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Your slot will be confirmed once an admin approves your payment.</p>
                  <Button asChild variant="outline" className="mt-3 w-full border-white/10">
                    <Link to="/tournaments/$id/pay" params={{ id }}>View payment</Link>
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={openConfirm}
                  disabled={busy || t.status !== "upcoming" || t.filled_slots >= t.max_slots || t.registration_open === false}
                  className="w-full bg-gradient-primary glow hover:opacity-95">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin"/> :
                    t.registration_open === false ? "Registration Closed" :
                    t.filled_slots >= t.max_slots ? "Tournament full" :
                    t.status !== "upcoming" ? "Registration closed" :
                    Number(t.entry_fee) > 0 ? `Pay ${currency(t.entry_fee)} to register` : "Register (Free)"}
                </Button>
              )}
            </div>

            {t.rules && (
              <div className="mt-8">
                <h3 className="font-display text-lg font-bold">Rules</h3>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white/5 p-4 text-sm text-muted-foreground">{t.rules}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <SiteFooter />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm registration</AlertDialogTitle>
            <AlertDialogDescription>
              {t && (Number(t.entry_fee) > 0
                ? `Register for "${t.title}"? ${currency(t.entry_fee)} will be deducted from your wallet.`
                : `Register for "${t.title}" (free entry)? Your slot will be reserved.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ff-uid">Free Fire UID</Label>
            <Input id="ff-uid" inputMode="numeric" pattern="\d*" maxLength={12} autoComplete="off" placeholder="Enter your Free Fire UID"
              value={ffUid} onChange={(e) => setFfUid(e.target.value.replace(/\D/g, "").slice(0, 12))} />
            <p className="text-xs text-muted-foreground">Required — numbers only, 8 to 12 digits.</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={register} disabled={!uidValid}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white/5 p-3"><div className="text-xs uppercase text-muted-foreground">{label}</div><div className="mt-1 font-bold">{value}</div></div>;
}

function RoomField({ label, value, obscured, onToggle }: { label: string; value: string; obscured?: boolean; onToggle?: () => void }) {
  return (
    <div className="rounded-lg bg-black/40 p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <code className="font-mono text-lg tracking-wider">{obscured ? "••••••••" : value}</code>
        <div className="flex gap-1">
          {onToggle && <Button size="icon" variant="ghost" onClick={onToggle}>{obscured ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}</Button>}
          <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied"); }}><Copy className="h-4 w-4"/></Button>
        </div>
      </div>
    </div>
  );
}

function FullShellLoading() {
  return <div className="min-h-screen"><SiteHeader/><div className="mx-auto max-w-5xl p-8"><div className="glass h-96 animate-pulse rounded-2xl"/></div><SiteFooter/></div>;
}
function FullShellNotFound() {
  return <div className="min-h-screen"><SiteHeader/><div className="mx-auto max-w-5xl p-8 text-center text-muted-foreground">Tournament not found.</div><SiteFooter/></div>;
}

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (d > 0 ? `${d}d ` : "") + `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function errorMsg(m: string) {


  const map: Record<string,string> = {
    tournament_full: "This tournament is full.",
    already_registered: "You are already registered.",
    insufficient_balance: "Insufficient Wallet Balance. Please add funds.",
    registration_closed: "Registration is closed for this tournament.",
    not_authenticated: "Please sign in.",
    tournament_not_found: "Tournament not found.",
    ff_uid_required: "Please enter your Free Fire UID.",
    ff_uid_invalid: "Free Fire UID must be 8–12 digits.",
  };
  for (const k of Object.keys(map)) if (m.includes(k)) return map[k];
  return m;
}
