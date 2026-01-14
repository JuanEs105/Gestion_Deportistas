// frontend/src/components/NotificacionesPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const NotificacionesPanel = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrar, setMostrar] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  
  useEffect(() => {
    cargarNotificaciones();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarNotificaciones, 30000);
    
    // Click fuera para cerrar
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setMostrar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const cargarNotificaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/api/notificaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotificaciones(response.data.notificaciones || []);
        setNoLeidas(response.data.no_leidas || 0);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };
  
  const marcarComoLeida = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/notificaciones/${id}/leer`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const marcarTodasComoLeidas = async () => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      await axios.put(
        'http://localhost:5000/api/notificaciones/leer-todas',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const eliminarNotificacion = async (id, e) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/notificaciones/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const getIconoPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return '🚨';
      case 'alta': return '⚠️';
      case 'media': return 'ℹ️';
      default: return '📌';
    }
  };
  
  const getColorPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return 'bg-red-100 border-red-500';
      case 'alta': return 'bg-orange-100 border-orange-500';
      case 'media': return 'bg-blue-100 border-blue-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };
  
  const getTiempoTranscurrido = (fecha) => {
    const ahora = new Date();
    const creada = new Date(fecha);
    const diffMs = ahora - creada;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return creada.toLocaleDateString('es-ES');
  };
  
  return (
    <div className="relative" ref={panelRef}>
      {/* BOTÓN DE NOTIFICACIONES */}
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition group"
        aria-label="Notificaciones"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse shadow-lg">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
        
        {/* Tooltip */}
        <span className="absolute hidden group-hover:block top-full mt-2 right-0 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
          {noLeidas} notificación{noLeidas !== 1 ? 'es' : ''} sin leer
        </span>
      </button>
      
      {/* PANEL DE NOTIFICACIONES */}
      {mostrar && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notificaciones
              </h3>
              <button
                onClick={() => setMostrar(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-100">
                {noLeidas} sin leer de {notificaciones.length}
              </span>
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  disabled={loading}
                  className="text-blue-100 hover:text-white underline text-xs disabled:opacity-50"
                >
                  {loading ? 'Marcando...' : 'Marcar todas'}
                </button>
              )}
            </div>
          </div>
          
          {/* Lista de Notificaciones */}
          <div className="flex-1 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg font-semibold mb-2">No hay notificaciones</p>
                <p className="text-sm">Te avisaremos cuando haya novedades</p>
              </div>
            ) : (
              <div className="divide-y">
                {notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.leida && marcarComoLeida(notif.id)}
                    className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                      !notif.leida ? `${getColorPrioridad(notif.prioridad)} border-l-4` : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 text-2xl flex-shrink-0">
                        {notif.icono || getIconoPrioridad(notif.prioridad)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-semibold text-gray-800 text-sm ${!notif.leida ? 'font-bold' : ''}`}>
                            {notif.titulo}
                          </h4>
                          
                          <button
                            onClick={(e) => eliminarNotificacion(notif.id, e)}
                            className="text-gray-400 hover:text-red-500 transition ml-2 flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notif.mensaje}
                        </p>
                        
                        {/* Info del evento si existe */}
                        {notif.evento && (
                          <div className="bg-white rounded-lg p-2 mb-2 text-xs border border-gray-200">
                            <div className="font-semibold text-gray-700 mb-1">
                              📅 {notif.evento.titulo}
                            </div>
                            <div className="text-gray-500">
                              {new Date(notif.evento.fecha).toLocaleString('es-ES')}
                            </div>
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {notif.prioridad === 'urgente' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                              URGENTE
                            </span>
                          )}
                          {notif.prioridad === 'alta' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                              Prioridad Alta
                            </span>
                          )}
                          
                          <span className="text-xs text-gray-400">
                            {getTiempoTranscurrido(notif.createdAt)}
                          </span>
                          
                          {!notif.leida && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        
                        {/* URL de acción */}
                        {notif.url && (
                          <div className="mt-2">
                            <a
                              href={notif.url}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium inline-flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver más
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="p-3 border-t bg-gray-50 rounded-b-xl text-center flex-shrink-0">
              <button
                onClick={() => window.location.href = '/notificaciones'}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPanel;