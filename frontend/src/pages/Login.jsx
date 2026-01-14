import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 🔥 CORRECCIÓN 1: Limpiar localStorage al montar el componente
  useEffect(() => {
    console.log('🧹 Limpiando localStorage al iniciar Login...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      // NORMALIZAR usuario con TODOS los campos
      const normalizedUser = {
        id: user.id,
        nombre: user.nombre || user.name,
        name: user.nombre || user.name,
        email: user.email,
        tipo: user.role || user.tipo,
        role: user.role || user.tipo,
        telefono: user.telefono,
        activo: user.activo,
        niveles_asignados: user.niveles_asignados || [], // ← CRÍTICO
        deportistaProfile: user.deportista || null
      };

      console.log('✅ Usuario normalizado:', normalizedUser);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      // CORRECCIÓN: Usar user.role para determinar redirección
      const userRole = normalizedUser.tipo.toLowerCase();
      
      // Redirigir según tipo de usuario
      if (userRole === 'admin' || userRole === 'entrenador') {
        navigate('/entrenador');
      } else {
        navigate('/deportista');
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón Volver al Inicio - SUPERIOR IZQUIERDA */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 text-gray-700 hover:text-gray-900 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-semibold">Volver al inicio</span>
      </button>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 relative overflow-hidden">
        
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          {/* Tarjeta de login */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 py-8 px-6 text-center">
              <div className="inline-block bg-white/20 p-4 rounded-2xl mb-4 backdrop-blur-sm">
                <span className="text-4xl">🏆</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">
                Titanes Cheer Evolution
              </h2>
              <p className="text-red-100 font-medium">
                Sistema de Gestión Deportiva
              </p>
            </div>

            {/* Formulario */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-300"
                      placeholder="correo@ejemplo.com"
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-300"
                      placeholder="••••••••"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Recordar sesión
                    </label>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Conectando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Iniciar sesión</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </button>
              </form>

              {/* Separador */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">¿No tienes cuenta?</span>
                  </div>
                </div>
              </div>

              {/* Botón contacto */}
              <div className="mt-6">
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-4 border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold rounded-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Contactar administración</span>
                  </div>
                </button>
              </div>

              {/* Credenciales de prueba */}
              <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                  Credenciales de Prueba
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-gray-300">
                    <p className="font-semibold text-gray-900 mb-1 text-sm">👨‍🏫 Entrenador (Recomendado)</p>
                    <div className="space-y-1">
                      <p className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded">entrenadors@deporters.com</p>
                      <p className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded">pasavant323</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-300">
                    <p className="font-semibold text-gray-900 mb-1 text-sm">👤 Deportista</p>
                    <div className="space-y-1">
                      <p className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded">pipe@gmail.com</p>
                      <p className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded">(tu contraseña)</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Usa estas credenciales para probar el sistema
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 py-4 px-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Titanes Cheer Evolution. Todos los derechos reservados.
              </p>
            </div>
          </div>

          {/* Mensaje adicional */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Al iniciar sesión, aceptas nuestros{' '}
              <a href="#" className="font-semibold text-red-600 hover:text-red-700">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="#" className="font-semibold text-red-600 hover:text-red-700">
                Política de Privacidad
              </a>
            </p>
          </div>
        </div>

        {/* Logo flotante en esquina inferior derecha */}
        <div className="absolute bottom-6 right-6">
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <img 
              src="/images/escudo-titanes.png" 
              alt="Titanes Logo" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="h-8 w-8 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center"><span class="text-white font-bold text-xs">T</span></div>';
              }}
            />
            <span className="text-sm font-bold text-gray-800">TITANES</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;