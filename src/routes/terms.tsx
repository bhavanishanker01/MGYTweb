import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({ meta: [{ title: "Terms of Service — MAMU HUB" }] }),
});
function Terms() {
  return (
    <div className="min-h-screen"><SiteHeader/>
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-black">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">By using MAMU HUB you agree to the following terms.</p>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p><b className="text-foreground">Eligibility.</b> You must be 18+ or of legal age in your jurisdiction to compete for cash prizes.</p>
        <p><b className="text-foreground">Fair play.</b> Any cheating, teaming, emulator abuse or account sharing results in a permanent ban and forfeit of wallet balance.</p>
        <p><b className="text-foreground">Payments.</b> Entry fees are non-refundable except for cancelled matches. Withdrawals are processed within 24 hours of approval.</p>
        <p><b className="text-foreground">Content.</b> By uploading avatars, screenshots or clips you grant MAMU HUB a license to use them for promotional purposes.</p>
        <p><b className="text-foreground">Termination.</b> We may suspend or terminate accounts that violate these terms.</p>
        <p><b className="text-foreground">Governing law.</b> These terms are governed by the laws of India.</p>
      </div>
    </article>
    <SiteFooter/></div>
  );
}
