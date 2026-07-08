import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerPwa } from "@/lib/pwa";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="glass-strong max-w-md rounded-2xl p-10 text-center">
        <h1 className="text-gradient font-display text-8xl font-black">404</h1>
        <h2 className="mt-4 font-display text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The arena you're looking for doesn't exist.</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-gradient-primary px-5 py-2 text-sm font-semibold glow">Return home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="glass-strong max-w-md rounded-2xl p-10 text-center">
        <h1 className="font-display text-xl">Something crashed</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold">Retry</button>
          <a href="/" className="rounded-md border border-white/10 px-4 py-2 text-sm">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MAMU HUB — Esports Tournaments, Prizes & Leaderboards" },
      { name: "description", content: "Compete in daily BGMI, Free Fire and CS tournaments. Real cash prizes, instant wallet, live leaderboard. Join MAMU HUB." },
      { name: "theme-color", content: "#ff4d00" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "MAMU HUB" },
      { property: "og:title", content: "MAMU HUB — Esports Tournaments, Prizes & Leaderboards" },
      { property: "og:description", content: "Compete in daily BGMI, Free Fire and CS tournaments. Real cash prizes, instant wallet, live leaderboard. Join MAMU HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MAMU HUB — Esports Tournaments, Prizes & Leaderboards" },
      { name: "twitter:description", content: "Compete in daily BGMI, Free Fire and CS tournaments. Real cash prizes, instant wallet, live leaderboard. Join MAMU HUB." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/DymZJbJZK7QpDhAs4EUthEoeTMB3/social-images/social-1783331177327-IMG_20250703_104035_249_(1).webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/DymZJbJZK7QpDhAs4EUthEoeTMB3/social-images/social-1783331177327-IMG_20250703_104035_249_(1).webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/pwa-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { void registerPwa(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Outlet />
          <Toaster position="top-right" richColors theme="dark" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
