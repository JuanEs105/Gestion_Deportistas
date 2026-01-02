import React, { useState, useEffect } from 'react';
import { deportistasAPI } from '../services/api';

const Estadisticas = () => {
  const [stats, setStats] = useState(null);
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const deportistasRes = await deportistasAPI.getAll();
      setDeportistas(deportistasRes.data || []);
      
      const statsData = {
        totalDeportistas: deportistasRes.data.length,
        activos: deportistasRes.data.filter(d => d.estado === 'activo').length,
        porNivel: {},
      };
      
      deportistasRes.data.forEach(d => {
        if (d.estado !== 'inactivo') {
          const nivel = d.nivel_actual || '1_basico';
          statsData.porNivel[nivel] = (statsData.porNivel[nivel] || 0) + 1;
          
        }
      });
      
      setStats(statsData);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📊 Estadísticas del Club</h1>
        <p className="text-gray-600">Métricas y análisis del rendimiento deportivo</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Deportistas</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalDeportistas || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Activos</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.activos || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Niveles Activos</h3>
          <p className="text-3xl font-bold text-purple-600">{Object.keys(stats?.porNivel || {}).length}</p>
        </div>
     
      </div>

      {/* Tablas de estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Por nivel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Deportistas por Nivel</h3>
          <div className="space-y-3">
            {Object.entries(stats?.porNivel || {}).map(([nivel, cantidad]) => (
              <div key={nivel} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">{nivel}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
                  {cantidad}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de deportistas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🏃‍♂️ Deportistas Activos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deportistas
                .filter(d => d.estado !== 'inactivo')
                .map(deportista => (
                  <tr key={deportista.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{deportista.User?.nombre}</div>
                          <div className="text-sm text-gray-500">{deportista.User?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {deportista.nivel_actual}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deportista.grupo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        deportista.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deportista.estado}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;