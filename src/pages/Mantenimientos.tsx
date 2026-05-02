import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MantenimientoDialog } from "@/components/MantenimientoDialog";
import { formatearFecha, formatearMoneda } from "@/lib/inventario";
import { Plus, Search, ExternalLink, Wrench, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const tonoEstado: Record<string, string> = {
  "Pendiente": "bg-warning/15 text-warning border-warning/30",
  "En proceso": "bg-accent/15 text-accent border-accent/30",
  "Completado": "bg-success/15 text-success border-success/30",
};

export default function Mantenimientos() {
  const [loading, setLoading] = useState(true);
  const [mants, setMants] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<Record<string, any>>({});

  const [busqueda, setBusqueda] = useState("");
  const [fEstado, setFEstado] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");

  const cargar = async () => {
    setLoading(true);
    const [mt, eq] = await Promise.all([
      supabase.from("mantenimientos").select("*").order("fecha", { ascending: false }),
      supabase.from("equipos").select("id,codigo_inventario,marca,modelo"),
    ]);
    setMants((mt.data as any) ?? []);
    const eqMap: Record<string, any> = {};
    (eq.data as any[] ?? []).forEach(e => { eqMap[e.id] = e; });
    setEquipos(eqMap);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return mants.filter(m => {
      if (fEstado !== "todos" && m.estado !== fEstado) return false;
      if (fTipo !== "todos" && m.tipo !== fTipo) return false;
      if (q) {
        const eq = equipos[m.equipo_id];
        const txt = [eq?.codigo_inventario, eq?.marca, eq?.modelo, m.tecnico, m.descripcion].join(" ").toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [mants, busqueda, fEstado, fTipo, equipos]);

  const stats = useMemo(() => ({
    total: mants.length,
    pendientes: mants.filter(m => m.estado === "Pendiente").length,
    proceso: mants.filter(m => m.estado === "En proceso").length,
    completados: mants.filter(m => m.estado === "Completado").length,
    costoTotal: mants.reduce((s, m) => s + (m.costo ?? 0), 0),
  }), [mants]);

  const KPI = ({ label, value, icon: Icon, tone }: any) => (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
      <div><div className="text-xl font-bold leading-tight">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
    </CardContent></Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mantenimientos</h1>
          <p className="text-sm text-muted-foreground mt-1">Preventivos y correctivos sobre el parque de equipos</p>
        </div>
        <MantenimientoDialog
          trigger={<Button><Plus className="h-4 w-4 mr-1.5" />Registrar mantenimiento</Button>}
          onSaved={cargar}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Pendientes" value={stats.pendientes} icon={AlertCircle} tone="bg-warning/15 text-warning" />
        <KPI label="En proceso" value={stats.proceso} icon={Clock} tone="bg-accent/15 text-accent" />
        <KPI label="Completados" value={stats.completados} icon={CheckCircle2} tone="bg-success/15 text-success" />
        <KPI label="Costo total" value={formatearMoneda(stats.costoTotal)} icon={Wrench} tone="bg-primary/10 text-primary" />
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por equipo, técnico, descripción..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
          </div>
          <Select value={fTipo} onValueChange={setFTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="Preventivo">Preventivo</SelectItem>
              <SelectItem value="Correctivo">Correctivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="En proceso">En proceso</SelectItem>
              <SelectItem value="Completado">Completado</SelectItem>
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
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Técnico</TableHead>
                <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8" /></TableCell></TableRow>
              )) : filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Sin mantenimientos para mostrar.</TableCell></TableRow>
              ) : filtrados.map(m => {
                const eq = equipos[m.equipo_id];
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatearFecha(m.fecha)}</TableCell>
                    <TableCell>
                      {eq ? (<div><div className="font-mono text-xs font-medium">{eq.codigo_inventario}</div><div className="text-xs text-muted-foreground">{eq.marca} {eq.modelo}</div></div>) : <span className="text-muted-foreground italic text-xs">—</span>}
                    </TableCell>
                    <TableCell><span className="text-xs">{m.tipo}</span></TableCell>
                    <TableCell><span className={`estado-badge border ${tonoEstado[m.estado]}`}>{m.estado}</span></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{m.tecnico ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-xs truncate">{m.descripcion ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{m.costo ? formatearMoneda(m.costo) : "—"}</TableCell>
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
