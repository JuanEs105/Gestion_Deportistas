// frontend/src/pages/Reportes.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { deportistasAPI } from '../services/api';

const Reportes = () => {
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [userRole, setUserRole] = useState('admin');
  
  useEffect(() => {
    // Obtener rol y niveles del usuario
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user) {
      setUserRole(user.tipo || user.role);
      
      if (user.tipo === 'entrenador') {
        setNivelesAsignados(user.niveles_asignados || []);
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
      } else {
        setDeportistas(todosDeportistas);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const descargarPDFIndividual = (deportistaId, nombre) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000/api/reportes/pdf/deportista/${deportistaId}`;
    
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
    })
    .catch(error => {
      console.error('Error:', error);
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
      link.download = `reporte_general_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    })
    .catch(error => {
      console.error('Error:', error);
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
    })
    .catch(error => {
      console.error('Error:', error);
      alert('❌ Error al descargar el reporte PDF de nivel');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  // Obtener niveles disponibles
  const getNivelesDisponibles = () => {
    if (userRole === 'admin') {
      return ['1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
    } else {
      return nivelesAsignados;
    }
  };

  const nivelesDisponibles = getNivelesDisponibles();
  const deportistasFiltrados = nivelSeleccionado === 'todos' 
    ? deportistas 
    : deportistas.filter(d => d.nivel_actual === nivelSeleccionado);
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Reportes y Exportaciones</h1>
        <p className="text-gray-600">Descarga reportes en PDF y Excel</p>
      </div>

      {/* INDICADOR DE CARGA GLOBAL */}
      {loading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="font-semibold">Descargando...</span>
        </div>
      )}

      {/* REPORTES GRUPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Excel Grupal */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📗</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Reporte General Excel</h3>
              <p className="text-sm text-gray-600">Todos los deportistas y evaluaciones</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filtrar por nivel:
            </label>
            <select
              value={nivelSeleccionado}
              onChange={(e) => setNivelSeleccionado(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="todos">Todos los niveles</option>
              {nivelesDisponibles.map(nivel => (
                <option key={nivel} value={nivel}>
                  {nivel === '1_basico' ? '1 Básico' :
                   nivel === '1_medio' ? '1 Medio' :
                   nivel === '1_avanzado' ? '1 Avanzado' :
                   `Nivel ${nivel}`}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={descargarExcelGrupal}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 Descargar Excel
          </button>
        </div>

        {/* PDF por Nivel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📕</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Progreso por Nivel (PDF)</h3>
              <p className="text-sm text-gray-600">Tabla de progreso grupal</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {nivelesDisponibles.map(nivel => (
              <button
                key={nivel}
                onClick={() => descargarPDFNivel(nivel)}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📄 {nivel === '1_basico' ? '1 Básico' :
                     nivel === '1_medio' ? '1 Medio' :
                     nivel === '1_avanzado' ? '1 Avanzado' :
                     `Nivel ${nivel}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* REPORTES INDIVIDUALES */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Reportes Individuales (PDF)</h3>
        
        {deportistasFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">📊</div>
            <p>No hay deportistas para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deportistasFiltrados.map(deportista => (
              <div
                key={deportista.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center mb-3">
                  {deportista.foto_perfil ? (
                    <img
                      src={deportista.foto_perfil}
                      alt={deportista.User?.nombre}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                      {deportista.User?.nombre?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{deportista.User?.nombre}</p>
                    <p className="text-xs text-gray-500">{deportista.nivel_actual}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => descargarPDFIndividual(deportista.id, deportista.User?.nombre)}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📄 Descargar PDF
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