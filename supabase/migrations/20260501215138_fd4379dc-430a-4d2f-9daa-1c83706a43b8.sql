CREATE OR REPLACE FUNCTION public.set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.actualizado_en = now(); RETURN NEW; END; $$;