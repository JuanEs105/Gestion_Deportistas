// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      
      // CORRECCIÓN: Usar 'role' en lugar de 'tipo'
      const normalizedUser = {
        id: user.id,
        nombre: user.nombre || user.name,
        email: user.email,
        tipo: user.role || user.tipo,  // ← ¡FIX!
        telefono: user.telefono,
        activo: user.activo,
        // Añadir deportistaProfile si existe
        deportistaProfile: user.deportista || null
      };
      
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="correo@ejemplo.com"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Conectando...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* CREDENCIALES DE PRUEBA - ACTUALIZADAS */}
        <div className="mt-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Credenciales de prueba:
            </p>
            <div className="text-xs text-blue-800 space-y-2">
              <div className="bg-white rounded p-2">
                <p className="font-medium">Entrenador (usa estas):</p>
                <p className="font-mono">entrenadors@deporters.com</p>
                <p className="font-mono">pasavant323</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="font-medium">O prueba con:</p>
                <p className="font-mono">pipe@gmail.com</p>
                <p className="font-mono">(tu contraseña)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;