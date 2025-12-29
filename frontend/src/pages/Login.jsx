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
      // CONEXIÓN REAL CON BACKEND
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      console.log('Respuesta completa del backend:', response.data);
      
      const { token, user } = response.data;
      
      // DEBUG: Ver qué campos viene del backend
      console.log('Usuario del backend:', user);
      console.log('Campo "tipo":', user.tipo);
      console.log('Campo "role":', user.role);
      console.log('Campo "rol":', user.rol);
      
      // NORMALIZAR DATOS DEL USUARIO (compatible con backend)
      const normalizedUser = {
        ...user,
        // Asegurar que siempre tengamos 'tipo'
        tipo: user.tipo || user.role || user.rol || 'usuario',
        // Asegurar que siempre tengamos 'nombre' (no 'name')
        nombre: user.nombre || user.name || 'Usuario'
      };
      
      console.log('Usuario normalizado para frontend:', normalizedUser);
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      // DEBUG: Verificar lo guardado
      const savedUser = JSON.parse(localStorage.getItem('user'));
      console.log('Usuario guardado en localStorage:', savedUser);
      
      // Redirigir según el tipo de usuario
      const userType = normalizedUser.tipo;
      console.log('Tipo de usuario para redirección:', userType);
      
      if (userType === 'entrenador' || userType === 'admin') {
        navigate('/entrenador');
      } else if (userType === 'deportista') {
        navigate('/deportista');
      } else {
        console.error('Tipo de usuario no reconocido:', userType);
        setError(`Tipo de usuario no reconocido: ${userType}`);
      }
      
    } catch (err) {
      console.error('Error completo en login:', err);
      console.error('Respuesta de error:', err.response);
      
      setError(
        err.response?.data?.error || 
        err.message ||
        'Error al conectar con el servidor. Verifica que el backend esté corriendo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Gestión Deportiva
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión con tus credenciales
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
              <strong>Error:</strong> {error}
              <div className="text-xs mt-1 text-red-500">
                Verifica las credenciales y que el backend esté corriendo
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Conectando...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p className="font-semibold mb-2">Credenciales de prueba:</p>
            <div className="bg-gray-50 p-3 rounded space-y-1">
              <p className="mb-1">
                <span className="font-medium">Entrenador:</span><br/>
                <code className="text-xs">entrenador@deportes.com</code> / 
                <code className="text-xs">password123</code>
              </p>
              <p>
                <span className="font-medium">Deportista:</span><br/>
                <code className="text-xs">carlos@deportes.com</code> / 
                <code className="text-xs">password123</code>
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs text-yellow-800 font-medium mb-1">
                ⚠️ Verificación de conexión
              </p>
              <p className="text-xs text-yellow-700">
                1. Asegúrate que el backend esté corriendo en:
                <br/>
                <code className="font-mono bg-yellow-100 px-1">http://localhost:5000</code>
                <br/>
                2. Abre la consola (F12) para ver logs detallados
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;