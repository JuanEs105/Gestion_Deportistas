import React, { useState, useEffect } from 'react';
import { deportistasAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Deportistas = () => {
  const navigate = useNavigate();
  const [deportistas, setDeportistas] = useState([]);
  const [deportistasTodos, setDeportistasTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [userRole, setUserRole] = useState('admin');
  
  // Estados para el modal - CORREGIDO: Usar JSON como el Admin
  const [showModal, setShowModal] = useState(false);
  const [creando, setCreando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    fecha_nacimiento: '',
    altura: '',
    peso: '',
    nivel_actual: '1_basico',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_parentesco: ''
  });
  
  // FUNCIÓN CORREGIDA: Abre modal para nuevo deportista
  const handleNuevoDeportista = () => {
    console.log('🟡 Abriendo modal para nuevo deportista...');
    
    // Resetear formulario con nivel por defecto
    const nivelPorDefecto = nivelesAsignados.length > 0 ? nivelesAsignados[0] : '1_basico';
    
    setFormData({
      nombre: '',
      email: '',
      password: '',
      telefono: '',
      fecha_nacimiento: '',
      altura: '',
      peso: '',
      nivel_actual: nivelPorDefecto,
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      contacto_emergencia_parentesco: ''
    });
    
    setShowModal(true);
  };
  
  // Funciones para manejar editar/eliminar
  const handleEditar = (deportistaId) => {
    console.log('Editar deportista:', deportistaId);
    if (userRole === 'entrenador') {
      navigate(`/entrenador/deportistas/editar/${deportistaId}`);
    } else {
      navigate(`/admin/deportistas/editar/${deportistaId}`);
    }
  };
  
  const handleEliminar = async (deportistaId, deportistaNombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${deportistaNombre}?`)) {
      return;
    }
    
    try {
      await deportistasAPI.delete(deportistaId);
      setDeportistas(deportistas.filter(d => d.id !== deportistaId));
      setDeportistasTodos(deportistasTodos.filter(d => d.id !== deportistaId));
      alert('Deportista eliminado correctamente');
    } catch (err) {
      console.error('Error eliminando deportista:', err);
      alert('Error al eliminar deportista');
    }
  };
  
  const handleVerDetalles = (deportistaId) => {
    console.log('Ver detalles deportista:', deportistaId);
    if (userRole === 'entrenador') {
      navigate(`/entrenador/deportistas/${deportistaId}`);
    } else {
      navigate(`/admin/deportistas/${deportistaId}`);
    }
  };
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user) {
      setUserRole(user.tipo || user.role);
      
      if (user.tipo === 'entrenador') {
        const niveles = user.niveles_asignados || [];
        setNivelesAsignados(niveles);
        
        if (niveles.length > 0) {
          setFiltroNivel(niveles[0]);
        }
      }
    }
    
    fetchDeportistas();
  }, []);

  const fetchDeportistas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      console.log('👤 Usuario:', user);
      
      const response = await deportistasAPI.getAll();
      const todosDeportistas = response.data?.deportistas || response.data || [];
      
      if (!Array.isArray(todosDeportistas)) {
        throw new Error('La respuesta no contiene un array de deportistas');
      }
      
      setDeportistasTodos(todosDeportistas);
      
      if (user && user.tipo === 'entrenador') {
        const nivelesEntrenador = user.niveles_asignados || [];
        
        console.log('📚 Niveles del entrenador:', nivelesEntrenador);
        
        if (nivelesEntrenador.length === 0) {
          console.log('⚠️ ENTRENADOR SIN NIVELES');
          setError('No tienes niveles asignados. Contacta al administrador.');
          setDeportistas([]);
          setLoading(false);
          return;
        }
        
        const deportistasFiltrados = todosDeportistas.filter(d => {
          const match = nivelesEntrenador.includes(d.nivel_actual);
          return match;
        });
        
        console.log('✅ Deportistas filtrados:', deportistasFiltrados.length);
        setDeportistas(deportistasFiltrados);
      } else {
        setDeportistas(todosDeportistas);
      }
      
    } catch (err) {
      console.error('Error cargando deportistas:', err);
      setError(err.response?.data?.error || err.message || 'Error al cargar deportistas');
      setDeportistas([]);
    } finally {
      setLoading(false);
    }
  };

  // FUNCIONES PARA EL MODAL DE CREACIÓN - CORREGIDAS
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCreando(true);
      console.log('📤 Intentando crear deportista...', formData);
      
      // Verificar campos requeridos
      if (!formData.nombre || !formData.email || !formData.password) {
        alert('Nombre, email y contraseña son requeridos');
        setCreando(false);
        return;
      }
      
      console.log('📦 Enviando datos como JSON (igual que el Admin)...');
      
      // IMPORTANTE: Enviar como JSON normal, NO como FormData
      const response = await deportistasAPI.create(formData);
      console.log('✅ Deportista creado:', response);
      
      alert('Deportista creado exitosamente');
      setShowModal(false);
      
      // Limpiar formulario
      const nivelPorDefecto = nivelesAsignados.length > 0 ? nivelesAsignados[0] : '1_basico';
      setFormData({
        nombre: '',
        email: '',
        password: '',
        telefono: '',
        fecha_nacimiento: '',
        altura: '',
        peso: '',
        nivel_actual: nivelPorDefecto,
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        contacto_emergencia_parentesco: ''
      });
      
      // Recargar lista
      fetchDeportistas();
      
    } catch (err) {
      console.error('❌ Error creando deportista:', err);
      console.error('Detalles del error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMsg = 'Error al crear deportista';
      
      if (err.response?.status === 401) {
        errorMsg = 'No autenticado. Por favor inicia sesión nuevamente.';
        // Verificar token
        console.log('🔑 Token actual:', localStorage.getItem('token'));
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      alert(`Error: ${errorMsg}`);
    } finally {
      setCreando(false);
    }
  };

  // Obtener niveles disponibles para el selector
  const getNivelesDisponibles = () => {
    if (userRole === 'admin') {
      return [
        { value: 'todos', label: 'Todos los niveles' },
        { value: '1_basico', label: '1 Básico' },
        { value: '1_medio', label: '1 Medio' },
        { value: '1_avanzado', label: '1 Avanzado' },
        { value: '2', label: 'Nivel 2' },
        { value: '3', label: 'Nivel 3' },
        { value: '4', label: 'Nivel 4' }
      ];
    } else {
      // Entrenador: SOLO sus niveles asignados
      return [
        { value: 'todos', label: 'Todos mis niveles' },
        ...nivelesAsignados.map(nivel => ({
          value: nivel,
          label: getNivelNombre(nivel)
        }))
      ];
    }
  };

  const getNivelNombre = (nivel) => {
    const nombres = {
      '1_basico': '1 Básico',
      '1_medio': '1 Medio',
      '1_avanzado': '1 Avanzado',
      '2': 'Nivel 2',
      '3': 'Nivel 3',
      '4': 'Nivel 4'
    };
    return nombres[nivel] || nivel;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'activo': 'bg-green-100 text-green-800',
      'lesionado': 'bg-yellow-100 text-yellow-800',
      'descanso': 'bg-blue-100 text-blue-800',
      'inactivo': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'activo': 'Activo',
      'lesionado': 'Lesionado',
      'descanso': 'Descanso',
      'inactivo': 'Inactivo'
    };
    return textos[estado] || estado;
  };

  // FILTRADO COMPLETO
  const deportistasFiltrados = deportistas.filter(deportista => {
    const user = deportista.User || {};
    const matchNombre = user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchEmail = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchBusqueda = searchTerm === '' || matchNombre || matchEmail;
    
    let matchNivel = true;
    if (filtroNivel !== 'todos') {
      matchNivel = deportista.nivel_actual === filtroNivel;
    } else if (userRole === 'entrenador' && nivelesAsignados.length > 0) {
      matchNivel = nivelesAsignados.includes(deportista.nivel_actual);
    }
    
    const matchEstado = filtroEstado === 'todos' || deportista.estado === filtroEstado;
    
    return matchBusqueda && matchNivel && matchEstado;
  });

  const getEstadisticas = () => {
    return {
      total: deportistas.length,
      activos: deportistas.filter(d => d.estado === 'activo').length,
      lesionados: deportistas.filter(d => d.estado === 'lesionado').length,
      filtrados: deportistasFiltrados.length
    };
  };

  const stats = getEstadisticas();

  if (loading && deportistas.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Gestión de Deportistas</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando deportistas...</span>
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
          <p className="text-gray-600">
            {userRole === 'entrenador' 
              ? 'Deportistas de tus niveles asignados' 
              : 'Administra la información de los deportistas'}
          </p>
          
          {userRole === 'entrenador' && nivelesAsignados.length > 0 && (
            <div className="mt-3 flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-700">📚 Tus niveles:</span>
              {nivelesAsignados.map(nivel => (
                <span key={nivel} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {getNivelNombre(nivel)}
                </span>
              ))}
            </div>
          )}
        </div>
        
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
              {getNivelesDisponibles().map(nivel => (
                <option key={nivel.value} value={nivel.value}>
                  {nivel.label}
                </option>
              ))}
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
          <h3 className="text-lg font-semibold mb-2">
            {userRole === 'entrenador' ? 'Mis Deportistas' : 'Total'}
          </h3>
          <p className="text-4xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Activos</h3>
          <p className="text-4xl font-bold">{stats.activos}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Lesionados</h3>
          <p className="text-4xl font-bold">{stats.lesionados}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Filtrados</h3>
          <p className="text-4xl font-bold">{stats.filtrados}</p>
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
                        {deportistas.length === 0
                          ? userRole === 'entrenador'
                            ? 'No tienes deportistas en tus niveles asignados'
                            : 'No hay deportistas registrados'
                          : 'No se encontraron deportistas con los filtros aplicados'}
                      </p>
                      {userRole === 'entrenador' && nivelesAsignados.length > 0 && (
                        <p className="text-gray-500">
                          Niveles asignados: {nivelesAsignados.map(n => getNivelNombre(n)).join(', ')}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                deportistasFiltrados.map((deportista) => {
                  const user = deportista.User || {};
                  return (
                    <tr key={deportista.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.foto_perfil ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.foto_perfil}
                              alt={user.nombre}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {user.nombre?.charAt(0)?.toUpperCase() || 'D'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.nombre || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {deportista.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email || 'Sin email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getNivelNombre(deportista.nivel_actual)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(deportista.estado)}`}>
                          {getEstadoTexto(deportista.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerDetalles(deportista.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            👁️ Ver
                          </button>
                          <button
                            onClick={() => handleEditar(deportista.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(deportista.id, user.nombre || 'este deportista')}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINACIÓN O INFO */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-semibold">{deportistasFiltrados.length}</span> de <span className="font-semibold">{deportistas.length}</span> deportistas
            </div>
            <div className="text-sm text-gray-500">
              {userRole === 'entrenador' && 'Filtrado por tus niveles asignados'}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA NUEVO DEPORTISTA - SIMILAR AL DEL ADMIN */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">➕ Nuevo Deportista</h3>
              {userRole === 'entrenador' && (
                <p className="text-green-100 text-sm mt-1">
                  Puedes crear deportistas en tus niveles asignados: {nivelesAsignados.map(n => getNivelNombre(n)).join(', ')}
                </p>
              )}
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
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Juan Pérez"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleChange}
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
                      name="altura"
                      value={formData.altura}
                      onChange={handleChange}
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
                      name="peso"
                      value={formData.peso}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nivel *</label>
                    <select
                      name="nivel_actual"
                      value={formData.nivel_actual}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {nivelesAsignados.map(nivel => (
                        <option key={nivel} value={nivel}>
                          {getNivelNombre(nivel)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Solo puedes crear en tus niveles asignados
                    </p>
                  </div>
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
                      name="contacto_emergencia_nombre"
                      value={formData.contacto_emergencia_nombre}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="María Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      name="contacto_emergencia_telefono"
                      value={formData.contacto_emergencia_telefono}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Parentesco</label>
                    <input
                      type="text"
                      name="contacto_emergencia_parentesco"
                      value={formData.contacto_emergencia_parentesco}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Madre"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition shadow-lg disabled:opacity-50"
                  disabled={creando}
                >
                  {creando ? '⏳ Creando...' : '✅ Crear Deportista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deportistas;