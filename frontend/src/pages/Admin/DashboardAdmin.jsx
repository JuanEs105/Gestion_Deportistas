// frontend/src/pages/Admin/DashboardAdmin.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DashboardAdmin = () => {
  const [stats, setStats] = useState(null);
  const [deportistasStats, setDeportistasStats] = useState(null);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [statsRes, deportistasRes, actividadRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getDeportistasStats(),
        adminAPI.getReporteActividad()
      ]);
      
      setStats(statsRes.stats);
      setDeportistasStats(deportistasRes);
      setActividadReciente(actividadRes.actividad_reciente || []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Preparar datos para gráficas
  const datosNiveles = deportistasStats?.por_nivel?.map(item => ({
    nivel: item.nivel_actual,
    cantidad: parseInt(item.cantidad)
  })) || [];

  const datosEstados = deportistasStats?.por_estado?.map(item => ({
    estado: item.estado,
    cantidad: parseInt(item.cantidad)
  })) || [];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          👑 Panel de Administración
        </h1>
        <p className="text-gray-600">Vista general del sistema y estadísticas</p>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Entrenadores */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase">Entrenadores</p>
              <p className="text-4xl font-bold mt-2">{stats?.total_entrenadores || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-5xl">💪</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">Personal activo del sistema</p>
          </div>
        </div>

        {/* Total Deportistas */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold uppercase">Deportistas</p>
              <p className="text-4xl font-bold mt-2">{stats?.total_deportistas || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-5xl">🏃</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-green-100 text-sm">
              {stats?.deportistas_activos || 0} activos
            </p>
          </div>
        </div>

        {/* Total Evaluaciones */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold uppercase">Evaluaciones</p>
              <p className="text-4xl font-bold mt-2">{stats?.total_evaluaciones || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-5xl">📋</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">
              {stats?.evaluaciones_este_mes || 0} este mes
            </p>
          </div>
        </div>

        {/* Promedio General */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-semibold uppercase">Promedio</p>
              <p className="text-4xl font-bold mt-2">{stats?.promedio_general || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-5xl">⭐</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-400">
            <p className="text-orange-100 text-sm">Puntuación general</p>
          </div>
        </div>
      </div>

      {/* GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Deportistas por Nivel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📊 Deportistas por Nivel
          </h3>
          {datosNiveles.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosNiveles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nivel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3b82f6">
                  {datosNiveles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No hay datos disponibles</p>
            </div>
          )}
        </div>

        {/* Estados de Deportistas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📈 Estados de Deportistas
          </h3>
          {datosEstados.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosEstados}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({estado, cantidad}) => `${estado}: ${cantidad}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {datosEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No hay datos disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            🔔 Actividad Reciente
          </h3>
          <span className="text-sm text-gray-500">Últimas 20 evaluaciones</span>
        </div>
        
        {actividadReciente.length > 0 ? (
          <div className="space-y-3">
            {actividadReciente.slice(0, 10).map((actividad, index) => (
              <div
                key={actividad.id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {actividad.puntuacion}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {actividad.deportista?.User?.nombre || 'Deportista'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {actividad.habilidad?.nombre || 'Habilidad'} • 
                    Por {actividad.entrenador?.nombre || 'Entrenador'}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    actividad.completado 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {actividad.completado ? '✅ Completado' : '🔄 En progreso'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(actividad.fecha_evaluacion).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">📋</div>
            <p>No hay actividad reciente</p>
          </div>
        )}
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-6">⚡ Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/entrenadores"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">👨‍🏫</div>
            <p className="font-semibold">Gestionar Entrenadores</p>
          </a>
          <a
            href="/admin/deportistas"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">🏃‍♂️</div>
            <p className="font-semibold">Ver Deportistas</p>
          </a>
          <a
            href="/admin/reportes"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📊</div>
            <p className="font-semibold">Generar Reportes</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;