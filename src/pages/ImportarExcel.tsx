import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO, prefijoTipo, type TipoEquipo, type EstadoEquipo } from "@/lib/inventario";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet } from "lucide-react";

type Row = Record<string, any>;

export default function ImportarExcel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [errores, setErrores] = useState<string[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; fail: number } | null>(null);

  const handleFile = async (file: File) => {
    setResultado(null); setErrores([]);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sh = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Row>(sh, { defval: "" });
    setRows(data);
    const errs: string[] = [];
    data.forEach((r, i) => {
      if (!r.tipo_equipo || !TIPOS_EQUIPO.includes(r.tipo_equipo)) errs.push(`Fila ${i + 2}: tipo_equipo inválido`);
      if (r.estado && !ESTADOS_EQUIPO.includes(r.estado)) errs.push(`Fila ${i + 2}: estado inválido`);
    });
    setErrores(errs);
  };

  const descargarPlantilla = () => {
    const ejemplo = [{
      tipo_equipo: "PC", marca: "Dell", modelo: "Optiplex 7090", numero_serie: "SN12345",
      codigo_filial: "SUC01", sector: "Administración", usuario_asignado: "Juan Pérez",
      estado: "Activo", hostname: "PC-001", sistema_operativo: "Windows 11",
      procesador: "i5-11500", ram_gb: 8, almacenamiento_gb: 256,
      observaciones: "",
    }];
    const ws = XLSX.utils.json_to_sheet(ejemplo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Equipos");
    XLSX.writeFile(wb, "plantilla_equipos.xlsx");
  };

  const importar = async () => {
    if (errores.length > 0) { toast.error("Corregí los errores antes de importar"); return; }
    setImportando(true);
    const [{ data: filiales }, { data: sectores }] = await Promise.all([
      supabase.from("filiales").select("id, codigo_filial"),
      supabase.from("sectores").select("id, nombre, filial_id"),
    ]);
    let ok = 0, fail = 0; const errs: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const filial = filiales?.find(f => f.codigo_filial === r.codigo_filial);
      const sector = filial ? sectores?.find(s => s.filial_id === filial.id && s.nombre === r.sector) : null;
      // generar código si falta
      let codigo = r.codigo_inventario;
      if (!codigo) {
        const { count } = await supabase.from("equipos").select("*", { count: "exact", head: true })
          .eq("tipo_equipo", r.tipo_equipo).eq("filial_id", filial?.id ?? "");
        codigo = `${prefijoTipo[r.tipo_equipo as TipoEquipo]}-${String((count ?? 0) + 1).padStart(3, "0")}-${filial?.codigo_filial ?? "XXX"}`;
      }
      const payload: any = {
        codigo_inventario: codigo,
        tipo_equipo: r.tipo_equipo,
        marca: r.marca || null, modelo: r.modelo || null,
        numero_serie: r.numero_serie || null, numero_imei: r.numero_imei || null,
        filial_id: filial?.id ?? null, sector_id: sector?.id ?? null,
        usuario_asignado: r.usuario_asignado || null,
        estado: (r.estado || "Activo") as EstadoEquipo,
        hostname: r.hostname || null, sistema_operativo: r.sistema_operativo || null,
        procesador: r.procesador || null,
        ram_gb: r.ram_gb ? parseInt(String(r.ram_gb)) : null,
        almacenamiento_gb: r.almacenamiento_gb ? parseInt(String(r.almacenamiento_gb)) : null,
        observaciones: r.observaciones || null,
      };
      const res = await supabase.from("equipos").insert(payload);
      if (res.error) { fail++; errs.push(`Fila ${i + 2}: ${res.error.message}`); }
      else ok++;
    }
    setImportando(false);
    setResultado({ ok, fail });
    setErrores(errs);
    if (ok > 0) toast.success(`✅ ${ok} equipos importados`);
    if (fail > 0) toast.error(`❌ ${fail} equipos con error`);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Importar desde Excel</h1>
        <p className="text-sm text-muted-foreground mt-1">Cargá masivamente equipos desde una planilla.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Descargar plantilla</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={descargarPlantilla}><Download className="h-4 w-4 mr-1.5" />Descargar plantilla .xlsx</Button>
          <p className="text-xs text-muted-foreground mt-2">Columnas requeridas: tipo_equipo, codigo_filial, sector, marca, modelo, numero_serie, estado, hostname, sistema_operativo, procesador, ram_gb, almacenamiento_gb, usuario_asignado, observaciones.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">2. Subir archivo</CardTitle></CardHeader>
        <CardContent>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Vista previa ({rows.length} filas)</CardTitle>
          </CardHeader>
          <CardContent>
            {errores.length > 0 && (
              <div className="mb-4 p-3 rounded border border-destructive/40 bg-destructive/10 text-sm">
                <div className="font-medium text-destructive mb-1">{errores.length} error(es) detectado(s):</div>
                <ul className="text-xs list-disc list-inside max-h-32 overflow-y-auto">{errores.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            <div className="overflow-x-auto max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>{Object.keys(rows[0]).map(k => <TableHead key={k}>{k}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 20).map((r, i) => (
                    <TableRow key={i}>{Object.keys(rows[0]).map(k => <TableCell key={k} className="text-xs">{String(r[k] ?? "")}</TableCell>)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={importar} disabled={importando || errores.length > 0}>
                <Upload className="h-4 w-4 mr-1.5" />{importando ? "Importando..." : `Importar ${rows.length} equipos`}
              </Button>
            </div>
            {resultado && (
              <div className="mt-4 p-3 rounded border bg-muted/30 text-sm">
                ✅ {resultado.ok} importados correctamente · ❌ {resultado.fail} con error
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
