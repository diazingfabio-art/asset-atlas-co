import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "usuario";
export type AppModule = "equipos" | "filiales" | "movimientos" | "mantenimientos" | "auditorias" | "reportes" | "alertas";
export type Permiso = { puede_ver: boolean; puede_crear: boolean; puede_editar: boolean; puede_eliminar: boolean };

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  permisos: Record<AppModule, Permiso>;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  puede: (modulo: AppModule, accion: keyof Permiso) => boolean;
  refresh: () => Promise<void>;
}

const defaultPerm: Permiso = { puede_ver: false, puede_crear: false, puede_editar: false, puede_eliminar: false };
const emptyPerms = (): Record<AppModule, Permiso> => ({
  equipos: { ...defaultPerm }, filiales: { ...defaultPerm }, movimientos: { ...defaultPerm },
  mantenimientos: { ...defaultPerm }, auditorias: { ...defaultPerm }, reportes: { ...defaultPerm }, alertas: { ...defaultPerm },
});

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permisos, setPermisos] = useState<Record<AppModule, Permiso>>(emptyPerms());

  const cargarRolYPermisos = async (uid: string) => {
    const [{ data: roles }, { data: perms }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("user_permissions").select("modulo, puede_ver, puede_crear, puede_editar, puede_eliminar").eq("user_id", uid),
    ]);
    const r: AppRole = roles?.some(x => x.role === "admin") ? "admin" : "usuario";
    setRole(r);
    const p = emptyPerms();
    perms?.forEach((row: any) => { p[row.modulo as AppModule] = { puede_ver: row.puede_ver, puede_crear: row.puede_crear, puede_editar: row.puede_editar, puede_eliminar: row.puede_eliminar }; });
    if (r === "admin") {
      (Object.keys(p) as AppModule[]).forEach(m => { p[m] = { puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true }; });
    }
    setPermisos(p);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess); setUser(sess?.user ?? null);
      if (sess?.user) { setTimeout(() => cargarRolYPermisos(sess.user.id), 0); }
      else { setRole(null); setPermisos(emptyPerms()); }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) cargarRolYPermisos(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user, session, loading, role, permisos,
    isAdmin: role === "admin",
    signOut: async () => { await supabase.auth.signOut(); },
    puede: (m, a) => role === "admin" ? true : !!permisos[m]?.[a],
    refresh: async () => { if (user) await cargarRolYPermisos(user.id); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
