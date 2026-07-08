import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currency, dt } from "@/lib/format";
import { Copy, Loader2, Upload, Image as ImageIcon, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tournaments/$id/pay")({
  component: PaymentPage,
  head: () => ({ meta: [{ title: "Complete payment — MAMU HUB" }] }),
});

function PaymentPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: t, isLoading } = useQuery({
    queryKey: ["tour", id],
    queryFn: async () => (await supabase.from("tournaments").select("*").eq("id", id).maybeSingle()).data,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings", "payment"],
    queryFn: async () => (await supabase.from("settings").select("value").eq("key", "payment").maybeSingle()).data?.value as any,
  });

  const { data: existingReg } = useQuery({
    queryKey: ["myReg", id, user?.id],
    queryFn: async () => user ? (await supabase.from("tournament_registrations").select("id").eq("tournament_id", id).eq("user_id", user.id).maybeSingle()).data : null,
    enabled: !!user,
  });

  const { data: myPayment } = useQuery({
    queryKey: ["myPayment", id, user?.id],
    queryFn: async () =>
      user
        ? (await supabase.from("payments" as any).select("*").eq("tournament_id", id).eq("user_id", user.id)
            .order("created_at", { ascending: false }).limit(1).maybeSingle()).data
        : null,
    enabled: !!user,
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

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const copyUpi = () => {
    if (!settings?.upi_id) return;
    navigator.clipboard.writeText(settings.upi_id);
    toast.success("UPI ID copied");
  };

  const submitProof = async (file: File) => {
    if (!user || !t) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Screenshot must be under 5 MB");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const ins = await supabase.from("payments" as any).insert({
        tournament_id: t.id, user_id: user.id, amount: t.entry_fee, screenshot_url: path, status: "pending",
      });
      if (ins.error) throw ins.error;
      toast.success("Payment submitted. Waiting for admin approval.");
      qc.invalidateQueries({ queryKey: ["myPayment", id, user.id] });
      qc.invalidateQueries({ queryKey: ["my-payments", user.id] });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Shell><div className="py-20 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!t) return <Shell><div className="py-20 text-center text-muted-foreground">Tournament not found.</div></Shell>;

  if (existingReg) {
    return <Shell><StatusCard title="You're already registered" body={`Your slot for "${t.title}" is confirmed.`} to={`/tournaments/${id}`} cta="View tournament" /></Shell>;
  }

  const pending = myPayment && (myPayment as any).status === "pending";
  const rejected = myPayment && (myPayment as any).status === "rejected";

  return (
    <Shell>
      <div className="mb-4">
        <Link to="/tournaments/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-foreground">← Back to tournament</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Summary */}
        <Card className="glass-strong border-white/5">
          <CardContent className="p-6">
            <h1 className="font-display text-2xl font-black">Complete your payment</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pay the entry fee via UPI and upload the screenshot to confirm your slot.</p>

            <div className="mt-5 space-y-3">
              <Row label="Tournament" value={t.title} />
              <Row label="Entry Fee" value={<span className="font-display text-2xl font-black text-gradient">{currency(t.entry_fee)}</span>} />
              <Row label="UPI ID" value={
                <div className="flex items-center gap-2">
                  <code className="rounded bg-white/5 px-2 py-1 text-sm">{settings?.upi_id ?? "—"}</code>
                  <Button size="sm" variant="outline" onClick={copyUpi}><Copy className="mr-1 h-3 w-3" />Copy</Button>
                </div>
              } />
            </div>

            {settings?.instructions && (
              <div className="mt-5 rounded-xl bg-white/5 p-4 text-sm text-muted-foreground ring-1 ring-white/10 whitespace-pre-wrap">
                {settings.instructions}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR + upload */}
        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <h2 className="font-display text-lg font-bold">Scan &amp; Pay</h2>
            <div className="mt-4 flex justify-center">
              <div className="grid h-64 w-64 place-items-center overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-white/10">
                {qrUrl ? (
                  <img src={qrUrl} alt="UPI QR code" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    QR not configured yet.<br />Please use the UPI ID above.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {pending ? (
                <div className="rounded-xl bg-yellow-500/10 p-4 ring-1 ring-yellow-500/30">
                  <div className="flex items-center gap-2 font-semibold text-yellow-300">
                    <Loader2 className="h-4 w-4 animate-spin" />Payment under review
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted {dt((myPayment as any).created_at)}. You'll be notified once an admin verifies it.</p>
                </div>
              ) : (
                <>
                  {rejected && (
                    <div className="rounded-xl bg-destructive/10 p-4 ring-1 ring-destructive/30">
                      <div className="font-semibold text-destructive">Previous submission rejected</div>
                      <p className="mt-1 text-xs text-muted-foreground">Reason: {(myPayment as any).rejection_reason || "—"}. Please pay again and re-upload the screenshot.</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) submitProof(f); e.currentTarget.value = ""; }} />
                  <Button disabled={busy} onClick={() => fileRef.current?.click()} className="w-full bg-gradient-primary glow">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-2 h-4 w-4" />Upload payment screenshot</>}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">PNG or JPG · max 5 MB</p>
                </>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/payments" })}>
                View my payments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 p-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div>{value}</div>
    </div>
  );
}

function StatusCard({ title, body, to, cta }: { title: string; body: string; to: string; cta: string }) {
  return (
    <Card className="glass-strong border-white/5">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        <h1 className="font-display text-2xl font-black">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        <Button asChild className="bg-gradient-primary"><Link to={to}>{cta}</Link></Button>
      </CardContent>
    </Card>
  );
}
