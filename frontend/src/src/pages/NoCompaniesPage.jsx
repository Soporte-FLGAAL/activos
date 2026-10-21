import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NoCompaniesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  async function backToLogin() {
    await logout();
    navigate('/login', { replace: true });
  }
  return (
    <main className="auth-screen">
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="glass-card company-card no-company-card">
        <ShieldAlert size={42} />
        <h1>Tu usuario no tiene empresas asignadas</h1>
        <p>Solicita al administrador que revise tus asignaciones antes de ingresar al sistema.</p>
        <button className="auth-submit" onClick={backToLogin}><LogOut size={18} /> Volver al inicio de sesión</button>
      </section>
    </main>
  );
}
