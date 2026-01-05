import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluacionesAPI } from '../services/api';

const MisEvaluaciones = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [deportista, setDeportista] = useState(null);
  const [comentarioExpandido, setComentarioExpandido] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user) {
        throw new Error('No hay sesión activa');
      }
      
      let deportistaId = user.deportistaProfile?.id;
      
      if (!deportistaId) {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/deportistas/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          deportistaId = data.deportista.id;
        }
      }
      
      if (!deportistaId) {
        throw new Error('No se encontró tu perfil de deportista');
      }
      
      setDeportista({
        nombre: user.nombre || user.name
      });
      
      // Cargar evaluaciones
      const evaluacionesRes = await evaluacionesAPI.getByDeportista(deportistaId);
      setEvaluaciones(evaluacionesRes.evaluaciones || []);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError(error.message || 'Error al cargar tus datos');
    } finally {
      setLoading(false);
    }
  };
  
  const getCategoriaIcon = (cat) => {
    const iconos = {
      'habilidad': '🏆',
      'ejercicio_accesorio': '💪',
      'postura': '🧘'
    };
    return iconos[cat] || '📋';
  };
  
  const getCategoriaNombre = (cat) => {
    return cat === 'habilidad' ? 'Habilidades Técnicas' :
           cat === 'ejercicio_accesorio' ? 'Ejercicios Accesorios' :
           'Posturas Corporales';
  };
  
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const toggleComentario = (id) => {
    if (comentarioExpandido === id) {
      setComentarioExpandido(null);
    } else {
      setComentarioExpandido(id);
    }
  };
  
  // Filtrar evaluaciones
  const evaluacionesFiltradas = evaluaciones.filter(e => {
    const matchCategoria = filtroCategoria === 'todas' || e.habilidad?.categoria === filtroCategoria;
    const matchEstado = filtroEstado === 'todas' || 
      (filtroEstado === 'completadas' && e.completado) ||
      (filtroEstado === 'pendientes' && !e.completado);
    return matchCategoria && matchEstado;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold text-lg">📋 Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error al cargar datos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={cargarDatos}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => navigate('/deportista')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Mis Evaluaciones</h1>
          {deportista && (
            <p className="text-gray-600">
              Historial completo de evaluaciones • {evaluaciones.length} registros
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/deportista')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
        >
          ← Volver al Dashboard
        </button>
      </div>
      
      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-sm opacity-90">Total Evaluaciones</p>
          <p className="text-4xl font-bold mt-2">{evaluaciones.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-xl text-white">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm opacity-90">Completadas</p>
          <p className="text-4xl font-bold mt-2">
            {evaluaciones.filter(e => e.completado).length}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-2xl shadow-xl text-white">
          <div className="text-4xl mb-2">⭐</div>
          <p className="text-sm opacity-90">Promedio</p>
          <p className="text-4xl font-bold mt-2">
            {evaluaciones.length > 0 
              ? (evaluaciones.reduce((sum, e) => sum + e.puntuacion, 0) / evaluaciones.length).toFixed(1)
              : '0'}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-sm opacity-90">Progreso</p>
          <p className="text-4xl font-bold mt-2">
            {evaluaciones.length > 0 
              ? Math.round((evaluaciones.filter(e => e.completado).length / evaluaciones.length) * 100)
              : 0}%
          </p>
        </div>
      </div>
      
      {/* FILTROS */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtrar Evaluaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Por Categoría</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todas">Todas las categorías</option>
              <option value="habilidad">🏆 Habilidades Técnicas</option>
              <option value="ejercicio_accesorio">💪 Ejercicios Accesorios</option>
              <option value="postura">🧘 Posturas Corporales</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Por Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todas">Todas</option>
              <option value="completadas">✅ Completadas</option>
              <option value="pendientes">🔄 En Progreso</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* LISTA DE EVALUACIONES */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Historial de Evaluaciones</h3>
          <span className="text-sm text-gray-500">
            Mostrando {evaluacionesFiltradas.length} de {evaluaciones.length}
          </span>
        </div>
        
        {evaluacionesFiltradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-7xl mb-4">📋</div>
            <h4 className="text-xl font-bold mb-2">
              {evaluaciones.length === 0 
                ? 'No tienes evaluaciones registradas aún' 
                : 'No hay evaluaciones con estos filtros'}
            </h4>
            <p className="text-gray-500">
              {evaluaciones.length === 0 
                ? 'Tu entrenador registrará aquí tus evaluaciones' 
                : 'Intenta cambiar los filtros para ver más resultados'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {evaluacionesFiltradas.map((evalu, index) => {
              const tieneRetroalimentacion = evalu.observaciones || evalu.video_url;
              
              return (
                <div
                  key={evalu.id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:border-blue-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getCategoriaIcon(evalu.habilidad?.categoria)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-gray-800 text-lg">{evalu.habilidad?.nombre}</h4>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                            #{evaluaciones.length - index}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          📅 {formatFecha(evalu.fecha_evaluacion)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-2 rounded-full font-bold text-lg ${
                        evalu.completado 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {evalu.completado ? '✅' : '🔄'} {evalu.puntuacion}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span>Mínimo requerido: <span className="font-bold text-blue-600">{evalu.habilidad?.puntuacion_minima || 7}/10</span></span>
                    <span>•</span>
                    <span>👨‍🏫 Evaluado por: <span className="font-semibold">{evalu.entrenador?.nombre || 'Entrenador'}</span></span>
                  </div>
                  
                  {/* RETROALIMENTACIÓN COMPLETA */}
                  {tieneRetroalimentacion && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleComentario(evalu.id)}
                        className="flex items-center justify-between w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">💬</span>
                          <span className="font-semibold text-blue-700">
                            Retroalimentación del Entrenador
                          </span>
                          {evalu.video_url && (
                            <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                              🎥 Video Incluido
                            </span>
                          )}
                        </div>
                        <span className="text-blue-600">
                          {comentarioExpandido === evalu.id ? '▲ Ocultar' : '▼ Mostrar'}
                        </span>
                      </button>
                      
                      {comentarioExpandido === evalu.id && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                          {/* OBSERVACIONES */}
                          {evalu.observaciones && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                                <span className="mr-2">📝</span> Observaciones:
                              </p>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                                {evalu.observaciones}
                              </p>
                            </div>
                          )}
                          
                          {/* VIDEO DE RETROALIMENTACIÓN */}
                          {evalu.video_url && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                                <span className="mr-2">🎥</span> Video de Retroalimentación:
                              </p>
                              <div className="bg-white p-3 rounded-lg">
                                <a
                                  href={evalu.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                  <span className="mr-2">▶️</span>
                                  Ver Video de Retroalimentación
                                </a>
                                <p className="text-xs text-gray-500 mt-2">
                                  Este video contiene comentarios y sugerencias específicas para mejorar tu técnica.
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* CONSEJOS DE MEJORA */}
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                              <span className="mr-2">💡</span> Recomendaciones para Próxima Evaluación:
                            </p>
                            <ul className="text-sm text-gray-600 bg-white p-3 rounded-lg list-disc pl-5 space-y-1">
                              <li>Enfócate en los puntos mencionados por tu entrenador</li>
                              <li>Practica regularmente antes de la siguiente evaluación</li>
                              <li>Si hay video, revísalo varias veces para identificar áreas de mejora</li>
                              <li>Consulta con tu entrenador si tienes dudas</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* SI NO HAY RETROALIMENTACIÓN */}
                  {!tieneRetroalimentacion && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-center">
                        <span className="mr-2">ℹ️</span>
                        Esta evaluación no incluye retroalimentación adicional. Si necesitas más detalles, consulta con tu entrenador.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* RESUMEN ESTADÍSTICO */}
      {evaluaciones.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Resumen de tu Rendimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Mejor Puntuación</p>
              <p className="text-2xl font-bold text-gray-800">
                {Math.max(...evaluaciones.map(e => e.puntuacion))}/10
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Peor Puntuación</p>
              <p className="text-2xl font-bold text-gray-800">
                {Math.min(...evaluaciones.map(e => e.puntuacion))}/10
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Racha Actual</p>
              <p className="text-2xl font-bold text-gray-800">
                {(() => {
                  let racha = 0;
                  for (let i = 0; i < evaluaciones.length; i++) {
                    if (evaluaciones[i].completado) racha++;
                    else break;
                  }
                  return racha;
                })()} evaluaciones exitosas consecutivas
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Evaluaciones con Retroalimentación</p>
              <p className="text-2xl font-bold text-gray-800">
                {evaluaciones.filter(e => e.observaciones || e.video_url).length}/{evaluaciones.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisEvaluaciones;