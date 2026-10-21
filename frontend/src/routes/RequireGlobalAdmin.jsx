import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireGlobalAdmin() {
  const { user, isAdminGlobal, loading } = useAuth();
  if (loading) return <div className="route-loading" role="status">Verificando permisos…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdminGlobal) return <Navigate to="/app" replace />;
  return <Outlet />;
}
