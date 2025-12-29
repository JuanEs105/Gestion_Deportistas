import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const navigate = useNavigate();
  
  // Obtener tipo de usuario del localStorage
  const getUserType = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      return user.tipo || user.role;
    } catch (error) {
      return null;
    }
  };
  
  const userType = getUserType();
  
  // Si no hay usuario, redirigir al login
  if (!userType) {
    navigate('/login');
    return null;
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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