import React, { useState, useEffect } from 'react';
import { deportistasAPI, evaluacionesAPI } from '../services/api';

const DashboardEntrenador = () => {
  const [stats, setStats] = useState({
    totalDeportistas: 0,
    evaluacionesPendientes: 0,
    completadosEsteMes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener deportistas
      const deportistasResponse = await deportistasAPI.getAll();
      const totalDeportistas = deportistasResponse.data?.length || 0;
      
      // Obtener evaluaciones (simulamos por ahora)
      // TODO: Crear endpoint real en backend
      const evaluacionesPendientes = Math.min(5, totalDeportistas);
      const completadosEsteMes = Math.floor(totalDeportistas * 1.5);
      
      setStats({
        totalDeportistas,
        evaluacionesPendientes,
        completadosEsteMes
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard del Entrenador</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard del Entrenador</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Deportistas</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalDeportistas}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Evaluaciones Pendientes</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.evaluacionesPendientes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Completados Este Mes</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.completadosEsteMes}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Nueva Evaluación
          </button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Agregar Deportista
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardEntrenador;