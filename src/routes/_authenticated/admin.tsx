import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth", search: { tab: "login" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const isStaff = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "moderator");
    if (!isStaff) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — MAMU HUB" }, { name: "robots", content: "noindex" }] }),
});

function AdminLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Outlet />
    </div>
  );
}
