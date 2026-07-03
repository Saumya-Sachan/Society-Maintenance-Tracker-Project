import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "admin" | "resident";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);


async function fetchRole(userId: string): Promise<Role> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  console.log("ROLE DATA:", data);
  console.log("ROLE ERROR:", error);
  if (error) return "resident";
  const roles = (data ?? []).map((r) => r.role as Role);
  return roles.includes("admin")? "admin":"resident";
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        // Defer role fetch to avoid deadlocks in the auth callback.
        setTimeout(() => {
          fetchRole(s.user.id).then((r) => mounted && setRole(r));
        }, 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const r = await fetchRole(data.session.user.id);
        if (mounted) setRole(r);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    role,
    loading,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshRole: async () => {
      if (session?.user) setRole(await fetchRole(session.user.id));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
