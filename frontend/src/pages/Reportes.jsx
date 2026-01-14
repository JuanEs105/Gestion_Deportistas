// frontend/src/pages/Reportes.jsx - VERSIÓN SIN DOCUMENTOS MASIVOS
import React, { useState, useEffect } from 'react';
import { deportistasAPI } from '../services/api';
import { FileSpreadsheet, Download, Filter, X, Users, TrendingUp, FileText } from 'lucide-react';

const Reportes = () => {
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [userRole, setUserRole] = useState('admin');
  
  // Opciones dinámicas de filtros
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    niveles: [],
    grupos: []
  });
  
  // FILTROS CON SELECCIÓN MÚLTIPLE
  const [filtros, setFiltros] = useState({
    niveles: [], // Array de niveles seleccionados
    grupos: [], // Array de grupos seleccionados
    estado: 'todos',
    busqueda: ''
  });
  
  // Filtros avanzados
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    edadMin: '',
    edadMax: '',
    alturaMin: '',
    alturaMax: '',
    pesoMin: '',
    pesoMax: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user) {
      setUserRole(user.tipo || user.role);
      
      if (user.tipo === 'entrenador') {
        const niveles = user.niveles_asignados || [];
        setNivelesAsignados(niveles);
      }
    }
    
    cargarDeportistas();
    cargarOpcionesFiltros();
  }, []);
  
  const cargarDeportistas = async () => {
    try {
      setLoading(true);
      const response = await deportistasAPI.getAll();
      const todosDeportistas = response.data?.deportistas || response.data || [];
      
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (user && user.tipo === 'entrenador' && user.niveles_asignados) {
        const deportistasFiltrados = todosDeportistas.filter(d => 
          d.nivel_actual === 'pendiente' || user.niveles_asignados.includes(d.nivel_actual)
        );
        setDeportistas(deportistasFiltrados);
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
  
  const cargarOpcionesFiltros = async () => {
    try {
      // Extraer niveles y grupos únicos directamente de deportistas
      const response = await deportistasAPI.getAll();
      const todosDeportistas = response.data?.deportistas || response.data || [];
      
      // Extraer niveles únicos
      const nivelesUnicos = [...new Set(todosDeportistas.map(d => d.nivel_actual))].filter(Boolean);
      
      // Extraer grupos únicos
      const gruposSet = new Set();
      todosDeportistas.forEach(d => {
        if (d.grupo_competitivo) {
          gruposSet.add(d.grupo_competitivo);
        }
        if (Array.isArray(d.grupos_competitivos)) {
          d.grupos_competitivos.forEach(g => gruposSet.add(g));
        }
      });
      
      setOpcionesFiltros({
        niveles: nivelesUnicos.sort(),
        grupos: [...gruposSet].sort()
      });
      
      console.log('✅ Opciones cargadas:', {
        niveles: nivelesUnicos,
        grupos: [...gruposSet]
      });
      
    } catch (error) {
      console.error('❌ Error cargando opciones:', error);
    }
  };

  // Función para toggle nivel
  const toggleNivel = (nivel) => {
    setFiltros(prev => ({
      ...prev,
      niveles: prev.niveles.includes(nivel)
        ? prev.niveles.filter(n => n !== nivel)
        : [...prev.niveles, nivel]
    }));
  };

  // Función para toggle grupo
  const toggleGrupo = (grupo) => {
    setFiltros(prev => ({
      ...prev,
      grupos: prev.grupos.includes(grupo)
        ? prev.grupos.filter(g => g !== grupo)
        : [...prev.grupos, grupo]
    }));
  };

  const descargarExcelGrupal = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const params = new URLSearchParams();
    
    // Niveles seleccionados
    if (filtros.niveles.length > 0) {
      filtros.niveles.forEach(nivel => {
        params.append('nivel', nivel);
      });
    }
    
    // Grupos seleccionados
    if (filtros.grupos.length > 0) {
      filtros.grupos.forEach(grupo => {
        params.append('grupo_competitivo', grupo);
      });
    }
    
    // Estado
    if (filtros.estado !== 'todos') {
      params.append('estado', filtros.estado);
    }
    
    // Búsqueda
    if (filtros.busqueda) {
      params.append('nombre', filtros.busqueda);
    }
    
    // Filtros avanzados
    if (mostrarFiltrosAvanzados) {
      if (filtrosAvanzados.edadMin) params.append('edadMin', filtrosAvanzados.edadMin);
      if (filtrosAvanzados.edadMax) params.append('edadMax', filtrosAvanzados.edadMax);
      if (filtrosAvanzados.alturaMin) params.append('alturaMin', filtrosAvanzados.alturaMin);
      if (filtrosAvanzados.alturaMax) params.append('alturaMax', filtrosAvanzados.alturaMax);
      if (filtrosAvanzados.pesoMin) params.append('pesoMin', filtrosAvanzados.pesoMin);
      if (filtrosAvanzados.pesoMax) params.append('pesoMax', filtrosAvanzados.pesoMax);
    }
    
    const queryString = params.toString();
    const url = `http://localhost:5000/api/reportes/excel/grupal${queryString ? '?' + queryString : ''}`;
    
    console.log('📗 Descargando Excel desde:', url);
    
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error('Error en la descarga');
      return response.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      
      let nombreArchivo = 'reporte_deportistas';
      if (filtros.niveles.length > 0) nombreArchivo += `_${filtros.niveles.join('_')}`;
      if (filtros.grupos.length > 0) nombreArchivo += `_${filtros.grupos.join('_')}`;
      nombreArchivo += `_${Date.now()}.xlsx`;
      
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      alert('✅ Excel descargado correctamente');
    })
    .catch(error => {
      console.error('❌ Error:', error);
      alert('❌ Error al descargar el reporte Excel. Verifica que el servidor esté corriendo.');
    })
    .finally(() => setLoading(false));
  };

  const descargarDocumentoPDF = async (deportistaId, nombre) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/reportes/documento/${deportistaId}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar documento');
      }
      
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      link.download = `documento_${nombreLimpio}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      
      alert('✅ Documento descargado correctamente');
    } catch (error) {
      console.error('❌ Error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getNivelNombre = (nivel) => {
    const nombres = {
      'pendiente': 'Pendiente',
      '1_basico': '1 Básico',
      '1_medio': '1 Medio',
      '1_avanzado': '1 Avanzado',
      '2': 'Nivel 2',
      '3': 'Nivel 3',
      '4': 'Nivel 4'
    };
    return nombres[nivel] || nivel;
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Filtrado de deportistas
  const deportistasFiltrados = deportistas.filter(d => {
    const nombre = d.user?.nombre || d.nombre || '';
    const email = d.user?.email || d.email || '';
    const edad = calcularEdad(d.fecha_nacimiento);
    
    // Búsqueda
    const matchBusqueda = filtros.busqueda === '' || 
      nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      email.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    // Estado
    const matchEstado = filtros.estado === 'todos' || d.estado === filtros.estado;
    
    // Niveles (si hay niveles seleccionados, debe estar en alguno)
    const matchNivel = filtros.niveles.length === 0 || filtros.niveles.includes(d.nivel_actual);
    
    // Grupos (si hay grupos seleccionados, debe estar en alguno)
    const matchGrupo = filtros.grupos.length === 0 || (() => {
      if (Array.isArray(d.grupos_competitivos)) {
        return d.grupos_competitivos.some(g => filtros.grupos.includes(g));
      }
      return filtros.grupos.includes(d.grupo_competitivo);
    })();
    
    // Filtros avanzados
    const matchEdadMin = !filtrosAvanzados.edadMin || (edad && edad >= parseInt(filtrosAvanzados.edadMin));
    const matchEdadMax = !filtrosAvanzados.edadMax || (edad && edad <= parseInt(filtrosAvanzados.edadMax));
    const matchAlturaMin = !filtrosAvanzados.alturaMin || (d.altura && d.altura >= parseFloat(filtrosAvanzados.alturaMin));
    const matchAlturaMax = !filtrosAvanzados.alturaMax || (d.altura && d.altura <= parseFloat(filtrosAvanzados.alturaMax));
    const matchPesoMin = !filtrosAvanzados.pesoMin || (d.peso && d.peso >= parseFloat(filtrosAvanzados.pesoMin));
    const matchPesoMax = !filtrosAvanzados.pesoMax || (d.peso && d.peso <= parseFloat(filtrosAvanzados.pesoMax));
    
    return matchBusqueda && matchEstado && matchNivel && matchGrupo && 
           matchEdadMin && matchEdadMax && matchAlturaMin && matchAlturaMax && 
           matchPesoMin && matchPesoMax;
  });

  // Contar deportistas con documentos
  const deportistasConDocumentos = deportistasFiltrados.filter(d => d.documento_identidad).length;

  const limpiarFiltros = () => {
    setFiltros({
      niveles: [],
      grupos: [],
      estado: 'todos',
      busqueda: ''
    });
    setFiltrosAvanzados({
      edadMin: '',
      edadMax: '',
      alturaMin: '',
      alturaMax: '',
      pesoMin: '',
      pesoMax: ''
    });
  };

  const hayFiltrosActivos = () => {
    return filtros.niveles.length > 0 || 
           filtros.grupos.length > 0 || 
           filtros.estado !== 'todos' ||
           filtros.busqueda ||
           filtrosAvanzados.edadMin || filtrosAvanzados.edadMax ||
           filtrosAvanzados.alturaMin || filtrosAvanzados.alturaMax ||
           filtrosAvanzados.pesoMin || filtrosAvanzados.pesoMax;
  };

  const limpiarFiltrosAvanzados = () => {
    setFiltrosAvanzados({
      edadMin: '',
      edadMax: '',
      alturaMin: '',
      alturaMax: '',
      pesoMin: '',
      pesoMax: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <FileSpreadsheet className="w-10 h-10 text-green-600" />
          Reportes y Documentos
        </h1>
        <p className="text-gray-600">Genera reportes Excel con filtros avanzados</p>
      </div>

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-pulse">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="font-semibold">⏳ Procesando...</span>
        </div>
      )}

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-2 opacity-90">Total Deportistas</h3>
              <p className="text-4xl font-bold">{deportistas.length}</p>
            </div>
            <Users className="w-12 h-12 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-2 opacity-90">Filtrados</h3>
              <p className="text-4xl font-bold">{deportistasFiltrados.length}</p>
            </div>
            <Filter className="w-12 h-12 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-2 opacity-90">Con Documentos</h3>
              <p className="text-4xl font-bold">{deportistasConDocumentos}</p>
            </div>
            <FileText className="w-12 h-12 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-2 opacity-90">Filtros Activos</h3>
              <p className="text-2xl font-bold">
                {filtros.niveles.length + filtros.grupos.length}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-50" />
          </div>
        </div>
      </div>

      {/* PANEL DE FILTROS */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Filter className="w-6 h-6 text-blue-600" />
            Filtros Inteligentes
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              {mostrarFiltrosAvanzados ? 'Ocultar Avanzados' : 'Mostrar Avanzados'}
            </button>
            {hayFiltrosActivos() && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* BÚSQUEDA */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🔍 Buscar deportista
          </label>
          <input
            type="text"
            placeholder="Nombre o email..."
            value={filtros.busqueda}
            onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* NIVELES - BOTONES MÚLTIPLES */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📚 Niveles (Selecciona uno o varios)
          </label>
          <div className="flex flex-wrap gap-2">
            {opcionesFiltros.niveles.map(nivel => (
              <button
                key={nivel}
                onClick={() => toggleNivel(nivel)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filtros.niveles.includes(nivel)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getNivelNombre(nivel)}
              </button>
            ))}
          </div>
          {filtros.niveles.length > 0 && (
            <div className="mt-2 text-sm text-blue-600 font-semibold">
              ✓ {filtros.niveles.length} nivel(es) seleccionado(s)
            </div>
          )}
        </div>

        {/* GRUPOS - BOTONES MÚLTIPLES */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🏆 Grupos Competitivos (Selecciona uno o varios)
          </label>
          <div className="flex flex-wrap gap-2">
            {opcionesFiltros.grupos.map(grupo => (
              <button
                key={grupo}
                onClick={() => toggleGrupo(grupo)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filtros.grupos.includes(grupo)
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {grupo}
              </button>
            ))}
          </div>
          {filtros.grupos.length > 0 && (
            <div className="mt-2 text-sm text-purple-600 font-semibold">
              ✓ {filtros.grupos.length} grupo(s) seleccionado(s)
            </div>
          )}
        </div>

        {/* ESTADO */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ⚡ Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="lesionado">Lesionado</option>
            <option value="descanso">Descanso</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        {/* FILTROS AVANZADOS */}
        {mostrarFiltrosAvanzados && (
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-700">Filtros Avanzados</h4>
              <button
                onClick={limpiarFiltrosAvanzados}
                className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
              >
                ✕ Limpiar Avanzados
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Edad */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-700 mb-3">👤 Edad (años)</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mínima</label>
                    <input
                      type="number"
                      placeholder="Ej: 10"
                      value={filtrosAvanzados.edadMin}
                      onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, edadMin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Máxima</label>
                    <input
                      type="number"
                      placeholder="Ej: 18"
                      value={filtrosAvanzados.edadMax}
                      onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, edadMax: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Altura */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-700 mb-3">📏 Altura (cm)</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mínima</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 150"
                      value={filtrosAvanzados.alturaMin}
                      onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, alturaMin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Máxima</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 180"
                      value={filtrosAvanzados.alturaMax}
                      onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, alturaMax: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Peso */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-700 mb-3">⚖️ Peso (kg)</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mínimo</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 40"
                      value={filtrosAvanzados.pesoMin}
                      onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, pesoMin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Máximo</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 80"
                      value={filtrosAvanzados.pesoMax}
                      onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, pesoMax: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTROS ACTIVOS */}
        {hayFiltrosActivos() && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Filtros activos:</div>
            <div className="flex flex-wrap gap-2">
              {filtros.niveles.map(nivel => (
                <span key={nivel} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  📚 {getNivelNombre(nivel)}
                </span>
              ))}
              {filtros.grupos.map(grupo => (
                <span key={grupo} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  🏆 {grupo}
                </span>
              ))}
              {filtros.estado !== 'todos' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ⚡ Estado: {filtros.estado}
                </span>
              )}
              {filtros.busqueda && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                  🔍 "{filtros.busqueda}"
                </span>
              )}
              {filtrosAvanzados.edadMin && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  Edad ≥ {filtrosAvanzados.edadMin}
                </span>
              )}
              {filtrosAvanzados.edadMax && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  Edad ≤ {filtrosAvanzados.edadMax}
                </span>
              )}
              {(filtrosAvanzados.alturaMin || filtrosAvanzados.alturaMax) && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  Altura: {filtrosAvanzados.alturaMin || '0'}-{filtrosAvanzados.alturaMax || '∞'} cm
                </span>
              )}
              {(filtrosAvanzados.pesoMin || filtrosAvanzados.pesoMax) && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Peso: {filtrosAvanzados.pesoMin || '0'}-{filtrosAvanzados.pesoMax || '∞'} kg
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTÓN DE DESCARGA PRINCIPAL */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-2xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-2">📗 Reporte Excel Completo</h3>
            <p className="text-green-100">
              {deportistasFiltrados.length} deportista{deportistasFiltrados.length !== 1 ? 's' : ''} seleccionado{deportistasFiltrados.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-2 text-green-100 text-sm">
              Incluye: Datos personales, nivel, grupo, estadísticas, evaluaciones
            </div>
          </div>
          <button
            onClick={descargarExcelGrupal}
            disabled={loading || deportistasFiltrados.length === 0}
            className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition shadow-lg disabled:opacity-50 flex items-center gap-3"
          >
            <Download className="w-6 h-6" />
            Descargar Excel
          </button>
        </div>
      </div>

      {/* LISTA DE DEPORTISTAS */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Deportistas Filtrados ({deportistasFiltrados.length})
        </h3>
        
        {deportistasFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Filter className="w-20 h-20 mx-auto mb-4 opacity-50" />
            <h4 className="text-xl font-bold mb-2">No hay deportistas para mostrar</h4>
            <p className="text-gray-500">Ajusta los filtros para ver resultados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deportistasFiltrados.map(deportista => {
              const nombre = deportista.user?.nombre || deportista.nombre || 'Sin nombre';
              const email = deportista.user?.email || deportista.email || 'Sin email';
              const foto = deportista.foto_perfil || deportista.user?.foto_perfil;
              const edad = calcularEdad(deportista.fecha_nacimiento);
              const grupos = Array.isArray(deportista.grupos_competitivos) 
                ? deportista.grupos_competitivos 
                : deportista.grupos_competitivos ? [deportista.grupos_competitivos] : [];
              
              return (
                <div
                  key={deportista.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center mb-3">
                    {foto ? (
                      <img
                        src={foto}
                        alt={nombre}
                        className="w-14 h-14 rounded-full object-cover mr-3 border-2 border-blue-300"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl mr-3">
                        {nombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{nombre}</p>
                      <p className="text-xs text-gray-500">{email}</p>
                      <div className="flex items-center flex-wrap gap-1 mt-1">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                          {getNivelNombre(deportista.nivel_actual)}
                        </span>
                        {edad && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
                            {edad} años
                          </span>
                        )}
                        {deportista.altura && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                            {deportista.altura} cm
                          </span>
                        )}
                      </div>
                      {grupos.length > 0 && (
                        <div className="mt-1">
                          {grupos.map((grupo, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold mr-1">
                              {grupo}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {deportista.documento_identidad && (
                      <button
                        onClick={() => descargarDocumentoPDF(deportista.id, nombre)}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Documento ID
                      </button>
                    )}
                    <button
                      onClick={() => descargarExcelGrupal()}
                      disabled={loading}
                      className={`flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Incluir en Excel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;