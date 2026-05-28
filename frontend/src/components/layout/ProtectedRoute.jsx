// ============================================================
// ProtectedRoute - Kurinda Inzira
// ============================================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, roles }) => {
  const { umukoresha, accessToken } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !umukoresha) {
    return <Navigate to="/injira" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(umukoresha.role_slug)) {
    // Redirect ku dashboard yabo
    const redirectMap = {
      umuturage:         '/umuturage',
      umukuru_umudugudu: '/umuyobozi',
      es_akagari:        '/umuyobozi',
      es_umurenge:       '/umuyobozi',
      admin_akarere:     '/akarere',
    };
    return <Navigate to={redirectMap[umukoresha.role_slug] || '/injira'} replace />;
  }

  return children;
};

export default ProtectedRoute;
