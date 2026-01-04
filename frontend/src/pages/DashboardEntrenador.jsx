// frontend/src/pages/DashboardEntrenador.jsx - VERSIÓN COMPLETA
import React, { useState, useEffect } from 'react';
import { deportistasAPI, evaluacionesAPI } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DashboardEntrenador = () => {
  const [stats, setStats] = useState({
    totalDeportistas: 0,
    deportistasActivos: 0,
    evaluacionesRealizadas: 0,
    promedioGeneral: 0
  });
  const [deportistasPorNivel, setDeportistasPorNivel] = useState([]);
  const [evaluacionesRecientes, setEvaluacionesRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nivelesAsignados, setNivelesAsignados] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Obtener niveles asignados del usuario
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const niveles = user?.niveles_asignados || [];
      setNivelesAsignados(niveles);
      
      // Obtener deportistas
      const deportistasRes = await deportistasAPI.getAll();
      const todosDeportistas = deportistasRes.data?.deportistas || deportistasRes.data || [];
      
      // Filtrar por niveles asignados
      const deportistasFiltrados = niveles.length > 0
        ? todosDeportistas.filter(d => niveles.includes(d.nivel_actual))
        : todosDeportistas;
      
      const deportistasActivos = deportistasFiltrados.filter(d => d.estado === 'activo');
      
      // Agrupar por nivel
      const porNivel = {};
      deportistasFiltrados.forEach(d => {
        const nivel = d.nivel_actual || '1_basico';
        porNivel[nivel] = (porNivel[nivel] || 0) + 1;
      });
      
      const datosNiveles = Object.entries(porNivel).map(([nivel, cantidad]) => ({
        nivel,
        cantidad
      }));
      
      setDeportistasPorNivel(datosNiveles);
      
      // Calcular evaluaciones (simulado - deberías tener un endpoint real)
      const evaluacionesRealizadas = deportistasFiltrados.length * 3; // Simulación
      
      setStats({
        totalDeportistas: deportistasFiltrados.length,
        deportistasActivos: deportistasActivos.length,
        evaluacionesRealizadas,
        promedioGeneral: 7.5 // Simulado
      });
      
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🏋️ Dashboard del Entrenador
        </h1>
        <p className="text-gray-600">
          Vista general de tus deportistas y evaluaciones
        </p>
        {nivelesAsignados.length > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-700">Niveles asignados:</span>
            {nivelesAsignados.map(nivel => (
              <span key={nivel} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {nivel}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ESTADÍSTICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase">Total Deportistas</p>
              <p className="text-4xl font-bold mt-2">{stats.totalDeportistas}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-5xl">👥</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">Bajo tu supervisión</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold uppercase">Activos</p>
              <p className="text-4xl font-bold mt-2">{stats.deportistasActivos}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-5xl">✅</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-green-100 text-sm">Entrenando actualmente</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold uppercase">Evaluaciones</p>
              <p className="text-4xl font-bold mt-2">{stats.evaluacionesRealizadas}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-5xl">📋</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">Realizadas este mes</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-semibold uppercase">Promedio</p>
              <p className="text-4xl font-bold mt-2">{stats.promedioGeneral.toFixed(1)}</p>
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

      {/* GRÁFICA DE DEPORTISTAS POR NIVEL */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📊 Deportistas por Nivel
        </h3>
        {deportistasPorNivel.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deportistasPorNivel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nivel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad">
                {deportistasPorNivel.map((entry, index) => (
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

      {/* ACCIONES RÁPIDAS */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-6">⚡ Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/entrenador/deportistas"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">👥</div>
            <p className="font-semibold">Ver Deportistas</p>
          </a>
          <a
            href="/entrenador/evaluaciones"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold">Nueva Evaluación</p>
          </a>
          <a
            href="/entrenador/calendario"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📅</div>
            <p className="font-semibold">Calendario</p>
          </a>
          <a
            href="/entrenador/reportes"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📊</div>
            <p className="font-semibold">Reportes</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardEntrenador;