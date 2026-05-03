-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');
CREATE TYPE public.app_module AS ENUM ('equipos','filiales','movimientos','mantenimientos','auditorias','reportes','alertas');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  email TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ USER PERMISSIONS (granular) ============
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo public.app_module NOT NULL,
  puede_ver BOOLEAN NOT NULL DEFAULT true,
  puede_crear BOOLEAN NOT NULL DEFAULT false,
  puede_editar BOOLEAN NOT NULL DEFAULT false,
  puede_eliminar BOOLEAN NOT NULL DEFAULT false,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, modulo)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.tiene_permiso(_user_id UUID, _modulo public.app_module, _accion TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE allowed BOOLEAN;
BEGIN
  IF public.has_role(_user_id, 'admin') THEN RETURN TRUE; END IF;
  SELECT CASE _accion
    WHEN 'ver' THEN puede_ver
    WHEN 'crear' THEN puede_crear
    WHEN 'editar' THEN puede_editar
    WHEN 'eliminar' THEN puede_eliminar
    ELSE FALSE END
  INTO allowed FROM public.user_permissions WHERE user_id = _user_id AND modulo = _modulo;
  RETURN COALESCE(allowed, FALSE);
END; $$;

-- ============ AUTO PROFILE + DEFAULT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nombre_completo)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'usuario');
  -- default permissions: solo ver
  INSERT INTO public.user_permissions (user_id, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
  SELECT NEW.id, m, TRUE, FALSE, FALSE, FALSE
  FROM unnest(ARRAY['equipos','filiales','movimientos','mantenimientos','auditorias','reportes','alertas']::public.app_module[]) AS m;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES: profiles / roles / permissions ============
CREATE POLICY "ver propio perfil" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "actualizar propio perfil" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin elimina perfil" ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "ver roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin gestiona roles ins" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin gestiona roles upd" ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin gestiona roles del" ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "ver permisos propios o admin" ON public.user_permissions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin gestiona permisos ins" ON public.user_permissions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin gestiona permisos upd" ON public.user_permissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin gestiona permisos del" ON public.user_permissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- ============ REPLACE PUBLIC POLICIES ON DOMAIN TABLES ============
DROP POLICY IF EXISTS acceso_publico_equipos ON public.equipos;
DROP POLICY IF EXISTS acceso_publico_filiales ON public.filiales;
DROP POLICY IF EXISTS acceso_publico_sectores ON public.sectores;
DROP POLICY IF EXISTS acceso_publico_movimientos ON public.movimientos;
DROP POLICY IF EXISTS acceso_publico_mantenimientos ON public.mantenimientos;
DROP POLICY IF EXISTS acceso_publico_auditorias ON public.auditorias;
DROP POLICY IF EXISTS acceso_publico_auditoria_items ON public.auditoria_items;

-- equipos
CREATE POLICY "ver equipos" ON public.equipos FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(),'equipos','ver'));
CREATE POLICY "crear equipos" ON public.equipos FOR INSERT TO authenticated WITH CHECK (public.tiene_permiso(auth.uid(),'equipos','crear'));
CREATE POLICY "editar equipos" ON public.equipos FOR UPDATE TO authenticated USING (public.tiene_permiso(auth.uid(),'equipos','editar'));
CREATE POLICY "eliminar equipos" ON public.equipos FOR DELETE TO authenticated USING (public.tiene_permiso(auth.uid(),'equipos','eliminar'));

-- filiales
CREATE POLICY "ver filiales" ON public.filiales FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(),'filiales','ver'));
CREATE POLICY "crear filiales" ON public.filiales FOR INSERT TO authenticated WITH CHECK (public.tiene_permiso(auth.uid(),'filiales','crear'));
CREATE POLICY "editar filiales" ON public.filiales FOR UPDATE TO authenticated USING (public.tiene_permiso(auth.uid(),'filiales','editar'));
CREATE POLICY "eliminar filiales" ON public.filiales FOR DELETE TO authenticated USING (public.tiene_permiso(auth.uid(),'filiales','eliminar'));

-- sectores (atado a filiales)
CREATE POLICY "ver sectores" ON public.sectores FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(),'filiales','ver'));
CREATE POLICY "crear sectores" ON public.sectores FOR INSERT TO authenticated WITH CHECK (public.tiene_permiso(auth.uid(),'filiales','crear'));
CREATE POLICY "editar sectores" ON public.sectores FOR UPDATE TO authenticated USING (public.tiene_permiso(auth.uid(),'filiales','editar'));
CREATE POLICY "eliminar sectores" ON public.sectores FOR DELETE TO authenticated USING (public.tiene_permiso(auth.uid(),'filiales','eliminar'));

-- movimientos
CREATE POLICY "ver movimientos" ON public.movimientos FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(),'movimientos','ver'));
CREATE POLICY "crear movimientos" ON public.movimientos FOR INSERT TO authenticated WITH CHECK (public.tiene_permiso(auth.uid(),'movimientos','crear'));
CREATE POLICY "editar movimientos" ON public.movimientos FOR UPDATE TO authenticated USING (public.tiene_permiso(auth.uid(),'movimientos','editar'));
CREATE POLICY "eliminar movimientos" ON public.movimientos FOR DELETE TO authenticated USING (public.tiene_permiso(auth.uid(),'movimientos','eliminar'));

-- mantenimientos
CREATE POLICY "ver mant" ON public.mantenimientos FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(),'mantenimientos','ver'));
CREATE POLICY "crear mant" ON public.mantenimientos FOR INSERT TO authenticated WITH CHECK (public.tiene_permiso(auth.uid(),'mantenimientos','crear'));
CREATE POLICY "editar mant" ON public.mantenimientos FOR UPDATE TO authenticated USING (public.tiene_permiso(auth.uid(),'mantenimientos','editar'));
CREATE POLICY "eliminar mant" ON public.mantenimientos FOR DELETE TO authenticated USING (public.tiene_permiso(auth.uid(),'mantenimientos','eliminar'));

-- auditorias
CREATE POLICY "ver aud" ON public.auditorias FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(),'auditorias','ver'));
CREATE POLICY "crear aud" ON public.auditorias FOR INSERT TO authenticated WITH CHECK (public.tiene_permiso(auth.uid(),'auditorias','crear'));
CREATE POLICY "editar aud" ON public.auditorias FOR UPDATE TO authenticated USING (public.tiene_permiso(auth.uid(),'auditorias','editar'));
CREATE POLICY "eliminar aud" ON public.auditorias FOR DELETE TO authenticated USING (public.tiene_permiso(auth.uid(),'auditorias','eliminar'));

CREATE POLICY "ver aud items" ON public.auditoria_items FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(),'auditorias','ver'));
CREATE POLICY "crear aud items" ON public.auditoria_items FOR INSERT TO authenticated WITH CHECK (public.tiene_permiso(auth.uid(),'auditorias','crear'));
CREATE POLICY "editar aud items" ON public.auditoria_items FOR UPDATE TO authenticated USING (public.tiene_permiso(auth.uid(),'auditorias','editar'));
CREATE POLICY "eliminar aud items" ON public.auditoria_items FOR DELETE TO authenticated USING (public.tiene_permiso(auth.uid(),'auditorias','eliminar'));

-- triggers actualizado_en
CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();
CREATE TRIGGER trg_user_perms_upd BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();