import { colorEstado, labelEstado, type EstadoEquipo } from "@/lib/inventario";

export function EstadoBadge({ estado }: { estado: EstadoEquipo }) {
  return (
    <span className={`estado-badge border ${colorEstado[estado]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labelEstado[estado]}
    </span>
  );
}
