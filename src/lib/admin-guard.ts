import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared beforeLoad guard for all /_authenticated/admin/* routes.
 * Redirects unauthenticated users to /auth and non-admins to /complaints.
 */
export async function ensureAdmin() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw redirect({ to: "/auth" });
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  if (!(data ?? []).some((r) => r.role === "admin")) {
    throw redirect({ to: "/complaints" });
  }
}
