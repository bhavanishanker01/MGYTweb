import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle, Instagram } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Contact — MAMU HUB" }] }),
});

function Contact() {
  return (
    <div className="min-h-screen">
      <SiteHeader/>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl font-black">Get in <span className="text-gradient">Touch</span></h1>
        <p className="mt-2 text-muted-foreground">For tournaments, sponsorships, or urgent issues.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="glass border-white/5"><CardContent className="p-5"><Mail className="h-6 w-6 text-primary"/><p className="mt-2 font-semibold">Email</p><a href="mailto:support@mamuhub.gg" className="text-sm text-muted-foreground">support@mamuhub.gg</a></CardContent></Card>
          <Card className="glass border-white/5"><CardContent className="p-5"><MessageCircle className="h-6 w-6 text-primary"/><p className="mt-2 font-semibold">Discord</p><p className="text-sm text-muted-foreground">discord.gg/mamuhub</p></CardContent></Card>
          <Card className="glass border-white/5"><CardContent className="p-5"><Instagram className="h-6 w-6 text-primary"/><p className="mt-2 font-semibold">Instagram</p><p className="text-sm text-muted-foreground">@mamuhub</p></CardContent></Card>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Signed in? Open a support ticket from your dashboard for faster help.</p>
      </div>
      <SiteFooter/>
    </div>
  );
}
