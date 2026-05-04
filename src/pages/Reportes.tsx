import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ESTADOS_EQUIPO, TIPOS_EQUIPO, formatearFecha, formatearMoneda, labelTipo, type EstadoEquipo, type TipoEquipo } from "@/lib/inventario";
import { Printer, FileSpreadsheet, FileText, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

type Equipo = any;
type Filial = { id: string; nombre: string; codigo_filial: string; ciudad: string | null };
type Sector = { id: string; nombre: string; filial_id: string };

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);

  // Filtros comunes
  const [fFilial, setFFilial] = useState("todas");
  const [fSector, setFSector] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");
  const [fEstado, setFEstado] = useState("todos");
  const [anio, setAnio] = useState("todos");
  const [usuario, setUsuario] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [eq, fi, se] = await Promise.all([
        supabase.from("equipos").select("*").order("codigo_inventario"),
        supabase.from("filiales").select("*").order("nombre"),
        supabase.from("sectores").select("*").order("nombre"),
      ]);
      setEquipos((eq.data as any) ?? []);
      setFiliales((fi.data as any) ?? []);
      setSectores((se.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const filiNombre = (id: string | null) => filiales.find(f => f.id === id)?.nombre ?? "—";
  const sectNombre = (id: string | null) => sectores.find(s => s.id === id)?.nombre ?? "—";
  const sectoresFiltrados = fFilial === "todas" ? sectores : sectores.filter(s => s.filial_id === fFilial);

  const anios = useMemo(() => {
    const set = new Set<string>();
    equipos.forEach(e => { if (e.fecha_adquisicion) set.add(e.fecha_adquisicion.slice(0, 4)); });
    return Array.from(set).sort().reverse();
  }, [equipos]);

  const filtrados = useMemo(() => {
    return equipos.filter(e => {
      if (fFilial !== "todas" && e.filial_id !== fFilial) return false;
      if (fSector !== "todos" && e.sector_id !== fSector) return false;
      if (fTipo !== "todos" && e.tipo_equipo !== fTipo) return false;
      if (fEstado !== "todos" && e.estado !== fEstado) return false;
      if (anio !== "todos" && (!e.fecha_adquisicion || e.fecha_adquisicion.slice(0, 4) !== anio)) return false;
      if (usuario.trim() && !e.usuario_asignado?.toLowerCase().includes(usuario.toLowerCase().trim())) return false;
      return true;
    });
  }, [equipos, fFilial, fSector, fTipo, fEstado, anio, usuario]);

  const totales = useMemo(() => {
    const valorTotal = filtrados.reduce((s, e) => s + (e.valor_compra ?? 0), 0);
    const porTipo: Record<string, number> = {};
    const porEstado: Record<string, number> = {};
    const porFilial: Record<string, number> = {};
    filtrados.forEach(e => {
      porTipo[e.tipo_equipo] = (porTipo[e.tipo_equipo] ?? 0) + 1;
      porEstado[e.estado] = (porEstado[e.estado] ?? 0) + 1;
      const f = filiNombre(e.filial_id);
      porFilial[f] = (porFilial[f] ?? 0) + 1;
    });
    return { valorTotal, porTipo, porEstado, porFilial, total: filtrados.length };
  }, [filtrados, filiales]);

  const limpiar = () => { setFFilial("todas"); setFSector("todos"); setFTipo("todos"); setFEstado("todos"); setAnio("todos"); setUsuario(""); };

  const exportarExcel = () => {
    if (filtrados.length === 0) { toast.error("No hay datos para exportar"); return; }
    const rows = filtrados.map(e => ({
      "Código Inventario": e.codigo_inventario,
      "Tipo": labelTipo[e.tipo_equipo as TipoEquipo],
      "Marca": e.marca ?? "",
      "Modelo": e.modelo ?? "",
      "N° Serie": e.numero_serie ?? "",
      "IMEI": e.numero_imei ?? "",
      "Filial": filiNombre(e.filial_id),
      "Sector": sectNombre(e.sector_id),
      "Usuario asignado": e.usuario_asignado ?? "",
      "Estado": e.estado,
      "Fecha adquisición": e.fecha_adquisicion ?? "",
      "Valor compra (ARS)": e.valor_compra ?? "",
      "Proveedor": e.proveedor ?? "",
      "N° Factura": e.numero_factura ?? "",
      "Garantía hasta": e.garantia_hasta ?? "",
      "S.O.": e.sistema_operativo ?? "",
      "Procesador": e.procesador ?? "",
      "RAM (GB)": e.ram_gb ?? "",
      "Almacenamiento (GB)": e.almacenamiento_gb ?? "",
      "IP": e.ip_asignada ?? "",
      "MAC": e.mac_address ?? "",
      "Observaciones": e.observaciones ?? "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0]).map(k => ({ wch: Math.max(12, k.length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `InventarioTI_${fecha}.xlsx`);
    toast.success(`Exportados ${rows.length} equipos`);
  };

  const exportarCSV = () => {
    if (filtrados.length === 0) { toast.error("No hay datos para exportar"); return; }
    const headers = ["Código","Tipo","Marca","Modelo","N° Serie","Filial","Sector","Usuario","Estado","Fecha adq.","Valor compra"];
    const lineas = filtrados.map(e => [
      e.codigo_inventario, labelTipo[e.tipo_equipo as TipoEquipo], e.marca ?? "", e.modelo ?? "", e.numero_serie ?? "",
      filiNombre(e.filial_id), sectNombre(e.sector_id), e.usuario_asignado ?? "", e.estado,
      e.fecha_adquisicion ?? "", e.valor_compra ?? ""
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...lineas].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `InventarioTI_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    if (filtrados.length === 0) { toast.error("No hay datos para exportar"); return; }
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const fechaStr = new Date().toLocaleString("es-AR");
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("InventarioTI — Reporte de Activos Tecnológicos", 14, 15);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Coordinación de Informática · Documento para auditoría`, 14, 21);
    doc.text(`Emitido: ${fechaStr}`, 14, 26);
    doc.text(`Filial: ${fFilial === "todas" ? "Todas" : filiNombre(fFilial)}  |  Sector: ${fSector === "todos" ? "Todos" : sectNombre(fSector)}  |  Tipo: ${fTipo === "todos" ? "Todos" : labelTipo[fTipo as TipoEquipo]}  |  Estado: ${fEstado === "todos" ? "Todos" : fEstado}  |  Año: ${anio === "todos" ? "Todos" : anio}  |  Usuario: ${usuario || "—"}`, 14, 31);

    autoTable(doc, {
      startY: 36,
      head: [["Código", "Tipo", "Marca/Modelo", "N° Serie", "Filial", "Sector", "Usuario", "Estado", "Adquisición", "Valor"]],
      body: filtrados.map(e => [
        e.codigo_inventario, labelTipo[e.tipo_equipo as TipoEquipo],
        `${e.marca ?? ""} ${e.modelo ?? ""}`.trim(), e.numero_serie ?? "—",
        filiNombre(e.filial_id), sectNombre(e.sector_id),
        e.usuario_asignado ?? "Sin asignar", e.estado,
        formatearFecha(e.fecha_adquisicion), e.valor_compra ? formatearMoneda(e.valor_compra) : "—",
      ]),
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 8);
      },
    });

    // Resumen al final
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Resumen: ${totales.total} equipos · Valor total: ${formatearMoneda(totales.valorTotal)}`, 14, finalY);

    doc.save(`InventarioTI_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success(`PDF generado con ${filtrados.length} equipos`);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground mt-1">Generá reportes filtrados, listos para imprimir o exportar para auditoría</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarCSV}><FileText className="h-4 w-4 mr-1.5" />CSV</Button>
          <Button variant="outline" onClick={exportarExcel}><FileSpreadsheet className="h-4 w-4 mr-1.5" />Excel</Button>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Imprimir / PDF</Button>
        </div>
      </div>

      <Card className="no-print p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Filial</Label>
            <Select value={fFilial} onValueChange={(v) => { setFFilial(v); setFSector("todos"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todas">Todas</SelectItem>{filiales.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sector</Label>
            <Select value={fSector} onValueChange={setFSector}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{sectoresFiltrados.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de equipo</Label>
            <Select value={fTipo} onValueChange={setFTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{TIPOS_EQUIPO.map(t => <SelectItem key={t} value={t}>{labelTipo[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estado</Label>
            <Select value={fEstado} onValueChange={setFEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{ESTADOS_EQUIPO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Año de adquisición</Label>
            <Select value={anio} onValueChange={setAnio}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{anios.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs">Usuario asignado</Label>
            <Input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Nombre del usuario..." />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={limpiar} className="w-full">Limpiar filtros</Button>
          </div>
        </div>
      </Card>

      {/* === ÁREA IMPRIMIBLE === */}
      <div ref={printRef} className="print-area space-y-4">
        {/* Encabezado de auditoría */}
        <div className="hidden print:block border-b-2 border-primary pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">InventarioTI — Reporte de Activos Tecnológicos</h1>
              <p className="text-sm text-muted-foreground">Coordinación de Informática · Documento para auditoría</p>
            </div>
            <div className="text-right text-xs">
              <div><strong>Emitido:</strong> {new Date().toLocaleString("es-AR")}</div>
              <div><strong>Total registros:</strong> {totales.total}</div>
            </div>
          </div>
          <div className="mt-2 text-xs grid grid-cols-3 gap-4">
            <div><strong>Filial:</strong> {fFilial === "todas" ? "Todas" : filiNombre(fFilial)}</div>
            <div><strong>Sector:</strong> {fSector === "todos" ? "Todos" : sectNombre(fSector)}</div>
            <div><strong>Tipo:</strong> {fTipo === "todos" ? "Todos" : labelTipo[fTipo as TipoEquipo]}</div>
            <div><strong>Estado:</strong> {fEstado === "todos" ? "Todos" : fEstado}</div>
            <div><strong>Año adq.:</strong> {anio === "todos" ? "Todos" : anio}</div>
            <div><strong>Usuario:</strong> {usuario || "—"}</div>
          </div>
        </div>

        {/* Resumen */}
        <Tabs defaultValue="resumen" className="no-print">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="detalle">Detalle ({totales.total})</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4 pt-4">
            <ResumenCards totales={totales} />
          </TabsContent>

          <TabsContent value="detalle" className="pt-4">
            <DetalleTabla items={filtrados} filiNombre={filiNombre} sectNombre={sectNombre} />
          </TabsContent>
        </Tabs>

        {/* Versión imprimible: muestra resumen + detalle SIEMPRE */}
        <div className="hidden print:block space-y-4">
          <ResumenCards totales={totales} />
          <h2 className="text-lg font-bold mt-6 border-b pb-1">Detalle de equipos</h2>
          <DetalleTabla items={filtrados} filiNombre={filiNombre} sectNombre={sectNombre} />
          <div className="mt-10 grid grid-cols-2 gap-12 text-xs">
            <div className="border-t pt-2 text-center">Firma Coordinador de Informática</div>
            <div className="border-t pt-2 text-center">Firma Auditor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumenCards({ totales }: { totales: any }) {
  const Bloque = ({ titulo, items }: { titulo: string; items: [string, number][] }) => (
    <Card><CardContent className="p-4">
      <h3 className="text-sm font-semibold mb-3">{titulo}</h3>
      <div className="space-y-1.5">
        {items.length === 0 ? <p className="text-xs text-muted-foreground">Sin datos</p> :
          items.map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm border-b border-border/50 pb-1 last:border-0">
              <span>{k}</span><span className="font-medium font-mono">{v}</span>
            </div>
          ))}
      </div>
    </CardContent></Card>
  );
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total equipos</div><div className="text-3xl font-bold">{totales.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Valor total inventario</div><div className="text-2xl font-bold">{formatearMoneda(totales.valorTotal)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tipos distintos</div><div className="text-3xl font-bold">{Object.keys(totales.porTipo).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Filiales con equipos</div><div className="text-3xl font-bold">{Object.keys(totales.porFilial).length}</div></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <Bloque titulo="Por tipo de equipo" items={Object.entries(totales.porTipo).sort((a:any,b:any)=>b[1]-a[1]) as any} />
        <Bloque titulo="Por estado" items={Object.entries(totales.porEstado).sort((a:any,b:any)=>b[1]-a[1]) as any} />
        <Bloque titulo="Por filial" items={Object.entries(totales.porFilial).sort((a:any,b:any)=>b[1]-a[1]) as any} />
      </div>
    </>
  );
}

function DetalleTabla({ items, filiNombre, sectNombre }: any) {
  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-xs print:text-[10px]">
        <thead className="bg-muted">
          <tr className="text-left">
            <th className="p-2">Código</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Marca / Modelo</th>
            <th className="p-2">N° Serie</th>
            <th className="p-2">Filial / Sector</th>
            <th className="p-2">Usuario</th>
            <th className="p-2">Estado</th>
            <th className="p-2 text-right">Adquisición</th>
            <th className="p-2 text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Sin equipos que coincidan con los filtros.</td></tr>
          ) : items.map((e: any) => (
            <tr key={e.id} className="border-t hover:bg-muted/30">
              <td className="p-2 font-mono">{e.codigo_inventario}</td>
              <td className="p-2">{labelTipo[e.tipo_equipo as TipoEquipo]}</td>
              <td className="p-2">{e.marca} {e.modelo}</td>
              <td className="p-2 font-mono">{e.numero_serie ?? "—"}</td>
              <td className="p-2">{filiNombre(e.filial_id)}<br/><span className="text-muted-foreground">{sectNombre(e.sector_id)}</span></td>
              <td className="p-2">{e.usuario_asignado ?? <span className="text-muted-foreground italic">Sin asignar</span>}</td>
              <td className="p-2">{e.estado}</td>
              <td className="p-2 text-right whitespace-nowrap">{formatearFecha(e.fecha_adquisicion)}</td>
              <td className="p-2 text-right whitespace-nowrap">{e.valor_compra ? formatearMoneda(e.valor_compra) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
