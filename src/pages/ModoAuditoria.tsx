import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoBadge } from "@/components/EstadoBadge";
import { iconoTipo, labelTipo, type EstadoEquipo, type TipoEquipo } from "@/lib/inventario";
import { Building2, Printer, ClipboardCheck } from "lucide-react";

type Equipo = { id: string; codigo_inventario: string; tipo_equipo: TipoEquipo; marca: string | null; modelo: string | null; numero_serie: string | null; estado: EstadoEquipo; usuario_asignado: string | null; filial_id: string | null; sector_id: string | null };
type Filial = { id: string; nombre: string; codigo_filial: string; ciudad: string | null };
type Sector = { id: string; nombre: string; filial_id: string };

export default function ModoAuditoria() {
  const [loading, setLoading] = useState(true);
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const generadoEn = new Date().toLocaleString("es-AR");

  useEffect(() => {
    (async () => {
      const [fi, se, eq] = await Promise.all([
        supabase.from("filiales").select("*").order("nombre"),
        supabase.from("sectores").select("*").order("nombre"),
        supabase.from("equipos").select("id,codigo_inventario,tipo_equipo,marca,modelo,numero_serie,estado,usuario_asignado,filial_id,sector_id").order("codigo_inventario"),
      ]);
      setFiliales((fi.data as any) ?? []);
      setSectores((se.data as any) ?? []);
      setEquipos((eq.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" /> Modo auditoría
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Vista de solo lectura organizada por filial y sector.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Imprimir / PDF</Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="py-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <div><span className="text-muted-foreground">Generado:</span> <strong>{generadoEn}</strong></div>
          <div><span className="text-muted-foreground">Total equipos:</span> <strong>{equipos.length}</strong></div>
          <div><span className="text-muted-foreground">Filiales:</span> <strong>{filiales.length}</strong></div>
          <div><span className="text-muted-foreground">Sectores:</span> <strong>{sectores.length}</strong></div>
        </CardContent>
      </Card>

      {filiales.map(fi => {
        const sectoresFi = sectores.filter(s => s.filial_id === fi.id);
        const equiposFi = equipos.filter(e => e.filial_id === fi.id);
        return (
          <Card key={fi.id}>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
                <span className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {fi.nombre} <span className="text-muted-foreground font-normal text-xs">({fi.codigo_filial}{fi.ciudad ? ` · ${fi.ciudad}` : ""})</span>
                </span>
                <span className="text-xs font-normal text-muted-foreground">{equiposFi.length} equipo(s)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sectoresFi.length === 0 && <div className="p-4 text-sm text-muted-foreground italic">Sin sectores cargados.</div>}
              {sectoresFi.map(se => {
                const equiposSe = equiposFi.filter(e => e.sector_id === se.id);
                return (
                  <div key={se.id} className="border-b last:border-b-0">
                    <div className="px-4 py-2 bg-muted/30 text-sm font-medium flex justify-between">
                      <span>{se.nombre}</span>
                      <span className="text-xs text-muted-foreground">{equiposSe.length} equipo(s)</span>
                    </div>
                    {equiposSe.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground italic">Sin equipos.</div>
                    ) : (
                      <div className="divide-y">
                        {equiposSe.map(e => {
                          const Ic = iconoTipo[e.tipo_equipo];
                          return (
                            <div key={e.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                              <Ic className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-mono text-xs w-32 shrink-0">{e.codigo_inventario}</span>
                              <span className="flex-1 min-w-0 truncate">{e.marca} {e.modelo} <span className="text-muted-foreground">· {labelTipo[e.tipo_equipo]}</span></span>
                              <span className="text-xs text-muted-foreground hidden sm:block">{e.usuario_asignado ?? "Sin asignar"}</span>
                              <EstadoBadge estado={e.estado} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* equipos sin sector */}
              {equiposFi.filter(e => !e.sector_id).length > 0 && (
                <div className="border-t">
                  <div className="px-4 py-2 bg-muted/30 text-sm font-medium italic text-muted-foreground">Sin sector asignado</div>
                  <div className="divide-y">
                    {equiposFi.filter(e => !e.sector_id).map(e => (
                      <div key={e.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                        <span className="font-mono text-xs w-32 shrink-0">{e.codigo_inventario}</span>
                        <span className="flex-1 truncate">{e.marca} {e.modelo}</span>
                        <EstadoBadge estado={e.estado} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
