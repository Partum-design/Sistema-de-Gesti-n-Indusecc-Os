import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, role, children }) => {
  // 1. Si no hay usuario, mandamos al login de inmediato
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si el rol no coincide (seguridad extra), mandamos al login
  if (user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si todo está bien, mostramos el contenido
  return children;
};

export default ProtectedRoute;