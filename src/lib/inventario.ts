import { Monitor, Laptop, Smartphone, Printer, ScanLine, Server, Tablet, Battery, HardDrive, type LucideIcon } from "lucide-react";

export const TIPOS_EQUIPO = ["PC", "Notebook", "Celular", "Impresora", "Escaner", "Servidor", "Tablet", "UPS", "Otro"] as const;
export const ESTADOS_EQUIPO = ["Activo", "En reparacion", "De baja", "En deposito", "Extraviado"] as const;
export const TIPOS_MOVIMIENTO = ["Asignacion", "Reasignacion", "Reparacion", "Baja", "Ingreso", "Traslado entre filiales"] as const;

export type TipoEquipo = typeof TIPOS_EQUIPO[number];
export type EstadoEquipo = typeof ESTADOS_EQUIPO[number];

export const iconoTipo: Record<TipoEquipo, LucideIcon> = {
  PC: Monitor,
  Notebook: Laptop,
  Celular: Smartphone,
  Impresora: Printer,
  Escaner: ScanLine,
  Servidor: Server,
  Tablet: Tablet,
  UPS: Battery,
  Otro: HardDrive,
};

export const colorEstado: Record<EstadoEquipo, string> = {
  "Activo": "bg-success/15 text-success border-success/30",
  "En reparacion": "bg-warning/15 text-warning border-warning/30",
  "De baja": "bg-destructive/15 text-destructive border-destructive/30",
  "En deposito": "bg-muted text-muted-foreground border-border",
  "Extraviado": "bg-destructive/20 text-destructive border-destructive/40",
};

export const labelEstado: Record<EstadoEquipo, string> = {
  "Activo": "Activo",
  "En reparacion": "En reparación",
  "De baja": "De baja",
  "En deposito": "En depósito",
  "Extraviado": "Extraviado",
};

export const labelTipo: Record<TipoEquipo, string> = {
  PC: "PC",
  Notebook: "Notebook",
  Celular: "Celular",
  Impresora: "Impresora",
  Escaner: "Escáner",
  Servidor: "Servidor",
  Tablet: "Tablet",
  UPS: "UPS",
  Otro: "Otro",
};

export const prefijoTipo: Record<TipoEquipo, string> = {
  PC: "PC", Notebook: "NB", Celular: "CEL", Impresora: "IMP",
  Escaner: "ESC", Servidor: "SRV", Tablet: "TAB", UPS: "UPS", Otro: "OTR",
};

export function formatearMoneda(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor);
}

export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function estadoGarantia(garantiaHasta: string | null | undefined): { label: string; tone: "success" | "warning" | "destructive" | "muted" } {
  if (!garantiaHasta) return { label: "Sin datos", tone: "muted" };
  const hoy = new Date();
  const venc = new Date(garantiaHasta + "T00:00:00");
  const dias = Math.floor((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { label: "Vencida", tone: "destructive" };
  if (dias <= 90) return { label: `${dias} días`, tone: "warning" };
  return { label: "Vigente", tone: "success" };
}

export function requiereImei(tipo: TipoEquipo) { return tipo === "Celular"; }
export function requiereSpecsPc(tipo: TipoEquipo) { return tipo === "PC" || tipo === "Notebook" || tipo === "Servidor"; }
