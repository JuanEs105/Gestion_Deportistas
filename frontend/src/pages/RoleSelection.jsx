import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'deportista',
      title: 'DEPORTISTA',
      icon: '🏃‍♂️',
      description: 'Soy miembro del club',
      color: 'from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700',
      action: () => navigate('/deportista-acceso')
    },
    {
      id: 'entrenador',
      title: 'ENTRENADOR',
      icon: '👨‍🏫',
      description: 'Soy entrenador',
      color: 'from-gray-700 to-gray-800',
      hoverColor: 'hover:from-gray-800 hover:to-gray-900',
      action: () => navigate('/login', { state: { role: 'entrenador' } })
    },
    {
      id: 'admin',
      title: 'ADMINISTRADOR',
      icon: '👨‍💼',
      description: 'Gestión del sistema',
      color: 'from-black to-gray-900',
      hoverColor: 'hover:from-gray-900 hover:to-black',
      action: () => navigate('/login', { state: { role: 'admin' } })
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/escudo-titanes.png" 
              alt="Titanes Cheer Evolution" 
              className="h-28 w-28 object-contain animate-bounce"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-3">
            TITANES
          </h1>
          <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-4">
            CHEER EVOLUTION
          </h2>
          <p className="text-xl text-gray-400 mb-2">Sistema de Gestión Deportiva</p>
          <div className="w-32 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto"></div>
        </div>

        {/* Título de selección */}
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          ¿Cómo deseas ingresar?
        </h2>

        {/* Grid de roles CENTRADO */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={role.action}
                className="group relative"
              >
                {/* Card */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-red-500/50 h-full flex flex-col items-center">
                  {/* Icono con gradiente */}
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${role.color} ${role.hoverColor} flex items-center justify-center text-6xl mb-6 shadow-xl transform transition-transform duration-300 group-hover:rotate-12`}>
                    {role.icon}
                  </div>

                  {/* Título */}
                  <h3 className={`text-2xl font-black mb-3 bg-gradient-to-r ${role.color} bg-clip-text text-transparent`}>
                    {role.title}
                  </h3>

                  {/* Descripción */}
                  <p className="text-gray-600 text-center mb-6 font-medium">
                    {role.description}
                  </p>

                  {/* Indicador hover */}
                  <div className="mt-auto">
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center text-sm font-bold bg-gradient-to-r ${role.color} bg-clip-text text-transparent`}>
                      <span>Ingresar</span>
                      <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Brillo hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${role.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10`}></div>
              </button>
            ))}
          </div>
        </div>

        {/* Botón volver a inicio */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Volver al sitio web</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;