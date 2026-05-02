import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MovimientoDialog } from "@/components/MovimientoDialog";
import { TIPOS_MOVIMIENTO, formatearFecha } from "@/lib/inventario";
import { Plus, Search, ArrowRight, ExternalLink } from "lucide-react";

type Mov = any;

export default function Movimientos() {
  const [loading, setLoading] = useState(true);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [equipos, setEquipos] = useState<Record<string, any>>({});
  const [filiales, setFiliales] = useState<Record<string, string>>({});
  const [sectores, setSectores] = useState<Record<string, string>>({});

  const [busqueda, setBusqueda] = useState("");
  const [fTipo, setFTipo] = useState("todos");

  const cargar = async () => {
    setLoading(true);
    const [mv, eq, fi, se] = await Promise.all([
      supabase.from("movimientos").select("*").order("fecha", { ascending: false }).order("creado_en", { ascending: false }),
      supabase.from("equipos").select("id,codigo_inventario,marca,modelo,tipo_equipo"),
      supabase.from("filiales").select("id,nombre"),
      supabase.from("sectores").select("id,nombre"),
    ]);
    setMovs((mv.data as any) ?? []);
    const eqMap: Record<string, any> = {};
    (eq.data as any[] ?? []).forEach(e => { eqMap[e.id] = e; });
    setEquipos(eqMap);
    const fiMap: Record<string, string> = {};
    (fi.data as any[] ?? []).forEach(f => { fiMap[f.id] = f.nombre; });
    setFiliales(fiMap);
    const seMap: Record<string, string> = {};
    (se.data as any[] ?? []).forEach(s => { seMap[s.id] = s.nombre; });
    setSectores(seMap);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return movs.filter(m => {
      if (fTipo !== "todos" && m.tipo_movimiento !== fTipo) return false;
      if (q) {
        const eq = equipos[m.equipo_id];
        const txt = [eq?.codigo_inventario, eq?.marca, eq?.modelo, m.usuario_destino, m.usuario_origen, m.responsable, m.observaciones].join(" ").toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [movs, busqueda, fTipo, equipos]);

  const ubic = (filialId: string | null, sectorId: string | null, usuario: string | null) => {
    const partes = [filialId && filiales[filialId], sectorId && sectores[sectorId], usuario].filter(Boolean);
    return partes.length ? partes.join(" / ") : "—";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtrados.length} de {movs.length} registros · trazabilidad completa</p>
        </div>
        <MovimientoDialog
          trigger={<Button><Plus className="h-4 w-4 mr-1.5" />Registrar movimiento</Button>}
          onSaved={cargar}
        />
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por equipo, usuario, responsable..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
          </div>
          <Select value={fTipo} onValueChange={setFTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {TIPOS_MOVIMIENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Fecha</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Origen</TableHead>
                <TableHead className="hidden md:table-cell">Destino</TableHead>
                <TableHead className="hidden lg:table-cell">Responsable</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>
              )) : filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Sin movimientos para mostrar.</TableCell></TableRow>
              ) : filtrados.map(m => {
                const eq = equipos[m.equipo_id];
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatearFecha(m.fecha)}</TableCell>
                    <TableCell>
                      {eq ? (
                        <div>
                          <div className="font-mono text-xs font-medium">{eq.codigo_inventario}</div>
                          <div className="text-xs text-muted-foreground">{eq.marca} {eq.modelo}</div>
                        </div>
                      ) : <span className="text-muted-foreground italic text-xs">Equipo eliminado</span>}
                    </TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{m.tipo_movimiento}</span></TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{ubic(m.filial_origen, m.sector_origen, m.usuario_origen)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{ubic(m.filial_destino, m.sector_destino, m.usuario_destino)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{m.responsable ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {eq && <Button asChild size="icon" variant="ghost" className="h-8 w-8"><Link to={`/equipos/${eq.id}`}><ExternalLink className="h-4 w-4" /></Link></Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
