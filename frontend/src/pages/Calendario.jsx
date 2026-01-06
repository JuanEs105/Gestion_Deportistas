// frontend/src/pages/Calendario.jsx - VERSIÓN 100% FUNCIONAL Y CORREGIDA
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Calendario = () => {
  const [eventos, setEventos] = useState([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [mostrarModal, setMostrarModal] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [nivelSeleccionado, setNivelSeleccionado] = useState('');
  const [eventoEditando, setEventoEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nivelesDisponibles, setNivelesDisponibles] = useState([]);
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos'); // NUEVO: Para filtrar vista
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    nivel: '',
    tipo: 'general'
  });

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [mesActual, filtroNivel]); // CAMBIADO: Ahora usa filtroNivel

  const cargarDatosUsuario = () => {
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  
  console.log('👤 Usuario cargado:', user);
  
  if (user) {
    const role = user.tipo || user.role || 'deportista';
    setUserRole(role);
    setUserName(user.nombre || user.name || 'Usuario');
    
    if (role === 'entrenador') {
      const niveles = user.niveles_asignados || [];
      console.log('📚 Niveles asignados:', niveles);
      
      setNivelesAsignados(niveles);
      
      // VERIFICAR SI NO TIENE NIVELES
      if (niveles.length === 0) {
        console.log('⚠️ ENTRENADOR SIN NIVELES ASIGNADOS');
        alert('⚠️ No tienes niveles asignados. Contacta al administrador para que te asigne niveles.');
        setFormData(prev => ({ ...prev, nivel: '1_basico' }));
      } else {
        // Seleccionar el primer nivel
        setNivelSeleccionado(niveles[0]);
        setFormData(prev => ({ ...prev, nivel: niveles[0] }));
        console.log('✅ Nivel seleccionado:', niveles[0]);
      }
    } else if (role === 'deportista') {
      const nivelDeportista = user.deportistaProfile?.nivel_actual || '1_basico';
      setNivelSeleccionado(nivelDeportista);
      setFormData(prev => ({ ...prev, nivel: nivelDeportista }));
    } else if (role === 'admin') {
      setFormData(prev => ({ ...prev, nivel: '1_basico' }));
    }
  } else {
    setUserRole('');
    setFormData(prev => ({ ...prev, nivel: 'todos' }));
  }
};

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const mes = mesActual.getMonth() + 1;
      const año = mesActual.getFullYear();
      
      // CORRECCIÓN: Usar filtroNivel para la vista
      const nivel = filtroNivel || 'todos';
      
      console.log('📥 Cargando eventos:', { nivel, mes, año, userRole });
      
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(
        `http://localhost:5000/api/calendario/nivel/${nivel}?mes=${mes}&año=${año}`,
        { headers }
      );
      
      console.log('✅ Eventos cargados:', response.data.eventos?.length);
      setEventos(response.data.eventos || []);
      
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      
      // Fallback a eventos públicos
      if (error.response?.status === 401 || error.response?.status === 500) {
        try {
          const mes = mesActual.getMonth() + 1;
          const año = mesActual.getFullYear();
          
          const response = await axios.get(
            `http://localhost:5000/api/calendario/publicos?mes=${mes}&año=${año}`
          );
          
          setEventos(response.data.eventos || []);
        } catch (fallbackError) {
          console.error('❌ Error cargando eventos públicos:', fallbackError);
          setEventos([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickDia = (dia) => {
    if (userRole === 'deportista' || !userRole) {
      // Solo ver eventos
      const eventosDelDia = getEventosPorDia(dia);
      if (eventosDelDia.length > 0) {
        setDiaSeleccionado(dia);
        setMostrarModal(true);
      }
    } else {
      // Admin y entrenadores pueden crear/editar
      setDiaSeleccionado(dia);
      setEventoEditando(null);
      
      // CORRECCIÓN CRÍTICA: Determinar nivel por defecto correctamente
      let nivelDefault = '1_basico';
      
      if (userRole === 'entrenador') {
        if (nivelesAsignados.length > 0) {
          nivelDefault = nivelesAsignados[0];
        } else {
          alert('⚠️ No tienes niveles asignados. Contacta al administrador.');
          return;
        }
      }
      
      setFormData({
        titulo: '',
        descripcion: '',
        fecha: formatearFecha(dia),
        nivel: nivelDefault, // NIVEL POR DEFECTO CORRECTO
        tipo: 'general'
      });
      
      setMostrarModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ Debes iniciar sesión para crear o editar eventos');
      return;
    }
    
    // VALIDACIONES MEJORADAS
    if (!formData.titulo.trim()) {
      alert('❌ El título es requerido');
      return;
    }
    
    if (!formData.fecha) {
      alert('❌ La fecha es requerida');
      return;
    }
    
    if (!formData.nivel) {
      alert('❌ El nivel es requerido');
      return;
    }
    
    // VALIDAR PERMISOS DE NIVEL
    if (userRole === 'entrenador') {
      if (!nivelesAsignados.includes(formData.nivel) && formData.nivel !== 'todos') {
        alert(`❌ No tienes permiso para crear eventos en el nivel ${formData.nivel}`);
        return;
      }
    }
    
    console.log('💾 Guardando evento:', formData);
    
    try {
      setLoading(true);
      
      const datosEvento = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion?.trim() || '',
        fecha: formData.fecha,
        nivel: formData.nivel,
        tipo: formData.tipo || 'general'
      };
      
      console.log('📤 Enviando:', datosEvento);
      
      if (eventoEditando) {
        await axios.put(
          `http://localhost:5000/api/calendario/${eventoEditando.id}`,
          datosEvento,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('✅ Evento actualizado');
      } else {
        const response = await axios.post(
          'http://localhost:5000/api/calendario',
          datosEvento,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Respuesta del servidor:', response.data);
        alert('✅ Evento creado exitosamente');
      }
      
      setMostrarModal(false);
      setDiaSeleccionado(null);
      await cargarEventos();
      
    } catch (error) {
      console.error('❌ Error guardando evento:', error);
      console.error('Detalles:', error.response?.data);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditarEvento = (evento) => {
    if (userRole !== 'admin' && userRole !== 'entrenador') {
      alert('⚠️ No tienes permisos para editar eventos');
      return;
    }
    
    setEventoEditando(evento);
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion || '',
      fecha: evento.fecha.split('T')[0],
      nivel: evento.nivel || '1_basico',
      tipo: evento.tipo || 'general'
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ Debes iniciar sesión para eliminar eventos');
      return;
    }
    
    if (!window.confirm('¿Eliminar este evento?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/calendario/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Evento eliminado');
      setMostrarModal(false);
      await cargarEventos();
    } catch (error) {
      alert('❌ Error al eliminar');
    } finally {
      setLoading(false);
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

  const formatearFecha = (diaObj) => {
    const año = diaObj.fecha.getFullYear();
    const mes = String(diaObj.fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(diaObj.fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
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

  const formatearNombreNivel = (nivel) => {
    const nombres = {
      '1_basico': '1 Básico',
      '1_medio': '1 Medio',
      '1_avanzado': '1 Avanzado',
      '2': 'Nivel 2',
      '3': 'Nivel 3',
      '4': 'Nivel 4',
      'todos': 'Todos'
    };
    return nombres[nivel] || nivel;
  };

  const puedeEditar = userRole === 'admin' || userRole === 'entrenador';
  const dias = getDiasDelMes();

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📅 Calendario de Eventos</h1>
        <p className="text-gray-600">
          {userRole === 'deportista' || !userRole
            ? 'Visualiza los eventos programados'
            : 'Haz clic en un día para crear o editar eventos'}
        </p>
        {userRole === 'entrenador' && nivelesAsignados.length > 0 && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-700">📚 Tus niveles:</span>
            {nivelesAsignados.map(nivel => (
              <span key={nivel} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {formatearNombreNivel(nivel)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CONTROLES Y FILTROS */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={mesAnterior} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800">
              {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
            </h2>
            
            <button onClick={mesSiguiente} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* FILTRO DE NIVEL PARA LA VISTA */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-semibold text-gray-700">Filtrar eventos:</label>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {nivelesDisponibles.map(nivel => (
                <option key={nivel.value} value={nivel.value}>
                  {nivel.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-700">Tipos:</span>
            {['competencia', 'entrenamiento', 'evaluacion', 'festivo', 'general'].map(tipo => (
              <div key={tipo} className="flex items-center space-x-1">
                <span className="text-lg">{getTipoIcon(tipo)}</span>
                <span className="text-xs text-gray-600 capitalize">{tipo}</span>
              </div>
            ))}
          </div>
          {puedeEditar && (
            <span className="text-sm text-blue-600">💡 Haz clic en un día para agregar eventos</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                onClick={() => handleClickDia(dia)}
                className={`min-h-[120px] p-2 transition-all duration-200 ${
                  !dia.mesActual 
                    ? 'bg-gray-50 text-gray-400' 
                    : esHoyFlag 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-white hover:bg-blue-50'
                } ${puedeEditar || tieneEventos ? 'cursor-pointer' : ''}`}
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

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">
                {userRole === 'deportista' || !userRole
                  ? `📅 Eventos del ${diaSeleccionado?.numero}` 
                  : eventoEditando 
                  ? '✏️ Editar Evento' 
                  : `➕ Nuevo Evento - ${diaSeleccionado?.numero}`}
              </h3>
            </div>

            {userRole === 'deportista' || !userRole ? (
              <div className="p-6">
                {getEventosPorDia(diaSeleccionado).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-6xl mb-4">📅</div>
                    <p>No hay eventos este día</p>
                  </div>
                ) : (
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
                                {formatearNombreNivel(evento.nivel)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {evento.descripcion && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {evento.descripcion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setDiaSeleccionado(null);
                  }}
                  className="w-full mt-6 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                {!eventoEditando && getEventosPorDia(diaSeleccionado).length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                      Eventos existentes este día:
                    </p>
                    <div className="space-y-2">
                      {getEventosPorDia(diaSeleccionado).map(evento => (
                        <div key={evento.id} className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm">{getTipoIcon(evento.tipo)} {evento.titulo}</span>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEditarEvento(evento)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(evento.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Título *</label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Competencia Regional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Detalles del evento..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Fecha *</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nivel *</label>
                      <select
                        value={formData.nivel}
                        onChange={(e) => setFormData({...formData, nivel: e.target.value})}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Selecciona un nivel</option>
                        {userRole === 'admin' ? (
                          <>
                            <option value="todos">Todos (Público)</option>
                            <option value="1_basico">1 Básico</option>
                            <option value="1_medio">1 Medio</option>
                            <option value="1_avanzado">1 Avanzado</option>
                            <option value="2">Nivel 2</option>
                            <option value="3">Nivel 3</option>
                            <option value="4">Nivel 4</option>
                          </>
                        ) : (
                          nivelesAsignados.map(nivel => (
                            <option key={nivel} value={nivel}>
                              {formatearNombreNivel(nivel)}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tipo *</label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="competencia">Competencia</option>
                        <option value="entrenamiento">Entrenamiento</option>
                        <option value="evaluacion">Evaluación</option>
                        <option value="festivo">Festivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Usuario:</strong> {userName} ({userRole || 'Visitante'})
                    </p>
                    {formData.nivel && (
                      <p className="text-xs text-blue-800 mt-1">
                        <strong>Nivel seleccionado:</strong> {formatearNombreNivel(formData.nivel)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModal(false);
                      setDiaSeleccionado(null);
                      setEventoEditando(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg"
                    disabled={loading}
                  >
                    {loading ? '⏳ Guardando...' : eventoEditando ? '✅ Actualizar' : '✅ Crear'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;