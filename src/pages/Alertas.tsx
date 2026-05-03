import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, UserX, Wrench, Calendar, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { estadoGarantia, formatearFecha, iconoTipo, type EstadoEquipo, type TipoEquipo } from "@/lib/inventario";

type Equipo = {
  id: string; codigo_inventario: string; tipo_equipo: TipoEquipo; marca: string | null;
  modelo: string | null; estado: EstadoEquipo; usuario_asignado: string | null;
  garantia_hasta: string | null; filial_id: string | null; sector_id: string | null;
  fecha_adquisicion: string | null;
};
type Filial = { id: string; nombre: string };
type Sector = { id: string; nombre: string };
type Mant = { id: string; equipo_id: string; estado: string; tipo: string; fecha: string };

export default function Alertas() {
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filiales, setFiliales] = useState<Record<string, string>>({});
  const [sectores, setSectores] = useState<Record<string, string>>({});
  const [mantPend, setMantPend] = useState<Mant[]>([]);

  useEffect(() => {
    (async () => {
      const [eq, fi, se, ma] = await Promise.all([
        supabase.from("equipos").select("id,codigo_inventario,tipo_equipo,marca,modelo,estado,usuario_asignado,garantia_hasta,filial_id,sector_id,fecha_adquisicion"),
        supabase.from("filiales").select("id,nombre"),
        supabase.from("sectores").select("id,nombre"),
        supabase.from("mantenimientos").select("id,equipo_id,estado,tipo,fecha").in("estado", ["Pendiente", "En proceso"]),
      ]);
      setEquipos((eq.data as any) ?? []);
      setFiliales(Object.fromEntries(((fi.data as any) ?? []).map((f: Filial) => [f.id, f.nombre])));
      setSectores(Object.fromEntries(((se.data as any) ?? []).map((s: Sector) => [s.id, s.nombre])));
      setMantPend((ma.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;

  const conGarantia = equipos.map(e => ({ ...e, g: estadoGarantia(e.garantia_hasta) }));
  const vencidas = conGarantia.filter(e => e.g.tone === "destructive");
  const porVencer = conGarantia.filter(e => e.g.tone === "warning");
  const sinAsignar = equipos.filter(e => !e.usuario_asignado && e.estado !== "De baja" && e.estado !== "Extraviado");
  const enReparacion = equipos.filter(e => e.estado === "En reparacion");
  const extraviados = equipos.filter(e => e.estado === "Extraviado");
  const equipoMap = Object.fromEntries(equipos.map(e => [e.id, e]));

  const tarjetas = [
    { label: "Garantías vencidas", valor: vencidas.length, icon: AlertTriangle, tone: "text-destructive bg-destructive/10" },
    { label: "Garantías por vencer (90 días)", valor: porVencer.length, icon: Calendar, tone: "text-warning bg-warning/10" },
    { label: "Sin usuario asignado", valor: sinAsignar.length, icon: UserX, tone: "text-info bg-info/10" },
    { label: "En reparación", valor: enReparacion.length, icon: Wrench, tone: "text-warning bg-warning/10" },
    { label: "Extraviados", valor: extraviados.length, icon: AlertTriangle, tone: "text-destructive bg-destructive/10" },
    { label: "Mantenimientos pendientes", valor: mantPend.length, icon: Wrench, tone: "text-info bg-info/10" },
  ];

  const renderLista = (lista: Equipo[], extra?: (e: Equipo) => React.ReactNode) => (
    lista.length === 0 ? (
      <p className="text-sm text-muted-foreground py-6 text-center">Sin elementos.</p>
    ) : (
      <div className="divide-y">
        {lista.map(e => {
          const Icono = iconoTipo[e.tipo_equipo];
          return (
            <Link key={e.id} to={`/equipos/${e.id}`} className="flex items-center gap-3 py-2.5 px-2 hover:bg-muted/50 rounded -mx-2">
              <Icono className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{e.codigo_inventario} <span className="font-normal text-muted-foreground">— {e.marca} {e.modelo}</span></div>
                <div className="text-xs text-muted-foreground truncate">
                  {filiales[e.filial_id ?? ""] ?? "—"} · {sectores[e.sector_id ?? ""] ?? "—"} · {e.usuario_asignado ?? "Sin asignar"}
                </div>
              </div>
              {extra?.(e)}
              <EstadoBadge estado={e.estado} />
            </Link>
          );
        })}
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="text-sm text-muted-foreground mt-1">Equipos que requieren atención inmediata</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Imprimir</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print-area">
        {tarjetas.map(t => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${t.tone}`}><t.icon className="h-4 w-4" /></div>
              <div className="text-2xl font-bold mt-2">{t.valor}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="garantias" className="no-print">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="garantias">Garantías ({vencidas.length + porVencer.length})</TabsTrigger>
          <TabsTrigger value="sin-asignar">Sin asignar ({sinAsignar.length})</TabsTrigger>
          <TabsTrigger value="reparacion">En reparación ({enReparacion.length})</TabsTrigger>
          <TabsTrigger value="extraviados">Extraviados ({extraviados.length})</TabsTrigger>
          <TabsTrigger value="mantenimientos">Mantenimientos pendientes ({mantPend.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="garantias">
          <Card>
            <CardHeader><CardTitle className="text-base">Garantías vencidas y por vencer</CardTitle></CardHeader>
            <CardContent>
              {renderLista([...vencidas, ...porVencer], (e) => {
                const g = estadoGarantia(e.garantia_hasta);
                return <Badge variant="outline" className={g.tone === "destructive" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning"}>{g.label} · {formatearFecha(e.garantia_hasta)}</Badge>;
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sin-asignar"><Card><CardContent className="pt-6">{renderLista(sinAsignar)}</CardContent></Card></TabsContent>
        <TabsContent value="reparacion"><Card><CardContent className="pt-6">{renderLista(enReparacion)}</CardContent></Card></TabsContent>
        <TabsContent value="extraviados"><Card><CardContent className="pt-6">{renderLista(extraviados)}</CardContent></Card></TabsContent>
        <TabsContent value="mantenimientos">
          <Card><CardContent className="pt-6">
            {mantPend.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Sin pendientes.</p> : (
              <div className="divide-y">
                {mantPend.map(m => {
                  const e = equipoMap[m.equipo_id];
                  if (!e) return null;
                  return (
                    <Link key={m.id} to={`/equipos/${e.id}`} className="flex items-center gap-3 py-2.5 px-2 hover:bg-muted/50 rounded -mx-2">
                      <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{e.codigo_inventario} — {m.tipo}</div>
                        <div className="text-xs text-muted-foreground">{formatearFecha(m.fecha)}</div>
                      </div>
                      <Badge variant="outline">{m.estado}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
