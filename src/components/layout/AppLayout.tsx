import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="no-print h-14 flex items-center gap-3 border-b bg-card px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="text-xs text-muted-foreground hidden sm:block">
              Última actualización: <span className="font-medium text-foreground">{new Date().toLocaleString("es-AR")}</span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
