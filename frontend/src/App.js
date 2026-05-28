// ============================================================
// App.js - Main Router
// ============================================================
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Pages
import InjiraPage       from './pages/auth/InjiraPage';
import IyandikishaPage  from './pages/auth/IyandikishaPage';

// Citizen Portal
import UmuturageDashboard from './pages/umuturage/Dashboard';
import GutangaIkibazo     from './pages/umuturage/GutangaIkibazo';
import IbibazoBye         from './pages/umuturage/IbibazoBye';
import GusabaImpushya     from './pages/umuturage/GusabaImpushya';

// Leader Dashboard (Village/Cell/Sector)
import LeaderDashboard    from './pages/leader/Dashboard';
import IbibazoBihawe      from './pages/leader/IbibazoBihawe';
import IkibazoCyimbitse   from './pages/leader/IkibazoCyimbitse';
import ImpushyaZisabwa    from './pages/leader/ImpushyaZisabwa';
import InyandikoZibanga   from './pages/leader/InyandikoZibanga';

// District Dashboard
import AkarareDashboard   from './pages/akarere/Dashboard';
import AbakoreshaPage     from './pages/akarere/Abakoresha';
import IbikorwaPage       from './pages/akarere/Ibikorwa';
import RaporoPage         from './pages/akarere/Raporo';

// Layout
import ProtectedRoute     from './components/layout/ProtectedRoute';
import NotFound           from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Inter, sans-serif' }
        }}
      />
      <Routes>
        {/* Auth Routes */}
        <Route path="/injira"      element={<InjiraPage />} />
        <Route path="/iyandikisha" element={<IyandikishaPage />} />

        {/* Citizen Routes */}
        <Route path="/umuturage" element={
          <ProtectedRoute roles={['umuturage']}>
            <UmuturageDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<IbibazoBye />} />
          <Route path="gutanga-ikibazo" element={<GutangaIkibazo />} />
          <Route path="ibibazo"         element={<IbibazoBye />} />
          <Route path="impushya"        element={<GusabaImpushya />} />
        </Route>

        {/* Leader Routes (Village / Cell / Sector) */}
        <Route path="/umuyobozi" element={
          <ProtectedRoute roles={['umukuru_umudugudu','es_akagari','es_umurenge']}>
            <LeaderDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<IbibazoBihawe />} />
          <Route path="ibibazo"          element={<IbibazoBihawe />} />
          <Route path="ikibazo/:id"      element={<IkibazoCyimbitse />} />
          <Route path="impushya"         element={<ImpushyaZisabwa />} />
          <Route path="inyandiko"        element={<InyandikoZibanga />} />
        </Route>

        {/* District Admin Routes */}
        <Route path="/akarere" element={
          <ProtectedRoute roles={['admin_akarere']}>
            <AkarareDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<RaporoPage />} />
          <Route path="raporo"     element={<RaporoPage />} />
          <Route path="abakoresha" element={<AbakoreshaPage />} />
          <Route path="ibikorwa"   element={<IbikorwaPage />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<SmartRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Redirect bitewe n'uruhare
function SmartRedirect() {
  const { umukoresha } = useAuthStore();
  if (!umukoresha) return <Navigate to="/injira" replace />;
  const redirectMap = {
    umuturage:          '/umuturage',
    umukuru_umudugudu:  '/umuyobozi',
    es_akagari:         '/umuyobozi',
    es_umurenge:        '/umuyobozi',
    admin_akarere:      '/akarere',
  };
  return <Navigate to={redirectMap[umukoresha.role_slug] || '/injira'} replace />;
}

export default App;
