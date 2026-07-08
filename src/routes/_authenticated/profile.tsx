import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "My Profile — MAMU HUB" }] }),
});

function ProfilePage() {
  const { user, profile, refresh } = useAuth();
  const [form, setForm] = useState({ full_name: "", game_name: "", game_uid: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      game_name: profile.game_name ?? "",
      game_uid: profile.game_uid ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profile updated");
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setUploading(false); toast.error(error.message); return; }
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    if (updErr) { setUploading(false); toast.error(updErr.message); return; }
    await refresh();
    setUploading(false);
    toast.success("Avatar updated");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">My <span className="text-gradient">Profile</span></h1>
        <Card className="glass-strong border-white/5">
          <CardHeader><CardTitle>Player identity</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/40 glow">
                <AvatarImage src={profile?.avatar_url ?? undefined}/>
                <AvatarFallback className="bg-gradient-primary text-lg font-bold">
                  {(profile?.full_name || "M").slice(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-display text-lg font-bold">{profile?.uid}</div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
                  {uploading ? "Uploading..." : "Change avatar"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (f) uploadAvatar(f);
                  }}/>
                </label>
              </div>
            </div>

            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})}/></div>
              <div><Label>Game name</Label><Input value={form.game_name} onChange={(e) => setForm({...form, game_name: e.target.value})}/></div>
              <div><Label>Game UID</Label><Input value={form.game_uid} onChange={(e) => setForm({...form, game_uid: e.target.value})}/></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}/></div>
              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input value={profile?.email ?? ""} disabled/>
              </div>
              <Button type="submit" disabled={busy} className="bg-gradient-primary glow md:col-span-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
