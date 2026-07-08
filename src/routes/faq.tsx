import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = [
  ["How do I register for a tournament?", "Sign up, deposit funds into your wallet, then open the tournament page and click Register. The entry fee is deducted automatically."],
  ["When do I get the room ID and password?", "Room details unlock automatically for registered players before match start time."],
  ["How long do withdrawals take?", "Approved withdrawals are paid out within 24 hours via UPI or bank transfer."],
  ["What happens if a match is cancelled?", "Your entry fee is refunded to your wallet automatically."],
  ["How are winners decided?", "Placement + kills, based on the mode rules published on each tournament page."],
  ["Is MAMU HUB safe?", "All payments are gated by admin review and all data is protected with row-level security."],
];

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({ meta: [{ title: "FAQ — MAMU HUB" }, { name: "description", content: "Answers about tournaments, wallet, withdrawals and rules on MAMU HUB." }] }),
});

function FAQPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader/>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl font-black">Frequently Asked <span className="text-gradient">Questions</span></h1>
        <Accordion type="single" collapsible className="mt-6 glass rounded-2xl px-4">
          {FAQ.map(([q, a], i) => (
            <AccordionItem key={i} value={String(i)} className="border-white/5">
              <AccordionTrigger className="text-left font-semibold">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <SiteFooter/>
    </div>
  );
}
