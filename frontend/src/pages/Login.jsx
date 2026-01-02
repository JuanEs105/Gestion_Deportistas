// frontend/src/pages/Login.jsx - VERSIÓN CORREGIDA
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Intentando login...');
      console.log('📧 Email:', email);
      console.log('🌐 URL:', 'http://localhost:5000/api/auth/login');
      
      // Petición de login
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos timeout
      });

      console.log('✅ Respuesta recibida:', response.data);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Respuesta del servidor incompleta');
      }
      
      // Normalizar usuario
      const normalizedUser = {
        id: user.id,
        nombre: user.nombre || user.name || 'Usuario',
        email: user.email,
        tipo: user.tipo || user.role || 'usuario',
        telefono: user.telefono,
        activo: user.activo
      };
      
      console.log('💾 Guardando usuario:', normalizedUser);
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      // Verificar que se guardó
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const savedToken = localStorage.getItem('token');
      
      console.log('✅ Usuario guardado:', savedUser);
      console.log('✅ Token guardado:', savedToken ? 'Sí' : 'No');
      
      // Redirigir según tipo
      const userType = normalizedUser.tipo.toLowerCase();
      console.log('🔀 Redirigiendo a:', userType === 'entrenador' ? '/entrenador' : '/deportista');
      
      if (userType === 'entrenador' || userType === 'admin') {
        navigate('/entrenador');
      } else if (userType === 'deportista') {
        navigate('/deportista');
      } else {
        throw new Error(`Tipo de usuario no reconocido: ${userType}`);
      }
      
    } catch (err) {
      console.error('❌ Error completo:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Tiempo de espera agotado. Verifica que el backend esté corriendo.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('No se pudo conectar al servidor. Asegúrate que el backend esté en http://localhost:5000');
      } else if (err.response) {
        // Error del servidor
        console.error('📄 Respuesta de error:', err.response.data);
        setError(err.response.data?.error || 'Credenciales inválidas');
      } else if (err.request) {
        // No hubo respuesta
        console.error('📡 Sin respuesta del servidor');
        setError('El servidor no responde. Verifica que el backend esté corriendo en http://localhost:5000');
      } else {
        // Otro error
        setError(err.message || 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Sistema de Gestión Deportiva
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión con tus credenciales
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error de autenticación</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Conectando...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Credenciales de prueba:
              </p>
              <div className="text-xs text-blue-800 space-y-2">
                <div className="bg-white rounded p-2">
                  <p className="font-medium">Entrenador:</p>
                  <p className="font-mono">entrenador@deportes.com</p>
                  <p className="font-mono">password123</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="font-medium">Deportista:</p>
                  <p className="font-mono">carlos@deportes.com</p>
                  <p className="font-mono">password123</p>
                </div>
              </div>
            </div>
            
            {/* Indicador de estado del backend */}
            <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>Backend: http://localhost:5000</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;