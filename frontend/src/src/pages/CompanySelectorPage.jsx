import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function CompanySelectorPage() {
  const navigate = useNavigate();
  const { user, companies, isAdminGlobal, activeCompany, loading, selectCompany, logout } = useAuth();
  const [selectedId, setSelectedId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeCompany) setSelectedId(String(activeCompany.id));
  }, [activeCompany]);

  if (loading) return <div className="route-loading">Cargando empresas…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (companies.length === 0) return <Navigate to="/sin-empresas" replace />;
  if (companies.length === 1 && activeCompany) return <Navigate to="/app" replace />;

  async function handleContinue(event) {
    event.preventDefault();
    setError('');
    const company = companies.find((item) => String(item.id) === selectedId);
    if (!company) {
      setError('Selecciona una empresa para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      selectCompany(company);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo seleccionar la empresa.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="auth-screen company-screen">
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="glass-card company-card" aria-labelledby="company-title">
        <div className="company-topline">
          <div className="brand-badge brand-badge--small">
            <img
              className="brand-logo"
              src="/assets/1__2_.png"
              alt="GAAL Logística"
              onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'block'; }}
            />
            <span className="brand-wordmark" style={{ display: 'none' }}>GAAL</span>
          </div>
          <button type="button" className="subtle-button" onClick={handleLogout}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>

        <header className="auth-heading company-heading">
          <p className="eyebrow">SELECCIÓN DE CONTEXTO</p>
          <h1 id="company-title">¿Con qué empresa vas a trabajar?</h1>
          <p>Hola, {user.nombres || user.email}. Selecciona la empresa para consultar la información y realizar operaciones dentro de su contexto.</p>
        </header>

        {isAdminGlobal && (
          <div className="global-admin-note">
            <ShieldCheck size={18} />
            <span>Tu cuenta tiene permisos de administrador global. La autorización final se valida en el backend.</span>
          </div>
        )}

        <form onSubmit={handleContinue}>
          <div className="company-list" role="radiogroup" aria-label="Empresas disponibles">
            {companies.map((company) => {
              const chosen = String(company.id) === selectedId;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  key={company.id}
                  className={`company-option${chosen ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(String(company.id))}
                >
                  <span className="company-option-icon">{company.scope === 'global' ? <ShieldCheck size={22} /> : <Building2 size={22} />}</span>
                  <span className="company-option-copy">
                    <strong>{company.name}</strong>
                    <span>{company.shortName || 'Empresa asignada'}</span>
                    <small>Rol: {company.roleLabel || company.role || 'Usuario'}</small>
                  </span>
                  <span className="company-option-state">
                    {chosen ? <CheckCircle2 size={22} /> : <span className="radio-empty" />}
                  </span>
                </button>
              );
            })}
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit company-submit" type="submit" disabled={submitting || !selectedId}>
            <span>{submitting ? 'Abriendo espacio…' : 'Continuar con esta empresa'}</span>
            <ArrowRight size={18} />
          </button>
        </form>
        <footer className="auth-footer">La empresa seleccionada se enviará como contexto en las solicitudes que lo requieran.</footer>
      </section>
    </main>
  );
}
