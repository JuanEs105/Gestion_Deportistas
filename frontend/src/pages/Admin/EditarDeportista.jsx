// frontend/src/pages/Admin/EditarDeportista.jsx - CON EQUIPOS
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deportistasAPI } from '../../services/api';
import { NIVELES_OPCIONES, EQUIPOS_OPCIONES, getEquipoColor } from '../../utils/constants';

const EditarDeportista = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [deportista, setDeportista] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    altura: '',
    peso: '',
    nivel_actual: '',
    equipo_competitivo: 'sin_equipo', // 🆕 NUEVO CAMPO
    estado: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_parentesco: ''
  });

  useEffect(() => {
    cargarDeportista();
  }, [id]);

  const cargarDeportista = async () => {
    try {
      setLoading(true);
      const response = await deportistasAPI.getById(id);
      const data = response.deportista || response;
      
      setDeportista(data);
      
      // Formatear fecha
      let fechaNacimiento = '';
      if (data.fecha_nacimiento) {
        const fecha = new Date(data.fecha_nacimiento);
        fechaNacimiento = fecha.toISOString().split('T')[0];
      }
      
      setFormData({
        nombre: data.user?.nombre || data.nombre || '',
        email: data.user?.email || data.email || '',
        telefono: data.user?.telefono || data.telefono || '',
        fecha_nacimiento: fechaNacimiento,
        altura: data.altura || '',
        peso: data.peso || '',
        nivel_actual: data.nivel_actual || 'pendiente',
        equipo_competitivo: data.equipo_competitivo || 'sin_equipo', // 🆕
        estado: data.estado || 'activo',
        contacto_emergencia_nombre: data.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: data.contacto_emergencia_telefono || '',
        contacto_emergencia_parentesco: data.contacto_emergencia_parentesco || ''
      });
    } catch (error) {
      console.error('Error cargando deportista:', error);
      alert('Error al cargar deportista');
      navigate('/admin/deportistas');
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
      await deportistasAPI.update(id, formData);
      alert('✅ Deportista actualizado exitosamente');
      navigate('/admin/deportistas');
    } catch (error) {
      console.error('Error actualizando deportista:', error);
      alert('❌ Error al actualizar: ' + (error.response?.data?.error || error.message));
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando deportista...</span>
        </div>
      </div>
    );
  }

  if (!deportista) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          No se encontró el deportista
        </div>
      </div>
    );
  }

  const foto = deportista.foto_perfil || deportista.user?.foto_perfil;
  const nombre = deportista.user?.nombre || deportista.nombre || 'Sin nombre';
  const equipoActual = formData.equipo_competitivo;
  const colorEquipo = getEquipoColor(equipoActual);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/deportistas')}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a deportistas
        </button>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          ✏️ Editar Deportista
        </h1>
        <p className="text-gray-600">
          Como administrador, puedes editar todos los campos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 max-w-4xl">
        
        {/* FOTO DE PERFIL */}
        <div className="flex justify-center mb-8">
          {foto ? (
            <img
              src={foto}
              alt={nombre}
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-lg">
              <span className="text-white text-5xl font-bold">
                {nombre?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* INFORMACIÓN PERSONAL */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">👤 Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">El email no puede modificarse</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* INFORMACIÓN DEPORTIVA */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏋️ Información Deportiva</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Altura (cm)</label>
              <input
                type="number"
                name="altura"
                value={formData.altura}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Peso (kg)</label>
              <input
                type="number"
                name="peso"
                value={formData.peso}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nivel *</label>
              <select
                name="nivel_actual"
                value={formData.nivel_actual}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {NIVELES_OPCIONES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {/* 🆕 SELECTOR DE EQUIPO */}
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>🏆 Equipo de Competencia</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorEquipo.bg} ${colorEquipo.text}`}>
                  {EQUIPOS_OPCIONES.find(e => e.value === equipoActual)?.label || 'Sin Equipo'}
                </span>
              </label>
              <select
                name="equipo_competitivo"
                value={formData.equipo_competitivo}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {EQUIPOS_OPCIONES.map(equipo => (
                  <option key={equipo.value} value={equipo.value}>
                    {equipo.emoji} {equipo.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                El equipo de competencia es independiente del nivel del deportista
              </p>
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="activo">Activo</option>
                <option value="lesionado">Lesionado</option>
                <option value="descanso">Descanso</option>
                <option value="inactivo">Inactivo</option>
                <option value="falta de pago">Falta de pago</option>
              </select>
            </div>
          </div>
        </div>

        {/* CONTACTO DE EMERGENCIA */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🚨 Contacto de Emergencia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                name="contacto_emergencia_nombre"
                value={formData.contacto_emergencia_nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                name="contacto_emergencia_telefono"
                value={formData.contacto_emergencia_telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Parentesco</label>
              <input
                type="text"
                name="contacto_emergencia_parentesco"
                value={formData.contacto_emergencia_parentesco}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/admin/deportistas')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition shadow-lg disabled:opacity-50"
            disabled={guardando}
          >
            {guardando ? '⏳ Guardando...' : '✅ Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarDeportista;