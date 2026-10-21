import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequireAuth } from './routes/RequireAuth';
import LoginPage from './pages/LoginPage';
import CompanySelectorPage from './pages/CompanySelectorPage';
import AppHome from './pages/AppHome';
import UnitsPage from './pages/UnitsPage';
import CatalogsPage from './pages/CatalogsPage';
import AdministrationPage from './pages/AdministrationPage';
import NoCompaniesPage from './pages/NoCompaniesPage';
import './styles/auth.css';

function StartRedirect() {
  const { user, companies, loading } = useAuth();
  if (loading) return <div className="route-loading">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!companies.length) return <Navigate to="/sin-empresas" replace />;
  // El panel principal muestra todas las empresas. La empresa activa se elige al abrir una tarjeta.
  return <Navigate to="/app" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StartRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth needsCompany={false} />}>
        <Route path="/app" element={<AppHome />} />
        <Route path="/seleccionar-empresa" element={<CompanySelectorPage />} />
        <Route path="/sin-empresas" element={<NoCompaniesPage />} />
        <Route path="/catalogos" element={<CatalogsPage />} />
        <Route path="/administracion" element={<AdministrationPage />} />
      </Route>
      <Route element={<RequireAuth needsCompany />}>
        <Route path="/unidades" element={<UnitsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
