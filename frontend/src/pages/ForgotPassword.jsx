// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nueva contraseña
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/api/password-recovery/request-reset', {
        email
      });

      setSuccess('✅ Código enviado a tu email. Revisa tu bandeja de entrada.');
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/password-recovery/verify-code', {
        email,
        code
      });

      setSuccess('✅ Código verificado correctamente');
      setTimeout(() => {
        setStep(3);
        setSuccess('');
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/password-recovery/reset-password', {
        email,
        code,
        newPassword
      });

      setSuccess('✅ Contraseña restablecida exitosamente');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 py-12 px-4">
      <div className="max-w-md w-full">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && 'Ingresa tu email para recibir un código'}
            {step === 2 && 'Ingresa el código de 6 dígitos'}
            {step === 3 && 'Crea tu nueva contraseña'}
          </p>
        </div>

        {/* INDICADOR DE PASOS */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* PASO 1: EMAIL */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="tu-email@ejemplo.com"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          )}

          {/* PASO 2: CÓDIGO */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl tracking-widest font-bold"
                  placeholder="000000"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Revisa tu email ({email})
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Cambiar email
              </button>
            </form>
          )}

          {/* PASO 3: NUEVA CONTRASEÑA */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Repite la contraseña"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </button>
            </form>
          )}

          {/* MENSAJES */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* VOLVER AL LOGIN */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;