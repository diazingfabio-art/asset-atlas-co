import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoBadge } from "@/components/EstadoBadge";
import { iconoTipo, labelTipo, formatearFecha, formatearMoneda, estadoGarantia, type EstadoEquipo, type TipoEquipo } from "@/lib/inventario";
import { ArrowLeft, Pencil, Printer, Trash2, History, Wrench } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MovimientoDialog } from "@/components/MovimientoDialog";
import { MantenimientoDialog } from "@/components/MantenimientoDialog";
import { toast } from "sonner";

type Equipo = any;

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [filial, setFilial] = useState<any>(null);
  const [sector, setSector] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: eq } = await supabase.from("equipos").select("*").eq("id", id!).maybeSingle();
      if (!eq) { setLoading(false); return; }
      setEquipo(eq);
      const [fi, se, mv, mt] = await Promise.all([
        eq.filial_id ? supabase.from("filiales").select("*").eq("id", eq.filial_id).maybeSingle() : Promise.resolve({ data: null }),
        eq.sector_id ? supabase.from("sectores").select("*").eq("id", eq.sector_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("movimientos").select("*").eq("equipo_id", id!).order("fecha", { ascending: false }),
        supabase.from("mantenimientos").select("*").eq("equipo_id", id!).order("fecha", { ascending: false }),
      ]);
      setFilial(fi.data); setSector(se.data);
      setMovimientos((mv as any).data ?? []);
      setMantenimientos((mt as any).data ?? []);
      setLoading(false);
    })();
  }, [id]);

  const eliminar = async () => {
    const res = await supabase.from("equipos").delete().eq("id", id!);
    if (res.error) { toast.error("Error: " + res.error.message); return; }
    toast.success("Equipo eliminado");
    navigate("/equipos");
  };

  if (loading) return <Skeleton className="h-96" />;
  if (!equipo) return <div className="text-center py-10">Equipo no encontrado. <Link to="/equipos" className="text-primary underline">Volver</Link></div>;

  const Icono = iconoTipo[equipo.tipo_equipo as TipoEquipo];
  const g = estadoGarantia(equipo.garantia_hasta);

  const Campo = ({ label, value }: { label: string; value: any }) => (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-medium break-words">{value || <span className="text-muted-foreground italic font-normal">—</span>}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-mono">{equipo.codigo_inventario}</h1>
          <p className="text-sm text-muted-foreground">{equipo.marca} {equipo.modelo}</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Imprimir</Button>
        <Button asChild><Link to={`/equipos/${id}/editar`}><Pencil className="h-4 w-4 mr-1.5" />Editar</Link></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción no se puede deshacer. Se borrarán también los movimientos y mantenimientos asociados.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={eliminar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Icono className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{equipo.marca} {equipo.modelo}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted">{labelTipo[equipo.tipo_equipo as TipoEquipo]}</span>
                  <EstadoBadge estado={equipo.estado as EstadoEquipo} />
                  <span className={`text-xs font-medium ${g.tone === "destructive" ? "text-destructive" : g.tone === "warning" ? "text-warning" : g.tone === "success" ? "text-success" : "text-muted-foreground"}`}>Garantía: {g.label}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
            <Campo label="Número de serie" value={equipo.numero_serie} />
            {equipo.tipo_equipo === "Celular" && <Campo label="IMEI" value={equipo.numero_imei} />}
            <Campo label="Filial" value={filial?.nombre} />
            <Campo label="Sector" value={sector?.nombre} />
            <Campo label="Usuario asignado" value={equipo.usuario_asignado} />
            <Campo label="Fecha de adquisición" value={formatearFecha(equipo.fecha_adquisicion)} />
            <Campo label="Valor de compra" value={formatearMoneda(equipo.valor_compra)} />
            <Campo label="Proveedor" value={equipo.proveedor} />
            <Campo label="N° Factura" value={equipo.numero_factura} />
            <Campo label="Garantía hasta" value={formatearFecha(equipo.garantia_hasta)} />
            {equipo.sistema_operativo && <Campo label="Sistema operativo" value={equipo.sistema_operativo} />}
            {equipo.procesador && <Campo label="Procesador" value={equipo.procesador} />}
            {equipo.ram_gb && <Campo label="RAM" value={`${equipo.ram_gb} GB`} />}
            {equipo.almacenamiento_gb && <Campo label="Almacenamiento" value={`${equipo.almacenamiento_gb} GB`} />}
            {equipo.ip_asignada && <Campo label="IP asignada" value={equipo.ip_asignada} />}
            {equipo.mac_address && <Campo label="MAC" value={equipo.mac_address} />}
            {equipo.observaciones && <div className="sm:col-span-2"><Campo label="Observaciones" value={equipo.observaciones} /></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Etiqueta QR</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <div className="bg-white p-3 rounded border">
              <QRCodeSVG value={equipo.codigo_inventario} size={160} />
            </div>
            <div className="font-mono text-sm font-semibold">{equipo.codigo_inventario}</div>
            <p className="text-xs text-muted-foreground text-center">Imprimí esta etiqueta y pegala en el equipo físico.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de movimientos</CardTitle></CardHeader>
        <CardContent>
          {movimientos.length === 0 ? <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p> : (
            <ol className="relative border-l-2 border-border ml-2 space-y-4">
              {movimientos.map(m => (
                <li key={m.id} className="ml-5">
                  <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  <div className="text-xs text-muted-foreground">{formatearFecha(m.fecha)}</div>
                  <div className="font-medium text-sm mt-0.5">{m.tipo_movimiento}</div>
                  {m.usuario_destino && <div className="text-xs text-muted-foreground">Asignado a: {m.usuario_destino}</div>}
                  {m.observaciones && <div className="text-xs mt-1">{m.observaciones}</div>}
                  {m.responsable && <div className="text-xs text-muted-foreground mt-1">Responsable: {m.responsable}</div>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Mantenimientos</CardTitle></CardHeader>
        <CardContent>
          {mantenimientos.length === 0 ? <p className="text-sm text-muted-foreground">Sin registros de mantenimiento.</p> : (
            <div className="divide-y">
              {mantenimientos.map(m => (
                <div key={m.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{m.tipo} · {formatearFecha(m.fecha)}</div>
                    <div className="text-xs text-muted-foreground">{m.descripcion}</div>
                    {m.tecnico && <div className="text-xs text-muted-foreground">Técnico: {m.tecnico}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs px-2 py-0.5 rounded bg-muted inline-block">{m.estado}</div>
                    {m.costo && <div className="text-xs text-muted-foreground mt-1">{formatearMoneda(m.costo)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
