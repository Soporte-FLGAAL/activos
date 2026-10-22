import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, LogIn } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) {
    const path = '/app';
    return <Navigate to={path} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      navigate(result.nextPath, { replace: true });
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="glass-card glass-card--login" aria-labelledby="login-title">
        <div className="brand-badge">
          <img
            className="brand-logo"
            src="../../public/flg.png"
            alt="GAAL Logística"
            onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'block'; }}
          />
          <span className="brand-wordmark" style={{ display: 'none' }}>GAAL</span>
        </div>

        <header className="auth-heading">
          <p className="eyebrow">PORTAL DE OPERACIONES</p>
          <h1 id="login-title">Acceso al portal</h1>
          <p>Ingresa para gestionar tu flota y documentación.</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label" htmlFor="email">Correo electrónico</label>
          <div className="auth-input-wrap">
            <Mail size={19} aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="ejemplo@gaal.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="password-label-row">
            <label className="auth-label" htmlFor="password">Contraseña</label>
          </div>
          <div className="auth-input-wrap">
            <LockKeyhole size={19} aria-hidden="true" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            <span>{submitting ? 'Validando acceso…' : 'Ingresar al sistema'}</span>
            <LogIn size={18} aria-hidden="true" />
          </button>
        </form>
        <footer className="auth-footer">© {new Date().getFullYear()} GAAL Logística. Acceso exclusivo a usuarios autorizados.</footer>
      </section>
    </main>
  );
}
