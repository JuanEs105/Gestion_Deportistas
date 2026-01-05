// frontend/src/components/Layout/Layout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // Si no hay usuario o token, redirigir al login
        if (!userData || !token) {
          console.log('🔐 No autenticado, redirigiendo...');
          navigate('/login', { replace: true });
          return;
        }
        
        // Si hay usuario, continuar
        setIsLoading(false);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        navigate('/login', { replace: true });
      }
    };
    
    // Pequeño delay para asegurar que React Router esté listo
    setTimeout(checkAuth, 100);
  }, [navigate]);
  
  // Obtener tipo de usuario del localStorage
  const getUserType = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return 'entrenador';
      
      const user = JSON.parse(userData);
      return user.tipo || user.role || 'entrenador';
    } catch (error) {
      return 'entrenador';
    }
  };
  
  const userType = getUserType();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Mostrar loader mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar tipoUsuario={userType} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;