import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequireAuth } from './routes/RequireAuth';
import { RequireGlobalAdmin } from './routes/RequireGlobalAdmin';
import LoginPage from './pages/LoginPage';
import CompanySelectorPage from './pages/CompanySelectorPage';
import AppHome from './pages/AppHome';
import UnitsPage from './pages/UnitsPage';
import CreateRecordPage from './pages/CreateRecordPage';
import UnitDetailPage from './pages/UnitDetailPage';
import CatalogsPage from './pages/CatalogsPage';
import AdministrationPage from './pages/AdministrationPage';
import AdminDirectoryPage from './pages/AdminDirectoryPage';
import UsersAdminPage from './pages/UsersAdminPage';
import RolesAdminPage from './pages/RolesAdminPage';
import InsurersAdminPage from './pages/InsurersAdminPage';
import UserCompanyAssignmentsPage from './pages/UserCompanyAssignmentsPage';
import { CatalogRegistryPage } from './pages/DataRegistryPage';
import NoCompaniesPage from './pages/NoCompaniesPage';
import './styles/auth.css';

function StartRedirect() {
  const { user, companies, loading } = useAuth();
  if (loading) return <div className="route-loading">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!companies.length) return <Navigate to="/sin-empresas" replace />;
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
        <Route path="/catalogos/:catalogKey" element={<CatalogRegistryPage />} />
      </Route>
      <Route element={<RequireGlobalAdmin />}>
        <Route path="/administracion" element={<AdministrationPage />} />
        <Route path="/administracion/usuarios" element={<UsersAdminPage />} />
        <Route path="/administracion/roles" element={<RolesAdminPage />} />
        <Route path="/administracion/aseguradoras" element={<InsurersAdminPage />} />
        <Route path="/administracion/asignaciones" element={<UserCompanyAssignmentsPage />} />
        <Route path="/administracion/:directoryKey" element={<AdminDirectoryPage />} />
      </Route>
      <Route element={<RequireAuth needsCompany /> }>
        <Route path="/unidades" element={<UnitsPage />} />
        <Route path="/unidades/alta" element={<CreateRecordPage />} />
        <Route path="/unidades/:id" element={<UnitDetailPage />} />
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
