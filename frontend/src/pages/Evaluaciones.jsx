// frontend/src/pages/Evaluaciones.jsx - CON GRÁFICAS
import React, { useState, useEffect } from 'react';
import { deportistasAPI, habilidadesAPI, evaluacionesAPI } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const Evaluaciones = () => {
  const [deportistas, setDeportistas] = useState([]);
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState(null);
  const [habilidades, setHabilidades] = useState([]);
  const [categoriaActual, setCategoriaActual] = useState('habilidad');
  const [progreso, setProgreso] = useState(null);
  const [historialEvaluaciones, setHistorialEvaluaciones] = useState([]);
  const [evaluacionActual, setEvaluacionActual] = useState({
    habilidad_id: '',
    puntuacion: 5,
    observaciones: '',
    video_url: ''
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarDeportistas();
  }, []);

  useEffect(() => {
    if (deportistaSeleccionado) {
      cargarDatosDeportista();
    }
  }, [deportistaSeleccionado, categoriaActual]);

  const cargarDeportistas = async () => {
    try {
      const response = await deportistasAPI.getAll();
      const deportistasArray = response.data?.deportistas || response.data || [];
      setDeportistas(deportistasArray.filter(d => d.estado !== 'inactivo'));
    } catch (error) {
      console.error('Error cargando deportistas:', error);
    }
  };

  const cargarDatosDeportista = async () => {
    try {
      setLoading(true);
      
      // Cargar habilidades del nivel actual
      const habilidadesRes = await habilidadesAPI.getByNivel(
        deportistaSeleccionado.nivel_actual,
        deportistaSeleccionado.id
      );
      
      const habilidadesData = habilidadesRes.habilidades || [];
      setHabilidades(habilidadesData);
      
      // Cargar progreso
      const progresoRes = await evaluacionesAPI.getProgreso(deportistaSeleccionado.id);
      setProgreso(progresoRes);
      
      // Cargar historial de evaluaciones
      const historialRes = await evaluacionesAPI.getByDeportista(deportistaSeleccionado.id);
      setHistorialEvaluaciones(historialRes.evaluaciones || []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarDeportista = (deportista) => {
    setDeportistaSeleccionado(deportista);
    setMostrarFormulario(false);
    setEvaluacionActual({
      habilidad_id: '',
      puntuacion: 5,
      observaciones: '',
      video_url: ''
    });
  };

  const handleEvaluar = async (habilidad) => {
    setEvaluacionActual({
      ...evaluacionActual,
      habilidad_id: habilidad.id
    });
    setMostrarFormulario(true);
  };

  const handleSubmitEvaluacion = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await evaluacionesAPI.create({
        deportista_id: deportistaSeleccionado.id,
        habilidad_id: evaluacionActual.habilidad_id,
        puntuacion: parseInt(evaluacionActual.puntuacion),
        observaciones: evaluacionActual.observaciones,
        video_url: evaluacionActual.video_url || null
      });
      
      alert('✅ Evaluación registrada exitosamente');
      setMostrarFormulario(false);
      setEvaluacionActual({
        habilidad_id: '',
        puntuacion: 5,
        observaciones: '',
        video_url: ''
      });
      
      // Recargar datos
      await cargarDatosDeportista();
      
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      alert('❌ Error al guardar la evaluación: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para gráficas
  const prepararDatosGraficas = () => {
    if (!progreso) return null;

    // Datos para gráfica de barras (progreso por categoría)
    const datosBarras = Object.entries(progreso.progreso_por_categoria).map(([categoria, data]) => ({
      categoria: categoria === 'habilidad' ? 'Habilidades' : 
                 categoria === 'ejercicio_accesorio' ? 'Ejercicios' : 'Posturas',
      completadas: data.completadas,
      total: data.total,
      porcentaje: data.porcentaje
    }));

    // Datos para gráfica radar (últimas 6 evaluaciones)
    const ultimasEvaluaciones = historialEvaluaciones
      .slice(0, 6)
      .reverse()
      .map(evalu => ({
        habilidad: evalu.habilidad?.nombre?.substring(0, 20) || 'Sin nombre',
        puntuacion: evalu.puntuacion,
        minimo: evalu.habilidad?.puntuacion_minima || 7
      }));

    // Datos para línea de tiempo (progreso histórico)
    const evaluacionesPorFecha = {};
    historialEvaluaciones.forEach(evalu => {
      const fecha = new Date(eval.fecha_evaluacion).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!evaluacionesPorFecha[fecha]) {
        evaluacionesPorFecha[fecha] = [];
      }
      evaluacionesPorFecha[fecha].push(eval.puntuacion);
    });

    const datosLinea = Object.entries(evaluacionesPorFecha)
      .slice(-10) // Últimas 10 fechas
      .map(([fecha, puntuaciones]) => ({
        fecha,
        promedio: (puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length).toFixed(1),
        evaluaciones: puntuaciones.length
      }));

    return { datosBarras, ultimasEvaluaciones, datosLinea };
  };

  const getNivelColor = (nivel) => {
    const colores = {
      '1_basico': 'bg-green-500',
      '1_medio': 'bg-blue-500',
      '1_avanzado': 'bg-purple-500',
      '2': 'bg-yellow-500',
      '3': 'bg-orange-500',
      '4': 'bg-red-500'
    };
    return colores[nivel] || 'bg-gray-500';
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

  const getCategoriaIcon = (categoria) => {
    const iconos = {
      'habilidad': '🏆',
      'ejercicio_accesorio': '💪',
      'postura': '🧘'
    };
    return iconos[categoria] || '📋';
  };

  const deportistasFiltrados = deportistas.filter(d => 
    d.User?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const habilidadesFiltradas = habilidades.filter(h => h.categoria === categoriaActual);

  const getEstadoHabilidad = (habilidad) => {
    if (!habilidad.evaluacion) {
      return { estado: 'pendiente', color: 'bg-gray-100 text-gray-800', icon: '⏳' };
    }
    
    if (habilidad.evaluacion.completada) {
      return { estado: 'completada', color: 'bg-green-100 text-green-800', icon: '✅' };
    }
    
    return { estado: 'en progreso', color: 'bg-yellow-100 text-yellow-800', icon: '🔄' };
  };

  const datosGraficas = deportistaSeleccionado && progreso ? prepararDatosGraficas() : null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📋 Sistema de Evaluaciones</h1>
        <p className="text-gray-600">Evalúa el progreso de los deportistas por habilidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO - LISTA DE DEPORTISTAS */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              👥 Deportistas
            </h2>
            
            {/* Búsqueda */}
            <input
              type="text"
              placeholder="🔍 Buscar deportista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />

            {/* Lista de deportistas */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {deportistasFiltrados.map((deportista) => (
                <button
                  key={deportista.id}
                  onClick={() => handleSeleccionarDeportista(deportista)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                    deportistaSeleccionado?.id === deportista.id
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-50 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {deportista.foto_perfil ? (
                      <img
                        src={deportista.foto_perfil}
                        alt={deportista.User?.nombre}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {deportista.User?.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{deportista.User?.nombre}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getNivelColor(deportista.nivel_actual)} text-white`}>
                          {getNivelNombre(deportista.nivel_actual)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO - EVALUACIONES */}
        <div className="lg:col-span-2">
          {!deportistaSeleccionado ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">👈</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Selecciona un deportista
              </h3>
              <p className="text-gray-600">
                Elige un deportista de la lista para ver y registrar sus evaluaciones
              </p>
            </div>
          ) : (
            <>
              {/* INFORMACIÓN DEL DEPORTISTA Y PROGRESO */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {deportistaSeleccionado.foto_perfil ? (
                      <img
                        src={deportistaSeleccionado.foto_perfil}
                        alt={deportistaSeleccionado.User?.nombre}
                        className="w-20 h-20 rounded-full border-4 border-white object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-white bg-white text-blue-600 flex items-center justify-center text-3xl font-bold">
                        {deportistaSeleccionado.User?.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-3xl font-bold">{deportistaSeleccionado.User?.nombre}</h2>
                      <p className="text-blue-100">{deportistaSeleccionado.User?.email}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                        {getNivelNombre(deportistaSeleccionado.nivel_actual)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BARRA DE PROGRESO TOTAL */}
                {progreso && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Progreso Total del Nivel</span>
                      <span className="text-2xl font-bold">{progreso.progreso_total.porcentaje}%</span>
                    </div>
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-500 flex items-center justify-center text-blue-600 font-bold text-sm"
                        style={{ width: `${progreso.progreso_total.porcentaje}%` }}
                      >
                        {progreso.progreso_total.porcentaje > 10 && `${progreso.progreso_total.completadas}/${progreso.progreso_total.total}`}
                      </div>
                    </div>
                    <p className="text-sm text-blue-100 mt-2">
                      {progreso.progreso_total.completadas} de {progreso.progreso_total.total} habilidades completadas
                    </p>
                  </div>
                )}
              </div>

              {/* GRÁFICAS DE PROGRESO */}
              {datosGraficas && historialEvaluaciones.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* GRÁFICA DE BARRAS - Progreso por Categoría */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Progreso por Categoría</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={datosGraficas.datosBarras}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="categoria" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="completadas" fill="#3b82f6" name="Completadas">
                          {datosGraficas.datosBarras.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                        <Bar dataKey="total" fill="#e5e7eb" name="Total" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* GRÁFICA RADAR - Últimas Evaluaciones */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Últimas 6 Evaluaciones</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={datosGraficas.ultimasEvaluaciones}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="habilidad" />
                        <PolarRadiusAxis domain={[0, 10]} />
                        <Radar name="Puntuación" dataKey="puntuacion" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Radar name="Mínimo" dataKey="minimo" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* GRÁFICA DE LÍNEA - Evolución Temporal */}
                  {datosGraficas.datosLinea.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Evolución del Rendimiento</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={datosGraficas.datosLinea}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fecha" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="promedio" stroke="#3b82f6" strokeWidth={3} name="Promedio" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* ESTADÍSTICAS POR CATEGORÍA */}
              {progreso && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Object.entries(progreso.progreso_por_categoria).map(([categoria, data]) => (
                    <div key={categoria} className="bg-white rounded-xl shadow p-4">
                      <div className="text-3xl mb-2">{getCategoriaIcon(categoria)}</div>
                      <h4 className="font-semibold text-gray-700 capitalize mb-2">
                        {categoria.replace('_', ' ')}
                      </h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-blue-600">{data.porcentaje}%</span>
                        <span className="text-sm text-gray-500">{data.completadas}/{data.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${data.porcentaje}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TABS DE CATEGORÍAS */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex space-x-2 mb-6 border-b">
                  {['habilidad', 'ejercicio_accesorio', 'postura'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaActual(cat)}
                      className={`px-6 py-3 font-semibold transition-all duration-200 ${
                        categoriaActual === cat
                          ? 'border-b-4 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {getCategoriaIcon(cat)} {cat === 'habilidad' ? 'Habilidades' : cat === 'ejercicio_accesorio' ? 'Ejercicios' : 'Posturas'}
                    </button>
                  ))}
                </div>

                {/* LISTA DE HABILIDADES */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {habilidadesFiltradas.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <p>No hay {categoriaActual === 'habilidad' ? 'habilidades' : categoriaActual === 'ejercicio_accesorio' ? 'ejercicios' : 'posturas'} en este nivel</p>
                      </div>
                    ) : (
                      habilidadesFiltradas.map((habilidad) => {
                        const estado = getEstadoHabilidad(habilidad);
                        return (
                          <div
                            key={habilidad.id}
                            className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="text-lg font-bold text-gray-800">{habilidad.nombre}</h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estado.color}`}>
                                    {estado.icon} {estado.estado}
                                  </span>
                                </div>
                                
                                {habilidad.descripcion && (
                                  <p className="text-sm text-gray-600 mb-2">{habilidad.descripcion}</p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-gray-500">
                                    Mínimo requerido: <span className="font-bold text-blue-600">{habilidad.puntuacion_minima}/10</span>
                                  </span>
                                  
                                  {habilidad.evaluacion && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span className="text-gray-500">
                                        Mejor puntuación: <span className={`font-bold ${habilidad.evaluacion.completada ? 'text-green-600' : 'text-yellow-600'}`}>
                                          {habilidad.evaluacion.mejor_puntuacion}/10
                                        </span>
                                      </span>
                                    </>
                                  )}
                                </div>
                                
                                {habilidad.evaluacion && (
                                  <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          habilidad.evaluacion.completada ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}
                                        style={{ width: `${(habilidad.evaluacion.mejor_puntuacion / 10) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleEvaluar(habilidad)}
                                className="ml-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                              >
                                {habilidad.evaluacion ? '🔄 Re-evaluar' : '✅ Evaluar'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL DE EVALUACIÓN */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">📝 Nueva Evaluación</h3>
              <p className="text-blue-100">
                {habilidades.find(h => h.id === evaluacionActual.habilidad_id)?.nombre}
              </p>
            </div>

            <form onSubmit={handleSubmitEvaluacion} className="p-6">
              {/* ESCALA DE PUNTUACIÓN VISUAL */}
              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-800 mb-4">
                  Puntuación (1-10)
                </label>
                
                <div className="flex justify-center items-center mb-4">
                  <div className="text-6xl font-bold text-blue-600">
                    {evaluacionActual.puntuacion}
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={evaluacionActual.puntuacion}
                  onChange={(e) => setEvaluacionActual({ ...evaluacionActual, puntuacion: e.target.value })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(evaluacionActual.puntuacion - 1) * 11.11}%, #e5e7eb ${(evaluacionActual.puntuacion - 1) * 11.11}%, #e5e7eb 100%)`
                  }}
                />
                
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={evaluacionActual.observaciones}
                  onChange={(e) => setEvaluacionActual({ ...evaluacionActual, observaciones: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Detalles sobre la ejecución, puntos a mejorar, etc..."
                />
              </div>

              {/* VIDEO URL */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Video URL (Opcional)
                </label>
                <input
                  type="url"
                  value={evaluacionActual.video_url}
                  onChange={(e) => setEvaluacionActual({ ...evaluacionActual, video_url: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://youtube.com/..."
                />
              </div>

              {/* BOTONES */}
              <div className="flex space-x-4">
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
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : '✅ Guardar Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evaluaciones;