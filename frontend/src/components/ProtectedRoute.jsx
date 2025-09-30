import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        // Se não houver token, redireciona para a página de login,
        // guardando a localização original para redirecionar de volta após o login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children; // Se houver token, renderiza o componente filho (a página protegida).
}

export default ProtectedRoute;