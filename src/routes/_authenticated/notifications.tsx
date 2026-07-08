import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dt } from "@/lib/format";
import { Bell, CheckCheck, Check, Trash2, Megaphone, Trophy, Wallet as WalletIcon, Info } from "lucide-react";
import { toast } from "sonner";

const iconFor = (type?: string) => {
  switch (type) {
    case "announcement": return Megaphone;
    case "tournament": return Trophy;
    case "wallet": return WalletIcon;
    case "success": return Trophy;
    default: return Info;
  }
};


export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotifPage,
  head: () => ({ meta: [{ title: "Notifications — MAMU HUB" }] }),
});

function NotifPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifs", user?.id],
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notifs-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifs", user.id] });
          qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });
        }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  // Auto-mark all as read when the page opens
  useEffect(() => {
    if (!user) return;
    (async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
      qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });
      qc.invalidateQueries({ queryKey: ["notifs", user.id] });
    })();
  }, [user, qc]);

  const invalidateAll = () => {
    if (!user) return;
    qc.invalidateQueries({ queryKey: ["notifs", user.id] });
    qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });
  };

  const markAll = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    invalidateAll();
  };

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    invalidateAll();
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    invalidateAll();
    toast.success("Notification removed");
  };


  return (
    <div className="min-h-screen">
      <SiteHeader/>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Bell className="h-6 w-6"/>Notifications</h1>
          <Button variant="outline" size="sm" onClick={markAll}><CheckCheck className="mr-2 h-4 w-4"/>Mark all read</Button>
        </div>
        <Card className="glass border-white/5"><CardContent className="p-0">
          {(!data || data.length === 0) && <p className="p-12 text-center text-muted-foreground">All clear. 🎯</p>}
          <ul className="divide-y divide-white/5">
            {data?.map((n: any) => {
              const Icon = iconFor(n.type);
              return (
                <li key={n.id} className={`p-4 ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-semibold">{n.title} {!n.is_read && <Badge className="bg-primary text-primary-foreground">New</Badge>}</div>
                      {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                      <div className="mt-1 text-xs text-muted-foreground">{dt(n.created_at)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!n.is_read && (
                        <Button variant="ghost" size="icon" onClick={() => markOne(n.id)} aria-label="Mark as read">
                          <Check className="h-4 w-4"/>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => remove(n.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}

          </ul>
        </CardContent></Card>
      </div>
      <SiteFooter/>
    </div>
  );
}
