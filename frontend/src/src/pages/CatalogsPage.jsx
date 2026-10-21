import { useState } from 'react';
import { ArrowUpRight, Database, Info, Layers, ShieldCheck, Tag, X } from 'lucide-react';
import WorkspaceLayout from '../components/WorkspaceLayout';

const CATALOGS = [
  { title: 'Tipos de unidad', detail: 'Cajas, Dolly, Tanques, Portas y otros tipos registrados.', icon: Layers },
  { title: 'Estados de unidad', detail: 'Catálogo de estados operativos de las unidades.', icon: ShieldCheck },
  { title: 'Combustibles', detail: 'Tipos de combustible disponibles.', icon: Tag },
  { title: 'Periodos', detail: 'Periodos utilizados por las verificaciones.', icon: Database },
  { title: 'Tipos de póliza', detail: 'Clasificación de las pólizas de seguro.', icon: Tag },
  { title: 'Tipos de tarjeta', detail: 'Catálogo de tipos de tarjeta de circulación.', icon: Layers },
  { title: 'Movimientos de placas', detail: 'Tipos de movimiento utilizados al registrar cambios de placas.', icon: Database },
];

export default function CatalogsPage() {
  const [selected, setSelected] = useState(null);
  return (
    <WorkspaceLayout activeNav="catalogs">
      <section className="workspace-page-heading">
        <p className="workspace-eyebrow">CONFIGURACIÓN DEL SISTEMA</p>
        <h1>Catálogos</h1>
        <p className="workspace-subtitle">Explora los tipos de datos utilizados por Activos.</p>
      </section>
      <div className="catalogs-grid">
        {CATALOGS.map(({ title, detail, icon: Icon }) => <button type="button" className="catalog-entry-card" key={title} onClick={() => setSelected({ title, detail })}>
          <span className="catalog-entry-icon"><Icon size={21} /></span>
          <span className="catalog-entry-copy"><strong>{title}</strong><small>{detail}</small></span>
          <ArrowUpRight size={16} />
        </button>)}
      </div>
      {selected && <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-pending-title"><button className="workspace-modal-close" type="button" aria-label="Cerrar" onClick={() => setSelected(null)}><X size={17} /></button><div className="workspace-modal-icon"><Info size={20} /></div><h2 id="catalog-pending-title">{selected.title}</h2><p>{selected.detail}</p><div className="workspace-modal-details">La tarjeta visual está preparada, pero el listado y las operaciones CRUD de este catálogo todavía no están conectados desde React. En el backend actual, las rutas de catálogo usan RBAC sin establecer el contexto de empresa, por lo que es necesario corregir ese middleware antes de conectarlas para usuarios que no sean ADMIN_GLOBAL.</div><button type="button" className="workspace-primary-button" onClick={() => setSelected(null)}>Entendido</button></section></div>}
    </WorkspaceLayout>
  );
}
