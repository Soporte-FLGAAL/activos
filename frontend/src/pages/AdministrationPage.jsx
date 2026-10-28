import { useEffect, useState } from 'react';
import { ArrowUpRight, Building2, Grid2X2, KeyRound, Link2, List, Shield, Users } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { getRegistryCount } from '../services/registryApi';

const MODULES = [
  { key: 'usuarios', title: 'Usuarios', detail: 'Gestión de cuentas de acceso al sistema.', countLabel: 'Usuarios registrados', endpoint: '/usuarios', icon: Users, tone: 'charcoal' },
  { key: 'roles', title: 'Roles', detail: 'Configuración de permisos y privilegios.', countLabel: 'Roles registrados', endpoint: '/roles', icon: Shield, tone: 'gray' },
  { key: 'aseguradoras', title: 'Aseguradoras', detail: 'Directorio y control de aseguradoras.', countLabel: 'Aseguradoras registradas', endpoint: '/aseguradoras', icon: Building2, tone: 'red' },
  { key: 'permisos', title: 'Permisos', detail: 'Define los permisos disponibles para configurar los roles.', countLabel: 'Permisos registrados', endpoint: '/permisos', icon: KeyRound, tone: 'wine' },
  { key: 'asignaciones', title: 'Asignar empresas a usuarios', detail: 'Administra en qué empresas participa cada usuario y el rol que tendrá en cada una.', countLabel: 'Asignaciones registradas', endpoint: '/usuarios-empresas', icon: Link2, tone: 'charcoal' },
];

export default function AdministrationPage() {
  const navigate = useNavigate();
  const { isAdminGlobal } = useAuth();
  const [counts, setCounts] = useState({});
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (!isAdminGlobal) return undefined;
    let cancelled = false;
    Promise.all(MODULES.map(async (module) => {
      try {
        const count = await getRegistryCount(module.endpoint, { company: false });
        return [module.key, { value: count, status: 'ready' }];
      } catch {
        return [module.key, { value: null, status: 'error' }];
      }
    })).then((rows) => { if (!cancelled) setCounts(Object.fromEntries(rows)); });
    return () => { cancelled = true; };
  }, [isAdminGlobal]);

  if (!isAdminGlobal) return <Navigate to="/app" replace />;

  return (
    <WorkspaceLayout activeNav="settings">
      <section className="admin-heading-row">
        <div><p className="admin-breadcrumb"><button type="button" onClick={() => navigate('/app')}>Panel Principal</button><span>›</span><strong>Administración</strong></p><h1>Administración</h1><p className="workspace-subtitle">Configuraciones globales del sistema.</p></div>
        <div className="workspace-view-toggle" aria-label="Vista de administración"><button type="button" className={viewMode === 'grid' ? 'is-selected' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={15} /> Grid</button><button type="button" className={viewMode === 'list' ? 'is-selected' : ''} onClick={() => setViewMode('list')}><List size={16} /> Lista</button></div>
      </section>

      <div className={`admin-module-grid${viewMode === 'list' ? ' is-list' : ''}`}>
        {MODULES.map(({ key, title, detail, countLabel, icon: Icon, tone }) => {
          const count = counts[key];
          return <button type="button" className="admin-module-card" key={key} onClick={() => navigate(`/administracion/${key}`)}>
            <span className={`admin-module-cover tone-${tone}`}><Icon size={30} /><strong>{title}</strong></span>
            <span className="admin-module-body"><span className="admin-module-detail">{detail}</span><span className="admin-module-footer"><span className="admin-module-count">{count?.status === 'ready' ? `${Number(count.value).toLocaleString('es-MX')} ${countLabel.toLowerCase()}` : count?.status === 'error' ? 'No disponible' : 'Consultando…'}</span><span className="admin-module-action">Gestionar <ArrowUpRight size={15} /></span></span></span>
          </button>;
        })}
      </div>
      <p className="registry-muted-note">Los registros se consultan desde la API. Abre cada módulo para crear, editar o eliminar registros y administrar las relaciones disponibles; las restricciones de sistema siguen aplicándose en el backend.</p>
    </WorkspaceLayout>
  );
}
