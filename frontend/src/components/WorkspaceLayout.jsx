import { FileText, Grid2X2, Home, LogOut, Settings, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function initials(user) {
  const name = user?.nombres || user?.email || 'Usuario';
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'US';
}

export default function WorkspaceLayout({ children, activeNav = 'home' }) {
  const navigate = useNavigate();
  const { user, activeCompany, isAdminGlobal, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const navItems = [
    { id: 'home', label: 'Panel principal', icon: Home, action: () => navigate('/app') },
    { id: 'units', label: 'Unidades', icon: Grid2X2, action: () => navigate(activeCompany ? '/unidades' : '/app'), disabled: !activeCompany },
    { id: 'users', label: 'Usuarios', icon: Users, action: () => navigate('/administracion') },
    { id: 'catalogs', label: 'Catálogos', icon: FileText, action: () => navigate('/catalogos') },
    { id: 'settings', label: 'Administración', icon: Settings, action: () => navigate('/administracion') },
  ];

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <button className="workspace-logo" type="button" onClick={() => navigate('/app')} aria-label="Ir al panel principal">
          <img src="/assets/1__2_.png" alt="GAAL" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'inline'; }} />
          <span style={{ display: 'none' }}>GAAL</span>
        </button>
        <div className="workspace-header-right">
          <div className="workspace-user-text">
            <strong>{user?.nombres || user?.email || 'Usuario'}</strong>
            <span>{isAdminGlobal || activeCompany?.role === 'ADMIN_GLOBAL' ? 'Administrador' : (activeCompany?.roleLabel || activeCompany?.role || 'Usuario')}</span>
          </div>
          <div className="workspace-avatar" aria-hidden="true">{initials(user)}</div>
          <button className="workspace-logout" onClick={handleLogout} type="button" title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={17} /></button>
        </div>
      </header>

      <nav className="workspace-rail" aria-label="Navegación principal">
        {navItems.map(({ id, label, icon: Icon, action, disabled }) => (
          <button key={id} type="button" className={`workspace-rail-button${activeNav === id ? ' is-active' : ''}`} aria-label={label} title={disabled ? 'Selecciona una empresa desde el panel principal' : label} disabled={disabled} onClick={action}>
            <Icon size={18} strokeWidth={1.7} />
          </button>
        ))}
      </nav>

      <main className="workspace-main">{children}</main>
    </div>
  );
}
