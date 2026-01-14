import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ tipoUsuario }) => {
  const location = useLocation();

  const menuItemsEntrenador = [
    { path: '/entrenador', label: 'Inicio', icon: '🏠' },
    { path: '/entrenador/deportistas', label: 'Deportistas', icon: '👥' },
    { path: '/entrenador/evaluaciones', label: 'Evaluaciones', icon: '📋' },
    { path: '/entrenador/calendario', label: 'Calendario', icon: '📅' },
    { path: '/entrenador/reportes', label: 'Reportes', icon: '📊' },
  ];


  const menuItemsDeportista = [
    { path: '/deportista', label: 'Inicio', icon: '🏠' },
    { path: '/deportista/progreso', label: 'Mi Progreso', icon: '📈' },
    { path: '/deportista/evaluaciones', label: 'Mis Evaluaciones', icon: '📋' },
    { path: '/deportista/habilidades', label: 'Mis Habilidades', icon: '🎯' },
    { path: '/deportista/calendario', label: 'Calendario', icon: '📅' }
   
  ];

  const menuItemsAdmin = [
    { path: '/admin', label: 'Inicio', icon: '🏠' },
    { path: '/admin/administradores', label: 'Administradores', icon: '👑' },
    { path: '/admin/entrenadores', label: 'Entrenadores', icon: '👨‍🏫' },
    { path: '/admin/deportistas', label: 'Deportistas', icon: '🏃' },
    { path: '/admin/calendario', label: 'Calendario', icon: '📅' },
    { path: '/admin/reportes', label: 'Reportes', icon: '📊' },
  ];

  const menuItems = 
    tipoUsuario === 'admin' ? menuItemsAdmin : 
    tipoUsuario === 'entrenador' ? menuItemsEntrenador : 
    menuItemsDeportista;
  
  return (
    <div className="bg-blue-900 text-white w-64 space-y-6 py-7 px-2">
      <div className="text-white flex items-center space-x-2 px-4">
        <span className="text-2xl font-bold">🏆</span>
        <h1 className="text-xl font-bold">Sistema Deportivo</h1>
      </div>

      <nav className="mt-10">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block py-2.5 px-4 rounded transition duration-200 ${
              location.pathname === item.path
                ? 'bg-blue-700 text-white'
                : 'hover:bg-blue-700 hover:text-white'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;