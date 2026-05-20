import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, requiredRole }) {
  const { user } = useAuth();

  // Hem React state hem localStorage kontrol et (timing sorununu önler)
  const token    = localStorage.getItem('token');
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();
  const effectiveUser = user || savedUser;

  if (!effectiveUser || !token) return <Navigate to="/login" replace />;

  if (requiredRole && !effectiveUser.roles?.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
