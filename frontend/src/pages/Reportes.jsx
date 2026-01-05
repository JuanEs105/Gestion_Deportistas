// frontend/src/pages/Reportes.jsx - VERSIÓN COMPLETAMENTE ARREGLADA
import React, { useState, useEffect } from 'react';
import { deportistasAPI } from '../services/api';

const Reportes = () => {
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Obtener datos del usuario
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user) {
      setUserRole(user.tipo || user.role);
      setUserName(user.nombre || user.name || 'Usuario');
      
      if (user.tipo === 'entrenador') {
        const niveles = user.niveles_asignados || [];
        setNivelesAsignados(niveles);
        // Establecer el primer nivel como seleccionado por defecto
        if (niveles.length > 0) {
          setNivelSeleccionado(niveles[0]);
        }
      }
    }
    
    cargarDeportistas();
  }, []);
  
  const cargarDeportistas = async () => {
    try {
      setLoading(true);
      const response = await deportistasAPI.getAll();
      const todosDeportistas = response.data?.deportistas || response.data || [];
      
      // Filtrar por niveles asignados si es entrenador
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (user && user.tipo === 'entrenador' && user.niveles_asignados) {
        const deportistasFiltrados = todosDeportistas.filter(d => 
          user.niveles_asignados.includes(d.nivel_actual)
        );
        setDeportistas(deportistasFiltrados);
        console.log('✅ Deportistas filtrados por nivel:', deportistasFiltrados.length);
      } else {
        setDeportistas(todosDeportistas);
      }
    } catch (error) {
      console.error('❌ Error cargando deportistas:', error);
      alert('Error al cargar deportistas');
    } finally {
      setLoading(false);
    }
  };
  
  const descargarPDFIndividual = (deportistaId, nombre) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000/api/reportes/pdf/deportista/${deportistaId}`;
    
    console.log('📥 Descargando PDF para:', nombre);
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la descarga');
      }
      return response.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `reporte_${nombre.replace(/\s/g, '_')}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      console.log('✅ PDF descargado exitosamente');
    })
    .catch(error => {
      console.error('❌ Error descargando PDF:', error);
      alert('❌ Error al descargar el reporte PDF');
    })
    .finally(() => {
      setLoading(false);
    });
  };
  
  const descargarExcelGrupal = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const nivel = nivelSeleccionado !== 'todos' ? `?nivel=${nivelSeleccionado}` : '';
    const url = `http://localhost:5000/api/reportes/excel/grupal${nivel}`;
    
    console.log('📥 Descargando Excel grupal...');
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la descarga');
      }
      return response.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `reporte_general_${nivelSeleccionado}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      console.log('✅ Excel descargado exitosamente');
    })
    .catch(error => {
      console.error('❌ Error descargando Excel:', error);
      alert('❌ Error al descargar el reporte Excel');
    })
    .finally(() => {
      setLoading(false);
    });
  };
  
  const descargarPDFNivel = (nivel) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000/api/reportes/pdf/nivel/${nivel}`;
    
    console.log('📥 Descargando PDF de nivel:', nivel);
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la descarga');
      }
      return response.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `progreso_nivel_${nivel}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      console.log('✅ PDF de nivel descargado exitosamente');
    })
    .catch(error => {
      console.error('❌ Error descargando PDF de nivel:', error);
      alert('❌ Error al descargar el reporte PDF de nivel');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  // Obtener niveles disponibles según el rol
  const getNivelesDisponibles = () => {
    if (userRole === 'admin') {
      return ['1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
    } else {
      return nivelesAsignados;
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

  const nivelesDisponibles = getNivelesDisponibles();
  
  // FILTROS APLICADOS
  const deportistasFiltrados = deportistas.filter(d => {
    // Filtro por nivel
    const matchNivel = nivelSeleccionado === 'todos' || d.nivel_actual === nivelSeleccionado;
    
    // Filtro por estado
    const matchEstado = filtroEstado === 'todos' || d.estado === filtroEstado;
    
    // Filtro por búsqueda
    const matchBusqueda = searchTerm === '' || 
      d.User?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.User?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchNivel && matchEstado && matchBusqueda;
  });
  
  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="text-5xl mr-3">📊</span>
          Reportes y Exportaciones
        </h1>
        <p className="text-gray-600">Descarga reportes en PDF y Excel de tus deportistas</p>
        {userRole === 'entrenador' && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-700">📚 Tus niveles asignados:</span>
            {nivelesAsignados.map(nivel => (
              <span key={nivel} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {getNivelNombre(nivel)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* INDICADOR DE CARGA GLOBAL */}
      {loading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3 animate-pulse">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="font-semibold">⏳ Generando reporte...</span>
        </div>
      )}

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">Total Deportistas</h3>
          <p className="text-4xl font-bold">{deportistas.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">Activos</h3>
          <p className="text-4xl font-bold">
            {deportistas.filter(d => d.estado === 'activo').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">Filtrados</h3>
          <p className="text-4xl font-bold">{deportistasFiltrados.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">Niveles Disponibles</h3>
          <p className="text-4xl font-bold">{nivelesDisponibles.length}</p>
        </div>
      </div>

      {/* REPORTES GRUPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Excel Grupal */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <span className="text-3xl">📗</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Reporte General Excel</h3>
              <p className="text-sm text-gray-600">Todos los deportistas y evaluaciones</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎯 Filtrar por nivel:
            </label>
            <select
              value={nivelSeleccionado}
              onChange={(e) => setNivelSeleccionado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
              {userRole === 'admin' && <option value="todos">Todos los niveles</option>}
              {nivelesDisponibles.map(nivel => (
                <option key={nivel} value={nivel}>
                  {getNivelNombre(nivel)}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={descargarExcelGrupal}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            📥 Descargar Excel
          </button>
        </div>

        {/* PDF por Nivel */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <span className="text-3xl">📕</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Progreso por Nivel (PDF)</h3>
              <p className="text-sm text-gray-600">Tabla de progreso grupal</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {nivelesDisponibles.map(nivel => (
              <button
                key={nivel}
                onClick={() => descargarPDFNivel(nivel)}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>📄</span>
                <span>{getNivelNombre(nivel)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FILTROS DE BÚSQUEDA */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar deportista
            </label>
            <input
              type="text"
              placeholder="Nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* REPORTES INDIVIDUALES */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="text-3xl mr-2">📋</span>
            Reportes Individuales (PDF)
          </h3>
          <span className="text-sm text-gray-600">
            {deportistasFiltrados.length} deportista{deportistasFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {deportistasFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-7xl mb-4">📊</div>
            <h4 className="text-xl font-bold mb-2">No hay deportistas para mostrar</h4>
            <p className="text-gray-500">
              {deportistas.length === 0 
                ? 'No tienes deportistas asignados' 
                : 'Intenta cambiar los filtros de búsqueda'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deportistasFiltrados.map(deportista => (
              <div
                key={deportista.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center mb-3">
                  {deportista.foto_perfil ? (
                    <img
                      src={deportista.foto_perfil}
                      alt={deportista.User?.nombre}
                      className="w-14 h-14 rounded-full object-cover mr-3 border-2 border-blue-300"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg">
                      {deportista.User?.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{deportista.User?.nombre}</p>
                    <p className="text-xs text-gray-500">{deportista.User?.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {getNivelNombre(deportista.nivel_actual)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        deportista.estado === 'activo' ? 'bg-green-100 text-green-800' :
                        deportista.estado === 'lesionado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {deportista.estado}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => descargarPDFIndividual(deportista.id, deportista.User?.nombre)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>📄</span>
                  <span>Descargar PDF</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;