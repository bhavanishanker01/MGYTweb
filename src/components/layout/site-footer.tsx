import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/5 glass">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-primary font-display font-black">M</div>
            <span className="font-display text-lg font-bold">MAMU <span className="text-gradient">HUB</span></span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Compete in daily BR & CS tournaments. Win real cash. Climb the leaderboard.
          </p>
        </div>
        <FooterCol title="Play" links={[
          ["Tournaments","/tournaments"], ["Winners","/winners"], ["Leaderboard","/leaderboard"],
        ]}/>
        <FooterCol title="Support" links={[
          ["FAQ","/faq"], ["Contact","/contact"], ["Support Ticket","/support"],
        ]}/>
        <FooterCol title="Legal" links={[
          ["Privacy","/privacy"], ["Terms","/terms"],
        ]}/>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MAMU HUB · All rights reserved · Play responsibly.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-bold uppercase tracking-widest text-primary">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link to={href} className="text-muted-foreground transition-colors hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
