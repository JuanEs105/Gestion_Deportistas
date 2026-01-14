// frontend/src/pages/Admin/AdminAdministradores.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminAdministradores = () => {
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [adminEditando, setAdminEditando] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
  });

  useEffect(() => {
    cargarAdministradores();
  }, []);

  const cargarAdministradores = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando administradores...');
      
      const response = await adminAPI.getAllAdministradores();
      console.log('✅ Respuesta administradores:', response);
      
      // ✅ FILTRO DE SEGURIDAD EN FRONTEND - Solo mostrar role='admin'
      let admins = response.administradores || response.data || [];
      admins = admins.filter(user => user.role === 'admin');
      
      console.log(`✅ ${admins.length} administradores filtrados`);
      setAdministradores(admins);
      
    } catch (error) {
      console.error('❌ Error cargando administradores:', error);
      alert('Error al cargar administradores: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoAdministrador = () => {
    setModoEdicion(false);
    setAdminEditando(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      telefono: '',
    });
    setMostrarFormulario(true);
  };

  const handleEditarAdministrador = (admin) => {
    setModoEdicion(true);
    setAdminEditando(admin);
    
    setFormData({
      nombre: admin.nombre || '',
      email: admin.email || '',
      password: '', // No mostrar password actual
      telefono: admin.telefono || '',
    });
    setMostrarFormulario(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (modoEdicion) {
        await adminAPI.updateAdministrador(adminEditando.id, formData);
        alert('✅ Administrador actualizado exitosamente');
      } else {
        await adminAPI.createAdministrador(formData);
        alert('✅ Administrador creado exitosamente');
      }
      
      setMostrarFormulario(false);
      await cargarAdministradores();
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar al administrador ${nombre}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await adminAPI.deleteAdministrador(id);
      alert('✅ Administrador eliminado exitosamente');
      await cargarAdministradores();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al eliminar: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, nombre) => {
    try {
      setLoading(true);
      await adminAPI.toggleAdministradorStatus(id);
      alert('✅ Estado actualizado');
      await cargarAdministradores();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const administradoresFiltrados = administradores.filter(admin => {
    const nombre = admin.nombre || '';
    const email = admin.email || '';
    
    const matchNombre = nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmail = email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchTerm === '' || matchNombre || matchEmail;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            👨‍💼 Gestión de Administradores
          </h1>
          <p className="text-gray-600">
            Administra los usuarios con permisos de administrador del sistema
          </p>
        </div>
        
        <button
          onClick={handleNuevoAdministrador}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <span className="text-2xl">➕</span>
          <span>Nuevo Administrador</span>
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Total Administradores</h3>
          <p className="text-4xl font-bold">{administradores.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Activos</h3>
          <p className="text-4xl font-bold">
            {administradores.filter(a => a.activo).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Filtrados</h3>
          <p className="text-4xl font-bold">{administradoresFiltrados.length}</p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Buscar Administrador
          </label>
          <input
            type="text"
            placeholder="Nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* TABLA DE ADMINISTRADORES */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Teléfono</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Creado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando administradores...</p>
                  </td>
                </tr>
              ) : administradoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <div className="text-6xl mb-4">👨‍💼</div>
                    <p className="text-lg">No hay administradores registrados</p>
                    <p className="text-sm mt-2">Usa el botón "Nuevo Administrador" para agregar uno</p>
                  </td>
                </tr>
              ) : (
                administradoresFiltrados.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      #{admin.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {admin.nombre || 'Sin nombre'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {admin.email || 'Sin email'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {admin.telefono || 'No tiene'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.activo 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditarAdministrador(admin)}
                          className="text-blue-600 hover:text-blue-900 transition p-1"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.nombre)}
                          className="text-yellow-600 hover:text-yellow-900 transition p-1"
                          title={admin.activo ? 'Desactivar' : 'Activar'}
                        >
                          {admin.activo ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleEliminar(admin.id, admin.nombre)}
                          className="text-red-600 hover:text-red-900 transition p-1"
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

      {/* MODAL FORMULARIO ADMINISTRADOR */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">
                {modoEdicion ? '✏️ Editar Administrador' : '➕ Nuevo Administrador'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={modoEdicion}
                    className={`w-full px-4 py-3 border-2 rounded-lg ${modoEdicion ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="admin@ejemplo.com"
                  />
                </div>
                
                {!modoEdicion && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!modoEdicion}
                      minLength="6"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+57 300 123 4567"
                  />
                </div>
                
                {modoEdicion && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nueva Contraseña (opcional)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      minLength="6"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dejar vacío para no cambiar"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4 border-t">
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
                  disabled={loading}
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

export default AdminAdministradores;