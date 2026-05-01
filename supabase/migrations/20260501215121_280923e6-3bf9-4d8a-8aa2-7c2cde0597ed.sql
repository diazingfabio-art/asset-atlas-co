-- Enums
CREATE TYPE public.tipo_equipo AS ENUM ('PC','Notebook','Celular','Impresora','Escaner','Servidor','Tablet','UPS','Otro');
CREATE TYPE public.estado_equipo AS ENUM ('Activo','En reparacion','De baja','En deposito','Extraviado');
CREATE TYPE public.tipo_movimiento AS ENUM ('Asignacion','Reasignacion','Reparacion','Baja','Ingreso','Traslado entre filiales');
CREATE TYPE public.tipo_mantenimiento AS ENUM ('Preventivo','Correctivo');
CREATE TYPE public.estado_mantenimiento AS ENUM ('Pendiente','En proceso','Completado');

-- Filiales
CREATE TABLE public.filiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ciudad TEXT,
  pais TEXT,
  codigo_filial TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sectores
CREATE TABLE public.sectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  filial_id UUID NOT NULL REFERENCES public.filiales(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sectores_filial ON public.sectores(filial_id);

-- Equipos
CREATE TABLE public.equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_inventario TEXT NOT NULL UNIQUE,
  tipo_equipo public.tipo_equipo NOT NULL,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  numero_imei TEXT,
  filial_id UUID REFERENCES public.filiales(id) ON DELETE SET NULL,
  sector_id UUID REFERENCES public.sectores(id) ON DELETE SET NULL,
  usuario_asignado TEXT,
  estado public.estado_equipo NOT NULL DEFAULT 'Activo',
  fecha_adquisicion DATE,
  valor_compra NUMERIC(14,2),
  proveedor TEXT,
  numero_factura TEXT,
  garantia_hasta DATE,
  sistema_operativo TEXT,
  procesador TEXT,
  ram_gb INTEGER,
  almacenamiento_gb INTEGER,
  ip_asignada TEXT,
  mac_address TEXT,
  observaciones TEXT,
  foto_url TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_equipos_filial ON public.equipos(filial_id);
CREATE INDEX idx_equipos_sector ON public.equipos(sector_id);
CREATE INDEX idx_equipos_estado ON public.equipos(estado);
CREATE INDEX idx_equipos_tipo ON public.equipos(tipo_equipo);

-- Movimientos
CREATE TABLE public.movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  tipo_movimiento public.tipo_movimiento NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_origen TEXT,
  usuario_destino TEXT,
  sector_origen UUID REFERENCES public.sectores(id) ON DELETE SET NULL,
  sector_destino UUID REFERENCES public.sectores(id) ON DELETE SET NULL,
  filial_origen UUID REFERENCES public.filiales(id) ON DELETE SET NULL,
  filial_destino UUID REFERENCES public.filiales(id) ON DELETE SET NULL,
  responsable TEXT,
  observaciones TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_movimientos_equipo ON public.movimientos(equipo_id);
CREATE INDEX idx_movimientos_fecha ON public.movimientos(fecha);

-- Mantenimientos
CREATE TABLE public.mantenimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  tipo public.tipo_mantenimiento NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT,
  tecnico TEXT,
  costo NUMERIC(14,2),
  estado public.estado_mantenimiento NOT NULL DEFAULT 'Pendiente',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mantenimientos_equipo ON public.mantenimientos(equipo_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.actualizado_en = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_filiales_updated BEFORE UPDATE ON public.filiales FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();
CREATE TRIGGER trg_sectores_updated BEFORE UPDATE ON public.sectores FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();
CREATE TRIGGER trg_equipos_updated BEFORE UPDATE ON public.equipos FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

-- RLS: enable on all tables but allow all access (no auth phase)
ALTER TABLE public.filiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_publico_filiales" ON public.filiales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_sectores" ON public.sectores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_equipos" ON public.equipos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_movimientos" ON public.movimientos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_mantenimientos" ON public.mantenimientos FOR ALL USING (true) WITH CHECK (true);