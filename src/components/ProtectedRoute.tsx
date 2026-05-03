import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppModule } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireModulo?: AppModule;
}

export function ProtectedRoute({ children, requireAdmin, requireModulo }: Props) {
  const { user, loading, isAdmin, puede } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireModulo && !puede(requireModulo, "puede_ver")) return <Navigate to="/" replace />;

  return <>{children}</>;
}
