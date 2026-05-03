import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardDrive, Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [perfilTab, setPerfilTab] = useState<"usuario" | "admin">("usuario");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => { if (!authLoading && user) navigate("/", { replace: true }); }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bienvenido");
    navigate("/", { replace: true });
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nombre_completo: nombre },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Si eligió "admin", lo promovemos (solo válido si todavía no hay admins en el sistema → primer admin)
    if (perfilTab === "admin" && data.user) {
      const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) === 0) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
        toast.success("Cuenta de administrador creada");
      } else {
        toast.info("Cuenta creada como usuario. Ya existe un admin: pedí permisos al administrador.");
      }
    } else {
      toast.success("Cuenta creada correctamente");
    }
    setLoading(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-3 shadow-lg">
            <HardDrive className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">InventarioTI</h1>
          <p className="text-sm text-muted-foreground">Coordinación de Informática</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Acceso al sistema</CardTitle>
            <CardDescription>Iniciá sesión o registrá una cuenta nueva</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="registro">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input id="email-login" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pwd-login">Contraseña</Label>
                    <Input id="pwd-login" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="registro">
                <Tabs value={perfilTab} onValueChange={(v) => setPerfilTab(v as any)} className="mb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="usuario"><User className="h-4 w-4 mr-1.5" />Usuario</TabsTrigger>
                    <TabsTrigger value="admin"><ShieldCheck className="h-4 w-4 mr-1.5" />Administrador</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground mb-3">
                  {perfilTab === "admin"
                    ? "El primer registro como administrador será el coordinador del sistema. Si ya hay un admin, este registro quedará como usuario común."
                    : "Tu cuenta será creada con permisos de solo lectura. El administrador podrá ampliarlos."}
                </p>
                <form onSubmit={handleRegistro} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reg">Email</Label>
                    <Input id="email-reg" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pwd-reg">Contraseña</Label>
                    <Input id="pwd-reg" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Crear cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/" className="hover:underline">← Volver</Link>
        </p>
      </div>
    </div>
  );
}
