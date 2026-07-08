import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Trophy, User as UserIcon, Wallet, LogOut, Shield, History } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/layout/notification-bell";

const nav = [
  { to: "/", label: "Home" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/winners", label: "Winners" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/notifications", label: "Notifications" },
  { to: "/faq", label: "FAQ" },
];


export function SiteHeader() {
  const { user, profile, isStaff, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass-strong border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary glow font-display text-lg font-black">M</div>
          <span className="font-display text-xl font-bold tracking-wider">MAMU <span className="text-gradient">HUB</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                path === n.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (

            <DropdownMenu>
              <DropdownMenuTrigger asChild>

                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8 border border-primary/40">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-xs">
                      {(profile?.full_name || profile?.email || "M").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm sm:inline">{profile?.game_name || profile?.full_name || "Player"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">{profile?.uid}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/dashboard"><Trophy className="mr-2 h-4 w-4"/>Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/profile"><UserIcon className="mr-2 h-4 w-4"/>Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/wallet"><Wallet className="mr-2 h-4 w-4"/>Wallet</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/history"><History className="mr-2 h-4 w-4"/>Match History</Link></DropdownMenuItem>
                {isStaff && (
                  <DropdownMenuItem asChild><Link to="/admin"><Shield className="mr-2 h-4 w-4"/>Admin</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive"><LogOut className="mr-2 h-4 w-4"/>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/login">Login</Link></Button>
              <Button asChild size="sm" className="bg-gradient-primary glow hover:opacity-90"><Link to="/register">Join Now</Link></Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5"/></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 glass-strong">
              <div className="mt-8 flex flex-col gap-1">
                {nav.map((n) => (
                  <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium hover:bg-white/5">
                    {n.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
