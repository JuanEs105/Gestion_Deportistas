// frontend/src/pages/Admin/AdminEntrenadores.jsx - MODAL CORREGIDO
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminEntrenadores = () => {
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [entrenadorEditando, setEntrenadorEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    niveles_asignados: []
  });

  const nivelesDisponibles = [
    { value: '1_basico', label: '1 Básico', color: 'bg-green-500' },
    { value: '1_medio', label: '1 Medio', color: 'bg-blue-500' },
    { value: '1_avanzado', label: '1 Avanzado', color: 'bg-purple-500' },
    { value: '2', label: 'Nivel 2', color: 'bg-yellow-500' },
    { value: '3', label: 'Nivel 3', color: 'bg-orange-500' },
    { value: '4', label: 'Nivel 4', color: 'bg-red-500' }
  ];

  useEffect(() => {
    cargarEntrenadores();
  }, []);

  const cargarEntrenadores = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllEntrenadores();
      setEntrenadores(response.entrenadores || []);
    } catch (error) {
      console.error('Error cargando entrenadores:', error);
      alert('Error al cargar entrenadores');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoEntrenador = () => {
    setModoEdicion(false);
    setEntrenadorEditando(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      telefono: '',
      niveles_asignados: []
    });
    setMostrarFormulario(true);
  };

  const handleEditarEntrenador = (entrenador) => {
    setModoEdicion(true);
    setEntrenadorEditando(entrenador);
    setFormData({
      nombre: entrenador.nombre,
      email: entrenador.email,
      password: '',
      telefono: entrenador.telefono || '',
      niveles_asignados: entrenador.niveles_asignados || []
    });
    setMostrarFormulario(true);
  };

  const handleToggleNivel = (nivelValue) => {
    setFormData(prev => {
      const niveles = prev.niveles_asignados || [];
      if (niveles.includes(nivelValue)) {
        return {
          ...prev,
          niveles_asignados: niveles.filter(n => n !== nivelValue)
        };
      } else {
        return {
          ...prev,
          niveles_asignados: [...niveles, nivelValue]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (modoEdicion) {
        await adminAPI.updateEntrenador(entrenadorEditando.id, formData);
        alert('✅ Entrenador actualizado exitosamente');
      } else {
        await adminAPI.createEntrenador(formData);
        alert('✅ Entrenador creado exitosamente');
      }
      
      setMostrarFormulario(false);
      await cargarEntrenadores();
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar al entrenador ${nombre}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await adminAPI.deleteEntrenador(id);
      alert('✅ Entrenador eliminado exitosamente');
      await cargarEntrenadores();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, nombre, activo) => {
    try {
      setLoading(true);
      await adminAPI.toggleEntrenadorStatus(id);
      alert(`✅ Entrenador ${activo ? 'desactivado' : 'activado'}`);
      await cargarEntrenadores();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const entrenadoresFiltrados = entrenadores.filter(e =>
    e.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            👨‍🏫 Gestión de Entrenadores
          </h1>
          <p className="text-gray-600">Administra el personal de entrenamiento</p>
        </div>
        
        <button
          onClick={handleNuevoEntrenador}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <span className="text-2xl">➕</span>
          <span>Nuevo Entrenador</span>
        </button>
      </div>

      {/* BÚSQUEDA */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar entrenador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Total</h3>
          <p className="text-4xl font-bold">{entrenadores.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Activos</h3>
          <p className="text-4xl font-bold">
            {entrenadores.filter(e => e.activo).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Filtrados</h3>
          <p className="text-4xl font-bold">{entrenadoresFiltrados.length}</p>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Teléfono</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Niveles Asignados</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Deportistas</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : entrenadoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <div className="text-6xl mb-4">👨‍🏫</div>
                    <p>No hay entrenadores registrados</p>
                  </td>
                </tr>
              ) : (
                entrenadoresFiltrados.map((entrenador) => (
                  <tr key={entrenador.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold mr-3">
                          {entrenador.nombre?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {entrenador.nombre}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entrenador.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entrenador.telefono || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(entrenador.niveles_asignados || []).length > 0 ? (
                          entrenador.niveles_asignados.map(nivel => {
                            const nivelInfo = nivelesDisponibles.find(n => n.value === nivel);
                            return (
                              <span
                                key={nivel}
                                className={`px-2 py-1 ${nivelInfo?.color || 'bg-gray-500'} text-white rounded-full text-xs font-semibold`}
                              >
                                {nivelInfo?.label || nivel}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 text-sm">Sin niveles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {entrenador.deportistas_asignados || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        entrenador.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entrenador.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleStatus(entrenador.id, entrenador.nombre, entrenador.activo)}
                          className="text-yellow-600 hover:text-yellow-900 transition"
                          title={entrenador.activo ? 'Desactivar' : 'Activar'}
                        >
                          {entrenador.activo ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleEditarEntrenador(entrenador)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleEliminar(entrenador.id, entrenador.nombre)}
                          className="text-red-600 hover:text-red-900 transition"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO - CORREGIDO */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white rounded-t-2xl sticky top-0 z-10">
              <h3 className="text-2xl font-bold">
                {modoEdicion ? '✏️ Editar Entrenador' : '➕ Nuevo Entrenador'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={modoEdicion}
                    className={`w-full px-4 py-3 border-2 rounded-lg ${
                      modoEdicion ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                    }`}
                    placeholder="correo@ejemplo.com"
                  />
                  {modoEdicion && (
                    <p className="text-xs text-gray-500 mt-1">ℹ️ El email no se puede modificar</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Contraseña {modoEdicion ? '(dejar vacío para no cambiar)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!modoEdicion}
                    minLength="6"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+57 300 123 4567"
                  />
                </div>

                {/* SELECTOR DE NIVELES */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📚 Niveles Asignados *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Selecciona los niveles que este entrenador podrá gestionar
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {nivelesDisponibles.map(nivel => {
                      const isSelected = (formData.niveles_asignados || []).includes(nivel.value);
                      return (
                        <button
                          key={nivel.value}
                          type="button"
                          onClick={() => handleToggleNivel(nivel.value)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? `${nivel.color} text-white border-transparent shadow-lg scale-105`
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{nivel.label}</span>
                            {isSelected && <span className="text-xl">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {formData.niveles_asignados.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      ⚠️ Debes seleccionar al menos un nivel
                    </p>
                  )}
                </div>
              </div>

              {/* BOTONES - CORREGIDOS Y SIEMPRE VISIBLES */}
              <div className="flex space-x-4 pt-4 border-t sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition shadow-lg disabled:opacity-50"
                  disabled={loading || formData.niveles_asignados.length === 0}
                >
                  {loading ? '⏳ Guardando...' : modoEdicion ? '✅ Actualizar' : '✅ Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEntrenadores;