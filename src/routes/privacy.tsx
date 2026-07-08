import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({ meta: [{ title: "Privacy Policy — MAMU HUB" }] }),
});
function Privacy() {
  return (
    <div className="min-h-screen"><SiteHeader/>
    <article className="mx-auto max-w-3xl px-4 py-10 prose prose-invert">
      <h1 className="font-display text-4xl font-black">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      <h2>1. Information we collect</h2>
      <p className="text-muted-foreground">Account information (email, game name, UID), device identifiers, tournament activity, and wallet transaction history.</p>
      <h2>2. How we use it</h2>
      <p className="text-muted-foreground">To run tournaments, credit winnings, prevent fraud and improve the platform.</p>
      <h2>3. Sharing</h2>
      <p className="text-muted-foreground">We do not sell your data. We share only what is required for payment processing and legal compliance.</p>
      <h2>4. Data protection</h2>
      <p className="text-muted-foreground">All rows are protected by row-level security. Payment proofs are stored in a private bucket accessible only to you and approved staff.</p>
      <h2>5. Contact</h2>
      <p className="text-muted-foreground">Reach out at support@mamuhub.gg for privacy requests.</p>
    </article>
    <SiteFooter/></div>
  );
}
