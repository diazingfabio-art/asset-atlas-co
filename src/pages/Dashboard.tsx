import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoBadge } from "@/components/EstadoBadge";
import { iconoTipo, labelTipo, formatearFecha, estadoGarantia, type TipoEquipo, type EstadoEquipo, TIPOS_EQUIPO } from "@/lib/inventario";
import { Plus, Search, FileBarChart, AlertTriangle, TrendingUp, HardDrive } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

type Equipo = {
  id: string; codigo_inventario: string; tipo_equipo: TipoEquipo; marca: string | null;
  modelo: string | null; estado: EstadoEquipo; usuario_asignado: string | null;
  garantia_hasta: string | null; creado_en: string; filial_id: string | null;
};
type Filial = { id: string; nombre: string };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filiales, setFiliales] = useState<Filial[]>([]);

  useEffect(() => {
    (async () => {
      const [eq, fi] = await Promise.all([
        supabase.from("equipos").select("id,codigo_inventario,tipo_equipo,marca,modelo,estado,usuario_asignado,garantia_hasta,creado_en,filial_id").order("creado_en", { ascending: false }),
        supabase.from("filiales").select("id,nombre"),
      ]);
      setEquipos((eq.data as any) ?? []);
      setFiliales((fi.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const total = equipos.length;
  const porTipo = TIPOS_EQUIPO.map(t => ({ tipo: t, cantidad: equipos.filter(e => e.tipo_equipo === t).length })).filter(x => x.cantidad > 0);
  const porEstado = (["Activo","En reparacion","De baja","En deposito","Extraviado"] as EstadoEquipo[]).map(s => ({ estado: s, cantidad: equipos.filter(e => e.estado === s).length }));
  const porFilial = filiales.map(f => ({ nombre: f.nombre, cantidad: equipos.filter(e => e.filial_id === f.id).length }));
  const ultimos = equipos.slice(0, 5);
  const garantiasAlerta = equipos
    .map(e => ({ ...e, g: estadoGarantia(e.garantia_hasta) }))
    .filter(e => e.g.tone === "destructive" || e.g.tone === "warning")
    .slice(0, 6);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel principal</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen general del inventario tecnológico</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild><Link to="/equipos/nuevo"><Plus className="h-4 w-4 mr-1.5" />Agregar equipo</Link></Button>
          <Button asChild variant="outline"><Link to="/equipos"><Search className="h-4 w-4 mr-1.5" />Búsqueda rápida</Link></Button>
          <Button asChild variant="outline"><Link to="/reportes"><FileBarChart className="h-4 w-4 mr-1.5" />Reportes</Link></Button>
          <Button asChild variant="outline"><Link to="/alertas"><AlertTriangle className="h-4 w-4 mr-1.5" />Alertas</Link></Button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="col-span-2 sm:col-span-3 lg:col-span-1 relative overflow-hidden" style={{ background: "var(--gradient-primary)" }}>
          <CardContent className="p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80">Total equipos</div>
                <div className="text-3xl font-bold mt-1">{total}</div>
              </div>
              <HardDrive className="h-10 w-10 opacity-30" />
            </div>
          </CardContent>
        </Card>
        {porEstado.map(({ estado, cantidad }) => (
          <Card key={estado}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{estado === "En reparacion" ? "En reparación" : estado === "En deposito" ? "En depósito" : estado}</div>
              <div className="text-2xl font-semibold mt-1">{cantidad}</div>
              <div className="mt-1.5"><EstadoBadge estado={estado} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Por tipo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Equipos por tipo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {porTipo.map(({ tipo, cantidad }) => {
              const Icono = iconoTipo[tipo];
              return (
                <div key={tipo} className="flex items-center gap-3 rounded-md border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icono className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold leading-none">{cantidad}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{labelTipo[tipo]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Gráfico filial */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Equipos por filial</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porFilial}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="nombre" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 13 }}
                    cursor={{ fill: "hsl(var(--muted))" }}
                  />
                  <Bar dataKey="cantidad" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas de garantía */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Alertas de garantía</CardTitle></CardHeader>
          <CardContent>
            {garantiasAlerta.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay alertas pendientes.</p>
            ) : (
              <ul className="space-y-2">
                {garantiasAlerta.map(e => (
                  <li key={e.id} className="flex items-center justify-between gap-2 text-sm border-b last:border-0 pb-2 last:pb-0">
                    <Link to={`/equipos/${e.id}`} className="min-w-0 hover:text-primary">
                      <div className="font-medium truncate">{e.codigo_inventario}</div>
                      <div className="text-xs text-muted-foreground truncate">{e.marca} {e.modelo}</div>
                    </Link>
                    <span className={`text-xs font-medium shrink-0 ${e.g.tone === "destructive" ? "text-destructive" : "text-warning"}`}>
                      {e.g.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos equipos */}
      <Card>
        <CardHeader><CardTitle className="text-base">Últimos equipos registrados</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {ultimos.map(e => {
              const Icono = iconoTipo[e.tipo_equipo];
              return (
                <Link key={e.id} to={`/equipos/${e.id}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/50 -mx-2 px-2 rounded">
                  <Icono className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{e.codigo_inventario} <span className="text-muted-foreground font-normal">— {e.marca} {e.modelo}</span></div>
                    <div className="text-xs text-muted-foreground">{e.usuario_asignado ?? "Sin asignar"} · creado {formatearFecha(e.creado_en.slice(0, 10))}</div>
                  </div>
                  <EstadoBadge estado={e.estado} />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
