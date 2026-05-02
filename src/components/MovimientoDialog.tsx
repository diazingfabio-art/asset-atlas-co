import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_MOVIMIENTO } from "@/lib/inventario";
import { toast } from "sonner";

type Equipo = { id: string; codigo_inventario: string; marca: string | null; modelo: string | null; filial_id: string | null; sector_id: string | null; usuario_asignado: string | null; estado: string };
type Filial = { id: string; nombre: string };
type Sector = { id: string; nombre: string; filial_id: string };

interface Props {
  trigger: React.ReactNode;
  equipoPreseleccionado?: Equipo;
  onSaved?: () => void;
}

export function MovimientoDialog({ trigger, equipoPreseleccionado, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [saving, setSaving] = useState(false);

  const [equipoId, setEquipoId] = useState<string>(equipoPreseleccionado?.id ?? "");
  const [tipo, setTipo] = useState<string>("Reasignacion");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [filialDest, setFilialDest] = useState<string>("");
  const [sectorDest, setSectorDest] = useState<string>("");
  const [usuarioDest, setUsuarioDest] = useState("");
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [eq, fi, se] = await Promise.all([
        equipoPreseleccionado
          ? Promise.resolve({ data: [equipoPreseleccionado] })
          : supabase.from("equipos").select("id,codigo_inventario,marca,modelo,filial_id,sector_id,usuario_asignado,estado").order("codigo_inventario"),
        supabase.from("filiales").select("id,nombre").order("nombre"),
        supabase.from("sectores").select("id,nombre,filial_id").order("nombre"),
      ]);
      setEquipos((eq.data as any) ?? []);
      setFiliales((fi.data as any) ?? []);
      setSectores((se.data as any) ?? []);
    })();
  }, [open, equipoPreseleccionado]);

  const equipoSel = equipos.find(e => e.id === equipoId);
  const sectoresFiliados = filialDest ? sectores.filter(s => s.filial_id === filialDest) : [];

  const guardar = async () => {
    if (!equipoId || !tipo) { toast.error("Seleccioná equipo y tipo de movimiento"); return; }
    setSaving(true);
    try {
      const payload = {
        equipo_id: equipoId,
        tipo_movimiento: tipo as any,
        fecha,
        filial_origen: equipoSel?.filial_id ?? null,
        sector_origen: equipoSel?.sector_id ?? null,
        usuario_origen: equipoSel?.usuario_asignado ?? null,
        filial_destino: filialDest || null,
        sector_destino: sectorDest || null,
        usuario_destino: usuarioDest || null,
        responsable: responsable || null,
        observaciones: observaciones || null,
      };
      const { error: errMov } = await supabase.from("movimientos").insert(payload);
      if (errMov) throw errMov;

      // Actualizar equipo según tipo de movimiento
      const updates: any = {};
      if (tipo === "Asignacion" || tipo === "Reasignacion" || tipo === "Traslado entre filiales" || tipo === "Ingreso") {
        if (filialDest) updates.filial_id = filialDest;
        if (sectorDest) updates.sector_id = sectorDest;
        if (usuarioDest) updates.usuario_asignado = usuarioDest;
        updates.estado = "Activo";
      } else if (tipo === "Reparacion") {
        updates.estado = "En reparacion";
      } else if (tipo === "Baja") {
        updates.estado = "De baja";
        updates.usuario_asignado = null;
      }
      if (Object.keys(updates).length > 0) {
        const { error: errEq } = await supabase.from("equipos").update(updates).eq("id", equipoId);
        if (errEq) throw errEq;
      }

      toast.success("Movimiento registrado");
      setOpen(false);
      // reset
      if (!equipoPreseleccionado) setEquipoId("");
      setFilialDest(""); setSectorDest(""); setUsuarioDest(""); setResponsable(""); setObservaciones("");
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>Asignaciones, traslados, reparaciones o bajas. Quedará registrado en el historial del equipo.</DialogDescription>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de movimiento *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_MOVIMIENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>

          {tipo !== "Baja" && tipo !== "Reparacion" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Filial destino</Label>
                  <Select value={filialDest} onValueChange={(v) => { setFilialDest(v); setSectorDest(""); }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{filiales.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sector destino</Label>
                  <Select value={sectorDest} onValueChange={setSectorDest} disabled={!filialDest}>
                    <SelectTrigger><SelectValue placeholder={filialDest ? "Seleccionar" : "Elegí filial"} /></SelectTrigger>
                    <SelectContent>{sectoresFiliados.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Usuario asignado destino</Label>
                <Input value={usuarioDest} onChange={e => setUsuarioDest(e.target.value)} placeholder="Nombre completo" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Responsable del movimiento</Label>
            <Input value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Quién autoriza/realiza" />
          </div>
          <div className="space-y-1.5">
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} />
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
