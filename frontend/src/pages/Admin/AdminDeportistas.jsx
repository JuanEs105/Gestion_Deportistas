// frontend/src/pages/Admin/AdminDeportistas.jsx - VERSIÓN COMPLETA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiRefreshCw, 
  FiEye, 
  FiUsers, 
  FiEdit2, 
  FiAward, 
  FiUserCheck,
  FiCheck,
  FiChevronDown,
  FiSave,
  FiX,
  FiDollarSign,
  FiAlertCircle,
  FiLock
} from 'react-icons/fi';
import { MdSports, MdOutlineSportsScore, MdWarning, MdInfo } from 'react-icons/md';

const AdminDeportistas = () => {
  const navigate = useNavigate();
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroEquipo, setFiltroEquipo] = useState('todos');

  // Estados para modales
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  
  // Estados para menús desplegables
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [menuDeportistaId, setMenuDeportistaId] = useState(null);
  const [seleccionTemporal, setSeleccionTemporal] = useState({
    equipo: null,
    estado: null,
    nivel: null
  });
  const [guardando, setGuardando] = useState(false);

  // Datos de edición (solo campos editables para admin)
  const [edicionData, setEdicionData] = useState({
    peso: '',
    altura: '',
    telefono: ''
  });

  // Cargar deportistas
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      alert('Acceso restringido a administradores');
      navigate('/login');
      return;
    }
    
    cargarDeportistas();
  }, [navigate]);

  const cargarDeportistas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('📥 Cargando deportistas como ADMIN...');
      
      const response = await fetch('http://localhost:5000/api/deportistas', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
          navigate('/login');
          return;
        }
        
        throw new Error(`Error ${response.status}: No se pudo cargar los deportistas`);
      }
      
      const data = await response.json();
      console.log('✅ Datos recibidos:', data.length, 'deportistas');
      
      // Normalizar estructura
      const deportistasNormalizados = data.map(d => ({
        id: d.id,
        user_id: d.user_id,
        nombre: d.nombre || 'Sin nombre',
        email: d.email || '',
        telefono: d.telefono || '',
        nivel_actual: d.nivel_actual || 'pendiente',
        estado: d.estado || 'activo',
        equipo_competitivo: d.equipo_competitivo || 'sin_equipo',
        peso: d.peso || null,
        altura: d.altura || null,
        fecha_nacimiento: d.fecha_nacimiento || null,
        contacto_emergencia_nombre: d.contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: d.contacto_emergencia_telefono || null,
        contacto_emergencia_parentesco: d.contacto_emergencia_parentesco || null,
        created_at: d.created_at,
        updated_at: d.updated_at
      }));
      
      deportistasNormalizados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      setDeportistas(deportistasNormalizados);
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setDeportistas([]);
    } finally {
      setLoading(false);
    }
  };

  // FUNCIONES PARA LOS MENÚS (igual que en entrenador)
  const abrirMenu = (tipo, deportista) => {
    setDeportistaSeleccionado(deportista);
    setMenuAbierto(tipo);
    setMenuDeportistaId(deportista.id);
    
    const valorActual = tipo === 'nivel' ? deportista.nivel_actual :
                       tipo === 'equipo' ? deportista.equipo_competitivo :
                       deportista.estado;
    
    setSeleccionTemporal({
      ...seleccionTemporal,
      [tipo]: valorActual
    });
  };

  const seleccionarOpcion = (tipo, valor) => {
    setSeleccionTemporal({
      ...seleccionTemporal,
      [tipo]: valor
    });
  };

  // GUARDAR CAMBIOS (igual que en entrenador)
  const guardarEquipo = async () => {
    try {
      if (!deportistaSeleccionado || !seleccionTemporal.equipo) {
        setError('Error: Selecciona un equipo primero');
        return;
      }
      
      setGuardando(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Error: No estás autenticado');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/deportistas/${deportistaSeleccionado.id}/equipo`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          equipo_competitivo: seleccionTemporal.equipo 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar equipo');
      }
      
      // Actualizar estado local
      setDeportistas(prev => prev.map(d => {
        if (d.id === deportistaSeleccionado.id) {
          return {
            ...d,
            equipo_competitivo: seleccionTemporal.equipo
          };
        }
        return d;
      }));
      
      setSuccessMessage(`✅ Equipo actualizado: ${getEquipoNombre(seleccionTemporal.equipo)}`);
      setMenuAbierto(null);
      setMenuDeportistaId(null);
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error guardar equipo:', err);
      setError(`Error: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEstado = async () => {
    try {
      console.log('🔧 INICIANDO guardarEstado...');
      console.log('👤 Deportista:', deportistaSeleccionado?.nombre);
      console.log('🔄 Estado seleccionado:', seleccionTemporal.estado);
      
      if (!deportistaSeleccionado || !seleccionTemporal.estado) {
        setError('Error: Selecciona un estado primero');
        return;
      }
      
      setGuardando(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Error: No estás autenticado');
        navigate('/login');
        return;
      }
      
      console.log('📤 Enviando PUT a:', `http://localhost:5000/api/deportistas/${deportistaSeleccionado.id}`);
      
      const response = await fetch(`http://localhost:5000/api/deportistas/${deportistaSeleccionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          estado: seleccionTemporal.estado 
        })
      });
      
      console.log('📡 Status:', response.status);
      console.log('📡 Status Text:', response.statusText);
      
      const responseText = await response.text();
      console.log('📄 Respuesta:', responseText);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${responseText}`);
      }
      
      const responseData = JSON.parse(responseText);
      console.log('✅ Estado guardado:', responseData);
      
      // Actualizar estado local
      setDeportistas(prev => prev.map(d => {
        if (d.id === deportistaSeleccionado.id) {
          return {
            ...d,
            estado: seleccionTemporal.estado
          };
        }
        return d;
      }));
      
      const estadoNombre = getEstadoNombre(seleccionTemporal.estado);
      setSuccessMessage(`✅ Estado actualizado: ${estadoNombre}`);
      
      // Mensaje especial para estado pendiente_de_pago
      if (seleccionTemporal.estado === 'pendiente_de_pago') {
        setTimeout(() => {
          setSuccessMessage(`⏰ ${deportistaSeleccionado.nombre} ha sido suspendido por falta de pago`);
        }, 3000);
      }
      
      setMenuAbierto(null);
      setMenuDeportistaId(null);
      
      setTimeout(() => setSuccessMessage(''), 6000);
      
    } catch (err) {
      console.error('❌ Error guardar estado:', err);
      setError(`Error: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setGuardando(false);
    }
  };

  const guardarNivel = async () => {
    try {
      if (!deportistaSeleccionado || !seleccionTemporal.nivel) {
        setError('Error: Selecciona un nivel primero');
        return;
      }
      
      setGuardando(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Error: No estás autenticado');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/deportistas/${deportistaSeleccionado.id}/nivel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nivel_actual: seleccionTemporal.nivel 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar nivel');
      }
      
      // Actualizar estado local
      setDeportistas(prev => prev.map(d => {
        if (d.id === deportistaSeleccionado.id) {
          return {
            ...d,
            nivel_actual: seleccionTemporal.nivel
          };
        }
        return d;
      }));
      
      setSuccessMessage(`✅ Nivel actualizado: ${getNivelNombre(seleccionTemporal.nivel)}`);
      setMenuAbierto(null);
      setMenuDeportistaId(null);
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error guardar nivel:', err);
      setError(`Error: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setGuardando(false);
    }
  };

  // BOTONES DE ACCIÓN
  const handleVerDetalles = (deportista) => {
    setDeportistaSeleccionado(deportista);
    setShowDetalleModal(true);
    setMenuAbierto(null);
  };

  const handleEditar = (deportista) => {
    console.log('✏️ Editando deportista como ADMIN:', deportista);
    setDeportistaSeleccionado(deportista);
    
    // Solo cargar campos editables
    setEdicionData({
      peso: deportista.peso || '',
      altura: deportista.altura || '',
      telefono: deportista.telefono || ''
    });
    
    setShowEditarModal(true);
    setMenuAbierto(null);
  };

  const handleGuardarEdicion = async () => {
    try {
      if (!deportistaSeleccionado) return;
      
      setGuardando(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Error: No estás autenticado');
        navigate('/login');
        return;
      }
      
      // Preparar datos editables solo
      const datosActualizados = {
        peso: edicionData.peso ? parseFloat(edicionData.peso) : null,
        altura: edicionData.altura ? parseFloat(edicionData.altura) : null,
        telefono: edicionData.telefono || null
      };
      
      console.log('💾 Guardando edición como ADMIN:', datosActualizados);
      
      const response = await fetch(`http://localhost:5000/api/deportistas/${deportistaSeleccionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosActualizados)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar cambios');
      }
      
      const data = await response.json();
      console.log('✅ Deportista actualizado:', data);
      
      // Actualizar estado local
      setDeportistas(prev => prev.map(d => {
        if (d.id === deportistaSeleccionado.id) {
          return {
            ...d,
            ...datosActualizados,
            telefono: edicionData.telefono
          };
        }
        return d;
      }));
      
      setSuccessMessage('✅ Datos actualizados correctamente');
      setShowEditarModal(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error guardando edición:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Funciones auxiliares (igual que en entrenador)
  const getNivelNombre = (nivel) => {
    const niveles = {
      'pendiente': '⏳ Pendiente',
      'baby_titans': '👶 Baby Titans',
      '1_basico': '🥉 1 Básico',
      '1_medio': '🥈 1 Medio',
      '1_avanzado': '🥇 1 Avanzado',
      '2': '⭐ Nivel 2',
      '3': '🌟🌟 Nivel 3',
      '4': '🌟🌟🌟 Nivel 4'
    };
    return niveles[nivel] || nivel;
  };

  const getEquipoNombre = (equipo) => {
    const equipos = {
      'sin_equipo': '🚫 Sin equipo',
      'rocks_titans': '🪨 Rocks Titans',
      'lightning_titans': '⚡ Lightning Titans',
      'storm_titans': '🌪️ Storm Titans',
      'fire_titans': '🔥 Fire Titans',
      'electric_titans': '⚡ Electric Titans'
    };
    return equipos[equipo] || equipo;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800 border border-green-200';
      case 'lesionado': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'descanso': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'inactivo': return 'bg-red-100 text-red-800 border border-red-200';
      case 'pendiente': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'pendiente_de_pago': return 'bg-orange-100 text-orange-800 border border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getEstadoNombre = (estado) => {
    const estados = {
      'activo': '✅ Activo',
      'lesionado': '🤕 Lesionado',
      'descanso': '🏝️ Descanso',
      'inactivo': '❌ Inactivo',
      'pendiente': '⏳ Pendiente',
      'pendiente_de_pago': '💰 Pendiente de Pago'
    };
    return estados[estado] || estado;
  };

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura || altura <= 0) return null;
    return (peso / (altura * altura)).toFixed(1);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No registrada';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  // OPCIONES PARA LOS MENÚS
  const opcionesEquipos = [
    { value: 'sin_equipo', label: '🚫 Sin equipo' },
    { value: 'rocks_titans', label: '🪨 Rocks Titans' },
    { value: 'lightning_titans', label: '⚡ Lightning Titans' },
    { value: 'storm_titans', label: '🌪️ Storm Titans' },
    { value: 'fire_titans', label: '🔥 Fire Titans' },
    { value: 'electric_titans', label: '⚡ Electric Titans' }
  ];

  const opcionesEstados = [
    { value: 'activo', label: '✅ Activo' },
    { value: 'lesionado', label: '🤕 Lesionado' },
    { value: 'descanso', label: '🏝️ Descanso' },
    { value: 'inactivo', label: '❌ Inactivo' },
    { value: 'pendiente', label: '⏳ Pendiente' },
    { value: 'pendiente_de_pago', label: '💰 Pendiente de Pago' }
  ];

  const opcionesNiveles = [
    { value: 'pendiente', label: '⏳ Pendiente' },
    { value: 'baby_titans', label: '👶 Baby Titans' },
    { value: '1_basico', label: '🥉 1 Básico' },
    { value: '1_medio', label: '🥈 1 Medio' },
    { value: '1_avanzado', label: '🥇 1 Avanzado' },
    { value: '2', label: '⭐ Nivel 2' },
    { value: '3', label: '🌟🌟 Nivel 3' },
    { value: '4', label: '🌟🌟🌟 Nivel 4' }
  ];

  // Filtrado
  const deportistasFiltrados = deportistas.filter(deportista => {
    const nombre = deportista.nombre || '';
    const email = deportista.email || '';
    const telefono = deportista.telefono || '';
    
    const matchBusqueda = searchTerm === '' || 
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      telefono.includes(searchTerm);
    
    const matchNivel = filtroNivel === 'todos' || deportista.nivel_actual === filtroNivel;
    const matchEstado = filtroEstado === 'todos' || deportista.estado === filtroEstado;
    const matchEquipo = filtroEquipo === 'todos' || deportista.equipo_competitivo === filtroEquipo;
    
    return matchBusqueda && matchNivel && matchEstado && matchEquipo;
  });

  // Estadísticas
  const estadisticas = {
    total: deportistas.length,
    activos: deportistas.filter(d => d.estado === 'activo').length,
    lesionados: deportistas.filter(d => d.estado === 'lesionado').length,
    pendientes: deportistas.filter(d => d.estado === 'pendiente_de_pago').length,
    sinEquipo: deportistas.filter(d => d.equipo_competitivo === 'sin_equipo').length,
    filtrados: deportistasFiltrados.length
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <MdSports className="text-blue-600" />
              Vista Global de Deportistas - ADMINISTRADOR
            </h1>
            <p className="text-gray-600">Gestión completa de todos los deportistas del sistema</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
              <FiUserCheck /> ADMINISTRADOR
            </span>
            <button
              onClick={cargarDeportistas}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              <FiRefreshCw /> Refrescar
            </button>
          </div>
        </div>
        
        {/* Mensajes de estado */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 flex items-center gap-2">
              <FiCheck className="text-green-500" /> {successMessage}
            </p>
          </div>
        )}
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FiSearch /> Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">🎯 Todos los niveles</option>
              {opcionesNiveles.map(nivel => (
                <option key={nivel.value} value={nivel.value}>
                  {nivel.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">📊 Todos los estados</option>
              {opcionesEstados.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipo</label>
            <select
              value={filtroEquipo}
              onChange={(e) => setFiltroEquipo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">👥 Todos los equipos</option>
              {opcionesEquipos.map(equipo => (
                <option key={equipo.value} value={equipo.value}>
                  {equipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setFiltroNivel('todos');
              setFiltroEstado('todos');
              setFiltroEquipo('todos');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <FiRefreshCw /> Limpiar filtros
          </button>
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <h3 className="text-xs font-medium text-blue-800 mb-1">Total</h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-600">{estadisticas.total}</p>
          <p className="text-xs text-blue-500 mt-1">Deportistas</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <h3 className="text-xs font-medium text-green-800 mb-1">Activos</h3>
          <p className="text-2xl md:text-3xl font-bold text-green-600">{estadisticas.activos}</p>
          <p className="text-xs text-green-500 mt-1">{estadisticas.total > 0 ? Math.round((estadisticas.activos/estadisticas.total)*100) : 0}%</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <h3 className="text-xs font-medium text-yellow-800 mb-1">Lesionados</h3>
          <p className="text-2xl md:text-3xl font-bold text-yellow-600">{estadisticas.lesionados}</p>
          <p className="text-xs text-yellow-500 mt-1">En recuperación</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <h3 className="text-xs font-medium text-orange-800 mb-1">Pendientes Pago</h3>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">{estadisticas.pendientes}</p>
          <p className="text-xs text-orange-500 mt-1">Por cobrar</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <h3 className="text-xs font-medium text-red-800 mb-1">Sin equipo</h3>
          <p className="text-2xl md:text-3xl font-bold text-red-600">{estadisticas.sinEquipo}</p>
          <p className="text-xs text-red-500 mt-1">Por asignar</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
          <h3 className="text-xs font-medium text-indigo-800 mb-1">Filtrados</h3>
          <p className="text-2xl md:text-3xl font-bold text-indigo-600">{estadisticas.filtrados}</p>
          <p className="text-xs text-indigo-500 mt-1">Mostrando</p>
        </div>
      </div>

      {/* TABLA CON MENÚS DESPLEGABLES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiUsers /> Deportista
                  </div>
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiAward /> Nivel
                  </div>
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Cargando deportistas...</p>
                  </td>
                </tr>
              ) : deportistasFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="text-gray-400 mb-4">
                      <MdOutlineSportsScore className="text-6xl mx-auto opacity-50" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg mb-2">No hay deportistas encontrados</p>
                    <p className="text-gray-400 text-sm mb-4">
                      {deportistas.length === 0 
                        ? "No hay deportistas en el sistema"
                        : "Intenta cambiar los filtros de búsqueda"}
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFiltroNivel('todos');
                        setFiltroEstado('todos');
                        setFiltroEquipo('todos');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Ver todos los deportistas
                    </button>
                  </td>
                </tr>
              ) : (
                deportistasFiltrados.map((deportista) => {
                  const imc = calcularIMC(deportista.peso, deportista.altura);
                  const debePagar = deportista.estado === 'pendiente_de_pago';
                  
                  return (
                    <tr key={deportista.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                            debePagar ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {deportista.nombre?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{deportista.nombre}</div>
                            {imc && (
                              <div className="text-xs text-gray-500 mt-1">
                                IMC: {imc}
                              </div>
                            )}
                            {debePagar && (
                              <div className="text-xs text-orange-600 font-medium flex items-center gap-1 mt-1">
                                <FiAlertCircle className="text-xs" /> Debe pagar
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm text-gray-900">{deportista.email}</div>
                        {deportista.telefono && (
                          <div className="text-xs text-gray-500">{deportista.telefono}</div>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => abrirMenu('nivel', deportista)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
                              deportista.nivel_actual === 'pendiente' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {getNivelNombre(deportista.nivel_actual)}
                            <FiChevronDown />
                          </button>
                          
                          {/* MENÚ NIVEL */}
                          {menuAbierto === 'nivel' && menuDeportistaId === deportista.id && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border z-50">
                              <div className="p-2">
                                <div className="mb-2 px-2 py-1 border-b">
                                  <p className="text-xs font-medium text-gray-500">Seleccionar nivel</p>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {opcionesNiveles.map((nivel) => (
                                    <button
                                      key={nivel.value}
                                      onClick={() => seleccionarOpcion('nivel', nivel.value)}
                                      className={`w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 flex items-center justify-between ${
                                        seleccionTemporal.nivel === nivel.value ? 'bg-blue-50' : ''
                                      }`}
                                    >
                                      <span>{nivel.label}</span>
                                      {seleccionTemporal.nivel === nivel.value && (
                                        <FiCheck className="text-green-500" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2 mt-2 pt-2 border-t">
                                  <button
                                    onClick={guardarNivel}
                                    disabled={guardando}
                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                  >
                                    {guardando ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <FiSave className="text-xs" /> Guardar
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setMenuAbierto(null)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded"
                                  >
                                    <FiX />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => abrirMenu('equipo', deportista)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
                              deportista.equipo_competitivo === 'sin_equipo' 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {getEquipoNombre(deportista.equipo_competitivo)}
                            <FiChevronDown />
                          </button>
                          
                          {/* MENÚ EQUIPO */}
                          {menuAbierto === 'equipo' && menuDeportistaId === deportista.id && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border z-50">
                              <div className="p-2">
                                <div className="mb-2 px-2 py-1 border-b">
                                  <p className="text-xs font-medium text-gray-500">Seleccionar equipo</p>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {opcionesEquipos.map((equipo) => (
                                    <button
                                      key={equipo.value}
                                      onClick={() => seleccionarOpcion('equipo', equipo.value)}
                                      className={`w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 flex items-center justify-between ${
                                        seleccionTemporal.equipo === equipo.value ? 'bg-purple-50' : ''
                                      }`}
                                    >
                                      <span>{equipo.label}</span>
                                      {seleccionTemporal.equipo === equipo.value && (
                                        <FiCheck className="text-green-500" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2 mt-2 pt-2 border-t">
                                  <button
                                    onClick={guardarEquipo}
                                    disabled={guardando}
                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                  >
                                    {guardando ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <FiSave className="text-xs" /> Guardar
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setMenuAbierto(null)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded"
                                  >
                                    <FiX />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => abrirMenu('estado', deportista)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${getEstadoColor(deportista.estado)}`}
                          >
                            {getEstadoNombre(deportista.estado)}
                            <FiChevronDown />
                          </button>
                          
                          {/* MENÚ ESTADO */}
                          {menuAbierto === 'estado' && menuDeportistaId === deportista.id && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border z-50">
                              <div className="p-2">
                                <div className="mb-2 px-2 py-1 border-b">
                                  <p className="text-xs font-medium text-gray-500">Seleccionar estado</p>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {opcionesEstados.map((estado) => (
                                    <button
                                      key={estado.value}
                                      onClick={() => seleccionarOpcion('estado', estado.value)}
                                      className={`w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 flex items-center justify-between ${
                                        seleccionTemporal.estado === estado.value ? 'bg-orange-50' : ''
                                      }`}
                                    >
                                      <span>{estado.label}</span>
                                      {seleccionTemporal.estado === estado.value && (
                                        <FiCheck className="text-green-500" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2 mt-2 pt-2 border-t">
                                  <button
                                    onClick={guardarEstado}
                                    disabled={guardando}
                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                  >
                                    {guardando ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <FiSave className="text-xs" /> Guardar
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setMenuAbierto(null)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded"
                                  >
                                    <FiX />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleVerDetalles(deportista)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium flex items-center gap-1"
                            title="Ver detalles"
                          >
                            <FiEye /> Ver
                          </button>
                          
                          <button
                            onClick={() => handleEditar(deportista)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium flex items-center gap-1"
                            title="Editar"
                          >
                            <FiEdit2 /> Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLES */}
      {showDetalleModal && deportistaSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">👤 Detalles del Deportista</h3>
              <button 
                onClick={() => setShowDetalleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                  deportistaSeleccionado.estado === 'pendiente_de_pago' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-2xl font-bold ${
                    deportistaSeleccionado.estado === 'pendiente_de_pago' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {deportistaSeleccionado.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold">{deportistaSeleccionado.nombre}</h4>
                  <p className="text-gray-600">{deportistaSeleccionado.email}</p>
                  <p className="text-sm text-gray-500">📞 {deportistaSeleccionado.telefono || 'No registrado'}</p>
                  {deportistaSeleccionado.estado === 'pendiente_de_pago' && (
                    <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium inline-flex items-center gap-1">
                      <FiDollarSign /> PENDIENTE DE PAGO
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Nivel actual</p>
                  <p className="font-medium">{getNivelNombre(deportistaSeleccionado.nivel_actual)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="font-medium">{getEstadoNombre(deportistaSeleccionado.estado)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Equipo</p>
                  <p className="font-medium">{getEquipoNombre(deportistaSeleccionado.equipo_competitivo)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IMC</p>
                  <p className="font-medium">
                    {calcularIMC(deportistaSeleccionado.peso, deportistaSeleccionado.altura) || 'No registrado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Nac.</p>
                  <p className="font-medium">{formatFecha(deportistaSeleccionado.fecha_nacimiento)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peso</p>
                  <p className="font-medium">{deportistaSeleccionado.peso ? `${deportistaSeleccionado.peso} kg` : 'No registrado'}</p>
                </div>
              </div>
              
              {deportistaSeleccionado.contacto_emergencia_nombre && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">📞 Contacto de Emergencia</h5>
                  <p className="text-sm font-medium">{deportistaSeleccionado.contacto_emergencia_nombre}</p>
                  <p className="text-sm text-gray-600">{deportistaSeleccionado.contacto_emergencia_telefono}</p>
                  {deportistaSeleccionado.contacto_emergencia_parentesco && (
                    <p className="text-xs text-gray-500 mt-1">
                      Parentesco: {deportistaSeleccionado.contacto_emergencia_parentesco}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetalleModal(false);
                    handleEditar(deportistaSeleccionado);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <FiEdit2 className="inline mr-2" /> Editar
                </button>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDITAR - SOLO CAMPOS ESPECÍFICOS */}
      {showEditarModal && deportistaSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">✏️ Editar Deportista</h3>
              <button 
                onClick={() => setShowEditarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* ✅ INFORMACIÓN BÁSICA (SOLO LECTURA) */}
              <div className="border-b pb-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FiLock className="text-gray-400" /> Información Básica (No editable)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium">{deportistaSeleccionado.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{deportistaSeleccionado.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha Nacimiento</p>
                    <p className="font-medium">{formatFecha(deportistaSeleccionado.fecha_nacimiento)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className={`font-medium ${getEstadoColor(deportistaSeleccionado.estado)} inline-block px-2 py-1 rounded-full text-xs`}>
                      {getEstadoNombre(deportistaSeleccionado.estado)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ✅ CONTACTO DE EMERGENCIA (SOLO LECTURA) */}
              {deportistaSeleccionado.contacto_emergencia_nombre && (
                <div className="border-b pb-4">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FiLock className="text-gray-400" /> Contacto de Emergencia (No editable)
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Nombre</p>
                    <p className="font-medium mb-3">{deportistaSeleccionado.contacto_emergencia_nombre}</p>
                    
                    <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                    <p className="font-medium mb-3">{deportistaSeleccionado.contacto_emergencia_telefono}</p>
                    
                    {deportistaSeleccionado.contacto_emergencia_parentesco && (
                      <>
                        <p className="text-sm text-gray-500 mb-1">Parentesco</p>
                        <p className="font-medium">{deportistaSeleccionado.contacto_emergencia_parentesco}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* ✅ CAMPOS EDITABLES */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">📝 Campos Editables</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono Personal
                    </label>
                    <input
                      type="text"
                      value={edicionData.telefono}
                      onChange={(e) => setEdicionData({...edicionData, telefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 3101234567"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={edicionData.peso}
                        onChange={(e) => setEdicionData({...edicionData, peso: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: 70.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Altura (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={edicionData.altura}
                        onChange={(e) => setEdicionData({...edicionData, altura: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: 1.75"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleGuardarEdicion}
                  disabled={guardando}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiSave /> Guardar cambios
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditarModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500">
          Mostrando {deportistasFiltrados.length} de {deportistas.length} deportistas
          <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
            ADMINISTRADOR
          </span>
        </div>
        <button
          onClick={cargarDeportistas}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          {loading ? 'Actualizando...' : 'Actualizar lista'}
        </button>
      </div>

      {/* Overlay para cerrar menús */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setMenuAbierto(null);
            setMenuDeportistaId(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDeportistas;