import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, LifeBuoy } from "lucide-react";
import { dt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/support")({
  component: Support,
  head: () => ({ meta: [{ title: "Support — MAMU HUB" }] }),
});

function Support() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: tickets } = useQuery({
    queryKey: ["tickets", user?.id],
    queryFn: async () => (await supabase.from("support_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("support_tickets").insert({ user_id: user!.id, subject, message });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Ticket submitted");
    setSubject(""); setMessage(""); qc.invalidateQueries({ queryKey: ["tickets", user!.id] });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader/>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><LifeBuoy className="h-6 w-6 text-primary"/>Support</h1>
        <Card className="glass mt-6 border-white/5"><CardContent className="p-6">
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Subject</Label><Input required value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120}/></div>
            <div><Label>Message</Label><Textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000}/></div>
            <Button type="submit" disabled={busy} className="bg-gradient-primary glow">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Send ticket"}</Button>
          </form>
        </CardContent></Card>

        <h2 className="mt-8 font-display text-xl font-bold">Your tickets</h2>
        <div className="mt-3 space-y-2">
          {tickets?.length === 0 && <p className="text-sm text-muted-foreground">You haven't opened any tickets.</p>}
          {tickets?.map((t: any) => (
            <Card key={t.id} className="glass border-white/5"><CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{t.subject}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
                  {t.admin_response && <p className="mt-2 rounded bg-primary/10 p-2 text-sm">💬 {t.admin_response}</p>}
                </div>
                <Badge className="capitalize" variant="outline">{t.status.replace("_"," ")}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{dt(t.created_at)}</p>
            </CardContent></Card>
          ))}
        </div>
      </div>
      <SiteFooter/>
    </div>
  );
}
