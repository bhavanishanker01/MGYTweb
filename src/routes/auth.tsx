import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  tab: z.enum(["login", "register", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const { tab, redirect } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [current, setCurrent] = useState<string>(tab ?? "login");

  const afterAuth = () => navigate({ to: (redirect as any) || "/dashboard" });

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary font-display text-lg font-black glow">M</div>
            <span className="font-display text-2xl font-bold">MAMU <span className="text-gradient">HUB</span></span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Enter the arena</p>
        </div>

        <Tabs value={current} onValueChange={setCurrent}>
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Sign up</TabsTrigger>
            <TabsTrigger value="forgot">Reset</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6"><LoginForm onDone={afterAuth} /></TabsContent>
          <TabsContent value="register" className="mt-6"><RegisterForm onDone={afterAuth} /></TabsContent>
          <TabsContent value="forgot" className="mt-6"><ForgotForm /></TabsContent>
        </Tabs>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-muted-foreground">Or</span></div>
          </div>
          <GoogleButton onDone={afterAuth} />
        </div>
      </motion.div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></div>
      <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"/></div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-primary glow hover:opacity-95">
        {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Login"}
      </Button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gameName, setGameName] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name },
      },
    });
    if (error) { setBusy(false); toast.error(error.message); return; }
    if (data.user && gameName) {
      await supabase.from("profiles").update({ game_name: gameName, full_name: name }).eq("id", data.user.id);
    }
    setBusy(false);
    toast.success("Account created! You're in.");
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"/></div>
      <div><Label>In-game name</Label><Input value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="MAMU_King"/></div>
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 characters"/></div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-primary glow hover:opacity-95">
        {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Create account"}
      </Button>
    </form>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Reset email sent");
  };

  if (sent) return <p className="rounded-md bg-white/5 p-4 text-center text-sm">Check your inbox for the reset link.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter your account email and we'll send a reset link.</p>
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-primary hover:opacity-95">
        {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Send reset link"}
      </Button>
    </form>
  );
}

function GoogleButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setBusy(false); toast.error(String(result.error.message ?? result.error)); return; }
    if (result.redirected) return;
    setBusy(false);
    toast.success("Signed in!");
    onDone();
  };
  return (
    <Button variant="outline" type="button" onClick={onClick} disabled={busy}
      className="mt-4 w-full border-white/10 bg-white/5">
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .55 4.1 1.6l3-3C17.15 1.9 14.8 1 12 1 7.35 1 3.35 3.65 1.55 7.5l3.5 2.7C5.9 7.05 8.7 5 12 5z"/><path fill="#4285F4" d="M23 12.2c0-.75-.05-1.5-.2-2.2H12v4.2h6.2c-.25 1.5-1.1 2.75-2.35 3.6l3.6 2.8C21.6 18.35 23 15.5 23 12.2z"/><path fill="#FBBC05" d="M5.05 14.2c-.25-.7-.4-1.45-.4-2.2s.15-1.5.4-2.2L1.55 7.1C.55 9 0 11 0 12s.55 3 1.55 4.9l3.5-2.7z"/><path fill="#34A853" d="M12 23c3 0 5.55-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-3.3 0-6.1-2.05-7.05-4.9l-3.5 2.7C3.35 20.35 7.35 23 12 23z"/></svg>}
      Continue with Google
    </Button>
  );
}
