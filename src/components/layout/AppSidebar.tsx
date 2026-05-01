import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, HardDrive, Building2, History, FileBarChart, ClipboardCheck, Wrench } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const navPrincipal = [
  { title: "Panel principal", url: "/", icon: LayoutDashboard },
  { title: "Equipos", url: "/equipos", icon: HardDrive },
  { title: "Filiales y sectores", url: "/filiales", icon: Building2 },
];

const navOperaciones = [
  { title: "Movimientos", url: "/movimientos", icon: History, disabled: true },
  { title: "Mantenimientos", url: "/mantenimientos", icon: Wrench, disabled: true },
];

const navReportes = [
  { title: "Reportes", url: "/reportes", icon: FileBarChart, disabled: true },
  { title: "Modo auditoría", url: "/auditoria", icon: ClipboardCheck, disabled: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);

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
            <SidebarGroupContent>{renderItems(navPrincipal)}</SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider px-2">Operaciones</SidebarGroupLabel>}
            <SidebarGroupContent>{renderItems(navOperaciones)}</SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider px-2">Auditoría</SidebarGroupLabel>}
            <SidebarGroupContent>{renderItems(navReportes)}</SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
