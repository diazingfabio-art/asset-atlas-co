import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ScanLine, Search, CheckCircle2, XCircle, AlertCircle, Clock, Printer, StopCircle } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { formatearFecha, iconoTipo, type TipoEquipo } from "@/lib/inventario";
import { toast } from "sonner";

type EstadoItem = "Pendiente" | "Verificado" | "No encontrado" | "Discrepancia";

type Item = {
  id: string; equipo_id: string; estado: EstadoItem;
  ubicacion_encontrada: string | null; usuario_encontrado: string | null;
  notas: string | null; verificado_en: string | null;
  equipo?: any;
};

export default function AuditoriaDetalle() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [auditoria, setAuditoria] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filialNombre, setFilialNombre] = useState<string>("");
  const [sectorNombre, setSectorNombre] = useState<string>("");
  const [busqueda, setBusqueda] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [marcarOpen, setMarcarOpen] = useState<Item | null>(null);
  const [marcarForm, setMarcarForm] = useState({ estado: "Verificado" as EstadoItem, ubicacion: "", usuario: "", notas: "" });

  const cargar = async () => {
    if (!id) return;
    const { data: a } = await supabase.from("auditorias").select("*").eq("id", id).single();
    setAuditoria(a);
    if (a?.filial_id) {
      const { data: f } = await supabase.from("filiales").select("nombre").eq("id", a.filial_id).single();
      setFilialNombre(f?.nombre ?? "");
    }
    if (a?.sector_id) {
      const { data: s } = await supabase.from("sectores").select("nombre").eq("id", a.sector_id).single();
      setSectorNombre(s?.nombre ?? "");
    }
    const { data: its } = await supabase.from("auditoria_items").select("*").eq("auditoria_id", id);
    const equipoIds = (its ?? []).map((i: any) => i.equipo_id);
    const { data: equipos } = await supabase.from("equipos")
      .select("id,codigo_inventario,tipo_equipo,marca,modelo,numero_serie,usuario_asignado,filial_id,sector_id")
      .in("id", equipoIds);
    const mapEq = Object.fromEntries((equipos ?? []).map((e: any) => [e.id, e]));
    setItems(((its as any) ?? []).map((i: any) => ({ ...i, equipo: mapEq[i.equipo_id] })));
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const total = items.length;
  const verificados = items.filter(i => i.estado === "Verificado").length;
  const noEncontrados = items.filter(i => i.estado === "No encontrado").length;
  const discrepancias = items.filter(i => i.estado === "Discrepancia").length;
  const pendientes = items.filter(i => i.estado === "Pendiente").length;
  const progreso = total === 0 ? 0 : Math.round(((verificados + noEncontrados + discrepancias) / total) * 100);

  const handleScanResult = async (text: string) => {
    // text es el id del equipo (UUID)
    const item = items.find(i => i.equipo_id === text || i.equipo?.codigo_inventario === text);
    if (!item) {
      toast.error("Equipo no pertenece a esta auditoría");
      return;
    }
    setScannerOpen(false);
    abrirMarcar(item, "Verificado");
  };

  const abrirMarcar = (item: Item, estadoSugerido: EstadoItem = "Verificado") => {
    setMarcarOpen(item);
    setMarcarForm({
      estado: estadoSugerido,
      ubicacion: item.ubicacion_encontrada ?? "",
      usuario: item.usuario_encontrado ?? item.equipo?.usuario_asignado ?? "",
      notas: item.notas ?? "",
    });
  };

  const guardarMarca = async () => {
    if (!marcarOpen) return;
    const { error } = await supabase.from("auditoria_items").update({
      estado: marcarForm.estado,
      ubicacion_encontrada: marcarForm.ubicacion || null,
      usuario_encontrado: marcarForm.usuario || null,
      notas: marcarForm.notas || null,
      verificado_en: new Date().toISOString(),
    }).eq("id", marcarOpen.id);
    if (error) { toast.error("Error al guardar"); return; }
    toast.success(`Equipo marcado como ${marcarForm.estado}`);
    setMarcarOpen(null);
    cargar();
  };

  const finalizar = async () => {
    if (!confirm("¿Finalizar la auditoría? No podrá modificarse después.")) return;
    await supabase.from("auditorias").update({ estado: "Finalizada", fecha_fin: new Date().toISOString().slice(0, 10) }).eq("id", id);
    toast.success("Auditoría finalizada");
    cargar();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  if (!auditoria) return <div>Auditoría no encontrada</div>;

  const itemsFiltrados = items.filter(i => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return i.equipo?.codigo_inventario?.toLowerCase().includes(q)
      || i.equipo?.numero_serie?.toLowerCase().includes(q)
      || i.equipo?.marca?.toLowerCase().includes(q)
      || i.equipo?.modelo?.toLowerCase().includes(q)
      || i.equipo?.usuario_asignado?.toLowerCase().includes(q);
  });

  const renderItems = (lista: Item[]) => (
    lista.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Sin elementos.</p> : (
      <div className="divide-y">
        {lista.map(i => {
          const eq = i.equipo;
          if (!eq) return null;
          const Icono = iconoTipo[eq.tipo_equipo as TipoEquipo];
          return (
            <div key={i.id} className="flex items-center gap-3 py-2.5">
              <Icono className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  <Link to={`/equipos/${eq.id}`} className="hover:text-primary">{eq.codigo_inventario}</Link>
                  <span className="text-muted-foreground font-normal"> — {eq.marca} {eq.modelo}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  Asignado: {eq.usuario_asignado ?? "Sin asignar"}
                  {i.notas && ` · ${i.notas}`}
                </div>
              </div>
              <BadgeEstado estado={i.estado} />
              {auditoria.estado === "En curso" && (
                <Button size="sm" variant="outline" onClick={() => abrirMarcar(i)}>Marcar</Button>
              )}
            </div>
          );
        })}
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 no-print">
        <Button variant="ghost" size="sm" asChild><Link to="/auditorias"><ArrowLeft className="h-4 w-4 mr-1" />Volver</Link></Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{auditoria.nombre}</h1>
              <div className="text-sm text-muted-foreground mt-1">
                {filialNombre || "Todas las filiales"}{sectorNombre && ` · ${sectorNombre}`} · Iniciada {formatearFecha(auditoria.fecha_inicio)}
                {auditoria.fecha_fin && ` · Finalizada ${formatearFecha(auditoria.fecha_fin)}`}
                {auditoria.responsable && ` · Responsable: ${auditoria.responsable}`}
              </div>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Imprimir acta</Button>
              {auditoria.estado === "En curso" && (
                <>
                  <Button variant="outline" onClick={() => setScannerOpen(true)}><ScanLine className="h-4 w-4 mr-1.5" />Escanear QR</Button>
                  <Button variant="destructive" onClick={finalizar}><StopCircle className="h-4 w-4 mr-1.5" />Finalizar</Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{verificados + noEncontrados + discrepancias} / {total} ({progreso}%)</span>
            </div>
            <Progress value={progreso} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <KPI icon={CheckCircle2} label="Verificados" valor={verificados} color="text-success bg-success/10" />
            <KPI icon={Clock} label="Pendientes" valor={pendientes} color="text-info bg-info/10" />
            <KPI icon={AlertCircle} label="Discrepancias" valor={discrepancias} color="text-warning bg-warning/10" />
            <KPI icon={XCircle} label="No encontrados" valor={noEncontrados} color="text-destructive bg-destructive/10" />
          </div>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Equipos a verificar</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar código, serie, usuario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pendientes">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="pendientes">Pendientes ({pendientes})</TabsTrigger>
              <TabsTrigger value="verificados">Verificados ({verificados})</TabsTrigger>
              <TabsTrigger value="discrepancias">Discrepancias ({discrepancias})</TabsTrigger>
              <TabsTrigger value="no-encontrados">No encontrados ({noEncontrados})</TabsTrigger>
              <TabsTrigger value="todos">Todos ({total})</TabsTrigger>
            </TabsList>
            <TabsContent value="pendientes">{renderItems(itemsFiltrados.filter(i => i.estado === "Pendiente"))}</TabsContent>
            <TabsContent value="verificados">{renderItems(itemsFiltrados.filter(i => i.estado === "Verificado"))}</TabsContent>
            <TabsContent value="discrepancias">{renderItems(itemsFiltrados.filter(i => i.estado === "Discrepancia"))}</TabsContent>
            <TabsContent value="no-encontrados">{renderItems(itemsFiltrados.filter(i => i.estado === "No encontrado"))}</TabsContent>
            <TabsContent value="todos">{renderItems(itemsFiltrados)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Acta para impresión */}
      <div className="hidden print:block print-area">
        <h2 className="text-xl font-bold text-center mb-2">ACTA DE AUDITORÍA FÍSICA DE EQUIPOS</h2>
        <p className="text-center text-sm mb-4">{auditoria.nombre}</p>
        <table className="w-full text-xs mb-6">
          <tbody>
            <tr><td><strong>Filial:</strong></td><td>{filialNombre || "Todas"}</td><td><strong>Sector:</strong></td><td>{sectorNombre || "Todos"}</td></tr>
            <tr><td><strong>Inicio:</strong></td><td>{formatearFecha(auditoria.fecha_inicio)}</td><td><strong>Fin:</strong></td><td>{auditoria.fecha_fin ? formatearFecha(auditoria.fecha_fin) : "—"}</td></tr>
            <tr><td><strong>Responsable:</strong></td><td colSpan={3}>{auditoria.responsable ?? "—"}</td></tr>
            <tr><td><strong>Total:</strong></td><td>{total}</td><td><strong>Verificados:</strong></td><td>{verificados}</td></tr>
            <tr><td><strong>No encontrados:</strong></td><td>{noEncontrados}</td><td><strong>Discrepancias:</strong></td><td>{discrepancias}</td></tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th>Código</th><th>Tipo</th><th>Marca/Modelo</th><th>Asignado</th><th>Estado</th><th>Notas</th></tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id}>
                <td>{i.equipo?.codigo_inventario}</td>
                <td>{i.equipo?.tipo_equipo}</td>
                <td>{i.equipo?.marca} {i.equipo?.modelo}</td>
                <td>{i.usuario_encontrado ?? i.equipo?.usuario_asignado ?? "—"}</td>
                <td>{i.estado}</td>
                <td>{i.notas ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center"><div className="border-t pt-1">Coordinador de Informática</div></div>
          <div className="text-center"><div className="border-t pt-1">Auditor</div></div>
        </div>
      </div>

      {/* Scanner */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escanear código QR</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Apuntá la cámara al QR del equipo. Se marcará automáticamente al detectarlo.</p>
          {scannerOpen && <QRScanner onResult={handleScanResult} onError={(m) => toast.error(m)} />}
        </DialogContent>
      </Dialog>

      {/* Marcar */}
      <Dialog open={!!marcarOpen} onOpenChange={(o) => !o && setMarcarOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verificar equipo</DialogTitle></DialogHeader>
          {marcarOpen && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="font-semibold">{marcarOpen.equipo?.codigo_inventario}</div>
                <div className="text-muted-foreground">{marcarOpen.equipo?.marca} {marcarOpen.equipo?.modelo}</div>
                <div className="text-xs text-muted-foreground mt-1">Asignado en sistema: {marcarOpen.equipo?.usuario_asignado ?? "Sin asignar"}</div>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={marcarForm.estado} onValueChange={(v) => setMarcarForm({ ...marcarForm, estado: v as EstadoItem })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verificado">Verificado (todo OK)</SelectItem>
                    <SelectItem value="Discrepancia">Discrepancia (datos no coinciden)</SelectItem>
                    <SelectItem value="No encontrado">No encontrado</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Ubicación encontrada</Label>
                  <Input value={marcarForm.ubicacion} onChange={e => setMarcarForm({ ...marcarForm, ubicacion: e.target.value })} placeholder="Filial / sector real" />
                </div>
                <div>
                  <Label>Usuario actual</Label>
                  <Input value={marcarForm.usuario} onChange={e => setMarcarForm({ ...marcarForm, usuario: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={marcarForm.notas} onChange={e => setMarcarForm({ ...marcarForm, notas: e.target.value })} placeholder="Observaciones de la verificación..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarcarOpen(null)}>Cancelar</Button>
            <Button onClick={guardarMarca}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ icon: Icon, label, valor, color }: { icon: any; label: string; valor: number; color: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${color}`}><Icon className="h-4 w-4" /></div>
      <div className="text-2xl font-bold mt-1.5">{valor}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function BadgeEstado({ estado }: { estado: EstadoItem }) {
  const map: Record<EstadoItem, string> = {
    "Verificado": "bg-success/15 text-success border-success/30",
    "Pendiente": "bg-muted text-muted-foreground",
    "Discrepancia": "bg-warning/15 text-warning border-warning/30",
    "No encontrado": "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={map[estado]}>{estado}</Badge>;
}
