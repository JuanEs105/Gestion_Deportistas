// frontend/src/components/Layout/Layout.jsx - VERSIÓN CORREGIDA
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          console.log('🔐 No autenticado, redirigiendo...');
          navigate('/login', { replace: true });
          return;
        }
        
        const user = JSON.parse(userData);
        const tipo = (user.tipo || user.role || '').toLowerCase();
        setUserType(tipo);
        
        // CORRECCIÓN: Redirigir al dashboard correcto según el rol
        const currentPath = location.pathname;
        
        if (tipo === 'admin') {
          // Si es admin y está en ruta de entrenador, redirigir a admin
          if (currentPath.startsWith('/entrenador') && currentPath !== '/entrenador') {
            navigate('/admin', { replace: true });
          } else if (currentPath === '/' || currentPath === '/entrenador') {
            navigate('/admin', { replace: true });
          }
        } else if (tipo === 'entrenador') {
          // Si es entrenador y está en ruta de admin, redirigir a entrenador
          if (currentPath.startsWith('/admin')) {
            navigate('/entrenador', { replace: true });
          } else if (currentPath === '/') {
            navigate('/entrenador', { replace: true });
          }
        } else if (tipo === 'deportista') {
          // Si es deportista y está en otra ruta, redirigir a deportista
          if (currentPath.startsWith('/admin') || currentPath.startsWith('/entrenador')) {
            navigate('/deportista', { replace: true });
          } else if (currentPath === '/') {
            navigate('/deportista', { replace: true });
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        navigate('/login', { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate, location.pathname]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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