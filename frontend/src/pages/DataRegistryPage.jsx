import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Database, Search } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { getRegistryPage } from '../services/registryApi';

const ADMIN_REGISTRIES = {
  usuarios: {
    title: 'Usuarios', subtitle: 'Cuentas de acceso y estado de usuario.', endpoint: '/usuarios', activeNav: 'users',
    columns: [
      { label: 'ID', key: 'Usu_id' },
      { label: 'Nombre', value: (row) => [row.Usu_nombres, row.Usu_ap_paterno, row.Usu_ap_materno].filter(Boolean).join(' ') },
      { label: 'Correo electrónico', key: 'Usu_correo' },
      { label: 'Teléfono', key: 'Usu_telefono' },
      { label: 'Estado', key: 'Usu_status', badge: true },
    ],
  },
  roles: {
    title: 'Roles', subtitle: 'Roles definidos en el sistema.', endpoint: '/roles', activeNav: 'settings',
    columns: [{ label: 'ID', key: 'Rol_id' }, { label: 'Nombre del rol', key: 'Rol_nombre' }],
  },
  aseguradoras: {
    title: 'Aseguradoras', subtitle: 'Directorio de aseguradoras registradas.', endpoint: '/aseguradoras', activeNav: 'settings',
    columns: [
      { label: 'ID', key: 'Ase_id' }, { label: 'Aseguradora', key: 'Ase_nombre' }, { label: 'RFC', key: 'Ase_rfc' },
      { label: 'Teléfono', key: 'Ase_telefono' }, { label: 'Dirección', key: 'Ase_direccion' },
    ],
  },
};

const CATALOG_REGISTRIES = {
  'tipo-unidad': {
    title: 'Tipos de unidad', subtitle: 'Cajas, Dolly, Tanques, Portas y otros tipos registrados.', endpoint: '/catalogos/tipo-unidad',
    columns: [{ label: 'ID', key: 'TpU_id' }, { label: 'Tipo de unidad', key: 'TpU_nombre' }, { label: 'Nombre corto', key: 'TpU_nombre_corto' }],
  },
  'estado-unidad': {
    title: 'Estados de unidad', subtitle: 'Estados operativos disponibles para las unidades.', endpoint: '/catalogos/estado-unidad',
    columns: [{ label: 'ID', key: 'EsU_id' }, { label: 'Estado', key: 'EsU_estado' }],
  },
  combustible: {
    title: 'Combustibles', subtitle: 'Catálogo de combustibles registrados.', endpoint: '/catalogos/combustible',
    columns: [{ label: 'ID', key: 'Com_id' }, { label: 'Combustible', key: 'Com_nombre' }],
  },
  periodos: {
    title: 'Periodos', subtitle: 'Periodos utilizados por las verificaciones.', endpoint: '/catalogos/periodos',
    columns: [{ label: 'ID', key: 'Per_id' }, { label: 'Periodo', key: 'Per_nombre' }],
  },
  'tipo-poliza': {
    title: 'Tipos de póliza', subtitle: 'Clasificación de pólizas de seguro.', endpoint: '/catalogos/tipo-poliza',
    columns: [{ label: 'ID', key: 'TpP_id' }, { label: 'Tipo de póliza', key: 'TpP_nombre' }],
  },
  'tipo-tarjeta': {
    title: 'Tipos de tarjeta', subtitle: 'Clasificación de tarjetas de circulación.', endpoint: '/catalogos/tipo-tarjeta',
    columns: [{ label: 'ID', key: 'TpT_id' }, { label: 'Tipo de tarjeta', key: 'TpT_nombre' }],
  },
  'tipo-movimiento-placa': {
    title: 'Movimientos de placas', subtitle: 'Tipos de movimiento para los registros de placas.', endpoint: '/catalogos/tipo-movimiento-placa',
    columns: [{ label: 'ID', key: 'TpMP_id' }, { label: 'Movimiento', key: 'TpMP_nombre' }],
  },
};

export function AdminDirectoryPage() {
  const navigate = useNavigate();
  const { directoryKey } = useParams();
  return <RegistryInner kind="admin" registryKey={directoryKey} navigate={navigate} />;
}

export function CatalogRegistryPage() {
  const navigate = useNavigate();
  const { catalogKey } = useParams();
  return <RegistryInner kind="catalog" registryKey={catalogKey} navigate={navigate} />;
}

function RegistryInner({ kind, registryKey, navigate }) {
  const { activeCompany, isAdminGlobal, can } = useAuth();
  const adminMode = kind === 'admin';
  const config = (adminMode ? ADMIN_REGISTRIES : CATALOG_REGISTRIES)[registryKey];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const load = useCallback(async (signal) => {
    if (!config?.endpoint || (adminMode && !isAdminGlobal) || (!adminMode && (!can('catalogos:ver') || !activeCompany?.id) && !isAdminGlobal)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await getRegistryPage(config.endpoint, { page, limit: 20 }, { signal });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message || 'No fue posible consultar este listado.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [config?.endpoint, page, adminMode, isAdminGlobal, activeCompany?.id, can]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    if (!normalized || !config) return items;
    return items.filter((row) => config.columns.some((column) => {
      const value = column.value ? column.value(row) : row[column.key];
      return String(value ?? '').toLocaleLowerCase('es-MX').includes(normalized);
    }));
  }, [items, query, config]);

  if (!config) return <Navigate to={adminMode ? '/administracion' : '/catalogos'} replace />;
  if (adminMode && !isAdminGlobal) return <Navigate to="/app" replace />;
  if (!adminMode && !activeCompany?.id && !isAdminGlobal) {
    return <Navigate to="/seleccionar-empresa" replace state={{ from: `/catalogos/${registryKey}` }} />;
  }
  if (!adminMode && !can('catalogos:ver')) return <Navigate to="/catalogos" replace />;

  return (
    <WorkspaceLayout activeNav={adminMode ? (config.activeNav || 'settings') : 'catalogs'}>
      <section className="registry-heading">
        <button type="button" className="registry-back" onClick={() => navigate(adminMode ? '/administracion' : '/catalogos')} aria-label="Volver"><ArrowLeft size={18} /></button>
        <div className="registry-heading-copy"><p className="registry-breadcrumb">{adminMode ? 'Administración' : 'Catálogos'} / {config.title}</p><h1>{config.title}</h1><p className="workspace-subtitle">{config.subtitle}</p></div>
        <label className="registry-search"><Search size={16} /><input type="search" placeholder={`Buscar ${config.title.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      </section>

      <div className="registry-panel">
        <div className="registry-panel-heading"><div><Database size={17} /><strong>Registros</strong></div><span>{loading ? 'Consultando…' : `${pagination.total} en total`}</span></div>
        {error && <div className="workspace-error"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => load()}>Reintentar</button></div>}
        {loading ? <div className="workspace-loading">Cargando información…</div> : !error && visibleItems.length === 0 ? <div className="workspace-empty-state"><Database size={27} /><h2>Sin registros</h2><p>{query ? 'No hay registros de esta página que coincidan con la búsqueda.' : 'El backend no devolvió registros para este listado.'}</p></div> : (
          <div className="registry-table-wrap"><table className="registry-table"><thead><tr>{config.columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody>
            {visibleItems.map((row, index) => <tr key={row.Usu_id ?? row.Rol_id ?? row.Ase_id ?? row.TpU_id ?? row.EsU_id ?? row.Com_id ?? row.Per_id ?? row.TpP_id ?? row.TpT_id ?? row.TpMP_id ?? index}>
              {config.columns.map((column) => {
                const value = column.value ? column.value(row) : row[column.key];
                return <td key={column.label}>{column.badge ? <span className={`registry-status ${value === 'ACTIVO' ? 'is-active' : 'is-inactive'}`}>{value || '—'}</span> : (value == null || value === '' ? '—' : String(value))}</td>;
              })}
            </tr>)}
          </tbody></table></div>
        )}
        <footer className="registry-pagination"><span>Página {pagination.page || page} de {Math.max(1, pagination.totalPages || 1)}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></footer>
      </div>
      <p className="registry-muted-note">Este listado consulta el backend. En esta entrega no se envían altas, cambios ni eliminaciones desde esta pantalla.</p>
    </WorkspaceLayout>
  );
}
