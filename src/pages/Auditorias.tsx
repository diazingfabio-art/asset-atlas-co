import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardCheck, Building2, Calendar } from "lucide-react";
import { formatearFecha } from "@/lib/inventario";
import { toast } from "sonner";

type Auditoria = {
  id: string; nombre: string; estado: string; fecha_inicio: string; fecha_fin: string | null;
  responsable: string | null; filial_id: string | null; sector_id: string | null;
};
type Filial = { id: string; nombre: string };
type Sector = { id: string; nombre: string; filial_id: string };

export default function Auditorias() {
  const [loading, setLoading] = useState(true);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", responsable: "", filial_id: "todas", sector_id: "todos" });

  const cargar = async () => {
    setLoading(true);
    const [a, f, s] = await Promise.all([
      supabase.from("auditorias").select("*").order("creado_en", { ascending: false }),
      supabase.from("filiales").select("id,nombre"),
      supabase.from("sectores").select("id,nombre,filial_id"),
    ]);
    setAuditorias((a.data as any) ?? []);
    setFiliales((f.data as any) ?? []);
    setSectores((s.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const filialMap = Object.fromEntries(filiales.map(f => [f.id, f.nombre]));
  const sectorMap = Object.fromEntries(sectores.map(s => [s.id, s.nombre]));
  const sectoresFiltrados = form.filial_id === "todas" ? [] : sectores.filter(s => s.filial_id === form.filial_id);

  const crear = async () => {
    if (!form.nombre.trim()) { toast.error("Ingresá un nombre para la auditoría"); return; }
    setSaving(true);
    // Determinar equipos a auditar
    let q = supabase.from("equipos").select("id");
    if (form.filial_id !== "todas") q = q.eq("filial_id", form.filial_id);
    if (form.sector_id !== "todos") q = q.eq("sector_id", form.sector_id);
    const { data: eqs, error: eqErr } = await q;
    if (eqErr) { toast.error("Error al obtener equipos"); setSaving(false); return; }
    if (!eqs?.length) { toast.error("No hay equipos en el alcance seleccionado"); setSaving(false); return; }

    const { data: nueva, error } = await supabase.from("auditorias").insert({
      nombre: form.nombre.trim(),
      responsable: form.responsable.trim() || null,
      filial_id: form.filial_id === "todas" ? null : form.filial_id,
      sector_id: form.sector_id === "todos" ? null : form.sector_id,
    }).select().single();
    if (error || !nueva) { toast.error("Error al crear auditoría"); setSaving(false); return; }

    const items = eqs.map((e: any) => ({ auditoria_id: nueva.id, equipo_id: e.id }));
    await supabase.from("auditoria_items").insert(items);
    toast.success(`Auditoría creada con ${items.length} equipos`);
    setOpen(false);
    setForm({ nombre: "", responsable: "", filial_id: "todas", sector_id: "todos" });
    cargar();
  };

  const colorEstado = (e: string) =>
    e === "Finalizada" ? "bg-success/15 text-success border-success/30"
    : e === "Cancelada" ? "bg-muted text-muted-foreground"
    : "bg-warning/15 text-warning border-warning/30";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Modo auditoría</h1>
          <p className="text-sm text-muted-foreground mt-1">Verificación física de equipos por filial o sector</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1.5" />Nueva auditoría</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva auditoría física</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Auditoría trimestral Q2 2026" />
              </div>
              <div>
                <Label>Responsable</Label>
                <Input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre del coordinador" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Filial</Label>
                  <Select value={form.filial_id} onValueChange={v => setForm({ ...form, filial_id: v, sector_id: "todos" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las filiales</SelectItem>
                      {filiales.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sector</Label>
                  <Select value={form.sector_id} onValueChange={v => setForm({ ...form, sector_id: v })} disabled={form.filial_id === "todas"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los sectores</SelectItem>
                      {sectoresFiltrados.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={crear} disabled={saving}>{saving ? "Creando..." : "Crear y comenzar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Skeleton className="h-64" /> : auditorias.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold">Sin auditorías registradas</h3>
          <p className="text-sm text-muted-foreground mt-1">Creá tu primera auditoría para comenzar a verificar equipos.</p>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {auditorias.map(a => (
            <Link key={a.id} to={`/auditorias/${a.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{a.nombre}</h3>
                    <Badge variant="outline" className={colorEstado(a.estado)}>{a.estado}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" />{a.filial_id ? filialMap[a.filial_id] : "Todas las filiales"}{a.sector_id ? ` · ${sectorMap[a.sector_id]}` : ""}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatearFecha(a.fecha_inicio)}{a.fecha_fin ? ` → ${formatearFecha(a.fecha_fin)}` : ""}</div>
                    {a.responsable && <div>Responsable: {a.responsable}</div>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
