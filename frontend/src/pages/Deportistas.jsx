// frontend/src/pages/Deportistas.jsx - VERSIÓN COMPLETA Y FUNCIONAL
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
  
  // FUNCIÓN QUE FALTABA - SOLUCIÓN AL ERROR
  const handleNuevoDeportista = () => {
    // Ajusta la ruta según tu configuración de rutas
    if (userRole === 'entrenador') {
      navigate('/entrenador/deportistas/nuevo');
    } else {
      navigate('/admin/deportistas/nuevo');
    }
  };
  
  // Funciones para manejar editar/eliminar
  const handleEditar = (deportistaId) => {
    console.log('Editar deportista:', deportistaId);
    // Navegar a la página de edición
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
      // Actualizar lista
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
    // Navegar a la página de detalles
    if (userRole === 'entrenador') {
      navigate(`/entrenador/deportistas/${deportistaId}`);
    } else {
      navigate(`/admin/deportistas/${deportistaId}`);
    }
  };
  
  useEffect(() => {
    // Obtener niveles asignados del usuario
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user) {
      setUserRole(user.tipo || user.role);
      
      if (user.tipo === 'entrenador') {
        const niveles = user.niveles_asignados || [];
        setNivelesAsignados(niveles);
        
        // Establecer el primer nivel asignado como filtro por defecto
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
      
      const response = await deportistasAPI.getAll();
      const deportistasArray = response.data?.deportistas || response.data || [];
      
      if (!Array.isArray(deportistasArray)) {
        throw new Error('La respuesta no contiene un array de deportistas');
      }
      
      // Guardar todos los deportistas
      setDeportistasTodos(deportistasArray);
      
      // FILTRAR POR NIVELES ASIGNADOS AUTOMÁTICAMENTE
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (user && user.tipo === 'entrenador' && user.niveles_asignados) {
        const deportistasFiltrados = deportistasArray.filter(d => 
          user.niveles_asignados.includes(d.nivel_actual)
        );
        setDeportistas(deportistasFiltrados);
      } else {
        // Admin ve todos
        setDeportistas(deportistasArray);
      }
      
    } catch (err) {
      console.error('Error cargando deportistas:', err);
      setError(err.response?.data?.error || err.message || 'Error al cargar deportistas');
      setDeportistas([]);
    } finally {
      setLoading(false);
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
    // Filtro por búsqueda
    const user = deportista.User || {};
    const matchNombre = user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchEmail = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchBusqueda = searchTerm === '' || matchNombre || matchEmail;
    
    // Filtro por nivel (respeta niveles asignados)
    let matchNivel = true;
    if (filtroNivel !== 'todos') {
      matchNivel = deportista.nivel_actual === filtroNivel;
    } else if (userRole === 'entrenador' && nivelesAsignados.length > 0) {
      // Si es "todos" pero es entrenador, solo mostrar de sus niveles
      matchNivel = nivelesAsignados.includes(deportista.nivel_actual);
    }
    
    // Filtro por estado
    const matchEstado = filtroEstado === 'todos' || deportista.estado === filtroEstado;
    
    return matchBusqueda && matchNivel && matchEstado;
  });

  // Calcular estadísticas SOLO de deportistas filtrados por niveles
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
          
          {/* Mostrar niveles asignados */}
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
    </div>
  );
};

export default Deportistas;