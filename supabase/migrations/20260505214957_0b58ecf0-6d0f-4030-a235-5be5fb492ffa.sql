ALTER TABLE public.equipos
  ADD COLUMN IF NOT EXISTS hostname text,
  ADD COLUMN IF NOT EXISTS numero_linea text,
  ADD COLUMN IF NOT EXISTS operadora text,
  ADD COLUMN IF NOT EXISTS cuenta_gmail text,
  ADD COLUMN IF NOT EXISTS teclado text,
  ADD COLUMN IF NOT EXISTS mouse text,
  ADD COLUMN IF NOT EXISTS monitor_1 text,
  ADD COLUMN IF NOT EXISTS monitor_2 text;

CREATE INDEX IF NOT EXISTS idx_equipos_filial ON public.equipos(filial_id);
CREATE INDEX IF NOT EXISTS idx_equipos_sector ON public.equipos(sector_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON public.equipos(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_equipo ON public.movimientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON public.movimientos(fecha);