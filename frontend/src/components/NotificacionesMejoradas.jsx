// frontend/src/components/NotificacionesMejoradas.jsx
import React, { useState, useEffect } from 'react';
import { evaluacionesAPI } from '../services/api';

const NotificacionesMejoradas = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrar, setMostrar] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  
  useEffect(() => {
    // Obtener niveles asignados del entrenador
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user && user.tipo === 'entrenador') {
      setNivelesAsignados(user.niveles_asignados || []);
    }
    
    cargarNotificaciones();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const cargarNotificaciones = async () => {
    try {
      const response = await evaluacionesAPI.getPendientes();
      const pendientes = response.deportistas || [];
      
      // FILTRAR POR NIVELES ASIGNADOS
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const nivelesEntrenador = user?.niveles_asignados || [];
      
      const deportistasFiltrados = pendientes.filter(d => 
        nivelesEntrenador.length === 0 || nivelesEntrenador.includes(d.nivel_actual)
      );
      
      const nuevasNotificaciones = [];
      
      // Generar notificaciones según el progreso
      for (const deportista of deportistasFiltrados) {
        try {
          const progresoRes = await evaluacionesAPI.getProgreso(deportista.id);
          const porcentaje = progresoRes.progreso_total.porcentaje;
          
          // NOTIFICACIÓN AL 90%
          if (porcentaje >= 90 && porcentaje < 100) {
            nuevasNotificaciones.push({
              id: `progreso-90-${deportista.id}`,
              tipo: 'advertencia_90',
              titulo: '⚠️ ¡Casi Completado!',
              mensaje: `${deportista.User?.nombre} está al ${porcentaje}% del nivel ${deportista.nivel_actual}`,
              deportista: deportista,
              progreso: progresoRes,
              timestamp: new Date(),
              leida: false,
              prioridad: 'media'
            });
          }
          
          // NOTIFICACIÓN AL 100% - LISTA PARA PROMOCIÓN
          if (porcentaje === 100 && deportista.cambio_nivel_pendiente) {
            nuevasNotificaciones.push({
              id: `nivel-completo-${deportista.id}`,
              tipo: 'nivel_completo',
              titulo: '🎉 ¡Nivel Completado!',
              mensaje: `${deportista.User?.nombre} completó el 100% del nivel ${deportista.nivel_actual}`,
              deportista: deportista,
              progreso: progresoRes,
              timestamp: new Date(),
              leida: false,
              prioridad: 'alta'
            });
          }
          
        } catch (error) {
          console.error('Error obteniendo progreso:', error);
        }
      }
      
      setNotificaciones(nuevasNotificaciones);
      setNoLeidas(nuevasNotificaciones.filter(n => !n.leida).length);
      
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };
  
  const marcarComoLeida = (id) => {
    setNotificaciones(prev => 
      prev.map(n => n.id === id ? {...n, leida: true} : n)
    );
    setNoLeidas(prev => Math.max(0, prev - 1));
  };
  
  const aprobarNivel = async (deportista, progreso) => {
    if (!window.confirm(
      `¿Confirmas que ${deportista.User?.nombre} ha completado todos los requisitos?\n\n` +
      `Nivel actual: ${deportista.nivel_actual}\n` +
      `Nivel siguiente: ${deportista.nivel_sugerido}\n` +
      `Progreso: ${progreso.progreso_total.porcentaje}%`
    )) {
      return;
    }
    
    try {
      await evaluacionesAPI.aprobarCambioNivel(
        deportista.id, 
        `Promovido automáticamente - Completó el 100% del nivel ${deportista.nivel_actual}`
      );
      
      // Mostrar mensaje de éxito
      alert(`✅ ¡${deportista.User?.nombre} ha sido promovido exitosamente!\n\n` +
            `De: ${deportista.nivel_actual}\n` +
            `A: ${deportista.nivel_sugerido}`);
      
      marcarComoLeida(`nivel-completo-${deportista.id}`);
      await cargarNotificaciones();
    } catch (error) {
      alert('❌ Error al aprobar: ' + error.message);
    }
  };
  
  const verDetalleProgreso = (deportista, progreso) => {
    const detalles = Object.entries(progreso.progreso_por_categoria)
      .map(([cat, data]) => 
        `${cat === 'habilidad' ? '🏆 Habilidades' : 
          cat === 'ejercicio_accesorio' ? '💪 Ejercicios' : '🧘 Posturas'}: ${data.completadas}/${data.total} (${data.porcentaje}%)`
      ).join('\n');
    
    alert(
      `📊 Progreso Detallado de ${deportista.User?.nombre}\n\n` +
      `Nivel: ${deportista.nivel_actual}\n` +
      `Progreso Total: ${progreso.progreso_total.porcentaje}%\n` +
      `Completadas: ${progreso.progreso_total.completadas}/${progreso.progreso_total.total}\n\n` +
      `Desglose por categoría:\n${detalles}\n\n` +
      `Faltan: ${progreso.progreso_total.faltantes} habilidades`
    );
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
  
  // Ordenar notificaciones por prioridad
  const notificacionesOrdenadas = [...notificaciones].sort((a, b) => {
    const prioridades = { alta: 3, media: 2, baja: 1 };
    return prioridades[b.prioridad] - prioridades[a.prioridad];
  });
  
  return (
    <div className="relative">
      {/* BOTÓN DE NOTIFICACIONES */}
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition group"
      >
        <span className="text-2xl">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
            {noLeidas}
          </span>
        )}
        
        {/* Tooltip */}
        <span className="absolute hidden group-hover:block top-full mt-2 right-0 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {noLeidas} notificación{noLeidas !== 1 ? 'es' : ''} sin leer
        </span>
      </button>
      
      {/* PANEL DE NOTIFICACIONES */}
      {mostrar && (
        <div className="absolute right-0 mt-2 w-[450px] bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-[600px] overflow-y-auto">
          <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl sticky top-0 z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">🔔 Notificaciones</h3>
              <button
                onClick={() => setMostrar(false)}
                className="text-white hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-100">{noLeidas} sin leer</span>
              {notificaciones.length > 0 && (
                <button
                  onClick={() => {
                    setNotificaciones(prev => prev.map(n => ({...n, leida: true})));
                    setNoLeidas(0);
                  }}
                  className="text-blue-100 hover:text-white underline text-xs"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>
          
          {notificaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg font-semibold mb-2">No hay notificaciones</p>
              <p className="text-sm">Te avisaremos cuando haya novedades</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacionesOrdenadas.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition ${
                    !notif.leida ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  } ${
                    notif.prioridad === 'alta' ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 text-3xl">
                      {notif.tipo === 'nivel_completo' ? '🎉' : '⚠️'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-800">{notif.titulo}</h4>
                        {notif.prioridad === 'alta' && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                            ¡URGENTE!
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{notif.mensaje}</p>
                      
                      {/* Barra de progreso visual */}
                      {notif.progreso && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progreso del nivel</span>
                            <span className="font-bold">
                              {notif.progreso.progreso_total.completadas}/{notif.progreso.progreso_total.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                notif.progreso.progreso_total.porcentaje === 100 
                                  ? 'bg-green-500 animate-pulse' 
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${notif.progreso.progreso_total.porcentaje}%` }}
                            >
                              <span className="text-white text-xs font-bold flex items-center justify-center h-full">
                                {notif.progreso.progreso_total.porcentaje}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Información del deportista */}
                      <div className="bg-gray-100 rounded-lg p-2 mb-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span>👤 {notif.deportista.User?.nombre}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                            {getNivelNombre(notif.deportista.nivel_actual)}
                          </span>
                        </div>
                        {notif.tipo === 'nivel_completo' && (
                          <div className="mt-1 text-green-700 font-semibold">
                            ➡️ Listo para: {getNivelNombre(notif.deportista.nivel_sugerido)}
                          </div>
                        )}
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex flex-wrap gap-2">
                        {notif.tipo === 'nivel_completo' ? (
                          <>
                            <button
                              onClick={() => aprobarNivel(notif.deportista, notif.progreso)}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md"
                            >
                              ✅ Aprobar Promoción
                            </button>
                            <button
                              onClick={() => verDetalleProgreso(notif.deportista, notif.progreso)}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
                            >
                              📊 Ver Detalles
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => verDetalleProgreso(notif.deportista, notif.progreso)}
                              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
                            >
                              📊 Ver Progreso
                            </button>
                            <button
                              onClick={() => marcarComoLeida(notif.id)}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                            >
                              ✓ Marcar leída
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <p className="text-xs text-gray-400 mt-2">
                        🕒 {new Date(notif.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesMejoradas;