import { useState } from 'react';
import { ArrowUpRight, Building2, KeyRound, ShieldCheck, UserCog } from 'lucide-react';
import WorkspaceLayout from '../components/WorkspaceLayout';

const MODULES = [
  { title: 'Empresas', detail: 'Datos generales de las empresas registradas.', icon: Building2 },
  { title: 'Usuarios', detail: 'Cuentas de acceso y estado de usuario.', icon: UserCog },
  { title: 'Roles y permisos', detail: 'Asignación de roles y permisos por empresa.', icon: KeyRound },
  { title: 'Seguridad', detail: 'Configuración de acceso y autorizaciones.', icon: ShieldCheck },
];

export default function AdministrationPage() {
  const [selected, setSelected] = useState(null);
  return (
    <WorkspaceLayout activeNav="settings">
      <section className="workspace-page-heading">
        <p className="workspace-eyebrow">CONFIGURACIÓN DEL SISTEMA</p>
        <h1>Administración</h1>
        <p className="workspace-subtitle">Accesos administrativos disponibles para la integración del sistema.</p>
      </section>
      <div className="catalogs-grid">
        {MODULES.map(({ title, detail, icon: Icon }) => <button className="catalog-entry-card" key={title} type="button" onClick={() => setSelected({ title, detail })}>
          <span className="catalog-entry-icon"><Icon size={21} /></span><span className="catalog-entry-copy"><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={16} />
        </button>)}
      </div>
      {selected && <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="admin-pending-title"><button className="workspace-modal-close" type="button" aria-label="Cerrar" onClick={() => setSelected(null)}>×</button><div className="workspace-modal-icon"><ShieldCheck size={20} /></div><h2 id="admin-pending-title">{selected.title}</h2><p>{selected.detail}</p><div className="workspace-modal-details">La navegación visual está preparada, pero esta sección no ejecuta cambios ni consultas administrativas todavía. Antes de conectarla deben quedar confirmadas las reglas de autorización de las rutas correspondientes.</div><button type="button" className="workspace-primary-button" onClick={() => setSelected(null)}>Entendido</button></section></div>}
    </WorkspaceLayout>
  );
}
