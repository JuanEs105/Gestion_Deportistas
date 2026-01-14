// frontend/src/pages/Entrenador/EditarDeportista.jsx - CON EQUIPOS
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deportistasAPI } from '../../services/api';
import { EQUIPOS_OPCIONES, getEquipoColor, getNivelNombre } from '../../utils/constants';

const EditarDeportista = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [deportista, setDeportista] = useState(null);
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    altura: '',
    peso: '',
    nivel_actual: '',
    equipo_competitivo: 'sin_equipo', // 🆕 NUEVO CAMPO
    estado: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const niveles = user?.niveles_asignados || [];
    setNivelesAsignados(niveles);
    
    cargarDeportista();
  }, [id]);

  const cargarDeportista = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Cargando deportista ID:', id);
      
      const response = await deportistasAPI.getById(id);
      console.log('📥 Respuesta:', response);
      
      const data = response.deportista || response;
      
      if (!data) {
        throw new Error('No se recibieron datos del deportista');
      }
      
      console.log('✅ Deportista cargado:', data);
      setDeportista(data);
      
      setFormData({
        altura: data.altura || '',
        peso: data.peso || '',
        nivel_actual: data.nivel_actual || 'pendiente',
        equipo_competitivo: data.equipo_competitivo || 'sin_equipo', // 🆕
        estado: data.estado || 'activo'
      });
      
    } catch (error) {
      console.error('❌ Error cargando deportista:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error al cargar deportista';
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setGuardando(true);
      console.log('💾 Guardando datos:', formData);
      
      await deportistasAPI.update(id, formData);
      
      alert('✅ Deportista actualizado exitosamente');
      navigate('/entrenador/deportistas');
    } catch (error) {
      console.error('❌ Error actualizando deportista:', error);
      alert('❌ Error al actualizar: ' + (error.response?.data?.error || error.message));
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
        <div className="flex flex-col justify-center items-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">
              ⏳
            </div>
          </div>
          <span className="mt-6 text-xl font-bold text-gray-600">Cargando deportista...</span>
        </div>
      </div>
    );
  }

  if (error || !deportista) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 min-h-screen">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <span className="text-6xl mr-4">⚠️</span>
              <div>
                <h2 className="text-2xl font-bold text-red-700">Error al cargar deportista</h2>
                <p className="text-gray-600">{error || 'No se encontró el deportista'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/entrenador/deportistas')}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-bold transition-all shadow-lg"
            >
              ← Volver a deportistas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nombre = deportista.user?.nombre || deportista.nombre || 'Sin nombre';
  const email = deportista.user?.email || deportista.email || 'Sin email';
  const telefono = deportista.user?.telefono || deportista.telefono;
  const foto = deportista.foto_perfil || deportista.user?.foto_perfil;
  const equipoActual = formData.equipo_competitivo;
  const colorEquipo = getEquipoColor(equipoActual);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.4s ease-out; }
      `}</style>

      {/* HEADER */}
      <div className="mb-8 animate-slide-in">
        <button
          onClick={() => navigate('/entrenador/deportistas')}
          className="group flex items-center text-blue-600 hover:text-blue-800 font-bold mb-6 transition-all transform hover:scale-105"
        >
          <svg className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a deportistas
        </button>
        
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-3xl shadow-2xl text-white">
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <span className="text-5xl">✏️</span>
            Editar Deportista
          </h1>
          <p className="text-blue-100 text-lg">
            Como entrenador, puedes editar: peso, altura, nivel, equipo y estado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INFORMACIÓN NO EDITABLE (SOLO VISTA) */}
        <div className="lg:col-span-1 animate-slide-in">
          <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6 border border-gray-100">
            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-blue-100 p-2 rounded-lg text-2xl">📋</span>
              Info del Deportista
            </h3>
            
            {/* Foto */}
            <div className="flex justify-center mb-6">
              {foto ? (
                <img
                  src={foto}
                  alt={nombre}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-xl ring-4 ring-blue-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-200 shadow-xl">
                  <span className="text-white text-5xl font-black">
                    {nombre?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Datos no editables */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-xs font-black text-gray-500 uppercase mb-1 tracking-wide">
                  Nombre
                </label>
                <p className="text-lg font-bold text-gray-800">{nombre}</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-xs font-black text-gray-500 uppercase mb-1 tracking-wide">
                  Email
                </label>
                <p className="text-sm text-gray-700 break-all">{email}</p>
              </div>

              {telefono && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1 tracking-wide">
                    Teléfono
                  </label>
                  <p className="text-sm text-gray-700 font-mono">{telefono}</p>
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                <p className="text-xs text-blue-700 flex items-center font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Estos campos no son editables por entrenadores
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO EDITABLE */}
        <div className="lg:col-span-2 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3">
              <span className="bg-purple-100 p-3 rounded-xl text-3xl">📝</span>
              Campos Editables
            </h3>

            <div className="space-y-6">
              
              {/* ALTURA */}
              <div className="group">
                <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 p-2 rounded-lg">📏</span>
                  Altura (cm)
                </label>
                <input
                  type="number"
                  name="altura"
                  value={formData.altura}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="300"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all text-lg font-semibold shadow-sm hover:shadow-md"
                  placeholder="Ej: 175"
                />
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  Ingresa la altura en centímetros
                </p>
              </div>

              {/* PESO */}
              <div className="group">
                <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-green-100 p-2 rounded-lg">⚖️</span>
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="300"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all text-lg font-semibold shadow-sm hover:shadow-md"
                  placeholder="Ej: 70"
                />
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  Ingresa el peso en kilogramos
                </p>
              </div>

              {/* NIVEL ACTUAL */}
              <div className="group">
                <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-purple-100 p-2 rounded-lg">🎯</span>
                  Nivel Actual *
                </label>
                <select
                  name="nivel_actual"
                  value={formData.nivel_actual}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-lg font-semibold shadow-sm hover:shadow-md cursor-pointer"
                >
                  <option value="pendiente">Pendiente (Sin asignar)</option>
                  {nivelesAsignados.map(nivel => (
                    <option key={nivel} value={nivel}>
                      {getNivelNombre(nivel)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center gap-1">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold">ℹ️</span>
                  Solo puedes asignar: {nivelesAsignados.map(n => getNivelNombre(n)).join(', ')}
                </p>
              </div>

              {/* 🆕 EQUIPO DE COMPETENCIA */}
              <div className="group">
                <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-yellow-100 p-2 rounded-lg">🏆</span>
                  Equipo de Competencia
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorEquipo.bg} ${colorEquipo.text}`}>
                    {EQUIPOS_OPCIONES.find(e => e.value === equipoActual)?.label || 'Sin Equipo'}
                  </span>
                </label>
                <select
                  name="equipo_competitivo"
                  value={formData.equipo_competitivo}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all text-lg font-semibold shadow-sm hover:shadow-md cursor-pointer"
                >
                  {EQUIPOS_OPCIONES.map(equipo => (
                    <option key={equipo.value} value={equipo.value}>
                      {equipo.emoji} {equipo.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center gap-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">ℹ️</span>
                  El equipo de competencia es independiente del nivel
                </p>
              </div>

              {/* ESTADO */}
              <div className="group">
                <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-orange-100 p-2 rounded-lg">📊</span>
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all text-lg font-semibold shadow-sm hover:shadow-md cursor-pointer"
                >
                  <option value="activo">✅ Activo</option>
                  <option value="lesionado">🤕 Lesionado</option>
                  <option value="descanso">😴 Descanso</option>
                  <option value="inactivo">❌ Inactivo</option>
                  <option value="falta de pago">💰 Falta de pago</option>
                </select>
              </div>

            </div>

            {/* BOTONES */}
            <div className="flex space-x-4 mt-10 pt-8 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/entrenador/deportistas')}
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-black text-lg transition-all transform hover:scale-105 shadow-md"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 font-black text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={guardando}
              >
                {guardando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  '✅ Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default EditarDeportista;