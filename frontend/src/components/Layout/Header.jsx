import React from 'react';

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
    
    if (userType === 'entrenador' || userType === 'admin') {
      return 'Panel del Entrenador';
    } else if (userType === 'deportista') {
      return 'Panel del Deportista';
    }
    return 'Panel de Usuario';
  };
  
  return (
    <header className="bg-white shadow">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {getPanelTitle()}
          </h2>
          <p className="text-sm text-gray-600">
            Bienvenido, {user.nombre}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;