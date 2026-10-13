// ============================================================
// ARCHIVO: frontend/src/App.jsx  (ARCHIVO PRINCIPAL)
// ============================================================
// IMPORTACIONES:
// - react: useState
// - framer-motion: (usado en páginas hijas)
// - recharts: (usado en Dashboard)
// - ./context/AuthContext: AuthProvider
// - ./routes: AppRouter
// ============================================================
import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <AuthProvider>
      <AppRouter currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </AuthProvider>
  );
}
