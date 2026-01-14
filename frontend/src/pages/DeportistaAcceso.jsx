import React from 'react';
import { useNavigate } from 'react-router-dom';

const DeportistaAcceso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Botón volver */}
        <button
          onClick={() => navigate('/acceso')}
          className="mb-6 text-gray-400 hover:text-white flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Volver</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/escudo-titanes.png" 
              alt="Titanes" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Acceso Deportista
          </h1>
          <p className="text-xl text-gray-400">¿Ya tienes una cuenta?</p>
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* SÍ tengo cuenta */}
          <button
            onClick={() => navigate('/login', { state: { role: 'deportista' } })}
            className="group relative"
          >
            <div className="bg-white rounded-3xl p-10 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-green-500/50 h-full flex flex-col items-center">
              {/* Icono */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-6xl mb-6 shadow-lg transform transition-transform duration-300 group-hover:rotate-12">
                ✅
              </div>

              {/* Título */}
              <h3 className="text-2xl font-black mb-4 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                SÍ, YA TENGO CUENTA
              </h3>

              {/* Descripción */}
              <p className="text-gray-600 text-center mb-6">
                Ya estoy registrado en el sistema y tengo mis credenciales de acceso
              </p>

              {/* Badge */}
              <div className="bg-green-50 text-green-700 px-6 py-2 rounded-full font-semibold text-sm">
                Iniciar Sesión →
              </div>
            </div>

            {/* Brillo hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
          </button>

          {/* NO tengo cuenta */}
          <button
            onClick={() => navigate('/registro-deportista')}
            className="group relative"
          >
            <div className="bg-white rounded-3xl p-10 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/50 h-full flex flex-col items-center">
              {/* Icono */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-6xl mb-6 shadow-lg transform transition-transform duration-300 group-hover:rotate-12">
                📝
              </div>

              {/* Título */}
              <h3 className="text-2xl font-black mb-4 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                NO, SOY NUEVO
              </h3>

              {/* Descripción */}
              <p className="text-gray-600 text-center mb-6">
                Quiero registrarme por primera vez en el sistema de Titanes
              </p>

              {/* Badge */}
              <div className="bg-blue-50 text-blue-700 px-6 py-2 rounded-full font-semibold text-sm">
                Crear Cuenta →
              </div>
            </div>

            {/* Brillo hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default DeportistaAcceso;