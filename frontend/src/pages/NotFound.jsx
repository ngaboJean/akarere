// ============================================================
// 404 Not Found Page
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rwanda-dark to-blue-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={48} className="text-rwanda-yellow" />
        </div>
        <h1 className="text-8xl font-black text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Urupapuro Ntiruboneka</h2>
        <p className="text-blue-200 mb-8">Inzira washakaga ntiboneka muri sisitemu.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-white text-rwanda-dark px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
        >
          <Home size={20} />
          Subira Ahabanza
        </Link>
      </div>
    </div>
  );
}
