import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, HardDrive, Building2, History, FileBarChart, ClipboardCheck, Wrench, AlertTriangle, Settings, LogOut, ShieldCheck, User, Upload, Eye } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, AppModule } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navPrincipal: { title: string; url: string; icon: any; modulo?: AppModule }[] = [
  { title: "Panel principal", url: "/", icon: LayoutDashboard },
  { title: "Equipos", url: "/equipos", icon: HardDrive, modulo: "equipos" },
  { title: "Importar Excel", url: "/importar", icon: Upload, modulo: "equipos" },
  { title: "Filiales y sectores", url: "/filiales", icon: Building2, modulo: "filiales" },
];

const navOperaciones: { title: string; url: string; icon: any; modulo?: AppModule }[] = [
  { title: "Movimientos", url: "/movimientos", icon: History, modulo: "movimientos" },
  { title: "Mantenimientos", url: "/mantenimientos", icon: Wrench, modulo: "mantenimientos" },
];

const navReportes: { title: string; url: string; icon: any; modulo?: AppModule }[] = [
  { title: "Reportes", url: "/reportes", icon: FileBarChart, modulo: "reportes" },
  { title: "Modo auditoría", url: "/modo-auditoria", icon: Eye, modulo: "auditorias" },
  { title: "Auditorías checklist", url: "/auditorias", icon: ClipboardCheck, modulo: "auditorias" },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle, modulo: "alertas" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, role, puede, signOut } = useAuth();
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);

  const filtrar = (items: typeof navPrincipal) => items.filter(i => !i.modulo || puede(i.modulo, "puede_ver"));

  const renderItems = (items: typeof navPrincipal) => (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActive(item.url);
        const disabled = (item as any).disabled;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild={!disabled}
              isActive={active}
              tooltip={item.title}
              className={`${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {disabled ? (
                <div className="flex items-center gap-2 w-full">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                  {!collapsed && <span className="text-[10px] uppercase tracking-wider opacity-60">Pronto</span>}
                </div>
              ) : (
                <NavLink to={item.url} className="flex items-center gap-2 w-full">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                </NavLink>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="h-full" style={{ background: "var(--gradient-sidebar)" }}>
        <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-semibold text-sidebar-foreground leading-tight">InventarioTI</div>
                <div className="text-[11px] text-sidebar-foreground/60 leading-tight">Coordinación Informática</div>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider px-2">Gestión</SidebarGroupLabel>}
            <SidebarGroupContent>{renderItems(filtrar(navPrincipal))}</SidebarGroupContent>
          </SidebarGroup>

          {filtrar(navOperaciones).length > 0 && (
            <SidebarGroup>
              {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider px-2">Operaciones</SidebarGroupLabel>}
              <SidebarGroupContent>{renderItems(filtrar(navOperaciones))}</SidebarGroupContent>
            </SidebarGroup>
          )}

          {filtrar(navReportes).length > 0 && (
            <SidebarGroup>
              {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider px-2">Auditoría</SidebarGroupLabel>}
              <SidebarGroupContent>{renderItems(filtrar(navReportes))}</SidebarGroupContent>
            </SidebarGroup>
          )}

          {isAdmin && (
            <SidebarGroup>
              {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider px-2">Administración</SidebarGroupLabel>}
              <SidebarGroupContent>
                {renderItems([{ title: "Configuración", url: "/configuracion", icon: Settings }])}
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          {user && (
            <div className={`flex ${collapsed ? "flex-col" : "items-center"} gap-2`}>
              <div className={`flex items-center gap-2 min-w-0 ${collapsed ? "" : "flex-1"}`}>
                <div className="h-8 w-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shrink-0">
                  {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-sidebar-foreground truncate">{user.email}</div>
                    <div className="text-[10px] text-sidebar-foreground/60 capitalize">{role}</div>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={async () => { await signOut(); navigate("/auth"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
