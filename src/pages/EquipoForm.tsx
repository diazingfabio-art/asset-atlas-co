import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO, labelTipo, prefijoTipo, requiereImei, requiereSpecsPc, type TipoEquipo, type EstadoEquipo } from "@/lib/inventario";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

type Filial = { id: string; nombre: string; codigo_filial: string };
type Sector = { id: string; nombre: string; filial_id: string };

export default function EquipoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = !!id;
  const [saving, setSaving] = useState(false);
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);

  const [form, setForm] = useState({
    codigo_inventario: "", tipo_equipo: "PC" as TipoEquipo, marca: "", modelo: "",
    numero_serie: "", numero_imei: "", filial_id: "", sector_id: "", usuario_asignado: "",
    estado: "Activo" as EstadoEquipo, fecha_adquisicion: "", valor_compra: "",
    proveedor: "", numero_factura: "", garantia_hasta: "",
    sistema_operativo: "", procesador: "", ram_gb: "", almacenamiento_gb: "",
    ip_asignada: "", mac_address: "", observaciones: "",
    hostname: "", numero_linea: "", operadora: "", cuenta_gmail: "",
    teclado: "", mouse: "", monitor_1: "", monitor_2: "",
  });

  useEffect(() => {
    (async () => {
      const [fi, se] = await Promise.all([
        supabase.from("filiales").select("*").order("nombre"),
        supabase.from("sectores").select("*").order("nombre"),
      ]);
      setFiliales((fi.data as any) ?? []);
      setSectores((se.data as any) ?? []);
      if (editing) {
        const { data } = await supabase.from("equipos").select("*").eq("id", id).maybeSingle();
        if (data) {
          setForm({
            codigo_inventario: data.codigo_inventario ?? "",
            tipo_equipo: data.tipo_equipo, marca: data.marca ?? "", modelo: data.modelo ?? "",
            numero_serie: data.numero_serie ?? "", numero_imei: data.numero_imei ?? "",
            filial_id: data.filial_id ?? "", sector_id: data.sector_id ?? "",
            usuario_asignado: data.usuario_asignado ?? "", estado: data.estado,
            fecha_adquisicion: data.fecha_adquisicion ?? "",
            valor_compra: data.valor_compra?.toString() ?? "",
            proveedor: data.proveedor ?? "", numero_factura: data.numero_factura ?? "",
            garantia_hasta: data.garantia_hasta ?? "",
            sistema_operativo: data.sistema_operativo ?? "", procesador: data.procesador ?? "",
            ram_gb: data.ram_gb?.toString() ?? "", almacenamiento_gb: data.almacenamiento_gb?.toString() ?? "",
            ip_asignada: data.ip_asignada ?? "", mac_address: data.mac_address ?? "",
            observaciones: data.observaciones ?? "",
          });
        }
      }
    })();
  }, [id, editing]);

  // Auto-generar código
  useEffect(() => {
    if (editing) return;
    if (!form.tipo_equipo || !form.filial_id) return;
    const filial = filiales.find(f => f.id === form.filial_id);
    if (!filial) return;
    (async () => {
      const { count } = await supabase.from("equipos").select("*", { count: "exact", head: true }).eq("filial_id", form.filial_id).eq("tipo_equipo", form.tipo_equipo);
      const num = String((count ?? 0) + 1).padStart(3, "0");
      setForm(f => ({ ...f, codigo_inventario: `${prefijoTipo[form.tipo_equipo]}-${num}-${filial.codigo_filial}` }));
    })();
  }, [form.tipo_equipo, form.filial_id, filiales, editing]);

  const sectoresFil = sectores.filter(s => s.filial_id === form.filial_id);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.codigo_inventario || !form.tipo_equipo) {
      toast.error("Faltan campos obligatorios");
      return;
    }
    // Validaciones críticas
    if (form.numero_serie) {
      let q = supabase.from("equipos").select("id").eq("numero_serie", form.numero_serie);
      if (editing) q = q.neq("id", id!);
      const { data: exists } = await q.maybeSingle();
      if (exists) { toast.error(`Ya existe un equipo con número de serie: ${form.numero_serie}`); return; }
    }
    if (requiereImei(form.tipo_equipo) && form.numero_imei && !/^\d{15}$/.test(form.numero_imei)) {
      toast.error("El IMEI debe tener exactamente 15 dígitos numéricos"); return;
    }
    if (form.fecha_adquisicion && new Date(form.fecha_adquisicion) > new Date()) {
      toast.error("La fecha de adquisición no puede ser futura"); return;
    }
    if (form.valor_compra && parseFloat(form.valor_compra) <= 0) {
      toast.error("El valor de compra debe ser mayor a 0"); return;
    }
    if (form.estado === "De baja" && !form.observaciones.trim()) {
      toast.error("Para dar de baja debés indicar el motivo en observaciones"); return;
    }
    setSaving(true);
    const payload: any = {
      codigo_inventario: form.codigo_inventario,
      tipo_equipo: form.tipo_equipo,
      marca: form.marca || null, modelo: form.modelo || null,
      numero_serie: form.numero_serie || null,
      numero_imei: requiereImei(form.tipo_equipo) ? (form.numero_imei || null) : null,
      filial_id: form.filial_id || null, sector_id: form.sector_id || null,
      usuario_asignado: form.usuario_asignado || null, estado: form.estado,
      fecha_adquisicion: form.fecha_adquisicion || null,
      valor_compra: form.valor_compra ? parseFloat(form.valor_compra) : null,
      proveedor: form.proveedor || null, numero_factura: form.numero_factura || null,
      garantia_hasta: form.garantia_hasta || null,
      sistema_operativo: requiereSpecsPc(form.tipo_equipo) ? (form.sistema_operativo || null) : null,
      procesador: requiereSpecsPc(form.tipo_equipo) ? (form.procesador || null) : null,
      ram_gb: requiereSpecsPc(form.tipo_equipo) && form.ram_gb ? parseInt(form.ram_gb) : null,
      almacenamiento_gb: form.almacenamiento_gb ? parseInt(form.almacenamiento_gb) : null,
      ip_asignada: form.ip_asignada || null, mac_address: form.mac_address || null,
      observaciones: form.observaciones || null,
    };
    const res = editing
      ? await supabase.from("equipos").update(payload).eq("id", id!)
      : await supabase.from("equipos").insert(payload);
    setSaving(false);
    if (res.error) { toast.error("Error al guardar: " + res.error.message); return; }
    toast.success(editing ? "Equipo actualizado" : "Equipo creado");
    navigate("/equipos");
  };

  const upd = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const showImei = requiereImei(form.tipo_equipo);
  const showSpecs = requiereSpecsPc(form.tipo_equipo);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{editing ? "Editar equipo" : "Nuevo equipo"}</h1>
          <p className="text-sm text-muted-foreground">{editing ? "Modificá los datos del equipo" : "Registrá un nuevo activo tecnológico"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de equipo *</Label>
              <Select value={form.tipo_equipo} onValueChange={v => upd("tipo_equipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_EQUIPO.map(t => <SelectItem key={t} value={t}>{labelTipo[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado *</Label>
              <Select value={form.estado} onValueChange={v => upd("estado", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS_EQUIPO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.marca} onChange={e => upd("marca", e.target.value)} /></div>
            <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => upd("modelo", e.target.value)} /></div>
            <div><Label>Número de serie</Label><Input value={form.numero_serie} onChange={e => upd("numero_serie", e.target.value)} /></div>
            {showImei && <div><Label>IMEI</Label><Input value={form.numero_imei} onChange={e => upd("numero_imei", e.target.value)} /></div>}
            <div className="sm:col-span-2">
              <Label>Código de inventario *</Label>
              <Input value={form.codigo_inventario} onChange={e => upd("codigo_inventario", e.target.value)} className="font-mono" />
              <p className="text-xs text-muted-foreground mt-1">Se genera automáticamente al elegir tipo y filial.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ubicación y asignación</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Filial</Label>
              <Select value={form.filial_id} onValueChange={v => { upd("filial_id", v); upd("sector_id", ""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar filial" /></SelectTrigger>
                <SelectContent>{filiales.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sector</Label>
              <Select value={form.sector_id} onValueChange={v => upd("sector_id", v)} disabled={!form.filial_id}>
                <SelectTrigger><SelectValue placeholder={form.filial_id ? "Seleccionar sector" : "Seleccioná filial primero"} /></SelectTrigger>
                <SelectContent>{sectoresFil.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Usuario asignado</Label><Input value={form.usuario_asignado} onChange={e => upd("usuario_asignado", e.target.value)} placeholder="Nombre del responsable" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Datos de compra y garantía</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div><Label>Fecha de adquisición</Label><Input type="date" value={form.fecha_adquisicion} onChange={e => upd("fecha_adquisicion", e.target.value)} /></div>
            <div><Label>Valor de compra (ARS)</Label><Input type="number" step="0.01" value={form.valor_compra} onChange={e => upd("valor_compra", e.target.value)} /></div>
            <div><Label>Proveedor</Label><Input value={form.proveedor} onChange={e => upd("proveedor", e.target.value)} /></div>
            <div><Label>N° Factura</Label><Input value={form.numero_factura} onChange={e => upd("numero_factura", e.target.value)} /></div>
            <div><Label>Garantía hasta</Label><Input type="date" value={form.garantia_hasta} onChange={e => upd("garantia_hasta", e.target.value)} /></div>
          </CardContent>
        </Card>

        {showSpecs && (
          <Card>
            <CardHeader><CardTitle className="text-base">Especificaciones técnicas</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div><Label>Sistema operativo</Label><Input value={form.sistema_operativo} onChange={e => upd("sistema_operativo", e.target.value)} /></div>
              <div><Label>Procesador</Label><Input value={form.procesador} onChange={e => upd("procesador", e.target.value)} /></div>
              <div><Label>RAM (GB)</Label><Input type="number" value={form.ram_gb} onChange={e => upd("ram_gb", e.target.value)} /></div>
              <div><Label>Almacenamiento (GB)</Label><Input type="number" value={form.almacenamiento_gb} onChange={e => upd("almacenamiento_gb", e.target.value)} /></div>
              <div><Label>IP asignada</Label><Input value={form.ip_asignada} onChange={e => upd("ip_asignada", e.target.value)} /></div>
              <div><Label>MAC address</Label><Input value={form.mac_address} onChange={e => upd("mac_address", e.target.value)} className="font-mono" /></div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} value={form.observaciones} onChange={e => upd("observaciones", e.target.value)} placeholder="Notas adicionales, condiciones especiales, etc." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-lg border">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-1.5" />{saving ? "Guardando..." : "Guardar equipo"}</Button>
        </div>
      </form>
    </div>
  );
}
