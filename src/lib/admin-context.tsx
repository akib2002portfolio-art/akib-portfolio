import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type EditKind = "project" | "skillGroup" | "experience" | "education" | "statusUpdate" | "siteSettings";

type EditState = { kind: EditKind; item: any | null } | null;

type AdminContextValue = {
  session: Session | null;
  isAdmin: boolean;
  loginOpen: boolean;
  setLoginOpen: (v: boolean) => void;
  editState: EditState;
  openEditor: (kind: EditKind, item?: any) => void;
  closeEditor: () => void;
  signOut: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [editState, setEditState] = useState<EditState>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AdminContextValue = {
    session,
    isAdmin: !!session,
    loginOpen,
    setLoginOpen,
    editState,
    openEditor: (kind, item = null) => setEditState({ kind, item }),
    closeEditor: () => setEditState(null),
    signOut: () => supabase.auth.signOut(),
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
