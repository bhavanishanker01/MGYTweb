import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currency, dt, tournamentTypeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Loader2, Plus, Users, Trophy, Wallet, Megaphone, Crown, LayoutDashboard,
  Image as ImageIcon, Bell, Settings, Menu, Search, Trash2, Check, X, Eye,
  CalendarClock, DollarSign, Users2, ShieldCheck, Radio, CheckCircle2,
  Receipt, QrCode, Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

type SectionKey =
  | "dashboard" | "tournaments" | "participants" | "results" | "winners" | "payments"
  | "announcements" | "banners" | "notifications" | "users" | "wallet" | "paysettings" | "settings";

const NAV: { key: SectionKey; label: string; icon: any }[] = [
  { key: "dashboard",     label: "Dashboard",       icon: LayoutDashboard },
  { key: "tournaments",   label: "Tournaments",     icon: Trophy },
  { key: "participants",  label: "Participants",    icon: Users2 },
  { key: "results",       label: "Publish Results", icon: CheckCircle2 },
  { key: "winners",       label: "Winners",         icon: Crown },
  { key: "payments",      label: "Payments",        icon: Receipt },
  { key: "announcements", label: "Announcements",   icon: Megaphone },
  { key: "banners",       label: "Banner Manager",  icon: ImageIcon },
  { key: "notifications", label: "Notifications",   icon: Bell },
  { key: "users",         label: "Users",           icon: Users },
  { key: "wallet",        label: "Wallet",          icon: Wallet },
  { key: "paysettings",   label: "Payment Settings",icon: QrCode },
  { key: "settings",      label: "Settings",        icon: Settings },
];

function AdminHome() {
  const [section, setSection] = useState<SectionKey>("dashboard");
  const [openMobile, setOpenMobile] = useState(false);

  const NavList = ({ onPick }: { onPick?: () => void }) => (
    <nav className="flex flex-col gap-1 p-3">
      <div className="mb-3 px-3 pt-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold">Admin <span className="text-gradient">Console</span></span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">MAMU HUB control center</p>
      </div>
      {NAV.map(({ key, label, icon: Icon }) => {
        const active = section === key;
        return (
          <button
            key={key}
            onClick={() => { setSection(key); onPick?.(); }}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-gradient-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.62_0.24_27/60%)]"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );

  const current = NAV.find(n => n.key === section)!;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-3 py-4 sm:px-6 sm:py-8">
      {/* Desktop sidebar */}
      <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto rounded-2xl glass lg:block">
        <NavList />
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-white/10 bg-background/95 p-0 backdrop-blur-xl">
                <NavList onPick={() => setOpenMobile(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <current.icon className="h-5 w-5 text-primary" />
                <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
                  {current.label}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">Manage the {current.label.toLowerCase()} area.</p>
            </div>
          </div>
        </div>

        <div key={section} className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          {section === "dashboard"     && <DashboardSection go={setSection} />}
          {section === "tournaments"   && <TournamentsAdmin />}
          {section === "participants"  && <ParticipantsAdmin />}
          {section === "results"       && <ResultsAdmin />}
          {section === "winners"       && <WinnersAdmin />}
          {section === "payments"      && <PaymentsAdmin />}
          {section === "announcements" && <AnnouncementAdmin />}
          {section === "banners"       && <BannerManager />}
          {section === "notifications" && <NotificationsAdmin />}
          {section === "users"         && <UsersAdmin />}
          {section === "wallet"        && <WalletAdmin />}
          {section === "paysettings"   && <PaymentSettingsAdmin />}
          {section === "settings"      && <SettingsPlaceholder />}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────  DASHBOARD  ───────────────────────────── */

function DashboardSection({ go }: { go: (k: SectionKey) => void }) {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats-v2"],
    queryFn: async () => {
      const [u, t, tActive, tDone, regs, tours, wins, ann] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tournaments").select("*", { count: "exact", head: true }),
        supabase.from("tournaments").select("*", { count: "exact", head: true }).in("status", ["upcoming", "live"]),
        supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("tournament_registrations").select("*", { count: "exact", head: true }),
        supabase.from("tournaments").select("prize_pool"),
        supabase.from("winners").select("*", { count: "exact", head: true }),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
      ]);
      const pool = (tours.data ?? []).reduce((s, r: any) => s + Number(r.prize_pool || 0), 0);
      return {
        users: u.count ?? 0,
        tours: t.count ?? 0,
        active: tActive.count ?? 0,
        done: tDone.count ?? 0,
        regs: regs.count ?? 0,
        pool,
        wins: wins.count ?? 0,
        ann: ann.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Total Users",           value: String(stats?.users ?? 0), desc: "Registered profiles", icon: Users,        accent: "from-primary/25 to-primary/5",  fg: "text-primary" },
    { label: "Total Tournaments",     value: String(stats?.tours ?? 0), desc: "All time",            icon: Trophy,       accent: "from-accent/25 to-accent/5",    fg: "text-accent" },
    { label: "Active Tournaments",    value: String(stats?.active ?? 0),desc: "Upcoming + live",     icon: Radio,        accent: "from-emerald-500/25 to-emerald-500/5", fg: "text-emerald-400" },
    { label: "Completed Tournaments", value: String(stats?.done ?? 0),  desc: "Finished events",     icon: CheckCircle2, accent: "from-sky-500/25 to-sky-500/5",  fg: "text-sky-400" },
    { label: "Total Registrations",   value: String(stats?.regs ?? 0),  desc: "Slots taken",         icon: Users2,       accent: "from-primary/25 to-primary/5",  fg: "text-primary" },
    { label: "Total Prize Pool",      value: currency(stats?.pool ?? 0),desc: "Across all events",   icon: DollarSign,   accent: "from-accent/25 to-accent/5",    fg: "text-accent" },
    { label: "Total Winners",         value: String(stats?.wins ?? 0),  desc: "Posted results",      icon: Crown,        accent: "from-yellow-500/25 to-yellow-500/5", fg: "text-yellow-400" },
    { label: "Total Announcements",   value: String(stats?.ann ?? 0),   desc: "Published",           icon: Megaphone,    accent: "from-fuchsia-500/25 to-fuchsia-500/5", fg: "text-fuchsia-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label} className="glass group relative overflow-hidden border-white/5 transition-transform hover:-translate-y-0.5">
            <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60", c.accent)} />
            <CardContent className="relative p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-xs">
                  {c.label}
                </span>
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10", c.fg)}>
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 font-display text-2xl font-bold sm:text-3xl">{c.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass border-white/5 lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-lg font-bold">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: "tournaments", label: "New Tournament", icon: Trophy },
                { k: "winners", label: "Post Winner", icon: Crown },
                { k: "announcements", label: "Announce", icon: Megaphone },
                { k: "wallet", label: "Wallet Queue", icon: Wallet },
              ].map(a => (
                <button key={a.k}
                  onClick={() => go(a.k as SectionKey)}
                  className="glass flex flex-col items-start gap-2 rounded-xl border border-white/5 p-4 text-left transition-all hover:border-primary/40 hover:bg-white/5">
                  <a.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{a.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardContent className="p-5">
            <h3 className="mb-2 font-display text-lg font-bold">Status</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span className="text-muted-foreground">Realtime</span><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Online</Badge></li>
              <li className="flex items-center justify-between"><span className="text-muted-foreground">Auth</span><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Healthy</Badge></li>
              <li className="flex items-center justify-between"><span className="text-muted-foreground">Storage</span><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">OK</Badge></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SHARED UI  ───────────────────────────── */

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Card className={cn("glass border-white/5", className)}><CardContent className="p-4 sm:p-5">{children}</CardContent></Card>;
}

function ConfirmDelete({ onConfirm, label = "Delete" }: { onConfirm: () => void; label?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="glass-strong">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function statusBadge(s?: string) {
  const map: Record<string, string> = {
    upcoming: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    live: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    completed: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    cancelled: "bg-destructive/20 text-destructive border-destructive/30",
    active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    suspended: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    banned: "bg-destructive/20 text-destructive border-destructive/30",
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={cn("capitalize", map[s ?? ""] ?? "bg-white/5")}>{s ?? "—"}</Badge>;
}

/* ─────────────────────────────  TOURNAMENTS  ───────────────────────────── */

function TournamentsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "old" | "prize">("new");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data } = useQuery({
    queryKey: ["admin-tours"],
    queryFn: async () => (await supabase.from("tournaments").select("*").order("start_time", { ascending: false })).data ?? [],
  });

  const filtered = useMemo(() => {
    let list = (data ?? []).filter((t: any) =>
      (statusF === "all" || t.status === statusF) &&
      (!q || `${t.title} ${t.map} ${t.mode}`.toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "new") list = list.slice().sort((a: any, b: any) => +new Date(b.start_time) - +new Date(a.start_time));
    if (sort === "old") list = list.slice().sort((a: any, b: any) => +new Date(a.start_time) - +new Date(b.start_time));
    if (sort === "prize") list = list.slice().sort((a: any, b: any) => Number(b.prize_pool) - Number(a.prize_pool));
    return list;
  }, [data, q, statusF, sort]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const del = async (id: string) => {
    if (!window.confirm("Delete this tournament? All registered players will be refunded to their wallets.")) return;
    const { data, error } = await supabase.rpc("cancel_and_refund_tournament" as any, { _tid: id, _delete: true });
    if (error) return toast.error(error.message);
    const res = (data ?? {}) as { refunded_count?: number; total_refunded?: number };
    toast.success(`Deleted. Refunded ${res.refunded_count ?? 0} player(s) · ₹${res.total_refunded ?? 0}`);
    qc.invalidateQueries();
  };

  const toggleRegistration = async (t: any) => {
    const next = !(t.registration_open ?? true);
    const { error } = await supabase.rpc("set_registration_open" as any, { _tid: t.id, _open: next });
    if (error) return toast.error(error.message);
    toast.success(next ? "Registration opened" : "Registration closed");
    qc.invalidateQueries({ queryKey: ["admin-tours"] });
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search title, map, mode…" className="pl-9" />
          </div>
          <Select value={statusF} onValueChange={v => { setStatusF(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Newest</SelectItem>
              <SelectItem value="old">Oldest</SelectItem>
              <SelectItem value="prize">Prize (high)</SelectItem>
            </SelectContent>
          </Select>
          <TournamentDialog onDone={() => qc.invalidateQueries()} />
        </div>
      </SectionCard>

      <SectionCard className="p-0">
        <ul className="divide-y divide-white/5">
          {paged.map((t: any) => (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 transition-colors hover:bg-white/[0.03] sm:flex sm:flex-wrap sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-accent/20 text-accent border-accent/30">{tournamentTypeLabel[t.type]}</Badge>
                  {statusBadge(t.status)}
                  <span className="truncate font-semibold">{t.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <CalendarClock className="mr-1 inline h-3 w-3" />
                  {dt(t.start_time)} · {t.filled_slots}/{t.max_slots} · Prize {currency(t.prize_pool)}
                  {" · "}
                  <span className={t.registration_open === false ? "text-destructive" : "text-emerald-400"}>
                    {t.registration_open === false ? "Registration Closed" : "Registration Open"}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="outline"
                  className={cn("h-8", t.registration_open === false ? "border-emerald-500/30 text-emerald-300" : "border-destructive/30 text-destructive")}
                  onClick={() => toggleRegistration(t)}>
                  {t.registration_open === false ? "Open Registration" : "Close Registration"}
                </Button>
                <RoomDialog tour={t} />
                <ConfirmDelete onConfirm={() => del(t.id)} />
              </div>
            </li>
          ))}
          {paged.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">No tournaments match.</li>}
        </ul>
      </SectionCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">{title}</h4>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function TournamentDialog({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    title: "", description: "", type: "br_squad", map: "Bermuda", mode: "Classic",
    entry_fee: "10", prize_pool: "1000", per_kill_prize: "10", max_slots: "48",
    rules: "", start_time: "", registration_deadline: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("tournaments").insert({
      title: f.title, description: f.description, type: f.type as any, map: f.map, mode: f.mode,
      entry_fee: parseFloat(f.entry_fee), prize_pool: parseFloat(f.prize_pool), per_kill_prize: parseFloat(f.per_kill_prize),
      max_slots: parseInt(f.max_slots), rules: f.rules, start_time: new Date(f.start_time).toISOString(),
      registration_deadline: f.registration_deadline ? new Date(f.registration_deadline).toISOString() : null,
      created_by: user!.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Tournament created"); setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary glow"><Plus className="mr-2 h-4 w-4" />New Tournament</Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create tournament</DialogTitle>
          <DialogDescription>Fill in the details below. Fields are grouped for clarity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormSection title="Tournament Details">
            <div className="md:col-span-2"><Label>Title</Label><Input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={f.type} onValueChange={v => setF({ ...f, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="br_solo">BR Solo</SelectItem>
                  <SelectItem value="br_duo">BR Duo</SelectItem>
                  <SelectItem value="br_squad">BR Squad</SelectItem>
                  <SelectItem value="cs_squad">CS Squad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Map</Label>
              <Select value={f.map} onValueChange={v => setF({ ...f, map: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Bermuda", "Purgatory", "Kalahari", "Alpine", "Nexterra", "Bermuda Remastered"].map(m =>
                    <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={f.mode} onValueChange={v => setF({ ...f, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Classic", "Ranked", "Clash Squad", "Lone Wolf", "Custom"].map(m =>
                    <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormSection title="Prize Details">
            <div><Label>Entry Fee (₹)</Label><Input type="number" value={f.entry_fee} onChange={e => setF({ ...f, entry_fee: e.target.value })} /></div>
            <div><Label>Prize Pool (₹)</Label><Input type="number" value={f.prize_pool} onChange={e => setF({ ...f, prize_pool: e.target.value })} /></div>
            <div><Label>Per Kill (₹)</Label><Input type="number" value={f.per_kill_prize} onChange={e => setF({ ...f, per_kill_prize: e.target.value })} /></div>
            <div><Label>Max Slots</Label><Input type="number" required value={f.max_slots} onChange={e => setF({ ...f, max_slots: e.target.value })} /></div>
          </FormSection>

          <FormSection title="Schedule">
            <div><Label>Start time</Label><Input type="datetime-local" required value={f.start_time} onChange={e => setF({ ...f, start_time: e.target.value })} /></div>
            <div><Label>Registration deadline</Label><Input type="datetime-local" value={f.registration_deadline} onChange={e => setF({ ...f, registration_deadline: e.target.value })} /></div>
          </FormSection>

          <FormSection title="Registration Settings">
            <div className="md:col-span-2"><Label>Rules</Label><Textarea rows={4} value={f.rules} onChange={e => setF({ ...f, rules: e.target.value })} /></div>
          </FormSection>

          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary glow">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create tournament"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoomDialog({ tour }: { tour: any }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ room_id: "", room_password: "", reveal_at: "" });
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("rooms").select("*").eq("tournament_id", tour.id).maybeSingle();
      if (data) {
        const local = new Date(new Date(data.reveal_at).getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16);
        setF({ room_id: data.room_id ?? "", room_password: data.room_password ?? "", reveal_at: local });
      }
    })();
  }, [open, tour.id]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.reveal_at) return toast.error("Set a reveal time");
    const { error } = await supabase.from("rooms").upsert({
      tournament_id: tour.id, room_id: f.room_id, room_password: f.room_password,
      reveal_at: new Date(f.reveal_at).toISOString(),
    }, { onConflict: "tournament_id" });
    if (error) return toast.error(error.message);
    toast.success("Room saved · players will be notified"); setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Room</Button></DialogTrigger>
      <DialogContent className="glass-strong">
        <DialogHeader><DialogTitle>Room details</DialogTitle><DialogDescription>Publish the room ID and password. They stay hidden from players until the reveal time.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Room ID</Label><Input required value={f.room_id} onChange={e => setF({ ...f, room_id: e.target.value })} /></div>
          <div><Label>Password</Label><Input required value={f.room_password} onChange={e => setF({ ...f, room_password: e.target.value })} /></div>
          <div>
            <Label>Reveal at</Label>
            <Input type="datetime-local" required value={f.reveal_at} onChange={e => setF({ ...f, reveal_at: e.target.value })} />
            <p className="mt-1 text-xs text-muted-foreground">Players see a countdown until this time, then Room ID & Password appear automatically.</p>
          </div>
          <Button type="submit" className="w-full bg-gradient-primary">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────  PARTICIPANTS  ───────────────────────────── */

function ParticipantsAdmin() {
  const qc = useQueryClient();
  const [tid, setTid] = useState<string>("");
  const [q, setQ] = useState("");

  const { data: tours } = useQuery({
    queryKey: ["adm-tours-list"],
    queryFn: async () => (await supabase.from("tournaments").select("id, title, start_time").order("start_time", { ascending: false })).data ?? [],
  });

  const { data: parts } = useQuery({
    queryKey: ["adm-parts", tid],
    enabled: !!tid,
    queryFn: async () => {
      const { data: regs } = await supabase.from("tournament_registrations")
        .select("*").eq("tournament_id", tid).order("created_at", { ascending: false });
      const ids = (regs ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles")
        .select("id, uid, full_name, game_name, avatar_url, status, email").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (regs ?? []).map((r: any) => ({ ...r, profile: map.get(r.user_id) }));
    },
  });

  const filtered = (parts ?? []).filter((p: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return `${p.profile?.game_name} ${p.profile?.full_name} ${p.profile?.uid} ${p.ff_uid}`.toLowerCase().includes(s);
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("tournament_registrations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); qc.invalidateQueries();
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={tid} onValueChange={setTid}>
            <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Pick a tournament…" /></SelectTrigger>
            <SelectContent>
              {tours?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search participants…" className="pl-9" />
          </div>
        </div>
      </SectionCard>

      {!tid && <SectionCard><p className="py-8 text-center text-sm text-muted-foreground">Select a tournament to view its participants.</p></SectionCard>}

      {tid && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p: any) => (
            <Card key={p.id} className="glass border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                    <AvatarImage src={p.profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {(p.profile?.game_name || p.profile?.full_name || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.profile?.game_name || p.profile?.full_name || "Unknown"}</div>
                    <p className="truncate text-xs text-muted-foreground">FF UID: {p.ff_uid ?? "—"}</p>
                  </div>
                  {statusBadge(p.profile?.status)}
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Slot: <span className="text-foreground font-medium">#{p.slot_number ?? "—"}</span></p>
                  <p>Registered: <span className="text-foreground">{dt(p.created_at)}</span></p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <EditFfUidButton reg={p} onDone={() => qc.invalidateQueries({ queryKey: ["adm-parts", tid] })} />
                  <ConfirmDelete onConfirm={() => remove(p.id)} label="Remove" />
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full">
              <SectionCard><p className="py-8 text-center text-sm text-muted-foreground">No participants match.</p></SectionCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditFfUidButton({ reg, onDone }: { reg: any; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(reg.ff_uid ?? "");
  const [busy, setBusy] = useState(false);

  const valid = /^\d{8,12}$/.test(val.trim());
  const save = async () => {
    const clean = val.trim();
    if (!/^\d{8,12}$/.test(clean)) return toast.error("Free Fire UID must be 8–12 digits");
    setBusy(true);
    const { error } = await supabase.rpc("admin_update_reg_ff_uid" as any, { _reg_id: reg.id, _ff_uid: clean });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("UID updated");
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setVal(reg.ff_uid ?? ""); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1">
          {reg.ff_uid ? "Edit UID" : "Set UID"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reg.ff_uid ? "Edit Free Fire UID" : "Add Free Fire UID"}</DialogTitle>
          <DialogDescription>Update the player's in-game UID for this registration.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`ffuid-${reg.id}`}>Free Fire UID</Label>
          <Input id={`ffuid-${reg.id}`} inputMode="numeric" pattern="\d*" maxLength={12} value={val}
            onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="Enter your Free Fire UID" />
          <p className="text-xs text-muted-foreground">Numbers only, 8 to 12 digits.</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy || !valid}>{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────  WINNERS  ───────────────────────────── */

/* ─────────────────────────────  PUBLISH RESULTS  ───────────────────────────── */

type ResultRow = { user_id: string; slot_number: number | null; name: string; position: string; kills: string; points: string; prize: string; mvp: boolean };

function ResultsAdmin() {
  const qc = useQueryClient();
  const [tid, setTid] = useState("");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [busy, setBusy] = useState(false);

  const { data: tours } = useQuery({
    queryKey: ["adm-tours-for-results"],
    queryFn: async () =>
      (await supabase.from("tournaments").select("id,title,status,start_time,prize_pool,per_kill_prize").in("status", ["live", "completed", "upcoming"]).order("start_time", { ascending: false }).limit(200)).data ?? [],
  });

  const { data: existing } = useQuery({
    queryKey: ["adm-results-existing", tid],
    enabled: !!tid,
    queryFn: async () => {
      const [regs, res, profs] = await Promise.all([
        supabase.from("tournament_registrations").select("user_id, slot_number").eq("tournament_id", tid).order("slot_number", { ascending: true }),
        supabase.from("match_results").select("user_id, position, kills, points, prize, mvp").eq("tournament_id", tid),
        Promise.resolve(null),
      ]);
      const ids = (regs.data ?? []).map((r: any) => r.user_id);
      const { data: p } = ids.length
        ? await supabase.from("profiles").select("id, game_name, full_name, email").in("id", ids)
        : { data: [] as any[] };
      const byId = new Map((p ?? []).map((x: any) => [x.id, x]));
      const resById = new Map((res.data ?? []).map((r: any) => [r.user_id, r]));
      return (regs.data ?? []).map((r: any) => {
        const pr = byId.get(r.user_id);
        const ex = resById.get(r.user_id) as any;
        return {
          user_id: r.user_id,
          slot_number: r.slot_number,
          name: pr?.game_name || pr?.full_name || pr?.email || r.user_id.slice(0, 8),
          position: ex?.position != null ? String(ex.position) : "",
          kills: ex?.kills != null ? String(ex.kills) : "0",
          points: ex?.points != null ? String(ex.points) : "0",
          prize: ex?.prize != null ? String(ex.prize) : "0",
          mvp: !!ex?.mvp,
        } as ResultRow;
      });
    },
  });

  useEffect(() => { if (existing) setRows(existing); }, [existing]);

  const upd = (i: number, patch: Partial<ResultRow>) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const publish = async () => {
    if (!tid) return toast.error("Pick a tournament");
    if (rows.length === 0) return toast.error("No participants to publish");
    setBusy(true);
    const payload = rows
      .filter(r => r.position !== "" || Number(r.kills) > 0 || Number(r.prize) > 0)
      .map(r => ({
        user_id: r.user_id,
        position: r.position === "" ? null : Number(r.position),
        kills: Number(r.kills) || 0,
        points: Number(r.points) || 0,
        prize: Number(r.prize) || 0,
        mvp: r.mvp,
      }));
    if (payload.length === 0) { setBusy(false); return toast.error("Fill at least one row"); }
    const { error } = await supabase.rpc("publish_tournament_results", { _tid: tid, _rows: payload as any });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Published ${payload.length} result${payload.length > 1 ? "s" : ""} · wallets credited · users notified`);
    qc.invalidateQueries();
  };

  const podium = rows.filter(r => r.position && Number(r.position) >= 1 && Number(r.position) <= 3).length;
  const totalPrize = rows.reduce((s, r) => s + (Number(r.prize) || 0), 0);

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Label>Tournament</Label>
            <Select value={tid} onValueChange={setTid}>
              <SelectTrigger><SelectValue placeholder="Select tournament…" /></SelectTrigger>
              <SelectContent>
                {tours?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} · <span className="opacity-60">{t.status}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tid && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-white/10">{rows.length} players</Badge>
              <Badge variant="outline" className="border-white/10">Podium: {podium}/3</Badge>
              <Badge variant="outline" className="border-white/10">Prize sum: {currency(totalPrize)}</Badge>
            </div>
          )}
        </div>
      </SectionCard>

      {tid && rows.length === 0 && (
        <SectionCard><p className="p-6 text-center text-sm text-muted-foreground">No registered participants for this tournament yet.</p></SectionCard>
      )}

      {tid && rows.length > 0 && (
        <>
          <SectionCard className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-white/5">
                  <th className="p-3">Slot</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 w-20">Position</th>
                  <th className="p-3 w-20">Kills</th>
                  <th className="p-3 w-20">Points</th>
                  <th className="p-3 w-24">Prize (₹)</th>
                  <th className="p-3 w-16">MVP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.user_id} className="border-b border-white/5">
                    <td className="p-3 text-muted-foreground">#{r.slot_number ?? "—"}</td>
                    <td className="p-3 font-medium truncate">{r.name}</td>
                    <td className="p-2"><Input type="number" min="1" value={r.position} onChange={e => upd(i, { position: e.target.value })} className="h-9" /></td>
                    <td className="p-2"><Input type="number" min="0" value={r.kills} onChange={e => upd(i, { kills: e.target.value })} className="h-9" /></td>
                    <td className="p-2"><Input type="number" min="0" value={r.points} onChange={e => upd(i, { points: e.target.value })} className="h-9" /></td>
                    <td className="p-2"><Input type="number" min="0" step="0.01" value={r.prize} onChange={e => upd(i, { prize: e.target.value })} className="h-9" /></td>
                    <td className="p-2 text-center">
                      <input type="checkbox" checked={r.mvp} onChange={e => upd(i, { mvp: e.target.checked })} className="h-4 w-4 accent-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={busy} className="bg-gradient-primary glow">
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Publish results
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-strong">
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish final results?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This marks the tournament as completed, credits {currency(totalPrize)} to winners' wallets,
                    updates the leaderboard, adds top 3 to the Winners page, and notifies every participant.
                    You can re-run to correct rows.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={publish} className="bg-gradient-primary">Publish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </div>
  );
}

function WinnersAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ tournament_id: "", user_id: "", position: "1", prize: "" });

  const { data: tours } = useQuery({
    queryKey: ["adm-tours-for-winner"],
    queryFn: async () => (await supabase.from("tournaments").select("id, title, start_time, prize_pool, status").order("start_time", { ascending: false }).limit(200)).data ?? [],
  });

  const selectedTour = (tours ?? []).find((t: any) => t.id === f.tournament_id);

  const { data: players } = useQuery({
    queryKey: ["adm-tour-players", f.tournament_id],
    enabled: !!f.tournament_id,
    queryFn: async () => {
      const { data: regs } = await supabase.from("tournament_registrations")
        .select("user_id, slot_number").eq("tournament_id", f.tournament_id).order("slot_number", { ascending: true });
      const ids = (regs ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, game_name, email").in("id", ids);
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (regs ?? []).map((r: any) => ({ ...r, profile: byId.get(r.user_id) }));
    },
  });

  // Existing winners for this tournament — disable already-awarded positions
  const { data: existingWinners } = useQuery({
    queryKey: ["adm-winners-for-tour", f.tournament_id],
    enabled: !!f.tournament_id,
    queryFn: async () => (await supabase.from("winners").select("user_id, position").eq("tournament_id", f.tournament_id)).data ?? [],
  });
  const takenPositions = new Set((existingWinners ?? []).map((w: any) => w.position));
  const takenUsers = new Set((existingWinners ?? []).map((w: any) => w.user_id));

  // Auto-fill prize from tournament prize_pool when tournament or position changes
  useEffect(() => {
    if (!selectedTour) return;
    const pool = Number(selectedTour.prize_pool || 0);
    const split: Record<string, number> = { "1": pool * 0.6, "2": pool * 0.3, "3": pool * 0.1 };
    const suggested = split[f.position] ?? pool;
    setF(prev => ({ ...prev, prize: suggested ? String(Math.round(suggested)) : "0" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.tournament_id, f.position]);

  const selectedPlayer = (players ?? []).find((p: any) => p.user_id === f.user_id);
  const playerName = selectedPlayer?.profile?.game_name || selectedPlayer?.profile?.full_name || selectedPlayer?.profile?.email || "";
  const positionLabel = ({ "1": "🥇 First Place", "2": "🥈 Second Place", "3": "🥉 Third Place" } as any)[f.position] ?? `Position #${f.position}`;

  const openConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(f.tournament_id)) return toast.error("Pick a tournament from the list");
    if (!UUID_RE.test(f.user_id)) return toast.error("Pick a registered player from the list");
    const amt = parseFloat(f.prize);
    if (!(amt > 0)) return toast.error("Enter a valid prize amount");
    if (takenPositions.has(parseInt(f.position))) return toast.error("Prize has already been distributed for this position.");
    if (takenUsers.has(f.user_id)) return toast.error("This player already received a prize for this tournament.");
    setConfirmOpen(true);
  };

  const distribute = async () => {
    setConfirmOpen(false);
    setBusy(true);
    const { error } = await supabase.rpc("distribute_prize" as any, {
      _tid: f.tournament_id,
      _uid: f.user_id,
      _position: parseInt(f.position),
      _amount: parseFloat(f.prize),
    });
    setBusy(false);
    if (error) {
      const msg = error.message.includes("prize_already_distributed") ? "Prize has already been distributed."
        : error.message.includes("player_not_registered") ? "Selected player is not registered for this tournament."
        : error.message.includes("not_authorized") ? "You are not authorized."
        : error.message;
      return toast.error(msg);
    }
    toast.success(`₹${f.prize} credited to ${playerName || "winner"}`);
    setOpen(false);
    setF({ tournament_id: "", user_id: "", position: "1", prize: "" });
    qc.invalidateQueries();
  };

  const { data } = useQuery({ queryKey: ["adm-winners"], queryFn: async () => (await supabase.from("winners").select("*, tournaments(title)").order("created_at", { ascending: false }).limit(50)).data ?? [] });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary glow"><Crown className="mr-2 h-4 w-4" />Distribute Prize</Button></DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Distribute prize</DialogTitle>
              <DialogDescription>Pick a tournament, a registered player, and the position. Prize auto-loads from the tournament's prize pool.</DialogDescription>
            </DialogHeader>
            <form onSubmit={openConfirm} className="space-y-3">
              <div>
                <Label>Tournament</Label>
                <Select value={f.tournament_id} onValueChange={v => setF({ ...f, tournament_id: v, user_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select tournament…" /></SelectTrigger>
                  <SelectContent>
                    {tours?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}{t.status ? ` · ${t.status}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Player (registered only)</Label>
                <Select value={f.user_id} onValueChange={v => setF({ ...f, user_id: v })} disabled={!f.tournament_id}>
                  <SelectTrigger><SelectValue placeholder={f.tournament_id ? (players?.length ? "Select player…" : "No registered players") : "Pick tournament first"} /></SelectTrigger>
                  <SelectContent>
                    {players?.map((p: any) => {
                      const already = takenUsers.has(p.user_id);
                      return (
                        <SelectItem key={p.user_id} value={p.user_id} disabled={already}>
                          #{p.slot_number} · {p.profile?.game_name || p.profile?.full_name || p.profile?.email || p.user_id.slice(0, 8)}{already ? " (already awarded)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Position</Label>
                  <Select value={f.position} onValueChange={v => setF({ ...f, position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" disabled={takenPositions.has(1)}>🥇 First Place{takenPositions.has(1) ? " (awarded)" : ""}</SelectItem>
                      <SelectItem value="2" disabled={takenPositions.has(2)}>🥈 Second Place{takenPositions.has(2) ? " (awarded)" : ""}</SelectItem>
                      <SelectItem value="3" disabled={takenPositions.has(3)}>🥉 Third Place{takenPositions.has(3) ? " (awarded)" : ""}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Prize (₹)</Label><Input type="number" min="1" step="0.01" value={f.prize} onChange={e => setF({ ...f, prize: e.target.value })} /></div>
              </div>
              {selectedTour && <p className="text-xs text-muted-foreground">Tournament prize pool: {currency(Number(selectedTour.prize_pool || 0))}</p>}
              <Button type="submit" disabled={!f.tournament_id || !f.user_id || busy} className="w-full bg-gradient-primary glow">
                {busy ? "Distributing…" : "Review & confirm"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm prize distribution</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to credit <b>{currency(Number(f.prize) || 0)}</b> to <b>{playerName || "the selected player"}</b> for <b>{positionLabel}</b> in <b>{selectedTour?.title}</b>. This action cannot be repeated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={distribute}>Confirm & credit wallet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SectionCard className="p-0">
        <ul className="divide-y divide-white/5">
          {data?.map((w: any) => (
            <li key={w.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">#{w.position}</div>
                  <span className="truncate font-semibold">{w.tournaments?.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{dt(w.created_at)}</p>
              </div>
              <div className="font-display text-lg font-bold text-gradient">{currency(w.prize)}</div>
            </li>
          ))}
          {(!data || data.length === 0) && <li className="p-10 text-center text-sm text-muted-foreground">No winners yet.</li>}
        </ul>
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────  ANNOUNCEMENTS  ───────────────────────────── */

function AnnouncementAdmin() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("announcements").insert({ title, body });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Posted"); setTitle(""); setBody(""); qc.invalidateQueries();
  };

  const { data } = useQuery({ queryKey: ["adm-ann"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [] });

  const del = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); qc.invalidateQueries();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard>
        <form onSubmit={submit} className="space-y-3">
          <h3 className="flex items-center gap-2 font-display font-bold"><Megaphone className="h-4 w-4 text-primary" />New announcement</h3>
          <div><Label>Title</Label><Input required value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Body</Label><Textarea required rows={5} value={body} onChange={e => setBody(e.target.value)} /></div>
          <Button type="submit" disabled={busy} className="bg-gradient-primary glow">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard className="p-0">
        <div className="border-b border-white/5 p-4">
          <h3 className="font-display font-bold">Previous announcements</h3>
        </div>
        <ul className="max-h-[600px] divide-y divide-white/5 overflow-y-auto">
          {data?.map((a: any) => (
            <li key={a.id} className="group p-4 transition-colors hover:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.title}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">{dt(a.created_at)}</p>
                </div>
                <ConfirmDelete onConfirm={() => del(a.id)} />
              </div>
            </li>
          ))}
          {(!data || data.length === 0) && <li className="p-10 text-center text-sm text-muted-foreground">No announcements yet.</li>}
        </ul>
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────  BANNERS / NOTIFS / SETTINGS  ───────────────────────────── */

function BannerManager() {
  return (
    <SectionCard>
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary/20 text-primary">
          <ImageIcon className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-bold">Banner Manager</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Tournament banners are set via the <span className="font-semibold text-foreground">banner_url</span> field on each tournament.
          A full uploader UI is coming soon — for now edit the tournament to change its banner.
        </p>
      </div>
    </SectionCard>
  );
}

function NotificationsAdmin() {
  const { data } = useQuery({
    queryKey: ["adm-notifs"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(80)).data ?? [],
  });
  return (
    <SectionCard className="p-0">
      <div className="border-b border-white/5 p-4">
        <h3 className="font-display font-bold">Recent notifications</h3>
        <p className="text-xs text-muted-foreground">Latest events fanned out to users.</p>
      </div>
      <ul className="max-h-[600px] divide-y divide-white/5 overflow-y-auto">
        {data?.map((n: any) => (
          <li key={n.id} className="flex items-start gap-3 p-4">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{n.title}</span>
                {statusBadge(n.type)}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{dt(n.created_at)}</p>
            </div>
          </li>
        ))}
        {(!data || data.length === 0) && <li className="p-10 text-center text-sm text-muted-foreground">No notifications yet.</li>}
      </ul>
    </SectionCard>
  );
}

function SettingsPlaceholder() {
  return (
    <SectionCard>
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary/20 text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-bold">Settings</h3>
        <p className="max-w-md text-sm text-muted-foreground">Global configuration is managed via the backend for now.</p>
      </div>
    </SectionCard>
  );
}

/* ─────────────────────────────  USERS  ───────────────────────────── */

function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data } = useQuery({
    queryKey: ["adm-users"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const setStatus = async (id: string, status: "active" | "suspended" | "banned") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status); qc.invalidateQueries();
  };

  const filtered = (data ?? []).filter((u: any) =>
    (statusF === "all" || u.status === statusF) &&
    (!q || `${u.game_name} ${u.full_name} ${u.email} ${u.uid}`.toLowerCase().includes(q.toLowerCase()))
  );
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email, UID…" className="pl-9" />
          </div>
          <Select value={statusF} onValueChange={v => { setStatusF(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <SectionCard className="p-0">
        <ul className="divide-y divide-white/5">
          {paged.map((u: any) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {(u.game_name || u.full_name || u.email || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{u.game_name || u.full_name || u.email}</div>
                  <p className="truncate text-xs text-muted-foreground">{u.uid} · {u.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {statusBadge(u.status)}
                <Button size="sm" variant="outline" onClick={() => setStatus(u.id, "active")}>Activate</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(u.id, "suspended")}>Suspend</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => setStatus(u.id, "banned")}>Ban</Button>
              </div>
            </li>
          ))}
          {paged.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">No users match.</li>}
        </ul>
      </SectionCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────  WALLET  ───────────────────────────── */

function WalletAdmin() {
  const qc = useQueryClient();
  const [wdTab, setWdTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [depTab, setDepTab] = useState<"pending" | "approved" | "rejected">("pending");

  const { data: deps } = useQuery({
    queryKey: ["adm-deps"],
    queryFn: async () => (await supabase.from("deposit_requests").select("*, profiles(uid, game_name, full_name, email, game_uid)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: wds } = useQuery({
    queryKey: ["adm-wds"],
    queryFn: async () => (await supabase.from("withdraw_requests").select("*, profiles(uid, game_name, full_name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: walletStats } = useQuery({
    queryKey: ["adm-wallet-stats"],
    queryFn: async () => {
      const [{ data: sums }, { data: totals }] = await Promise.all([
        supabase.from("wallets").select("balance"),
        supabase.from("wallet_transactions").select("type, amount"),
      ]);
      const distributed = (sums ?? []).reduce((s, r: any) => s + Number(r.balance ?? 0), 0);
      const paid = (totals ?? []).filter((t: any) => t.type === "withdraw").reduce((s, t: any) => s + Math.abs(Number(t.amount)), 0);
      return { distributed, paid };
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("adm-wallet")
      .on("postgres_changes", { event: "*", schema: "public", table: "withdraw_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["adm-wds"] });
        qc.invalidateQueries({ queryKey: ["adm-wallet-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "deposit_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["adm-deps"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const approveDeposit = async (r: any) => {
    const { error } = await supabase.rpc("approve_deposit" as any, { _id: r.id });
    if (error) return toast.error(error.message);
    toast.success("Deposit approved");
    qc.invalidateQueries({ queryKey: ["adm-deps"] });
    qc.invalidateQueries({ queryKey: ["adm-wallet-stats"] });
  };
  const rejectDeposit = async (r: any) => {
    const reason = window.prompt("Rejection reason (optional):") ?? "";
    const { error } = await supabase.rpc("reject_deposit" as any, { _id: r.id, _reason: reason });
    if (error) return toast.error(error.message);
    toast.success("Deposit rejected");
    qc.invalidateQueries({ queryKey: ["adm-deps"] });
  };
  const approveWithdraw = async (r: any) => {
    const { error } = await supabase.rpc("approve_withdrawal" as any, { _id: r.id });
    if (error) return toast.error(error.message);
    toast.success("Withdrawal approved");
    qc.invalidateQueries({ queryKey: ["adm-wds"] });
    qc.invalidateQueries({ queryKey: ["adm-wallet-stats"] });
  };
  const rejectWithdraw = async (r: any) => {
    const reason = window.prompt("Rejection reason:") ?? "";
    if (!reason.trim()) return;
    const { error } = await supabase.rpc("reject_withdrawal" as any, { _id: r.id, _reason: reason });
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    qc.invalidateQueries({ queryKey: ["adm-wds"] });
  };

  const pendingWd = (wds ?? []).filter((r: any) => r.status === "pending");
  const filteredWd = (wds ?? []).filter((r: any) => r.status === wdTab);

  const DepRow = ({ r }: any) => <DepositRow r={r} onApprove={approveDeposit} onReject={rejectDeposit} />;

  const WdRow = ({ r }: any) => (
    <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold">{currency(r.amount)} · {r.profiles?.game_name || r.profiles?.uid}</div>
          <p className="truncate text-xs text-muted-foreground">
            UPI: {r.account_details?.upi_id ?? "—"} · Name: {r.account_details?.account_holder ?? "—"}
          </p>
          {r.account_details?.notes && <p className="truncate text-xs text-muted-foreground">Notes: {r.account_details.notes}</p>}
          {r.status === "rejected" && r.admin_note && <p className="text-xs text-red-400">Reason: {r.admin_note}</p>}
        </div>
        {r.status === "pending" ? (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => approveWithdraw(r)} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
            <Button size="sm" variant="outline" onClick={() => rejectWithdraw(r)}>Reject</Button>
          </div>
        ) : (
          <Badge variant="outline" className="capitalize">{r.status}</Badge>
        )}
      </div>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SectionCard><div className="text-xs text-muted-foreground">Pending withdrawals</div><div className="mt-1 font-display text-2xl font-bold text-yellow-400">{pendingWd.length}</div><div className="text-xs text-muted-foreground">{currency(pendingWd.reduce((s: number, r: any) => s + Number(r.amount), 0))}</div></SectionCard>
        <SectionCard><div className="text-xs text-muted-foreground">Total paid out</div><div className="mt-1 font-display text-2xl font-bold text-emerald-400">{currency(walletStats?.paid ?? 0)}</div></SectionCard>
        <SectionCard><div className="text-xs text-muted-foreground">Wallet balance distributed</div><div className="mt-1 font-display text-2xl font-bold text-gradient">{currency(walletStats?.distributed ?? 0)}</div></SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display font-bold">Deposits</h3>
            <div className="flex gap-1">
              {(["pending", "approved", "rejected"] as const).map((s) => (
                <Button key={s} size="sm" variant={depTab === s ? "default" : "outline"} className="capitalize" onClick={() => setDepTab(s)}>{s}</Button>
              ))}
            </div>
          </div>
          <ul className="space-y-2">
            {deps?.filter((d: any) => d.status === depTab).map((r: any) => <DepRow key={r.id} r={r} />)}
            {(deps?.filter((d: any) => d.status === depTab).length ?? 0) === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing here.</li>}
          </ul>
        </SectionCard>
        <SectionCard>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display font-bold">Withdrawals</h3>
            <div className="flex gap-1">
              {(["pending", "approved", "rejected"] as const).map((s) => (
                <Button key={s} size="sm" variant={wdTab === s ? "default" : "outline"} className="capitalize" onClick={() => setWdTab(s)}>{s}</Button>
              ))}
            </div>
          </div>
          <ul className="space-y-2">
            {filteredWd.map((r: any) => <WdRow key={r.id} r={r} />)}
            {filteredWd.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing here.</li>}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function DepositRow({ r, onApprove, onReject }: { r: any; onApprove: (r: any) => void; onReject: (r: any) => void }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    if (!r.proof_url) return;
    supabase.storage.from("payment-proofs").createSignedUrl(r.proof_url, 60 * 60).then(({ data }) => setThumb(data?.signedUrl ?? null));
  }, [r.proof_url]);
  const name = r.profiles?.full_name || r.profiles?.game_name || r.profiles?.uid || "Player";
  return (
    <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
      <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-3">
        <a href={thumb ?? "#"} target="_blank" rel="noopener noreferrer" className="block h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
          {thumb ? <img src={thumb} alt="Payment proof" className="h-full w-full object-cover" /> : null}
        </a>
        <div className="min-w-0 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="truncate font-semibold">{name}</span>
            <span className="font-display font-bold text-gradient">{currency(r.amount)}</span>
            <Badge variant="outline" className="capitalize">{r.method}</Badge>
          </div>
          <p className="truncate text-muted-foreground">Email: {r.profiles?.email ?? "—"}</p>
          <p className="truncate text-muted-foreground">Game UID: {r.profiles?.game_uid ?? r.profiles?.uid ?? "—"}</p>
          <p className="truncate text-muted-foreground">Txn ID: {r.txn_id || "—"}</p>
          <p className="text-muted-foreground">{dt(r.created_at)}</p>
          {r.status === "rejected" && r.admin_note && <p className="text-red-400">Reason: {r.admin_note}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {r.status === "pending" ? (
            <>
              <Button size="sm" onClick={() => onApprove(r)} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
              <Button size="sm" variant="outline" onClick={() => onReject(r)}>Reject</Button>
            </>
          ) : (
            <Badge variant="outline" className="capitalize">{r.status}</Badge>
          )}
        </div>
      </div>
    </li>
  );
}

/* ─────────────────────────────  PAYMENTS  ───────────────────────────── */

function PaymentsAdmin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["adm-payments", tab],
    queryFn: async () => {
      const { data: pays } = await supabase.from("payments" as any)
        .select("*").eq("status", tab).order("created_at", { ascending: false });
      const list = (pays ?? []) as any[];
      if (!list.length) return [];
      const tourIds = Array.from(new Set(list.map(p => p.tournament_id)));
      const userIds = Array.from(new Set(list.map(p => p.user_id)));
      const [{ data: tours }, { data: profs }] = await Promise.all([
        supabase.from("tournaments").select("id, title").in("id", tourIds),
        supabase.from("profiles").select("id, uid, full_name, game_name, avatar_url").in("id", userIds),
      ]);
      const byT = new Map((tours ?? []).map((t: any) => [t.id, t]));
      const byU = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return list.map(p => ({ ...p, tournament: byT.get(p.tournament_id), profile: byU.get(p.user_id) }));
    },
  });

  const filtered = (data ?? []).filter((p: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return `${p.tournament?.title} ${p.profile?.game_name} ${p.profile?.full_name} ${p.profile?.uid}`.toLowerCase().includes(s);
  });

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_payment" as any, { _pid: id });
    if (error) return toast.error(error.message);
    toast.success("Payment approved & user registered");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
            {(["pending", "approved", "rejected"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  tab === t ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {t}
              </button>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user, tournament…" className="pl-9" />
          </div>
        </div>
      </SectionCard>

      {filtered.length === 0 ? (
        <SectionCard><p className="py-8 text-center text-sm text-muted-foreground">No {tab} payments.</p></SectionCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p: any) => <PaymentCard key={p.id} p={p} onApprove={() => approve(p.id)} />)}
        </div>
      )}
    </div>
  );
}

function PaymentCard({ p, onApprove }: { p: any; onApprove: () => void }) {
  const qc = useQueryClient();
  const [thumb, setThumb] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  useEffect(() => {
    if (!p.screenshot_url) return;
    supabase.storage.from("payment-proofs").createSignedUrl(p.screenshot_url, 60 * 60).then(({ data }) => setThumb(data?.signedUrl ?? null));
  }, [p.screenshot_url]);

  const doReject = async () => {
    const { error } = await supabase.rpc("reject_payment" as any, { _pid: p.id, _reason: reason });
    if (error) return toast.error(error.message);
    toast.success("Payment rejected");
    setRejectOpen(false); setReason("");
    qc.invalidateQueries();
  };

  return (
    <Card className="glass border-white/5">
      <a href={thumb ?? "#"} target="_blank" rel="noopener noreferrer" className="block h-40 w-full overflow-hidden bg-white/5">
        {thumb ? <img src={thumb} alt="Proof" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-muted-foreground">Loading…</div>}
      </a>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-1 ring-white/10">
            <AvatarImage src={p.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
              {(p.profile?.game_name || p.profile?.full_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{p.profile?.game_name || p.profile?.full_name || "Unknown"}</div>
            <p className="truncate text-xs text-muted-foreground">{p.tournament?.title ?? "—"}</p>
          </div>
          <div className="font-display font-bold">{currency(p.amount)}</div>
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">{dt(p.created_at)}</p>
        {p.status === "rejected" && p.rejection_reason && (
          <p className="mt-2 text-xs text-destructive">Reason: {p.rejection_reason}</p>
        )}
        {p.status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={onApprove} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Check className="mr-1 h-3 w-3" />Approve</Button>
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1"><X className="mr-1 h-3 w-3" />Reject</Button>
              </DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader>
                  <DialogTitle>Reject payment</DialogTitle>
                  <DialogDescription>The user will see this reason.</DialogDescription>
                </DialogHeader>
                <Textarea rows={3} placeholder="Reason for rejection…" value={reason} onChange={e => setReason(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button className="bg-destructive text-destructive-foreground" onClick={doReject}>Confirm reject</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────  PAYMENT SETTINGS  ───────────────────────────── */

function PaymentSettingsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["adm-paysettings"],
    queryFn: async () => (await supabase.from("settings").select("value").eq("key", "payment").maybeSingle()).data?.value as any,
  });

  const [upi, setUpi] = useState("");
  const [instructions, setInstructions] = useState("");
  const [qrPath, setQrPath] = useState<string>("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setUpi(data.upi_id ?? "");
    setInstructions(data.instructions ?? "");
    setQrPath(data.qr_url ?? "");
  }, [data]);

  useEffect(() => {
    if (!qrPath) { setQrPreview(null); return; }
    if (qrPath.startsWith("http")) { setQrPreview(qrPath); return; }
    supabase.storage.from("payment-config").createSignedUrl(qrPath, 60 * 60).then(({ data }) => setQrPreview(data?.signedUrl ?? null));
  }, [qrPath]);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `qr-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-config").upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) throw up.error;
      setQrPath(path);
      toast.success("QR uploaded — remember to Save");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true);
    const merged = { ...(data ?? {}), upi_id: upi, instructions, qr_url: qrPath };
    const { error } = await supabase.from("settings").update({ value: merged }).eq("key", "payment");
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Payment settings saved");
    qc.invalidateQueries({ queryKey: ["adm-paysettings"] });
    qc.invalidateQueries({ queryKey: ["settings", "payment"] });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard>
        <h3 className="mb-4 flex items-center gap-2 font-display font-bold"><QrCode className="h-4 w-4 text-primary" />UPI details</h3>
        <div className="space-y-3">
          <div><Label>UPI ID</Label><Input value={upi} onChange={e => setUpi(e.target.value)} placeholder="yourname@upi" /></div>
          <div><Label>Payment instructions</Label><Textarea rows={6} value={instructions} onChange={e => setInstructions(e.target.value)} /></div>
          <Button onClick={save} disabled={busy} className="bg-gradient-primary glow">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard>
        <h3 className="mb-4 flex items-center gap-2 font-display font-bold"><ImageIcon className="h-4 w-4 text-primary" />QR image</h3>
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-56 w-56 place-items-center overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-white/10">
            {qrPreview
              ? <img src={qrPreview} alt="UPI QR" className="h-full w-full object-contain" />
              : <div className="text-center text-xs text-muted-foreground"><ImageIcon className="mx-auto mb-2 h-8 w-8" />No QR uploaded</div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.currentTarget.value = ""; }} />
          <Button onClick={() => fileRef.current?.click()} disabled={busy} variant="outline" className="w-full">
            <Upload className="mr-2 h-4 w-4" />{qrPath ? "Replace QR image" : "Upload QR image"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Recommended: square PNG, max 2 MB. Click Save after uploading.</p>
        </div>
      </SectionCard>
    </div>
  );
}
