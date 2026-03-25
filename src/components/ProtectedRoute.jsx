import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If the user's role isn't allowed, redirect them to their specific dashboard based on role
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "teacher") return <Navigate to="/teacher" replace />;
    if (userRole === "student") return <Navigate to="/student" replace />;
    
    // Fallback if role is completely missing or invalid
    return <Navigate to="/login" replace />;
  }

  return children;
}
