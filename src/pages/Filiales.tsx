import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building2, Plus, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Filial = { id: string; nombre: string; ciudad: string | null; pais: string | null; codigo_filial: string };
type Sector = { id: string; nombre: string; filial_id: string };

export default function Filiales() {
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [conteoEquipos, setConteoEquipos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [filDialog, setFilDialog] = useState<{ open: boolean; data: Partial<Filial> }>({ open: false, data: {} });
  const [secDialog, setSecDialog] = useState<{ open: boolean; data: Partial<Sector> }>({ open: false, data: {} });

  const cargar = async () => {
    const [fi, se, eq] = await Promise.all([
      supabase.from("filiales").select("*").order("nombre"),
      supabase.from("sectores").select("*").order("nombre"),
      supabase.from("equipos").select("sector_id"),
    ]);
    setFiliales((fi.data as any) ?? []);
    setSectores((se.data as any) ?? []);
    const cnt: Record<string, number> = {};
    ((eq.data as any) ?? []).forEach((e: any) => { if (e.sector_id) cnt[e.sector_id] = (cnt[e.sector_id] ?? 0) + 1; });
    setConteoEquipos(cnt);
    setLoading(false);
  };
  useEffect(() => { cargar(); }, []);

  const guardarFilial = async () => {
    const d = filDialog.data;
    if (!d.nombre || !d.codigo_filial) { toast.error("Nombre y código son obligatorios"); return; }
    const payload = { nombre: d.nombre, ciudad: d.ciudad ?? null, pais: d.pais ?? null, codigo_filial: d.codigo_filial };
    const res = d.id
      ? await supabase.from("filiales").update(payload).eq("id", d.id)
      : await supabase.from("filiales").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(d.id ? "Filial actualizada" : "Filial creada");
    setFilDialog({ open: false, data: {} });
    cargar();
  };

  const eliminarFilial = async (id: string) => {
    const res = await supabase.from("filiales").delete().eq("id", id);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Filial eliminada"); cargar();
  };

  const guardarSector = async () => {
    const d = secDialog.data;
    if (!d.nombre || !d.filial_id) { toast.error("Nombre y filial son obligatorios"); return; }
    const payload = { nombre: d.nombre, filial_id: d.filial_id };
    const res = d.id
      ? await supabase.from("sectores").update(payload).eq("id", d.id)
      : await supabase.from("sectores").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(d.id ? "Sector actualizado" : "Sector creado");
    setSecDialog({ open: false, data: {} });
    cargar();
  };

  const eliminarSector = async (id: string) => {
    const res = await supabase.from("sectores").delete().eq("id", id);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Sector eliminado"); cargar();
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Filiales y sectores</h1>
          <p className="text-sm text-muted-foreground mt-1">{filiales.length} filiales · {sectores.length} sectores</p>
        </div>
        <Dialog open={filDialog.open} onOpenChange={o => setFilDialog({ open: o, data: o ? filDialog.data : {} })}>
          <DialogTrigger asChild><Button onClick={() => setFilDialog({ open: true, data: {} })}><Plus className="h-4 w-4 mr-1.5" />Nueva filial</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{filDialog.data.id ? "Editar filial" : "Nueva filial"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input value={filDialog.data.nombre ?? ""} onChange={e => setFilDialog(f => ({ ...f, data: { ...f.data, nombre: e.target.value } }))} /></div>
              <div><Label>Código de filial *</Label><Input value={filDialog.data.codigo_filial ?? ""} onChange={e => setFilDialog(f => ({ ...f, data: { ...f.data, codigo_filial: e.target.value } }))} className="font-mono" placeholder="CM01" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ciudad</Label><Input value={filDialog.data.ciudad ?? ""} onChange={e => setFilDialog(f => ({ ...f, data: { ...f.data, ciudad: e.target.value } }))} /></div>
                <div><Label>País</Label><Input value={filDialog.data.pais ?? ""} onChange={e => setFilDialog(f => ({ ...f, data: { ...f.data, pais: e.target.value } }))} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setFilDialog({ open: false, data: {} })}>Cancelar</Button><Button onClick={guardarFilial}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filiales.map(f => {
          const secsFil = sectores.filter(s => s.filial_id === f.id);
          const totalEquipos = secsFil.reduce((acc, s) => acc + (conteoEquipos[s.id] ?? 0), 0);
          return (
            <Card key={f.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0"><Building2 className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{f.nombre}</CardTitle>
                      <div className="text-xs text-muted-foreground">{[f.ciudad, f.pais].filter(Boolean).join(", ")} · <span className="font-mono">{f.codigo_filial}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFilDialog({ open: true, data: f })}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar filial?</AlertDialogTitle><AlertDialogDescription>Se eliminarán también todos los sectores asociados ({secsFil.length}). Los equipos quedarán sin filial asignada.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => eliminarFilial(f.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <span><Layers className="h-3 w-3 inline mr-1" />{secsFil.length} sectores</span>
                  <span>{totalEquipos} equipos</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {secsFil.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded hover:bg-muted/50 group">
                    <div className="flex-1 text-sm">{s.nombre}</div>
                    <span className="text-xs text-muted-foreground">{conteoEquipos[s.id] ?? 0} eq.</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSecDialog({ open: true, data: s })}><Pencil className="h-3 w-3" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Eliminar sector?</AlertDialogTitle><AlertDialogDescription>Los equipos asignados a este sector quedarán sin sector.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => eliminarSector(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setSecDialog({ open: true, data: { filial_id: f.id } })}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Agregar sector
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={secDialog.open} onOpenChange={o => setSecDialog({ open: o, data: o ? secDialog.data : {} })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{secDialog.data.id ? "Editar sector" : "Nuevo sector"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Filial</Label>
              <div className="text-sm py-2 px-3 rounded border bg-muted">{filiales.find(f => f.id === secDialog.data.filial_id)?.nombre ?? "—"}</div>
            </div>
            <div><Label>Nombre del sector *</Label><Input value={secDialog.data.nombre ?? ""} onChange={e => setSecDialog(f => ({ ...f, data: { ...f.data, nombre: e.target.value } }))} placeholder="Administración" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSecDialog({ open: false, data: {} })}>Cancelar</Button><Button onClick={guardarSector}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
