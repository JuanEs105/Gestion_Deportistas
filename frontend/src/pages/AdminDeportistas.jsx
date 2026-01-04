// frontend/src/pages/AdminDeportistas.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI, deportistasAPI, uploadAPI } from '../../services/api';

const AdminDeportistas = () => {
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [deportistaEditando, setDeportistaEditando] = useState(null);
  const [mostrarModalFoto, setMostrarModalFoto] = useState(false);
  const [deportistaFoto, setDeportistaFoto] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    fecha_nacimiento: '',
    altura: '',
    peso: '',
    nivel_actual: '1_basico',
    estado: 'activo',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_parentesco: ''
  });

  useEffect(() => {
    cargarDeportistas();
  }, []);

  const cargarDeportistas = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllDeportistasGlobal();
      setDeportistas(response.deportistas || []);
    } catch (error) {
      console.error('Error cargando deportistas:', error);
      alert('Error al cargar deportistas');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoDeportista = () => {
    setModoEdicion(false);
    setDeportistaEditando(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      telefono: '',
      fecha_nacimiento: '',
      altura: '',
      peso: '',
      nivel_actual: '1_basico',
      estado: 'activo',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      contacto_emergencia_parentesco: ''
    });
    setMostrarFormulario(true);
  };

  const handleEditarDeportista = (deportista) => {
    setModoEdicion(true);
    setDeportistaEditando(deportista);
    
    let fechaNacimiento = '';
    if (deportista.fecha_nacimiento) {
      const fecha = new Date(deportista.fecha_nacimiento);
      fechaNacimiento = fecha.toISOString().split('T')[0];
    }
    
    setFormData({
      nombre: deportista.User?.nombre || '',
      email: deportista.User?.email || '',
      password: '',
      telefono: deportista.User?.telefono || '',
      fecha_nacimiento: fechaNacimiento,
      altura: deportista.altura || '',
      peso: deportista.peso || '',
      nivel_actual: deportista.nivel_actual || '1_basico',
      estado: deportista.estado || 'activo',
      contacto_emergencia_nombre: deportista.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: deportista.contacto_emergencia_telefono || '',
      contacto_emergencia_parentesco: deportista.contacto_emergencia_parentesco || ''
    });
    setMostrarFormulario(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (modoEdicion) {
        await deportistasAPI.update(deportistaEditando.id, formData);
        alert('✅ Deportista actualizado exitosamente');
      } else {
        await deportistasAPI.create(formData);
        alert('✅ Deportista creado exitosamente');
      }
      
      setMostrarFormulario(false);
      await cargarDeportistas();
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar al deportista ${nombre}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await deportistasAPI.delete(id);
      alert('✅ Deportista eliminado exitosamente');
      await cargarDeportistas();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModalFoto = (deportista) => {
    setDeportistaFoto(deportista);
    setArchivoFoto(null);
    setPreviewFoto(deportista.foto_perfil || null);
    setMostrarModalFoto(true);
  };

  const handleSeleccionarFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('❌ Tipo de archivo no permitido');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ El archivo es demasiado grande. Máximo: 5MB');
        return;
      }
      
      setArchivoFoto(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirFoto = async () => {
    if (!archivoFoto) {
      alert('⚠️ Por favor selecciona una imagen');
      return;
    }
    
    try {
      setLoading(true);
      await uploadAPI.uploadDeportistaFoto(deportistaFoto.id, archivoFoto);
      alert('✅ Foto actualizada exitosamente');
      setMostrarModalFoto(false);
      await cargarDeportistas();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al subir la foto');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (!window.confirm('¿Estás seguro de eliminar la foto de perfil?')) {
      return;
    }
    
    try {
      setLoading(true);
      await uploadAPI.deleteDeportistaFoto(deportistaFoto.id);
      alert('✅ Foto eliminada exitosamente');
      setMostrarModalFoto(false);
      await cargarDeportistas();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al eliminar la foto');
    } finally {
      setLoading(false);
    }
  };

  const deportistasFiltrados = deportistas.filter(deportista => {
    const nombre = deportista.User?.nombre || '';
    const email = deportista.User?.email || '';
    
    const matchNombre = nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmail = email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBusqueda = searchTerm === '' || matchNombre || matchEmail;
    
    const matchNivel = filtroNivel === 'todos' || deportista.nivel_actual === filtroNivel;
    const matchEstado = filtroEstado === 'todos' || deportista.estado === filtroEstado;
    
    return matchBusqueda && matchNivel && matchEstado;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏃 Vista Global de Deportistas
          </h1>
          <p className="text-gray-600">Todos los deportistas del sistema</p>
        </div>
        
        <button
          onClick={handleNuevoDeportista}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <span className="text-2xl">➕</span>
          <span>Nuevo Deportista</span>
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 Filtrar por Nivel
            </label>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="todos">Todos los niveles</option>
              <option value="1_basico">1 Básico</option>
              <option value="1_medio">1 Medio</option>
              <option value="1_avanzado">1 Avanzado</option>
              <option value="2">Nivel 2</option>
              <option value="3">Nivel 3</option>
              <option value="4">Nivel 4</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Filtrar por Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="lesionado">Lesionado</option>
              <option value="descanso">Descanso</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Total</h3>
          <p className="text-4xl font-bold">{deportistas.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Activos</h3>
          <p className="text-4xl font-bold">
            {deportistas.filter(d => d.estado === 'activo').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Lesionados</h3>
          <p className="text-4xl font-bold">
            {deportistas.filter(d => d.estado === 'lesionado').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Filtrados</h3>
          <p className="text-4xl font-bold">{deportistasFiltrados.length}</p>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Foto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Nivel</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : deportistasFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <div className="text-6xl mb-4">🏃</div>
                    <p>No hay deportistas</p>
                  </td>
                </tr>
              ) : (
                deportistasFiltrados.map((deportista) => (
                  <tr key={deportista.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      {deportista.foto_perfil ? (
                        <img
                          src={deportista.foto_perfil}
                          alt={deportista.User?.nombre}
                          className="h-12 w-12 rounded-full object-cover shadow"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow">
                          <span className="text-white font-bold text-lg">
                            {deportista.User?.nombre?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {deportista.User?.nombre || 'Sin nombre'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {deportista.User?.email || 'Sin email'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {deportista.nivel_actual || 'Sin nivel'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        deportista.estado === 'activo' 
                          ? 'bg-green-100 text-green-800'
                          : deportista.estado === 'lesionado'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {deportista.estado || 'desconocido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAbrirModalFoto(deportista)}
                          className="text-purple-600 hover:text-purple-900 transition p-1"
                          title="Cambiar foto"
                        >
                          📸
                        </button>
                        <button
                          onClick={() => handleEditarDeportista(deportista)}
                          className="text-blue-600 hover:text-blue-900 transition p-1"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleEliminar(deportista.id, deportista.User?.nombre)}
                          className="text-red-600 hover:text-red-900 transition p-1"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO DEPORTISTA */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">
                {modoEdicion ? '✏️ Editar Deportista' : '➕ Nuevo Deportista'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Información Personal */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">👤 Información Personal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      disabled={modoEdicion}
                      className={`w-full px-4 py-3 border-2 rounded-lg ${modoEdicion ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'}`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  {!modoEdicion && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required={!modoEdicion}
                        minLength="6"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Información Deportiva */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">🏋️ Información Deportiva</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Altura (cm)</label>
                    <input
                      type="number"
                      value={formData.altura}
                      onChange={(e) => setFormData({...formData, altura: e.target.value})}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Peso (kg)</label>
                    <input
                      type="number"
                      value={formData.peso}
                      onChange={(e) => setFormData({...formData, peso: e.target.value})}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nivel *</label>
                    <select
                      value={formData.nivel_actual}
                      onChange={(e) => setFormData({...formData, nivel_actual: e.target.value})}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="1_basico">1 Básico</option>
                      <option value="1_medio">1 Medio</option>
                      <option value="1_avanzado">1 Avanzado</option>
                      <option value="2">Nivel 2</option>
                      <option value="3">Nivel 3</option>
                      <option value="4">Nivel 4</option>
                    </select>
                  </div>
                  {modoEdicion && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="activo">Activo</option>
                        <option value="lesionado">Lesionado</option>
                        <option value="descanso">Descanso</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">🚨 Contacto de Emergencia</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={formData.contacto_emergencia_nombre}
                      onChange={(e) => setFormData({...formData, contacto_emergencia_nombre: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="María Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.contacto_emergencia_telefono}
                      onChange={(e) => setFormData({...formData, contacto_emergencia_telefono: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Parentesco</label>
                    <input
                      type="text"
                      value={formData.contacto_emergencia_parentesco}
                      onChange={(e) => setFormData({...formData, contacto_emergencia_parentesco: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Madre"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition shadow-lg disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '⏳ Guardando...' : modoEdicion ? '✅ Actualizar' : '✅ Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOTO */}
      {mostrarModalFoto && deportistaFoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">📸 Foto de Perfil</h3>
              <p className="text-purple-100">{deportistaFoto.User?.nombre}</p>
            </div>

            <div className="p-6">
              {/* Vista previa de foto */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-48 h-48 mb-4 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden shadow-lg">
                  {previewFoto ? (
                    <img
                      src={previewFoto}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-6xl text-gray-400 mb-2">📷</div>
                      <p className="text-gray-500">Sin foto</p>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 text-center mb-4">
                  Tamaño recomendado: 500x500px<br />
                  Formatos: JPG, PNG, GIF, WebP<br />
                  Máximo: 5MB
                </p>
              </div>

              {/* Botones de selección */}
              <div className="mb-6">
                <label className="block mb-4">
                  <span className="block text-sm font-semibold text-gray-700 mb-2">
                    Seleccionar nueva foto:
                  </span>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md">
                      📁 Elegir archivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSeleccionarFoto}
                        className="hidden"
                      />
                    </label>
                    <span className="text-sm text-gray-600">
                      {archivoFoto ? archivoFoto.name : 'Ningún archivo seleccionado'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                {previewFoto && deportistaFoto.foto_perfil && (
                  <button
                    type="button"
                    onClick={handleEliminarFoto}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-semibold transition shadow disabled:opacity-50"
                    disabled={loading}
                  >
                    🗑️ Eliminar foto
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setMostrarModalFoto(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                  disabled={loading}
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={handleSubirFoto}
                  disabled={!archivoFoto || loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition shadow disabled:opacity-50"
                >
                  {loading ? '⏳ Subiendo...' : '✅ Guardar foto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeportistas;