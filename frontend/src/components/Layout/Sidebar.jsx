import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ tipoUsuario }) => {
  const location = useLocation();
  
  const menuItemsEntrenador = [
    { path: '/entrenador', label: 'Dashboard', icon: '🏠' },
    { path: '/entrenador/deportistas', label: 'Deportistas', icon: '👥' },
    { path: '/entrenador/evaluaciones', label: 'Evaluaciones', icon: '📋' },
    { path: '/entrenador/habilidades', label: 'Habilidades', icon: '🏅' },
    { path: '/entrenador/grupos', label: 'Grupos', icon: '👨‍👩‍👧‍👦' },
  ];
  
  const menuItemsDeportista = [
    { path: '/deportista', label: 'Dashboard', icon: '🏠' },
    { path: '/deportista/progreso', label: 'Mi Progreso', icon: '📈' },
    { path: '/deportista/evaluaciones', label: 'Mis Evaluaciones', icon: '📋' },
  ];

  const menuItems = tipoUsuario === 'entrenador' ? menuItemsEntrenador : menuItemsDeportista;

  return (
    <div className="bg-blue-800 text-white w-64 space-y-6 py-7 px-2">
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