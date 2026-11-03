import { useState } from 'react';
import { apiRequestBlob } from '../services/apiClient';

export default function ProtectedDocumentLink({ href, children = 'Ver documento' }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');

  if (!href) return <span className="unit-file-no-document">Sin documento adjunto</span>;

  const match = String(href).match(/\\/upload\\/([^/?#]+)/i);
  const requestPath = match ? `/upload/${encodeURIComponent(match[1])}` : null;

  async function handleOpen(event) {
    // Archivos protegidos requieren Bearer y X-Empresa-Id; otros enlaces se abren normalmente.
    if (!requestPath) return;
    event.preventDefault();
    if (opening) return;

    setOpening(true);
    setError('');
    const popup = window.open('about:blank', '_blank');
    if (!popup) {
      setError('Permite las ventanas emergentes para abrir el documento.');
      setOpening(false);
      return;
    }
    popup.opener = null;

    try {
      const blob = await apiRequestBlob(requestPath);
      const objectUrl = URL.createObjectURL(blob);
      popup.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
    } catch (requestError) {
      popup.close();
      setError(requestError.message || 'No se pudo abrir el documento.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <span className="unit-file-link-wrap">
      <a className="unit-file-current-link" href={href} target="_blank" rel="noreferrer noopener" onClick={handleOpen}>
        {opening ? 'Abriendo…' : children}
      </a>
      {error && <small className="unit-file-link-error" role="alert">{error}</small>}
    </span>
  );
}
