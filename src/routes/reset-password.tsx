import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { toast.error("Min 6 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <form onSubmit={onSubmit} className="glass-strong w-full max-w-sm rounded-2xl p-8 space-y-4">
        <h1 className="font-display text-2xl font-bold">Set new password</h1>
        <div><Label>New password</Label><Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)}/></div>
        <Button type="submit" disabled={busy} className="w-full bg-gradient-primary glow">
          {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Update password"}
        </Button>
      </form>
    </div>
  );
}
