// frontend/src/components/Layout/Header.jsx - VERSIÓN ACTUALIZADA
import React from 'react';
import NotificacionesMejoradas from '../NotificacionesMejoradas';

const Header = ({ onLogout }) => {
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      
      return {
        nombre: user.nombre || user.name || 'Usuario',
        email: user.email || '',
        tipo: user.tipo || user.role || user.rol || 'usuario'
      };
    } catch (error) {
      return null;
    }
  };
  
  const user = getUserFromStorage();
  
  if (!user) {
    return (
      <header className="bg-white shadow">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Sistema de Gestión Deportiva
          </h2>
        </div>
      </header>
    );
  }
  
  const getPanelTitle = () => {
    const userType = user.tipo?.toLowerCase();
    
    if (userType === 'admin') {
      return 'Panel de Administración';
    } else if (userType === 'entrenador') {
      return 'Panel del Entrenador';
    } else if (userType === 'deportista') {
      return 'Panel del Deportista';
    }
    return 'Panel de Usuario';
  };
  
  const esEntrenadorOAdmin = user.tipo?.toLowerCase() === 'entrenador' || user.tipo?.toLowerCase() === 'admin';
  
  return (
    <header className="bg-white shadow-md">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {getPanelTitle()}
          </h2>
          <p className="text-sm text-gray-600">
            Bienvenido, <span className="font-semibold">{user.nombre}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* NOTIFICACIONES MEJORADAS (solo para entrenadores/admins) */}
          {esEntrenadorOAdmin && <NotificacionesMejoradas />}
          
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-500">Usuario</p>
            <p className="text-sm text-gray-700 font-medium">{user.email}</p>
          </div>
          
          <button
            onClick={onLogout}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;