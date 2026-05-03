import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, User, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppModule } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MODULOS: { key: AppModule; label: string }[] = [
  { key: "equipos", label: "Equipos" }, { key: "filiales", label: "Filiales y sectores" },
  { key: "movimientos", label: "Movimientos" }, { key: "mantenimientos", label: "Mantenimientos" },
  { key: "auditorias", label: "Auditorías" }, { key: "reportes", label: "Reportes" }, { key: "alertas", label: "Alertas" },
];
const ACCIONES = ["puede_ver", "puede_crear", "puede_editar", "puede_eliminar"] as const;
const ACC_LABEL: Record<string, string> = { puede_ver: "Ver", puede_crear: "Crear", puede_editar: "Editar", puede_eliminar: "Eliminar" };

interface Usuario { user_id: string; nombre_completo: string | null; email: string | null; role: "admin" | "usuario"; }

export default function Configuracion() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<Record<string, any>>({});
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = async () => {
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, nombre_completo, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const lista: Usuario[] = (profs ?? []).map((p: any) => ({
      ...p, role: roles?.find((r: any) => r.user_id === p.user_id && r.role === "admin") ? "admin" : "usuario",
    }));
    setUsuarios(lista);
    if (lista.length && !seleccionado) setSeleccionado(lista[0].user_id);
    setLoading(false);
  };

  const cargarPermisos = async (uid: string) => {
    const { data } = await supabase.from("user_permissions").select("*").eq("user_id", uid);
    const map: Record<string, any> = {};
    MODULOS.forEach(m => {
      const row = data?.find((d: any) => d.modulo === m.key);
      map[m.key] = row ?? { modulo: m.key, puede_ver: true, puede_crear: false, puede_editar: false, puede_eliminar: false };
    });
    setPermisos(map);
  };

  useEffect(() => { cargarUsuarios(); }, []);
  useEffect(() => { if (seleccionado) cargarPermisos(seleccionado); }, [seleccionado]);

  const togglePerm = (mod: string, acc: string) => {
    setPermisos(p => ({ ...p, [mod]: { ...p[mod], [acc]: !p[mod][acc] } }));
  };

  const guardar = async () => {
    if (!seleccionado) return;
    setGuardando(true);
    const filas = MODULOS.map(m => ({
      user_id: seleccionado, modulo: m.key,
      puede_ver: permisos[m.key].puede_ver, puede_crear: permisos[m.key].puede_crear,
      puede_editar: permisos[m.key].puede_editar, puede_eliminar: permisos[m.key].puede_eliminar,
    }));
    const { error } = await supabase.from("user_permissions").upsert(filas, { onConflict: "user_id,modulo" });
    setGuardando(false);
    if (error) return toast.error(error.message);
    toast.success("Permisos actualizados");
  };

  const cambiarRol = async (uid: string, nuevoRol: "admin" | "usuario") => {
    if (nuevoRol === "admin") {
      const { error } = await supabase.from("user_roles").upsert({ user_id: uid, role: "admin" }, { onConflict: "user_id,role" });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
      if (error) return toast.error(error.message);
    }
    toast.success("Rol actualizado");
    cargarUsuarios();
  };

  const eliminarUsuario = async (uid: string) => {
    const { error } = await supabase.from("profiles").delete().eq("user_id", uid);
    if (error) return toast.error(error.message);
    toast.success("Usuario eliminado del sistema");
    setSeleccionado(null);
    cargarUsuarios();
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const usuarioSel = usuarios.find(u => u.user_id === seleccionado);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de usuarios y permisos</h1>
        <p className="text-muted-foreground">Gestioná los roles y permisos granulares de cada cuenta del sistema.</p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuarios registrados</CardTitle>
            <CardDescription>{usuarios.length} cuenta(s)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead></TableRow></TableHeader>
              <TableBody>
                {usuarios.map(u => (
                  <TableRow key={u.user_id} className={`cursor-pointer ${seleccionado === u.user_id ? "bg-muted" : ""}`} onClick={() => setSeleccionado(u.user_id)}>
                    <TableCell>
                      <div className="font-medium text-sm">{u.nombre_completo || "Sin nombre"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      {u.role === "admin"
                        ? <Badge className="bg-primary"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>
                        : <Badge variant="secondary"><User className="h-3 w-3 mr-1" />Usuario</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{usuarioSel?.nombre_completo || "Seleccioná un usuario"}</CardTitle>
                <CardDescription>{usuarioSel?.email}</CardDescription>
              </div>
              {usuarioSel && (
                <div className="flex gap-2 items-center">
                  <Select value={usuarioSel.role} onValueChange={(v) => cambiarRol(usuarioSel.user_id, v as any)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usuario">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este usuario del sistema?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminarán su perfil y permisos. La cuenta de autenticación deberá borrarse desde el panel de Lovable Cloud.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => eliminarUsuario(usuarioSel.user_id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {usuarioSel?.role === "admin" ? (
              <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-primary" />
                Los administradores tienen acceso total a todos los módulos. Cambiá su rol a "Usuario" para definir permisos granulares.
              </div>
            ) : usuarioSel ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      {ACCIONES.map(a => <TableHead key={a} className="text-center">{ACC_LABEL[a]}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULOS.map(m => (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        {ACCIONES.map(a => (
                          <TableCell key={a} className="text-center">
                            <Checkbox checked={!!permisos[m.key]?.[a]} onCheckedChange={() => togglePerm(m.key, a)} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4">
                  <Button onClick={guardar} disabled={guardando}>
                    {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar permisos
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
