// frontend/src/components/Notificaciones.jsx
import React, { useState, useEffect } from 'react';
import { evaluacionesAPI } from '../services/api';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrar, setMostrar] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  
  useEffect(() => {
    cargarNotificaciones();
    // Revisar cada 30 segundos
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const cargarNotificaciones = async () => {
    try {
      const response = await evaluacionesAPI.getPendientes();
      const pendientes = response.deportistas || [];
      
      // Crear notificaciones
      const nuevasNotificaciones = pendientes.map(deportista => ({
        id: deportista.id,
        tipo: 'nivel_completado',
        titulo: '🎉 ¡Nivel Completado!',
        mensaje: `${deportista.User?.nombre} ha completado el nivel ${deportista.nivel_actual}`,
        deportista: deportista,
        timestamp: new Date(),
        leida: false
      }));
      
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
  
  const aprobarNivel = async (deportista) => {
    try {
      await evaluacionesAPI.aprobarCambioNivel(deportista.id, 'Aprobado desde notificaciones');
      alert(`✅ ${deportista.User?.nombre} promovido exitosamente`);
      marcarComoLeida(deportista.id);
      await cargarNotificaciones();
    } catch (error) {
      alert('❌ Error al aprobar: ' + error.message);
    }
  };
  
  return (
    <div className="relative">
      {/* BOTÓN DE NOTIFICACIONES */}
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <span className="text-2xl">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {noLeidas}
          </span>
        )}
      </button>
      
      {/* PANEL DE NOTIFICACIONES */}
      {mostrar && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
            <h3 className="font-bold text-lg">🔔 Notificaciones</h3>
            <p className="text-sm text-blue-100">{noLeidas} sin leer</p>
          </div>
          
          {notificaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition ${
                    !notif.leida ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 text-2xl">
                      {notif.tipo === 'nivel_completado' && '🎉'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{notif.titulo}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notif.mensaje}</p>
                      
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => aprobarNivel(notif.deportista)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition"
                        >
                          ✅ Aprobar Nivel
                        </button>
                        <button
                          onClick={() => marcarComoLeida(notif.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                        >
                          Marcar leída
                        </button>
                      </div>
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

export default Notificaciones;