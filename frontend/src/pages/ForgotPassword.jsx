// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: código + nueva contraseña
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // ⚠️ CORRECCIÓN: URL del backend
  const API_URL = 'http://localhost:5000/api/auth';

  // PASO 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // ⚠️ CORRECCIÓN: Ruta correcta
      await axios.post(`${API_URL}/forgot-password`, { email });

      setSuccess('✅ Código enviado a tu email. Revisa tu bandeja de entrada.');
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);

    } catch (err) {
      // Manejo mejorado de errores
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      'Error al enviar el código';
      setError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Cambiar contraseña (incluye verificación del código)
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validaciones frontend
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ⚠️ CORRECCIÓN: Una sola llamada para verificar y cambiar
      await axios.post(`${API_URL}/reset-password`, {
        email,
        code,
        newPassword
      });

      setSuccess('✅ Contraseña restablecida exitosamente. Redirigiendo al login...');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // Manejo detallado de errores
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      'Error al restablecer la contraseña';
      
      setError(`❌ ${errorMsg}`);
      
      // Si el código expiró o es inválido, volver al paso 1
      if (errorMsg.includes('expirado') || errorMsg.includes('inválido') || errorMsg.includes('invalido')) {
        setTimeout(() => {
          setStep(1);
          setError('El código no es válido. Solicita uno nuevo.');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-black py-12 px-4">
      <div className="max-w-md w-full">
        {/* HEADER CON ESTILO TITANES */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-red-600 to-black rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-4xl text-white">🔐</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && 'Ingresa tu email para recibir un código'}
            {step === 2 && 'Ingresa el código y tu nueva contraseña'}
          </p>
        </div>

        {/* INDICADOR DE PASOS SIMPLIFICADO */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          {/* PASO 1: SOLICITAR EMAIL */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Registrado
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  placeholder="ejemplo@email.com"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Te enviaremos un código de 6 dígitos
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email.includes('@')}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-gray-900 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando código...
                  </span>
                ) : 'Enviar Código'}
              </button>
            </form>
          )}

          {/* PASO 2: CÓDIGO Y NUEVA CONTRASEÑA */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* CÓDIGO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificación
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCode(value.slice(0, 6));
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-2xl tracking-widest font-bold"
                  placeholder="000000"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Revisa el correo: <span className="font-semibold">{email}</span>
                </p>
              </div>

              {/* NUEVA CONTRASEÑA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-purple-500"
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Repite la contraseña"
                  disabled={loading}
                />
              </div>

              {/* BOTONES */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6 || newPassword.length < 6 || confirmPassword.length < 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-gray-900 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Procesando...' : 'Cambiar Contraseña'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className="w-full py-2 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  ← Volver a solicitar código
                </button>
              </div>
            </form>
          )}

          {/* MENSAJES DE ESTADO */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* ENLACE AL LOGIN */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center mx-auto"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio de sesión
            </button>
          </div>
        </div>

        {/* INFO ADICIONAL */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>El código expira en 15 minutos. Revisa tu carpeta de spam si no lo encuentras.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;