// frontend/src/pages/Deportistas.jsx - CON CREAR DEPORTISTA
import React, { useState, useEffect } from 'react';
import { deportistasAPI, uploadAPI } from '../services/api';

const Deportistas = () => {
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  
  // Estado del formulario
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
    fetchDeportistas();
  }, []);

  const fetchDeportistas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await deportistasAPI.getAll();
      const deportistasArray = response.data?.deportistas || response.data || [];
      
      if (!Array.isArray(deportistasArray)) {
        throw new Error('La respuesta no contiene un array de deportistas');
      }
      
      setDeportistas(deportistasArray);
      
    } catch (err) {
      console.error('❌ Error cargando deportistas:', err);
      setError(err.response?.data?.error || err.message || 'Error al cargar deportistas');
      setDeportistas([]);
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
    
    // Formatear fecha si existe
    let fechaNacimiento = '';
    if (deportista.fecha_nacimiento) {
      const fecha = new Date(deportista.fecha_nacimiento);
      fechaNacimiento = fecha.toISOString().split('T')[0];
    }
    
    setFormData({
      nombre: deportista.User?.nombre || '',
      email: deportista.User?.email || '',
      password: '', // No pre-llenar contraseña
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

  const handleSubmitFormulario = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (modoEdicion) {
        // Actualizar deportista existente
        await deportistasAPI.update(deportistaEditando.id, formData);
        alert('✅ Deportista actualizado exitosamente');
      } else {
        // Crear nuevo deportista
        await deportistasAPI.create(formData);
        alert('✅ Deportista creado exitosamente');
      }
      
      setMostrarFormulario(false);
      await fetchDeportistas();
      
    } catch (err) {
      console.error('Error guardando deportista:', err);
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este deportista? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      await deportistasAPI.delete(id);
      alert('✅ Deportista eliminado exitosamente');
      await fetchDeportistas();
    } catch (err) {
      console.error('Error eliminando deportista:', err);
      alert('❌ Error al eliminar: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('❌ Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WEBP)');
        return;
      }
      
      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ El archivo es demasiado grande. Tamaño máximo: 5MB');
        return;
      }
      
      setArchivoFoto(file);
      
      // Crear preview
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
      setArchivoFoto(null);
      setPreviewFoto(null);
      await fetchDeportistas();
      
    } catch (error) {
      console.error('Error subiendo foto:', error);
      alert('❌ Error al subir la foto: ' + (error.response?.data?.error || error.message));
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
      await fetchDeportistas();
      
    } catch (error) {
      console.error('Error eliminando foto:', error);
      alert('❌ Error al eliminar la foto: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deportistasFiltrados = deportistas.filter(deportista => {
    const matchNombre = deportista.User?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchEmail = deportista.User?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchBusqueda = searchTerm === '' || matchNombre || matchEmail;
    
    const matchNivel = filtroNivel === 'todos' || deportista.nivel_actual === filtroNivel;
    const matchEstado = filtroEstado === 'todos' || deportista.estado === filtroEstado;
    
    return matchBusqueda && matchNivel && matchEstado;
  });

  if (loading && deportistas.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Gestión de Deportistas</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">👥 Gestión de Deportistas</h1>
          <p className="text-gray-600">Administra la información de los deportistas</p>
        </div>
        
        {/* BOTÓN CREAR NUEVO */}
        <button
          onClick={handleNuevoDeportista}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <span className="text-2xl">➕</span>
          <span>Nuevo Deportista</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Foto
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deportistasFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-xl font-semibold mb-2">
                        {searchTerm || filtroNivel !== 'todos' || filtroEstado !== 'todos'
                          ? 'No se encontraron deportistas con los filtros aplicados'
                          : 'No hay deportistas registrados'}
                      </p>
                      <p className="text-gray-500">
                        {!searchTerm && filtroNivel === 'todos' && filtroEstado === 'todos' && 
                          'Haz clic en "Nuevo Deportista" para comenzar'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                deportistasFiltrados.map((deportista) => (
                  <tr key={deportista.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {deportista.foto_perfil ? (
                        <img
                          src={deportista.foto_perfil}
                          alt={deportista.User?.nombre || 'Deportista'}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {deportista.User?.nombre || 'Sin nombre'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {deportista.User?.email || 'Sin email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {deportista.nivel_actual}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        deportista.estado === 'activo' 
                          ? 'bg-green-100 text-green-800'
                          : deportista.estado === 'lesionado'
                          ? 'bg-yellow-100 text-yellow-800'
                          : deportista.estado === 'descanso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {deportista.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAbrirModalFoto(deportista)}
                          className="text-purple-600 hover:text-purple-900 font-semibold transition hover:scale-110"
                          title="Cambiar foto"
                        >
                          📸 Foto
                        </button>
                        <button
                          onClick={() => handleEditarDeportista(deportista)}
                          className="text-blue-600 hover:text-blue-900 font-semibold transition hover:scale-110"
                          title="Editar deportista"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(deportista.id)}
                          className="text-red-600 hover:text-red-900 font-semibold transition hover:scale-110"
                          title="Eliminar deportista"
                        >
                          🗑️ Eliminar
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

      {/* MODAL FORMULARIO */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    {modoEdicion ? '✏️ Editar Deportista' : '➕ Nuevo Deportista'}
                  </h3>
                  <p className="text-blue-100">
                    {modoEdicion 
                      ? `Actualizando información de ${deportistaEditando?.User?.nombre}` 
                      : 'Completa el formulario para registrar un nuevo deportista'}
                  </p>
                </div>
                {modoEdicion && (
                  <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                    <p className="text-sm font-semibold">ID: {deportistaEditando?.id?.slice(0, 8)}...</p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmitFormulario} className="p-6">
              {/* INFORMACIÓN PERSONAL */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">👤</span>
                  Información Personal
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={modoEdicion}
                      className={`w-full px-4 py-3 border-2 rounded-lg transition ${
                        modoEdicion 
                          ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                          : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="correo@ejemplo.com"
                    />
                    {modoEdicion && (
                      <p className="text-xs text-gray-500 mt-1">
                        ℹ️ El email no se puede modificar
                      </p>
                    )}
                  </div>

                  {!modoEdicion && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!modoEdicion}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  )}

                  {modoEdicion && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        name="estado"
                        value={formData.estado || deportistaEditando?.estado || 'activo'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="activo">Activo</option>
                        <option value="lesionado">Lesionado</option>
                        <option value="descanso">Descanso</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* INFORMACIÓN DEPORTIVA */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🏋️</span>
                  Información Deportiva
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      name="altura"
                      value={formData.altura}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      name="peso"
                      value={formData.peso}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="70"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nivel Inicial *
                    </label>
                    <select
                      name="nivel_actual"
                      value={formData.nivel_actual}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="1_basico">1 Básico</option>
                      <option value="1_medio">1 Medio</option>
                      <option value="1_avanzado">1 Avanzado</option>
                      <option value="2">Nivel 2</option>
                      <option value="3">Nivel 3</option>
                      <option value="4">Nivel 4</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CONTACTO DE EMERGENCIA */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🚨</span>
                  Contacto de Emergencia
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="contacto_emergencia_nombre"
                      value={formData.contacto_emergencia_nombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Ej: María Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="contacto_emergencia_telefono"
                      value={formData.contacto_emergencia_telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parentesco
                    </label>
                    <input
                      type="text"
                      name="contacto_emergencia_parentesco"
                      value={formData.contacto_emergencia_parentesco}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Ej: Madre"
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES */}
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition shadow-lg disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '⏳ Guardando...' : modoEdicion ? '✅ Actualizar' : '✅ Crear Deportista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE FOTO DE PERFIL */}
      {mostrarModalFoto && deportistaFoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">📸 Foto de Perfil</h3>
              <p className="text-purple-100">{deportistaFoto.User?.nombre}</p>
            </div>

            <div className="p-6">
              {/* Preview de la foto */}
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  {previewFoto ? (
                    <img
                      src={previewFoto}
                      alt="Preview"
                      className="w-48 h-48 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-6xl font-bold border-4 border-purple-500 shadow-lg">
                      {deportistaFoto.User?.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Input de archivo */}
                <div className="flex justify-center">
                  <label className="cursor-pointer bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-3 px-6 rounded-lg transition inline-flex items-center space-x-2">
                    <span>📁 Seleccionar Imagen</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleSeleccionarFoto}
                      className="hidden"
                    />
                  </label>
                </div>

                {archivoFoto && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-sm text-green-700">
                      ✅ Archivo seleccionado: <span className="font-semibold">{archivoFoto.name}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Tamaño: {(archivoFoto.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                {/* Información */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    <strong>ℹ️ Formatos permitidos:</strong> JPG, PNG, GIF, WEBP<br />
                    <strong>Tamaño máximo:</strong> 5MB
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                {deportistaFoto.foto_perfil && (
                  <button
                    type="button"
                    onClick={handleEliminarFoto}
                    className="flex-1 px-4 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold transition"
                    disabled={loading}
                  >
                    🗑️ Eliminar Foto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalFoto(false);
                    setArchivoFoto(null);
                    setPreviewFoto(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubirFoto}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 font-semibold transition shadow-lg disabled:opacity-50"
                  disabled={loading || !archivoFoto}
                >
                  {loading ? '⏳ Subiendo...' : '✅ Subir Foto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deportistas;