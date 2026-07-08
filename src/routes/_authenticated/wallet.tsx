import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { currency, dt } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, Clock, Copy, Image as ImageIcon, Loader2, TrendingUp, Wallet as WalletIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
  head: () => ({ meta: [{ title: "Wallet — MAMU HUB" }] }),
});

function WalletPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
    qc.invalidateQueries({ queryKey: ["txs", user?.id] });
    qc.invalidateQueries({ queryKey: ["deps", user?.id] });
    qc.invalidateQueries({ queryKey: ["wds", user?.id] });
  };

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => (await supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle()).data,
    enabled: !!user,
  });

  const { data: txs } = useQuery({
    queryKey: ["txs", user?.id],
    queryFn: async () => (await supabase.from("wallet_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100)).data ?? [],
    enabled: !!user,
  });

  const { data: deps } = useQuery({
    queryKey: ["deps", user?.id],
    queryFn: async () => (await supabase.from("deposit_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  const { data: wds } = useQuery({
    queryKey: ["wds", user?.id],
    queryFn: async () => (await supabase.from("withdraw_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  // Realtime — refresh on changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`wallet-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => invalidateAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` }, () => invalidateAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "withdraw_requests", filter: `user_id=eq.${user.id}` }, () => invalidateAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "deposit_requests", filter: `user_id=eq.${user.id}` }, () => invalidateAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stats = useMemo(() => {
    const list = txs ?? [];
    const earnings = list
      .filter((t: any) => ["prize", "bonus", "adjustment", "deposit", "refund"].includes(t.type) && Number(t.amount) > 0)
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
    const withdrawn = list
      .filter((t: any) => t.type === "withdraw")
      .reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
    const pending = (wds ?? [])
      .filter((r: any) => r.status === "pending")
      .reduce((s: number, r: any) => s + Number(r.amount), 0);
    return { earnings, withdrawn, pending };
  }, [txs, wds]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold"><span className="text-gradient">Wallet</span></h1>
            <p className="text-sm text-muted-foreground">Deposits, withdrawals & prize credits</p>
          </div>
          <div className="flex gap-2">
            <DepositDialog onDone={invalidateAll} />
            <WithdrawDialog balance={Number(wallet?.balance ?? 0)} pending={stats.pending} onDone={invalidateAll} />
          </div>
        </div>

        <Card className="glass-strong border-white/5 glow">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 text-muted-foreground"><WalletIcon className="h-5 w-5 text-primary"/> Available balance</div>
            <div className="mt-2 font-display text-5xl font-black text-gradient">{currency(wallet?.balance ?? 0)}</div>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-400"/>} label="Total earnings" value={currency(stats.earnings)} />
          <StatCard icon={<ArrowUpCircle className="h-4 w-4 text-primary"/>} label="Total withdrawn" value={currency(stats.withdrawn)} />
          <StatCard icon={<Clock className="h-4 w-4 text-yellow-400"/>} label="Pending withdrawals" value={currency(stats.pending)} />
        </div>

        <Tabs defaultValue="tx" className="mt-8">
          <TabsList className="bg-white/5">
            <TabsTrigger value="tx">Transactions</TabsTrigger>
            <TabsTrigger value="dep">Deposits</TabsTrigger>
            <TabsTrigger value="wd">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="tx" className="mt-4">
            <Card className="glass border-white/5"><CardContent className="p-0">
              {(txs?.length ?? 0) === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</p> :
                <ul className="divide-y divide-white/5">
                  {txs?.map((t: any) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold capitalize">{labelForType(t.type)}</div>
                        <p className="truncate text-xs text-muted-foreground">{t.note ?? t.reference ?? ""} · {dt(t.created_at)}</p>
                      </div>
                      <div className={`shrink-0 font-display font-bold ${Number(t.amount) >= 0 ? "text-green-400" : "text-primary"}`}>
                        {Number(t.amount) >= 0 ? "+" : ""}{currency(t.amount)}
                      </div>
                    </li>
                  ))}
                </ul>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="dep" className="mt-4">
            <RequestList rows={deps ?? []} kind="deposit"/>
          </TabsContent>
          <TabsContent value="wd" className="mt-4">
            <RequestList rows={wds ?? []} kind="withdraw"/>
          </TabsContent>
        </Tabs>
      </div>
      <SiteFooter />
    </div>
  );
}

function labelForType(t: string) {
  switch (t) {
    case "prize": return "Tournament prize";
    case "entry_fee": return "Entry fee";
    case "deposit": return "Deposit";
    case "withdraw": return "Withdrawal";
    case "refund": return "Refund";
    case "adjustment": return "Manual credit";
    default: return t.replace("_", " ");
  }
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="glass border-white/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
        <div className="mt-1 font-display text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function RequestList({ rows, kind }: { rows: any[]; kind: "deposit" | "withdraw" }) {
  return (
    <Card className="glass border-white/5"><CardContent className="p-0">
      {rows.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No {kind}s yet.</p> :
      <ul className="divide-y divide-white/5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {currency(r.amount)}
                <Badge variant="outline" className="capitalize">{r.method}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{dt(r.created_at)}</p>
              {kind === "withdraw" && r.account_details?.upi_id && (
                <p className="truncate text-xs text-muted-foreground">To: {r.account_details.upi_id}</p>
              )}
              {r.status === "rejected" && r.admin_note && (
                <p className="text-xs text-red-400">Reason: {r.admin_note}</p>
              )}
            </div>
            <StatusBadge s={r.status}/>
          </li>
        ))}
      </ul>}
    </CardContent></Card>
  );
}

function StatusBadge({ s }: { s: string }) {
  const cls = s === "approved" ? "bg-green-500/20 text-green-400 border-green-500/30"
    : s === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30"
    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return <Badge className={cls + " capitalize"}>{s}</Badge>;
}

function DepositDialog({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [txnId, setTxnId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings", "payment"],
    queryFn: async () => (await supabase.from("settings").select("value").eq("key", "payment").maybeSingle()).data?.value as any,
  });

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  useEffect(() => {
    const path = settings?.qr_url as string | undefined;
    if (!path) { setQrUrl(null); return; }
    if (path.startsWith("http")) { setQrUrl(path); return; }
    supabase.storage.from("payment-config").createSignedUrl(path, 60 * 60 * 24 * 365).then(({ data }) => {
      setQrUrl(data?.signedUrl ?? null);
    });
  }, [settings?.qr_url]);

  const copyUpi = () => {
    if (!settings?.upi_id) return;
    navigator.clipboard.writeText(settings.upi_id);
    toast.success("UPI ID copied");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Upload payment screenshot");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setBusy(true);
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("payment-proofs").upload(path, file);
    if (up.error) { setBusy(false); return toast.error(up.error.message); }
    const { error } = await supabase.from("deposit_requests").insert({
      user_id: user!.id, amount: amt, method, txn_id: txnId, proof_url: path, status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Deposit request submitted");
    setOpen(false); setAmount(""); setTxnId(""); setFile(null); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary glow"><ArrowDownCircle className="mr-2 h-4 w-4"/>Deposit</Button></DialogTrigger>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add funds</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 p-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">UPI ID</span>
            <div className="flex items-center gap-2">
              <code className="rounded bg-white/5 px-2 py-1 text-sm">{settings?.upi_id ?? "—"}</code>
              <Button type="button" size="sm" variant="outline" onClick={copyUpi}><Copy className="mr-1 h-3 w-3"/>Copy</Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="grid h-48 w-48 place-items-center overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-white/10">
              {qrUrl ? (
                <img src={qrUrl} alt="UPI QR code" className="h-full w-full object-contain"/>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
                  <ImageIcon className="h-8 w-8"/>
                  QR not configured yet.<br/>Please use the UPI ID above.
                </div>
              )}
            </div>
          </div>
          {settings?.instructions && (
            <div className="rounded-xl bg-white/5 p-3 text-xs text-muted-foreground ring-1 ring-white/10 whitespace-pre-wrap">
              {settings.instructions}
            </div>
          )}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Amount (₹)</Label><Input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)}/></div>
          <div><Label>Method</Label><Input value={method} onChange={(e) => setMethod(e.target.value)}/></div>
          <div><Label>Transaction ID</Label><Input value={txnId} onChange={(e) => setTxnId(e.target.value)}/></div>
          <div><Label>Payment proof</Label><Input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] ?? null)}/></div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Submit request"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const WD_ERROR: Record<string, string> = {
  min_withdrawal_50: "Minimum withdrawal is ₹50",
  upi_required: "UPI ID is required",
  name_required: "Account holder name is required",
  insufficient_balance: "Amount exceeds available balance",
  wallet_not_found: "Wallet not found",
  not_authenticated: "Please sign in again",
};

function WithdrawDialog({ balance, pending, onDone }: { balance: number; pending: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [holder, setHolder] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const available = Math.max(0, balance - pending);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt < 50) return toast.error("Minimum withdrawal is ₹50");
    if (amt > available) return toast.error("Amount exceeds available balance");
    if (!upi.trim()) return toast.error("Enter your UPI ID");
    if (!holder.trim()) return toast.error("Enter account holder name");
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal" as any, {
      _amount: amt, _upi_id: upi.trim(), _account_holder: holder.trim(), _notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(WD_ERROR[error.message] ?? error.message);
    toast.success("Withdrawal requested");
    setOpen(false); setAmount(""); setUpi(""); setHolder(""); setNotes(""); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="border-white/10"><ArrowUpCircle className="mr-2 h-4 w-4"/>Withdraw</Button></DialogTrigger>
      <DialogContent className="glass-strong">
        <DialogHeader><DialogTitle>Withdraw funds</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Available: <b>{currency(available)}</b>{pending > 0 && <> · Pending: <b>{currency(pending)}</b></>}. Approved requests pay out within 24 hours. Minimum ₹50.
          </p>
          <div><Label>Amount (₹)</Label><Input type="number" min="50" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)}/></div>
          <div><Label>UPI ID</Label><Input required placeholder="yourname@upi" value={upi} onChange={(e) => setUpi(e.target.value)}/></div>
          <div><Label>Account holder name</Label><Input required value={holder} onChange={(e) => setHolder(e.target.value)}/></div>
          <div><Label>Notes (optional)</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}/></div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Request withdrawal"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
