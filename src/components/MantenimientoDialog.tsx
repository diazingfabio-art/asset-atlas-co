import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Equipo = { id: string; codigo_inventario: string; marca: string | null; modelo: string | null };

interface Props {
  trigger: React.ReactNode;
  equipoPreseleccionado?: Equipo;
  onSaved?: () => void;
}

export function MantenimientoDialog({ trigger, equipoPreseleccionado, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [saving, setSaving] = useState(false);

  const [equipoId, setEquipoId] = useState(equipoPreseleccionado?.id ?? "");
  const [tipo, setTipo] = useState("Preventivo");
  const [estado, setEstado] = useState("Pendiente");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tecnico, setTecnico] = useState("");
  const [costo, setCosto] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    if (!open || equipoPreseleccionado) return;
    supabase.from("equipos").select("id,codigo_inventario,marca,modelo").order("codigo_inventario")
      .then(({ data }) => setEquipos((data as any) ?? []));
  }, [open, equipoPreseleccionado]);

  const guardar = async () => {
    if (!equipoId) { toast.error("Seleccioná un equipo"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("mantenimientos").insert({
        equipo_id: equipoId,
        tipo: tipo as any,
        estado: estado as any,
        fecha,
        tecnico: tecnico || null,
        costo: costo ? parseFloat(costo) : null,
        descripcion: descripcion || null,
      });
      if (error) throw error;

      // Si está en proceso → poner equipo en reparación
      if (estado === "En proceso" && tipo === "Correctivo") {
        await supabase.from("equipos").update({ estado: "En reparacion" }).eq("id", equipoId);
      }
      // Si se completó → reactivar
      if (estado === "Completado") {
        await supabase.from("equipos").update({ estado: "Activo" }).eq("id", equipoId);
      }

      toast.success("Mantenimiento registrado");
      setOpen(false);
      if (!equipoPreseleccionado) setEquipoId("");
      setTecnico(""); setCosto(""); setDescripcion("");
      onSaved?.();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar mantenimiento</DialogTitle>
          <DialogDescription>Preventivo o correctivo. El estado del equipo se actualiza automáticamente.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {!equipoPreseleccionado && (
            <div className="space-y-1.5">
              <Label>Equipo *</Label>
              <Select value={equipoId} onValueChange={setEquipoId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                <SelectContent>
                  {equipos.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="font-mono text-xs">{e.codigo_inventario}</span> · {e.marca} {e.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventivo">Preventivo</SelectItem>
                  <SelectItem value="Correctivo">Correctivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado *</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En proceso">En proceso</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Técnico</Label>
              <Input value={tecnico} onChange={e => setTecnico(e.target.value)} placeholder="Nombre o empresa" />
            </div>
            <div className="space-y-1.5">
              <Label>Costo (ARS)</Label>
              <Input type="number" value={costo} onChange={e => setCosto(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción del trabajo</Label>
            <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Detalle del mantenimiento, repuestos, diagnóstico..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving}>{saving ? "Guardando..." : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
