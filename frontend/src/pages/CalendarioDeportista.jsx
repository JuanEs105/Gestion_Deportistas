// frontend/src/pages/CalendarioDeportista.jsx - SOLO VISUALIZACIÓN
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CalendarioDeportista = () => {
  const [eventos, setEventos] = useState([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [miNivel, setMiNivel] = useState('1_basico');
  const [nombreDeportista, setNombreDeportista] = useState('');

  useEffect(() => {
    // Obtener nivel del deportista
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user && user.deportistaProfile) {
      setMiNivel(user.deportistaProfile.nivel_actual);
      setNombreDeportista(user.nombre || user.name);
    }
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [mesActual, miNivel]);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const mes = mesActual.getMonth() + 1;
      const año = mesActual.getFullYear();
      
      const response = await axios.get(
        `http://localhost:5000/api/calendario/nivel/${miNivel}?mes=${mes}&año=${año}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEventos(response.data.eventos || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickDia = (dia) => {
    const eventosDelDia = getEventosPorDia(dia);
    if (eventosDelDia.length > 0) {
      setDiaSeleccionado(dia);
      setMostrarModal(true);
    }
  };

  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1));
  };

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1));
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
      '1_basico': '1 Básico',
      '1_medio': '1 Medio',
      '1_avanzado': '1 Avanzado',
      '2': 'Nivel 2',
      '3': 'Nivel 3',
      '4': 'Nivel 4'
    };
    return nombres[nivel] || nivel;
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
          Visualiza los eventos programados para tu nivel
        </p>
        <div className="mt-3 flex items-center space-x-3">
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
            👤 {nombreDeportista}
          </span>
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
            📚 {getNivelNombre(miNivel)}
          </span>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={mesAnterior}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800">
              {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
            </h2>
            
            <button
              onClick={mesSiguiente}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
            📊 {eventos.length} evento{eventos.length !== 1 ? 's' : ''} este mes
          </div>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-center space-x-6">
          <span className="text-sm font-semibold text-gray-700">Tipos de eventos:</span>
          {['competencia', 'entrenamiento', 'evaluacion', 'festivo', 'general'].map(tipo => (
            <div key={tipo} className="flex items-center space-x-2">
              <span className="text-lg">{getTipoIcon(tipo)}</span>
              <span className="text-xs text-gray-600 capitalize">{tipo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CALENDARIO */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header días de la semana */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-blue-500 to-blue-600">
          {diasSemana.map(dia => (
            <div key={dia} className="p-4 text-center">
              <span className="text-sm font-bold text-white">{dia}</span>
            </div>
          ))}
        </div>

        {/* Días del mes */}
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
                } ${tieneEventos ? 'cursor-pointer' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-semibold ${
                    esHoyFlag ? 'text-blue-600' : dia.mesActual ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {dia.numero}
                  </span>
                  {tieneEventos && (
                    <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {eventosDelDia.length}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {eventosDelDia.slice(0, 2).map((evento, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1 rounded ${getTipoColor(evento.tipo)} text-white truncate`}
                      title={evento.titulo}
                    >
                      <span className="mr-1">{getTipoIcon(evento.tipo)}</span>
                      {evento.titulo}
                    </div>
                  ))}
                  {eventosDelDia.length > 2 && (
                    <div className="text-xs text-blue-600 font-semibold">
                      +{eventosDelDia.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRÓXIMOS EVENTOS */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">📋</span>
          Próximos Eventos
        </h3>
        
        {eventos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-6xl mb-4">📅</div>
            <p>No hay eventos programados este mes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos
              .filter(e => new Date(e.fecha) >= new Date())
              .slice(0, 5)
              .map(evento => (
                <div
                  key={evento.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getTipoIcon(evento.tipo)}</span>
                      <div>
                        <h4 className="font-bold text-gray-800">{evento.titulo}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(evento.fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 ${getTipoColor(evento.tipo)} text-white rounded-full text-xs font-semibold capitalize`}>
                      {evento.tipo}
                    </span>
                  </div>
                  {evento.descripcion && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
                      {evento.descripcion}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* MODAL DETALLES */}
      {mostrarModal && diaSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">
                📅 Eventos del {diaSeleccionado.numero} de {meses[mesActual.getMonth()]}
              </h3>
              <p className="text-blue-100">Tu nivel: {getNivelNombre(miNivel)}</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {getEventosPorDia(diaSeleccionado).map(evento => (
                  <div key={evento.id} className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-3xl">{getTipoIcon(evento.tipo)}</span>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800">{evento.titulo}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 ${getTipoColor(evento.tipo)} text-white rounded-full text-xs font-semibold`}>
                            {evento.tipo}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {getNivelNombre(evento.nivel)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {evento.descripcion && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        📝 {evento.descripcion}
                      </p>
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