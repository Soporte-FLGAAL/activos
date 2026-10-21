import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ needsCompany = true }) {
  const { user, activeCompany, companies, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="route-loading" role="status">Verificando sesión…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (needsCompany && companies.length > 1 && !activeCompany) {
    return <Navigate to="/seleccionar-empresa" replace />;
  }
  return <Outlet />;
}
