// frontend/src/pages/Calendario.jsx - VERSIÓN FINAL MEJORADA
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Calendario = () => {
  const [eventos, setEventos] = useState([]);
  const [eventosSinFiltrar, setEventosSinFiltrar] = useState([]); // ✅ NUEVO: Guardamos todos los eventos
  const [mesActual, setMesActual] = useState(new Date());
  const [mostrarModal, setMostrarModal] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [error, setError] = useState('');
  const [modoVista, setModoVista] = useState('ver');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  
  // Estados para filtros
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroGrupo, setFiltroGrupo] = useState('todos');

  // Estados para formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    niveles: [],
    grupos_competitivos: [],
    tipo: 'general'
  });

  const nivelesDisponibles = [
    { value: 'todos', label: 'Todos los niveles', emoji: '🌟' },
    { value: 'baby_titans', label: 'Baby Titans', emoji: '👶' },
    { value: '1_basico', label: '1 Básico', emoji: '🥉' },
    { value: '1_medio', label: '1 Medio', emoji: '🥈' },
    { value: '1_avanzado', label: '1 Avanzado', emoji: '🥇' },
    { value: '2', label: 'Nivel 2', emoji: '⭐' },
    { value: '3', label: 'Nivel 3', emoji: '⭐⭐' },
    { value: '4', label: 'Nivel 4', emoji: '⭐⭐⭐' }
  ];

  const tiposEvento = [
    { value: 'general', label: 'General', emoji: '📌', color: 'bg-gray-500' },
    { value: 'competencia', label: 'Competencia', emoji: '🏆', color: 'bg-red-500' },
    { value: 'entrenamiento', label: 'Entrenamiento', emoji: '💪', color: 'bg-blue-500' },
    { value: 'evaluacion', label: 'Evaluación', emoji: '📋', color: 'bg-purple-500' },
    { value: 'festivo', label: 'Festivo', emoji: '🎉', color: 'bg-green-500' }
  ];

  // ============================================
  // NOTIFICACIÓN DE CAMBIOS
  // ============================================
  const mostrarNotificacionToast = (mensaje, tipo = 'info') => {
    // Crear el elemento de notificación
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce ${
      tipo === 'success' ? 'bg-green-500 text-white' : 
      tipo === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    toast.innerHTML = mensaje;
    
    // Añadir al DOM
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || user.tipo || '');
        setUserId(user.id || '');
        console.log('👤 Usuario:', { role: user.role, id: user.id });
      } catch (error) {
        console.error('Error parseando usuario:', error);
      }
    }
    
    cargarGruposCompetitivos();
  }, []);

  // ============================================
  // ✅ APLICAR FILTROS (NUEVA FUNCIÓN)
  // ============================================
  const aplicarFiltros = useCallback((eventosOriginales) => {
    console.log('🔍 Aplicando filtros:', { filtroNivel, filtroGrupo });
    console.log('📊 Eventos originales:', eventosOriginales.length);
    
    let eventosFiltrados = [...eventosOriginales];
    
    // Filtrar por nivel
    if (filtroNivel !== 'todos') {
      eventosFiltrados = eventosFiltrados.filter(evento => {
        const cumple = evento.nivel === filtroNivel || evento.nivel === 'todos';
        if (!cumple) {
          console.log(`❌ "${evento.titulo}" filtrado por nivel (tiene: ${evento.nivel}, buscando: ${filtroNivel})`);
        }
        return cumple;
      });
    }
    
    // Filtrar por grupo
    if (filtroGrupo !== 'todos') {
      eventosFiltrados = eventosFiltrados.filter(evento => {
        // Normalizar grupos para comparación
        const grupoEvento = evento.grupo_competitivo?.toLowerCase().replace(/\s+/g, '_');
        const grupoFiltro = filtroGrupo.toLowerCase().replace(/\s+/g, '_');
        
        // Incluir eventos sin grupo específico (para todos)
        const cumple = !evento.grupo_competitivo || grupoEvento === grupoFiltro;
        
        if (!cumple) {
          console.log(`❌ "${evento.titulo}" filtrado por grupo (tiene: ${evento.grupo_competitivo}, buscando: ${filtroGrupo})`);
        }
        return cumple;
      });
    }
    
    console.log('✅ Eventos después de filtrar:', eventosFiltrados.length);
    return eventosFiltrados;
  }, [filtroNivel, filtroGrupo]);

  // ============================================
  // CARGAR EVENTOS (MEJORADO)
  // ============================================
  const cargarEventos = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError('');
      
      const mes = mesActual.getMonth() + 1;
      const año = mesActual.getFullYear();
      
      const url = `http://localhost:5000/api/calendario/filtros?mes=${mes}&año=${año}`;
      
      if (!silencioso) {
        console.log('📡 Cargando eventos:', url);
      }
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        const todosEventos = response.data.eventos || [];
        const conteoAnterior = eventosSinFiltrar.length;
        const conteoNuevo = todosEventos.length;
        
        // Guardar eventos sin filtrar
        setEventosSinFiltrar(todosEventos);
        
        // Aplicar filtros
        const eventosFiltrados = aplicarFiltros(todosEventos);
        setEventos(eventosFiltrados);
        setUltimaActualizacion(new Date());
        
        if (!silencioso) {
          console.log(`✅ ${todosEventos.length} eventos cargados, ${eventosFiltrados.length} filtrados`);
        } else {
          console.log(`🔄 Calendario actualizado automáticamente: ${conteoAnterior} → ${conteoNuevo} eventos`);
          
          // Si hay nuevos eventos en actualización silenciosa
          if (conteoNuevo > conteoAnterior) {
            const diferencia = conteoNuevo - conteoAnterior;
            mostrarNotificacionToast(`🔔 ¡Nuevo${diferencia > 1 ? 's' : ''} evento${diferencia > 1 ? 's' : ''} agregado${diferencia > 1 ? 's' : ''}!`, 'success');
          }
        }
      } else {
        setError(response.data.error || 'Error al cargar eventos');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      if (!silencioso) {
        setError('No se pudieron cargar los eventos');
        setEventos([]);
        setEventosSinFiltrar([]);
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [mesActual, aplicarFiltros, eventosSinFiltrar.length]);

  // ============================================
  // ✅ APLICAR FILTROS CUANDO CAMBIAN
  // ============================================
  useEffect(() => {
    if (eventosSinFiltrar.length > 0) {
      console.log('🔄 Filtros cambiaron, reaplicando...');
      const eventosFiltrados = aplicarFiltros(eventosSinFiltrar);
      setEventos(eventosFiltrados);
    }
  }, [filtroNivel, filtroGrupo, eventosSinFiltrar, aplicarFiltros]);

  // ============================================
  // AUTO-REFRESH: Actualizar cada 30 segundos
  // ============================================
  useEffect(() => {
    // Cargar eventos inmediatamente
    cargarEventos(false);
    
    // Configurar auto-refresh cada 30 segundos
    const intervalo = setInterval(() => {
      console.log('🔄 Auto-refresh: verificando cambios...');
      cargarEventos(true); // Silencioso
    }, 30000); // 30 segundos
    
    return () => {
      clearInterval(intervalo);
      console.log('⏹️ Auto-refresh detenido');
    };
  }, [cargarEventos]);

  const cargarGruposCompetitivos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/calendario/grupos-competitivos');
      if (response.data.success) {
        setGruposDisponibles(response.data.grupos || []);
        console.log('✅ Grupos cargados:', response.data.grupos);
      }
    } catch (error) {
      console.error('❌ Error cargando grupos:', error);
      setGruposDisponibles([
        'ROCKS TITANS',
        'LIGHTNING TITANS', 
        'STORM TITANS',
        'FIRE TITANS',
        'ELECTRIC TITANS',
        'STARS EVOLUTION'
      ]);
    }
  };

  const toggleNivel = (nivel) => {
    if (modoVista === 'editar') {
      setFormData(prev => ({ ...prev, niveles: [nivel] }));
    } else {
      setFormData(prev => {
        const niveles = prev.niveles.includes(nivel)
          ? prev.niveles.filter(n => n !== nivel)
          : [...prev.niveles, nivel];
        return { ...prev, niveles };
      });
    }
  };

  const toggleGrupo = (grupo) => {
    if (modoVista === 'editar') {
      setFormData(prev => ({ 
        ...prev, 
        grupos_competitivos: prev.grupos_competitivos.includes(grupo) ? [] : [grupo]
      }));
    } else {
      setFormData(prev => {
        const grupos = prev.grupos_competitivos.includes(grupo)
          ? prev.grupos_competitivos.filter(g => g !== grupo)
          : [...prev.grupos_competitivos, grupo];
        return { ...prev, grupos_competitivos: grupos };
      });
    }
  };

  const seleccionarTodosNiveles = () => {
    if (modoVista !== 'editar') {
      const todosLosNiveles = nivelesDisponibles
        .filter(n => n.value !== 'todos')
        .map(n => n.value);
      setFormData(prev => ({ ...prev, niveles: todosLosNiveles }));
    }
  };

  const limpiarNiveles = () => {
    setFormData(prev => ({ ...prev, niveles: [] }));
  };

  const seleccionarTodosGrupos = () => {
    if (modoVista !== 'editar') {
      setFormData(prev => ({ ...prev, grupos_competitivos: [...gruposDisponibles] }));
    }
  };

  const limpiarGrupos = () => {
    setFormData(prev => ({ ...prev, grupos_competitivos: [] }));
  };

  const abrirModalCrear = (dia) => {
    console.log('➕ Abrir modal crear');
    setModoVista('crear');
    setEventoSeleccionado(null);
    setDiaSeleccionado(dia);
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: formatearFecha(dia),
      niveles: [],
      grupos_competitivos: [],
      tipo: 'general'
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (evento) => {
    console.log('✏️ Abrir modal editar:', evento.id);
    setModoVista('editar');
    setEventoSeleccionado(evento);
    setDiaSeleccionado(null);
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion || '',
      fecha: evento.fecha.split('T')[0],
      niveles: [evento.nivel],
      grupos_competitivos: evento.grupo_competitivo ? [evento.grupo_competitivo] : [],
      tipo: evento.tipo
    });
    setMostrarModal(true);
  };

  const abrirModalVer = (dia) => {
    console.log('👁️ Abrir modal ver eventos del día');
    setModoVista('ver');
    setEventoSeleccionado(null);
    setDiaSeleccionado(dia);
    setMostrarModal(true);
  };

  const handleClickDia = (dia) => {
    const eventosDelDia = getEventosPorDia(dia);
    console.log(`📅 Click en día ${dia.numero}:`, eventosDelDia.length, 'eventos');
    
    if (eventosDelDia.length > 0) {
      // Hay eventos: mostrar en modo ver
      abrirModalVer(dia);
    } else if (puedeEditar) {
      // No hay eventos y puede editar: modo crear
      abrirModalCrear(dia);
    }
    // Si no hay eventos y no puede editar: no hacer nada
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión');
      return;
    }
    
    if (formData.niveles.length === 0) {
      alert('⚠️ Debes seleccionar al menos un nivel');
      return;
    }
    
    try {
      setLoading(true);
      
      if (modoVista === 'editar' && eventoSeleccionado) {
        const datosEvento = {
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion?.trim() || '',
          fecha: formData.fecha,
          nivel: formData.niveles[0],
          grupo_competitivo: formData.grupos_competitivos[0] || null,
          tipo: formData.tipo
        };
        
        console.log('📤 Actualizando evento:', eventoSeleccionado.id, datosEvento);
        
        await axios.put(
          `http://localhost:5000/api/calendario/${eventoSeleccionado.id}`,
          datosEvento,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert('✅ Evento actualizado');
      } else {
        const datosEvento = {
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion?.trim() || '',
          fecha: formData.fecha,
          niveles: formData.niveles,
          grupos_competitivos: formData.grupos_competitivos.length > 0 
            ? formData.grupos_competitivos 
            : null,
          tipo: formData.tipo
        };
        
        console.log('📤 Creando eventos:', datosEvento);
        
        const response = await axios.post(
          'http://localhost:5000/api/calendario',
          datosEvento,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          alert(`✅ ${response.data.mensaje}`);
        }
      }
      
      setMostrarModal(false);
      // Recargar eventos inmediatamente después de crear/editar
      await cargarEventos(false);
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert(error.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (eventoId) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('🗑️ Eliminando evento:', eventoId);
      
      await axios.delete(
        `http://localhost:5000/api/calendario/${eventoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('✅ Evento eliminado');
      setMostrarModal(false);
      await cargarEventos(false);
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert(error.response?.data?.error || 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const puedeEditarEvento = (evento) => {
    const puede = userRole === 'admin' || (userRole === 'entrenador' && evento.entrenador_id === userId);
    console.log('🔐 Puede editar evento?', puede, { userRole, userId, entrenador_id: evento.entrenador_id });
    return puede;
  };

  const mesAnterior = () => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
  const mesSiguiente = () => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
  const irAHoy = () => setMesActual(new Date());

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

  const getTipoEvento = (tipo) => {
    return tiposEvento.find(t => t.value === tipo) || tiposEvento[0];
  };

  const getNivelNombre = (nivel) => {
    const n = nivelesDisponibles.find(niv => niv.value === nivel);
    return n ? `${n.emoji} ${n.label}` : nivel;
  };

  const dias = getDiasDelMes();
  const puedeEditar = userRole === 'admin' || userRole === 'entrenador';

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 Calendario de Eventos</h1>
        <p className="text-gray-600">
          {puedeEditar ? 'Crea y gestiona eventos • Se actualiza automáticamente' : 'Consulta los eventos programados'}
        </p>
        {error && (
          <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* FILTROS Y CONTROLES */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <button onClick={mesAnterior} className="p-2 hover:bg-gray-100 rounded">◀</button>
              <h2 className="text-xl font-bold min-w-[200px] text-center">
                {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
              </h2>
              <button onClick={mesSiguiente} className="p-2 hover:bg-gray-100 rounded">▶</button>
              <button onClick={irAHoy} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Hoy
              </button>
              <button
                onClick={() => cargarEventos(false)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
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
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                {loading ? '🔄 Cargando...' : `✅ ${eventos.length} de ${eventosSinFiltrar.length} eventos`}
              </div>
              {ultimaActualizacion && (
                <div className="text-xs text-gray-500">
                  Actualizado: {ultimaActualizacion.toLocaleTimeString('es-ES')}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">🎯 Filtrar por Nivel</label>
              <select
                value={filtroNivel}
                onChange={(e) => {
                  console.log('🎯 Cambiando filtro nivel a:', e.target.value);
                  setFiltroNivel(e.target.value);
                }}
                className="w-full px-4 py-2 border rounded"
              >
                {nivelesDisponibles.map(nivel => (
                  <option key={nivel.value} value={nivel.value}>
                    {nivel.emoji} {nivel.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">🏆 Filtrar por Grupo</label>
              <select
                value={filtroGrupo}
                onChange={(e) => {
                  console.log('🏆 Cambiando filtro grupo a:', e.target.value);
                  setFiltroGrupo(e.target.value);
                }}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="todos">Todos los grupos</option>
                {gruposDisponibles.map(grupo => (
                  <option key={grupo} value={grupo}>{grupo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded flex items-center justify-between">
            <div>
              📊 Mostrando eventos para: <strong>{getNivelNombre(filtroNivel)}</strong>
              {filtroGrupo !== 'todos' && <> - <strong>{filtroGrupo}</strong></>}
            </div>
            <div className="text-xs text-blue-600">
              🔄 Auto-actualización cada 30 segundos
            </div>
          </div>
        </div>
      </div>

      {/* CALENDARIO */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 bg-blue-600">
          {diasSemana.map(dia => (
            <div key={dia} className="p-3 text-center">
              <span className="text-sm font-bold text-white">{dia}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {dias.map((dia, index) => {
            const eventosDelDia = getEventosPorDia(dia);
            const tieneEventos = eventosDelDia.length > 0;
            const esHoyFlag = esHoy(dia);
            
            return (
              <div
                key={index}
                onClick={() => handleClickDia(dia)}
                className={`min-h-[100px] p-2 border cursor-pointer ${
                  !dia.mesActual 
                    ? 'bg-gray-50 text-gray-400' 
                    : esHoyFlag 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between">
                  <span className={`font-semibold ${
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
                
                <div className="mt-1 space-y-1">
                  {eventosDelDia.slice(0, 2).map((evento, idx) => {
                    const tipoEvento = getTipoEvento(evento.tipo);
                    return (
                      <div
                        key={idx}
                        className={`text-xs p-1 rounded ${tipoEvento.color} text-white truncate`}
                        title={evento.titulo}
                      >
                        <span className="mr-1">{tipoEvento.emoji}</span>
                        {evento.titulo}
                      </div>
                    );
                  })}
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

      {/* MODAL - Mantener el mismo código del modal de la segunda versión */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-4 text-white rounded-t-lg sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {modoVista === 'editar' ? '✏️ Editar Evento' : modoVista === 'crear' ? '➕ Crear Evento' : '📅 Eventos del Día'}
                </h3>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {modoVista === 'ver' && diaSeleccionado ? (
                <div>
                  {getEventosPorDia(diaSeleccionado).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">📭 No hay eventos programados para este día</p>
                      {puedeEditar && (
                        <button
                          onClick={() => abrirModalCrear(diaSeleccionado)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          ➕ Crear Evento
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="space-y-4 mb-4">
                        {getEventosPorDia(diaSeleccionado).map(evento => {
                          const tipoEvento = getTipoEvento(evento.tipo);
                          const puedeEditarEste = puedeEditarEvento(evento);
                          
                          return (
                            <div key={evento.id} className="border-2 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex items-start gap-3">
                                <span className="text-4xl">{tipoEvento.emoji}</span>
                                <div className="flex-1">
                                  <h4 className="font-bold text-lg mb-2">{evento.titulo}</h4>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <span className={`px-3 py-1 ${tipoEvento.color} text-white rounded-full text-xs font-semibold`}>
                                      {tipoEvento.label}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                      {getNivelNombre(evento.nivel)}
                                    </span>
                                    {evento.grupo_competitivo && (
                                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                        🏆 {evento.grupo_competitivo}
                                      </span>
                                    )}
                                  </div>
                                  {evento.descripcion && (
                                    <p className="mt-2 text-gray-700 text-sm bg-gray-50 p-3 rounded">{evento.descripcion}</p>
                                  )}
                                  {puedeEditarEste && (
                                    <div className="mt-4 flex gap-2">
                                      <button
                                        onClick={() => abrirModalEditar(evento)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                                      >
                                        ✏️ Editar
                                      </button>
                                      <button
                                        onClick={() => handleEliminar(evento.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                                      >
                                        🗑️ Eliminar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {puedeEditar && (
                        <button
                          onClick={() => abrirModalCrear(diaSeleccionado)}
                          className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium mb-3"
                        >
                          ➕ Crear Nuevo Evento
                        </button>
                      )}
                      
                      <button
                        onClick={() => setMostrarModal(false)}
                        className="w-full p-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Cerrar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">📝 Título *</label>
                      <input
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                        required
                        className="w-full p-3 border rounded-lg"
                        placeholder="Ej: Competencia Regional"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">📄 Descripción</label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                        rows="3"
                        placeholder="Detalles del evento..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">📅 Fecha *</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">🎯 Tipo de Evento *</label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                      >
                        {tiposEvento.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.emoji} {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-blue-900">
                        🎓 {modoVista === 'editar' ? 'Nivel' : 'Niveles'} * ({formData.niveles.length} seleccionados)
                      </label>
                      {modoVista !== 'editar' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={seleccionarTodosNiveles}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            ✓ Todos
                          </button>
                          <button
                            type="button"
                            onClick={limpiarNiveles}
                            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            ✕ Limpiar
                          </button>
                        </div>
                      )}
                    </div>
                    {modoVista === 'editar' && (
                      <div className="text-xs text-blue-700 mb-2 bg-blue-100 p-2 rounded">
                        ℹ️ En modo edición solo puedes seleccionar un nivel
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {nivelesDisponibles.filter(n => n.value !== 'todos').map(nivel => (
                        <button
                          key={nivel.value}
                          type="button"
                          onClick={() => toggleNivel(nivel.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.niveles.includes(nivel.value)
                              ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-md transform scale-105'
                              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{nivel.emoji}</div>
                          <div className="text-xs font-medium">{nivel.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-purple-900">
                        🏆 Grupos Competitivos ({formData.grupos_competitivos.length} seleccionados)
                      </label>
                      {modoVista !== 'editar' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={seleccionarTodosGrupos}
                            className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            ✓ Todos
                          </button>
                          <button
                            type="button"
                            onClick={limpiarGrupos}
                            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            ✕ Limpiar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-purple-700 mb-3 bg-purple-100 p-2 rounded">
                      💡 Si no seleccionas ningún grupo, el evento será visible para TODOS los grupos
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {gruposDisponibles.map(grupo => (
                        <button
                          key={grupo}
                          type="button"
                          onClick={() => toggleGrupo(grupo)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.grupos_competitivos.includes(grupo)
                              ? 'border-purple-600 bg-purple-100 text-purple-900 shadow-md transform scale-105'
                              : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50'
                          }`}
                        >
                          <div className="font-bold text-sm">{grupo}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {modoVista !== 'editar' && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-bold mb-2">📋 Resumen del evento:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Se crearán <strong>{formData.niveles.length || 0}</strong> evento(s) para los niveles seleccionados</li>
                        <li>• Visible para <strong>
                          {formData.grupos_competitivos.length === 0 
                            ? 'TODOS los grupos' 
                            : `${formData.grupos_competitivos.length} grupo(s) específico(s)`
                          }
                        </strong></li>
                        <li>• Total de eventos a crear: <strong>
                          {formData.grupos_competitivos.length === 0 
                            ? formData.niveles.length 
                            : formData.niveles.length * formData.grupos_competitivos.length
                          }
                        </strong></li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex space-x-4 sticky bottom-0 bg-white pt-4">
                    {modoVista === 'editar' && (
                      <button
                        type="button"
                        onClick={() => handleEliminar(eventoSeleccionado.id)}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                        disabled={loading}
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMostrarModal(false)}
                      className="flex-1 p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:bg-gray-400"
                      disabled={loading || formData.niveles.length === 0}
                    >
                      {loading ? '⏳ Guardando...' : modoVista === 'editar' ? '✅ Actualizar' : '✅ Crear'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;