
CREATE TYPE estado_auditoria AS ENUM ('En curso', 'Finalizada', 'Cancelada');
CREATE TYPE estado_item_auditoria AS ENUM ('Pendiente', 'Verificado', 'No encontrado', 'Discrepancia');

CREATE TABLE public.auditorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  filial_id UUID,
  sector_id UUID,
  responsable TEXT,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  estado estado_auditoria NOT NULL DEFAULT 'En curso',
  observaciones TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.auditoria_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id UUID NOT NULL REFERENCES public.auditorias(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL,
  estado estado_item_auditoria NOT NULL DEFAULT 'Pendiente',
  ubicacion_encontrada TEXT,
  usuario_encontrado TEXT,
  notas TEXT,
  verificado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auditoria_id, equipo_id)
);

ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY acceso_publico_auditorias ON public.auditorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY acceso_publico_auditoria_items ON public.auditoria_items FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_auditorias_actualizado
BEFORE UPDATE ON public.auditorias
FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE INDEX idx_auditoria_items_auditoria ON public.auditoria_items(auditoria_id);
CREATE INDEX idx_auditoria_items_equipo ON public.auditoria_items(equipo_id);
