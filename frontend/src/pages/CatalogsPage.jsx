import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Database, Layers, ShieldCheck, Tag } from 'lucide-react';
import WorkspaceLayout from '../components/WorkspaceLayout';

const CATALOGS = [
  { key: 'tipo-unidad', title: 'Tipos de unidad', detail: 'Cajas, Dolly, Tanques, Portas y otros tipos registrados.', icon: Layers },
  { key: 'estado-unidad', title: 'Estados de unidad', detail: 'Estados operativos disponibles para las unidades.', icon: ShieldCheck },
  { key: 'combustible', title: 'Combustibles', detail: 'Catálogo de combustibles registrados.', icon: Tag },
  { key: 'periodos', title: 'Periodos', detail: 'Periodos utilizados por las verificaciones.', icon: Database },
  { key: 'tipo-poliza', title: 'Tipos de póliza', detail: 'Clasificación de pólizas de seguro.', icon: Tag },
  { key: 'tipo-tarjeta', title: 'Tipos de tarjeta', detail: 'Clasificación de tarjetas de circulación.', icon: Layers },
  { key: 'tipo-movimiento-placa', title: 'Movimientos de placas', detail: 'Tipos de movimiento aplicados a las placas.', icon: Database },
];

export default function CatalogsPage() {
  const navigate = useNavigate();
  return (
    <WorkspaceLayout activeNav="catalogs">
      <section className="workspace-page-heading">
        <p className="workspace-eyebrow">CONFIGURACIÓN DEL SISTEMA</p>
        <h1>Catálogos</h1>
        <p className="workspace-subtitle">Explora los tipos de datos utilizados por Activos.</p>
      </section>
      <div className="catalogs-grid">
        {CATALOGS.map(({ key, title, detail, icon: Icon }) => <button className="catalog-entry-card" key={key} type="button" onClick={() => navigate(`/catalogos/${key}`)}>
          <span className="catalog-entry-icon"><Icon size={21} /></span><span className="catalog-entry-copy"><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={16} />
        </button>)}
      </div>
      <p className="registry-muted-note">Las consultas se autorizan con el rol de la empresa activa. Las operaciones de escritura se conectarán en las pantallas de administración de cada catálogo.</p>
    </WorkspaceLayout>
  );
}
