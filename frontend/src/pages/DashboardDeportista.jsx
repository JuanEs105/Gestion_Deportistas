// frontend/src/pages/DashboardDeportista.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardDeportista = () => {
  const [deportista, setDeportista] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [ultimasEvaluaciones, setUltimasEvaluaciones] = useState([]);
  const [proximosEventos, setProximosEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    cargarDatosPrincipales();
  }, []);
  
  const cargarDatosPrincipales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        navigate('/login');
        return;
      }
      
      const user = JSON.parse(userData);
      
      // OBTENER ID DEL DEPORTISTA CORRECTAMENTE
      let deportistaId = null;
      let nivelActual = '1_basico';
      
      if (user.deportistaProfile?.id) {
        deportistaId = user.deportistaProfile.id;
        nivelActual = user.deportistaProfile.nivel_actual || '1_basico';
      } else {
        const meResponse = await fetch('http://localhost:5000/api/deportistas/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (meResponse.ok) {
          const meData = await meResponse.json();
          deportistaId = meData.deportista.id;
          nivelActual = meData.deportista.nivel_actual;
          
          user.deportistaProfile = {
            id: deportistaId,
            nivel_actual: nivelActual,
            estado: meData.deportista.estado,
            foto_perfil: meData.deportista.foto_perfil
          };
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      if (!deportistaId) {
        throw new Error('No se pudo obtener tu perfil de deportista');
      }
      
      setDeportista({
        id: deportistaId,
        nombre: user.nombre || user.name,
        email: user.email,
        nivel_actual: nivelActual,
        foto_perfil: user.deportistaProfile?.foto_perfil
      });
      
      // CARGAR DATOS EN PARALELO
      const [progresoRes, evaluacionesRes, eventosRes] = await Promise.all([
        fetch(`http://localhost:5000/api/evaluaciones/progreso/${deportistaId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/evaluaciones/deportista/${deportistaId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/calendario/nivel/${nivelActual}?mes=${new Date().getMonth() + 1}&año=${new Date().getFullYear()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (progresoRes.ok) {
        const progresoData = await progresoRes.json();
        setProgreso(progresoData);
      }
      
      if (evaluacionesRes.ok) {
        const evalData = await evaluacionesRes.json();
        setUltimasEvaluaciones(evalData.evaluaciones?.slice(0, 5) || []);
      }
      
      if (eventosRes.ok) {
        const eventosData = await eventosRes.json();
        const hoy = new Date();
        const eventosFuturos = (eventosData.eventos || [])
          .filter(e => new Date(e.fecha) >= hoy)
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          .slice(0, 3);
        setProximosEventos(eventosFuturos);
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message || 'Error al cargar tus datos');
    } finally {
      setLoading(false);
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
  
  const getCategoriaIcon = (categoria) => {
    const iconos = {
      'habilidad': '🏆',
      'ejercicio_accesorio': '💪',
      'postura': '🧘'
    };
    return iconos[categoria] || '📋';
  };
  
  const getTipoIcon = (tipo) => {
    const iconos = {
      'competencia': '🏆',
      'entrenamiento': '💪',
      'evaluacion': '📋',
      'festivo': '🎉',
      'general': '📌'
    };
    return iconos[tipo] || '📌';
  };
  
  const irA = (ruta) => {
    navigate(ruta);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mb-6"></div>
        <p className="text-2xl font-bold text-blue-700">🏃 Cargando tu panel...</p>
        <p className="text-gray-600 mt-2">Obteniendo tus datos personalizados</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error al cargar datos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      
      {/* HEADER CON BIENVENIDA */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {deportista?.foto_perfil ? (
                <img
                  src={deportista.foto_perfil}
                  alt={deportista.nombre}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white text-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold">
                    {deportista?.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                ¡Hola, {deportista?.nombre}! 👋
              </h1>
              <p className="text-blue-100">{deportista?.email}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                  📚 {getNivelNombre(deportista?.nivel_actual)}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                  ⭐ Activo
                </span>
              </div>
            </div>
          </div>
          
          {/* PROGRESO CIRCULAR */}
          <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold mb-2">TU PROGRESO</p>
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="white"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="352"
                  strokeDashoffset={352 - ((progreso?.progreso_total?.porcentaje || 0) / 100) * 352}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold">{progreso?.progreso_total?.porcentaje || 0}%</p>
                <p className="text-xs opacity-90">
                  {progreso?.progreso_total?.completadas || 0}/{progreso?.progreso_total?.total || 0}
                </p>
              </div>
            </div>
            <p className="text-xs mt-2 opacity-90">
              {progreso?.progreso_total?.faltantes || 0} habilidades pendientes
            </p>
          </div>
        </div>
      </div>
      
      {/* ACCESO RÁPIDO */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🚀</span> Acceso Rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => irA('/deportista/progreso')}
            className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <span className="text-3xl">📊</span>
              </div>
              <span className="text-white opacity-70 group-hover:opacity-100 transition">→</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Mi Progreso</h3>
            <p className="text-blue-100 text-sm">Ver detalle completo</p>
            <div className="mt-3 pt-3 border-t border-white border-opacity-20">
              <p className="text-2xl font-bold">{progreso?.progreso_total?.porcentaje || 0}%</p>
            </div>
          </button>
          
          <button
            onClick={() => irA('/deportista/evaluaciones')}
            className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <span className="text-3xl">📋</span>
              </div>
              <span className="text-white opacity-70 group-hover:opacity-100 transition">→</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Mis Evaluaciones</h3>
            <p className="text-green-100 text-sm">Historial completo</p>
            <div className="mt-3 pt-3 border-t border-white border-opacity-20">
              <p className="text-2xl font-bold">{ultimasEvaluaciones.length}</p>
            </div>
          </button>
          
          <button
            onClick={() => irA('/deportista/habilidades')}
            className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <span className="text-3xl">🎯</span>
              </div>
              <span className="text-white opacity-70 group-hover:opacity-100 transition">→</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Mis Habilidades</h3>
            <p className="text-purple-100 text-sm">Por nivel y categoría</p>
            <div className="mt-3 pt-3 border-t border-white border-opacity-20">
              <p className="text-sm">{progreso?.progreso_total?.completadas || 0} completadas</p>
            </div>
          </button>
          
          <button
            onClick={() => irA('/deportista/calendario')}
            className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <span className="text-3xl">📅</span>
              </div>
              <span className="text-white opacity-70 group-hover:opacity-100 transition">→</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Calendario</h3>
            <p className="text-orange-100 text-sm">Eventos y actividades</p>
            <div className="mt-3 pt-3 border-t border-white border-opacity-20">
              <p className="text-sm">{proximosEventos.length} próximos</p>
            </div>
          </button>
        </div>
      </div>
      
      {/* PROGRESO POR CATEGORÍA */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📈</span> Tu Progreso por Categoría
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(progreso?.progreso_por_categoria || {}).map(([categoria, data]) => {
            const configs = {
              'habilidad': { 
                label: 'Habilidades Técnicas', 
                icon: '🏆', 
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50'
              },
              'ejercicio_accesorio': { 
                label: 'Ejercicios Accesorios', 
                icon: '💪', 
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50'
              },
              'postura': { 
                label: 'Posturas', 
                icon: '🧘', 
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50'
              }
            };
            
            const config = configs[categoria] || configs['habilidad'];
            
            return (
              <div key={categoria} className={`${config.bgColor} rounded-2xl p-6 border-2 border-gray-200`}>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-4xl">{config.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-800">{config.label}</h3>
                    <p className="text-sm text-gray-600">
                      {data.completadas}/{data.total} completadas
                    </p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-bold text-gray-800">{data.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`bg-gradient-to-r ${config.color} h-full rounded-full transition-all duration-1000`}
                      style={{ width: `${data.porcentaje}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Faltan:</span>
                  <span className="font-bold text-gray-800">{data.faltantes}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ÚLTIMAS EVALUACIONES Y PRÓXIMOS EVENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ÚLTIMAS EVALUACIONES */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">📋</span> Últimas Evaluaciones
            </h3>
            <button
              onClick={() => irA('/deportista/evaluaciones')}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
            >
              Ver todas →
            </button>
          </div>
          
          <div className="space-y-3">
            {ultimasEvaluaciones.map((evaluacion) => (
              <div
                key={evaluacion.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {getCategoriaIcon(evaluacion.habilidad?.categoria)}
                    </span>
                    <div>
                      <p className="font-bold text-gray-800">
                        {evaluacion.habilidad?.nombre || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      evaluacion.completado ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {evaluacion.puntuacion}/10
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      evaluacion.completado 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {evaluacion.completado ? '✅' : '🔄'}
                    </span>
                  </div>
                </div>
                
                {evaluacion.observaciones && (
                  <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                    💬 {evaluacion.observaciones}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* PRÓXIMOS EVENTOS */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">📅</span> Próximos Eventos
            </h3>
            <button
              onClick={() => irA('/deportista/calendario')}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
            >
              Ver calendario →
            </button>
          </div>
          
          <div className="space-y-3">
            {proximosEventos.map((evento) => (
              <div
                key={evento.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">{getTipoIcon(evento.tipo)}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{evento.titulo}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      📅 {new Date(evento.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {evento.descripcion && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {evento.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* MOTIVACIÓN */}
      <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-3">
          {progreso?.progreso_total?.porcentaje >= 80 ? '🌟 ¡Excelente trabajo!' :
           progreso?.progreso_total?.porcentaje >= 50 ? '💪 ¡Vas muy bien!' :
           '🚀 ¡Sigue adelante!'}
        </h3>
        <p className="text-lg mb-4">
          {progreso?.progreso_total?.porcentaje >= 80 ? 
            '¡Estás muy cerca de completar tu nivel! Sigue así.' :
           progreso?.progreso_total?.porcentaje >= 50 ?
            'Ya llevas más de la mitad, ¡no te detengas!' :
            'Cada evaluación te acerca a tu meta. ¡Tú puedes!'}
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm">
          <div>
            <p className="text-purple-100">Completadas</p>
            <p className="text-3xl font-bold">{progreso?.progreso_total?.completadas || 0}</p>
          </div>
          <div>
            <p className="text-purple-100">Faltan</p>
            <p className="text-3xl font-bold">{progreso?.progreso_total?.faltantes || 0}</p>
          </div>
          <div>
            <p className="text-purple-100">Total</p>
            <p className="text-3xl font-bold">{progreso?.progreso_total?.total || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDeportista;