// frontend/src/pages/CalendarioDeportista.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CalendarioDeportista = () => {
  const [eventos, setEventos] = useState([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [miInfo, setMiInfo] = useState({
    nivel: null,
    grupo: null,
    nombre: ''
  });

  // ============================================
  // CONFIGURAR INFORMACIÓN DEL USUARIO
  // ============================================
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user) {
      const nivel = user.deportistaProfile?.nivel_actual || user.deportista?.nivel_actual || '1_basico';
      const grupo = user.deportistaProfile?.equipo_competitivo || user.deportista?.equipo_competitivo || null;
      
      setMiInfo({
        nivel: nivel,
        grupo: grupo,
        nombre: user.nombre || user.name || ''
      });
      
      console.log('👤 Mi información:', { nivel, grupo, nombre: user.nombre });
    }
  }, []);

  // ============================================
  // FUNCIÓN AUXILIAR: Normalizar grupos
  // ============================================
  const normalizarGrupo = (grupo) => {
    if (!grupo) return null;
    // Convertir "ROCKS TITANS" → "rocks_titans"
    return grupo.toLowerCase().trim().replace(/\s+/g, '_');
  };

  // ============================================
  // CARGAR EVENTOS - VERSIÓN CORREGIDA Y DEFINITIVA
  // ============================================
  const cargarEventos = async (silencioso = false) => {
    if (!miInfo.nivel) {
      console.log('⚠️ No hay nivel configurado, esperando...');
      return;
    }
    
    console.log('\n🔄 ========== CARGANDO EVENTOS ==========');
    console.log('👤 Mi información:', miInfo);
    
    try {
      if (!silencioso) {
        setLoading(true);
        console.log('📡 Cargando eventos...');
      }
      
      const mes = mesActual.getMonth() + 1;
      const año = mesActual.getFullYear();
      
      const params = new URLSearchParams({
        mes: mes,
        año: año
      });
      
      const url = `http://localhost:5000/api/calendario/filtros?${params.toString()}`;
      
      console.log('📡 Consultando:', url);
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        const todosEventos = response.data.eventos || [];
        
        console.log(`📥 ${todosEventos.length} eventos totales recibidos del servidor`);
        console.log('🔍 Mi nivel:', miInfo.nivel);
        console.log('🔍 Mi grupo:', miInfo.grupo);
        
        // ✅ FILTRADO MEJORADO CON LOGS DETALLADOS
        const miGrupoNormalizado = normalizarGrupo(miInfo.grupo);
        
        const eventosMios = todosEventos.filter(evento => {
          const eventoGrupoNormalizado = normalizarGrupo(evento.grupo_competitivo);
          
          console.log(`\n🔎 Analizando: "${evento.titulo}"`);
          console.log(`   Nivel evento: "${evento.nivel}" | Mi nivel: "${miInfo.nivel}"`);
          console.log(`   Grupo evento: "${evento.grupo_competitivo}" (${eventoGrupoNormalizado}) | Mi grupo: "${miInfo.grupo}" (${miGrupoNormalizado})`);
          
          // REGLA 1: Eventos para "todos" los niveles sin grupo específico
          if (evento.nivel === 'todos' && !evento.grupo_competitivo) {
            console.log(`   ✅ CUMPLE - REGLA 1: para todos sin grupo`);
            return true;
          }
          
          // REGLA 2: Eventos para mi nivel sin grupo específico
          if (evento.nivel === miInfo.nivel && !evento.grupo_competitivo) {
            console.log(`   ✅ CUMPLE - REGLA 2: mi nivel (${miInfo.nivel}) sin grupo`);
            return true;
          }
          
          // REGLA 3: Eventos para "todos" los niveles con mi grupo
          if (evento.nivel === 'todos' && miGrupoNormalizado && eventoGrupoNormalizado === miGrupoNormalizado) {
            console.log(`   ✅ CUMPLE - REGLA 3: todos con mi grupo (${miInfo.grupo})`);
            return true;
          }
          
          // REGLA 4: Eventos para mi nivel Y mi grupo
          if (evento.nivel === miInfo.nivel && miGrupoNormalizado && eventoGrupoNormalizado === miGrupoNormalizado) {
            console.log(`   ✅ CUMPLE - REGLA 4: mi nivel + mi grupo`);
            return true;
          }
          
          // ✅ REGLA 5 (NUEVA): Si NO tengo grupo asignado, ver TODOS los eventos de mi nivel
          if (!miGrupoNormalizado && evento.nivel === miInfo.nivel) {
            console.log(`   ✅ CUMPLE - REGLA 5: mi nivel (${miInfo.nivel}) y no tengo grupo asignado`);
            return true;
          }
          
          console.log(`   ❌ NO CUMPLE ninguna regla`);
          return false;
        });
        
        console.log(`\n✅ RESULTADO: ${eventosMios.length} eventos filtrados para mí`);
        
        setEventos(eventosMios);
        setUltimaActualizacion(new Date());
        
        if (silencioso && eventosMios.length > eventos.length) {
          mostrarNotificacionNuevoEvento();
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      if (!silencioso) {
        setEventos([]);
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  // ============================================
  // AUTO-REFRESH: Actualizar cada 15 segundos
  // ============================================
  useEffect(() => {
    if (!miInfo.nivel) return;
    
    cargarEventos(false);
    
    const intervalo = setInterval(() => {
      console.log('🔄 Auto-refresh: verificando nuevos eventos...');
      cargarEventos(true);
    }, 15000);
    
    return () => {
      clearInterval(intervalo);
      console.log('⏹️ Auto-refresh detenido');
    };
  }, [miInfo.nivel, miInfo.grupo, mesActual]);

  // ============================================
  // NOTIFICACIÓN DE NUEVO EVENTO
  // ============================================
  const mostrarNotificacionNuevoEvento = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📅 Nuevo Evento', {
        body: '¡Se ha agregado un nuevo evento a tu calendario!',
        icon: '/favicon.ico'
      });
    }
    
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
    toast.innerHTML = '🔔 ¡Nuevo evento agregado!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // ============================================
  // SOLICITAR PERMISOS DE NOTIFICACIONES
  // ============================================
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permisos de notificación:', permission);
      });
    }
  }, []);

  // ============================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================
  const handleClickDia = (dia) => {
    const eventosDelDia = getEventosPorDia(dia);
    if (eventosDelDia.length > 0) {
      setDiaSeleccionado(dia);
      setMostrarModal(true);
    }
  };

  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
  };

  const irAHoy = () => {
    setMesActual(new Date());
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDiasDelMes = () => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasAnteriores = primerDia.getDay();
    const diasMes = ultimoDia.getDate();
    const dias = [];
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
    
    for (let i = diasAnteriores - 1; i >= 0; i--) {
      dias.push({
        numero: ultimoDiaMesAnterior - i,
        mesActual: false,
        fecha: new Date(año, mes - 1, ultimoDiaMesAnterior - i)
      });
    }
    
    for (let i = 1; i <= diasMes; i++) {
      dias.push({
        numero: i,
        mesActual: true,
        fecha: new Date(año, mes, i)
      });
    }
    
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push({
        numero: i,
        mesActual: false,
        fecha: new Date(año, mes + 1, i)
      });
    }
    
    return dias;
  };

  const getEventosPorDia = (diaObj) => {
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      return fechaEvento.toDateString() === diaObj.fecha.toDateString();
    });
  };

  const esHoy = (diaObj) => {
    const hoy = new Date();
    return diaObj.fecha.toDateString() === hoy.toDateString();
  };

  const getTipoColor = (tipo) => {
    const colores = {
      competencia: 'bg-red-500',
      entrenamiento: 'bg-blue-500',
      evaluacion: 'bg-purple-500',
      festivo: 'bg-green-500',
      general: 'bg-gray-500'
    };
    return colores[tipo] || 'bg-gray-500';
  };

  const getTipoIcon = (tipo) => {
    const iconos = {
      competencia: '🏆',
      entrenamiento: '💪',
      evaluacion: '📋',
      festivo: '🎉',
      general: '📌'
    };
    return iconos[tipo] || '📌';
  };

  const getNivelNombre = (nivel) => {
    const nombres = {
      'baby_titans': '👶 Baby Titans',
      '1_basico': '🥉 1 Básico',
      '1_medio': '🥈 1 Medio',
      '1_avanzado': '🥇 1 Avanzado',
      '2': '⭐ Nivel 2',
      '3': '⭐⭐ Nivel 3',
      '4': '⭐⭐⭐ Nivel 4',
      'todos': '🌟 Todos los niveles'
    };
    return nombres[nivel] || nivel;
  };

  const formatearGrupo = (grupo) => {
    if (!grupo) return '';
    // Convertir de rocks_titans a ROCKS TITANS
    return grupo.toUpperCase().replace(/_/g, ' ');
  };

  const dias = getDiasDelMes();

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="text-5xl mr-3">📅</span>
          Mi Calendario de Actividades
        </h1>
        <p className="text-gray-600">
          Solo ves eventos que aplican para tu nivel y grupo • Se actualiza automáticamente cada 15 segundos
        </p>
        <div className="mt-3 flex items-center space-x-3 flex-wrap">
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
            👤 {miInfo.nombre}
          </span>
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
            {getNivelNombre(miInfo.nivel)}
          </span>
          {miInfo.grupo && (
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
              🏆 {formatearGrupo(miInfo.grupo)}
            </span>
          )}
          <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm">
            🔍 {eventos.length} evento{eventos.length !== 1 ? 's' : ''} para mí
          </span>
          {ultimaActualizacion && (
            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-xs">
              🔄 {ultimaActualizacion.toLocaleTimeString('es-ES')}
            </span>
          )}
        </div>
      </div>

      {/* CONTROLES */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={mesAnterior} className="p-2 hover:bg-gray-100 rounded-lg transition">
              ◀
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
            </h2>
            <button onClick={mesSiguiente} className="p-2 hover:bg-gray-100 rounded-lg transition">
              ▶
            </button>
            <button onClick={irAHoy} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition">
              Hoy
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => cargarEventos(false)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Cargando...
                </>
              ) : (
                <>
                  <span className="mr-2">🔄</span>
                  Actualizar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* INFO DE FILTRADO */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              🔄 Auto-actualización activa (cada 15 segundos)
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Solo ves eventos que cumplen con:</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Eventos para <strong>{getNivelNombre(miInfo.nivel)}</strong></li>
                {miInfo.grupo && (
                  <li>Eventos para <strong>{formatearGrupo(miInfo.grupo)}</strong></li>
                )}
                <li>Eventos generales para <strong>todos</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CALENDARIO */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="grid grid-cols-7 bg-gradient-to-r from-blue-500 to-blue-600">
          {diasSemana.map(dia => (
            <div key={dia} className="p-4 text-center">
              <span className="text-sm font-bold text-white">{dia}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
          {dias.map((dia, index) => {
            const eventosDelDia = getEventosPorDia(dia);
            const tieneEventos = eventosDelDia.length > 0;
            const esHoyFlag = esHoy(dia);
            
            return (
              <div
                key={index}
                onClick={() => tieneEventos && handleClickDia(dia)}
                className={`min-h-[120px] p-2 transition-all duration-200 ${
                  !dia.mesActual 
                    ? 'bg-gray-50 text-gray-400' 
                    : esHoyFlag 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-white hover:bg-blue-50'
                } ${tieneEventos ? 'cursor-pointer hover:shadow-inner' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-semibold ${
                    esHoyFlag ? 'text-blue-600' : dia.mesActual ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {dia.numero}
                  </span>
                  <div className="flex gap-1 items-center">
                    {tieneEventos && (
                      <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {eventosDelDia.length}
                      </span>
                    )}
                    {esHoyFlag && (
                      <span className="text-xs bg-red-500 text-white rounded-full px-2 py-1">
                        Hoy
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {eventosDelDia.slice(0, 3).map((evento, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1 rounded ${getTipoColor(evento.tipo)} text-white truncate`}
                      title={evento.titulo}
                    >
                      <span className="mr-1">{getTipoIcon(evento.tipo)}</span>
                      {evento.titulo}
                    </div>
                  ))}
                  {eventosDelDia.length > 3 && (
                    <div className="text-xs text-blue-600 font-semibold">
                      +{eventosDelDia.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DETALLES */}
      {mostrarModal && diaSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white rounded-t-2xl sticky top-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">
                    📅 Eventos del {diaSeleccionado.numero} de {meses[mesActual.getMonth()]}
                  </h3>
                  <p className="text-blue-100">
                    {getEventosPorDia(diaSeleccionado).length} evento{getEventosPorDia(diaSeleccionado).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setDiaSeleccionado(null);
                  }}
                  className="text-white hover:text-blue-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {getEventosPorDia(diaSeleccionado).map(evento => (
                  <div key={evento.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start space-x-3 mb-3">
                      <span className="text-3xl">{getTipoIcon(evento.tipo)}</span>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800">{evento.titulo}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`px-3 py-1 ${getTipoColor(evento.tipo)} text-white rounded-full text-xs font-semibold capitalize`}>
                            {evento.tipo}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {getNivelNombre(evento.nivel)}
                          </span>
                          {evento.grupo_competitivo && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                              🏆 {formatearGrupo(evento.grupo_competitivo)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <span className="mr-2">📅</span>
                        <span className="font-medium">
                          {new Date(evento.fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {evento.entrenador && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">👤</span>
                          <span>Creado por: <strong>{evento.entrenador.nombre}</strong></span>
                        </div>
                      )}
                    </div>
                    
                    {evento.descripcion && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">📝 Descripción:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {evento.descripcion}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setDiaSeleccionado(null);
                }}
                className="w-full mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioDeportista;