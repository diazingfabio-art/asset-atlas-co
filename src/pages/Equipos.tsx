import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoBadge } from "@/components/EstadoBadge";
import { iconoTipo, labelTipo, estadoGarantia, ESTADOS_EQUIPO, TIPOS_EQUIPO, type EstadoEquipo, type TipoEquipo } from "@/lib/inventario";
import { Plus, Search, Eye, Pencil, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Equipo = {
  id: string; codigo_inventario: string; tipo_equipo: TipoEquipo;
  marca: string | null; modelo: string | null; numero_serie: string | null;
  estado: EstadoEquipo; usuario_asignado: string | null; garantia_hasta: string | null;
  filial_id: string | null; sector_id: string | null;
};

export default function Equipos() {
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [total, setTotal] = useState(0);
  const [filiales, setFiliales] = useState<{ id: string; nombre: string }[]>([]);
  const [sectores, setSectores] = useState<{ id: string; nombre: string; filial_id: string }[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaDeb, setBusquedaDeb] = useState("");
  const [fFilial, setFFilial] = useState("todas");
  const [fSector, setFSector] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");
  const [fEstado, setFEstado] = useState("todos");
  const [pagina, setPagina] = useState(0);
  const PAGE = 20;

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => { setBusquedaDeb(busqueda); setPagina(0); }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    (async () => {
      const [fi, se] = await Promise.all([
        supabase.from("filiales").select("id,nombre").order("nombre"),
        supabase.from("sectores").select("id,nombre,filial_id").order("nombre"),
      ]);
      setFiliales((fi.data as any) ?? []);
      setSectores((se.data as any) ?? []);
    })();
  }, []);

  // Búsqueda y filtros en servidor + paginación
  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("equipos")
        .select("id,codigo_inventario,tipo_equipo,marca,modelo,numero_serie,estado,usuario_asignado,garantia_hasta,filial_id,sector_id", { count: "exact" })
        .order("codigo_inventario");
      const q = busquedaDeb.trim();
      if (q) {
        const safe = q.replace(/[%,]/g, " ");
        query = query.or(
          `codigo_inventario.ilike.%${safe}%,marca.ilike.%${safe}%,modelo.ilike.%${safe}%,numero_serie.ilike.%${safe}%,usuario_asignado.ilike.%${safe}%`
        );
      }
      if (fFilial !== "todas") query = query.eq("filial_id", fFilial);
      if (fSector !== "todos") query = query.eq("sector_id", fSector);
      if (fTipo !== "todos") query = query.eq("tipo_equipo", fTipo as any);
      if (fEstado !== "todos") query = query.eq("estado", fEstado as any);
      query = query.range(pagina * PAGE, pagina * PAGE + PAGE - 1);
      const { data, count } = await query;
      setEquipos((data as any) ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    })();
  }, [busquedaDeb, fFilial, fSector, fTipo, fEstado, pagina]);

  const sectoresFiltrados = fFilial === "todas" ? sectores : sectores.filter(s => s.filial_id === fFilial);
  const filtrados = equipos;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE));

  const limpiar = () => { setBusqueda(""); setFFilial("todas"); setFSector("todos"); setFTipo("todos"); setFEstado("todos"); setPagina(0); };
  const filiNombre = (id: string | null) => filiales.find(f => f.id === id)?.nombre ?? "—";
  const sectNombre = (id: string | null) => sectores.find(s => s.id === id)?.nombre ?? "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtrados.length} de {equipos.length} equipos</p>
        </div>
        <Button asChild><Link to="/equipos/nuevo"><Plus className="h-4 w-4 mr-1.5" />Agregar equipo</Link></Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por código, serie, usuario, marca..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
          </div>
          <Select value={fFilial} onValueChange={(v) => { setFFilial(v); setFSector("todos"); }}>
            <SelectTrigger><SelectValue placeholder="Filial" /></SelectTrigger>
            <SelectContent><SelectItem value="todas">Todas las filiales</SelectItem>{filiales.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fSector} onValueChange={setFSector}>
            <SelectTrigger><SelectValue placeholder="Sector" /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos los sectores</SelectItem>{sectoresFiltrados.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={fTipo} onValueChange={setFTipo}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos los tipos</SelectItem>{TIPOS_EQUIPO.map(t => <SelectItem key={t} value={t}>{labelTipo[t]}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fEstado} onValueChange={setFEstado}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{ESTADOS_EQUIPO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {(busqueda || fFilial !== "todas" || fSector !== "todos" || fTipo !== "todos" || fEstado !== "todos") && (
          <Button variant="ghost" size="sm" onClick={limpiar}><X className="h-3.5 w-3.5 mr-1" />Limpiar filtros</Button>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Código</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead className="hidden md:table-cell">Filial / Sector</TableHead>
                <TableHead className="hidden lg:table-cell">Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Garantía</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>)
              ) : filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No se encontraron equipos con esos filtros.</TableCell></TableRow>
              ) : filtrados.map(e => {
                const Icono = iconoTipo[e.tipo_equipo];
                const g = estadoGarantia(e.garantia_hasta);
                return (
                  <TableRow key={e.id} className="group">
                    <TableCell className="font-mono text-xs font-medium">{e.codigo_inventario}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0"><Icono className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{e.marca} {e.modelo}</div>
                          <div className="text-xs text-muted-foreground">{labelTipo[e.tipo_equipo]} · {e.numero_serie ?? "s/n"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      <div>{filiNombre(e.filial_id)}</div>
                      <div className="text-xs text-muted-foreground">{sectNombre(e.sector_id)}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{e.usuario_asignado ?? <span className="text-muted-foreground italic">Sin asignar</span>}</TableCell>
                    <TableCell><EstadoBadge estado={e.estado} /></TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`text-xs font-medium ${g.tone === "destructive" ? "text-destructive" : g.tone === "warning" ? "text-warning" : g.tone === "success" ? "text-success" : "text-muted-foreground"}`}>{g.label}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8"><Link to={`/equipos/${e.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8"><Link to={`/equipos/${e.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button>
                      </div>
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
