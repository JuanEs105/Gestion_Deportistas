// frontend/src/pages/Progreso.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluacionesAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Progreso = () => {
  const [deportista, setDeportista] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      let deportistaId = user.deportistaProfile?.id;
      
      setDeportista({
        nombre: user.nombre || user.name,
        nivel_actual: user.deportistaProfile?.nivel_actual || '1_basico'
      });
      
      // Cargar progreso y evaluaciones
      const [progresoRes, evaluacionesRes] = await Promise.all([
        evaluacionesAPI.getProgreso(deportistaId),
        evaluacionesAPI.getByDeportista(deportistaId)
      ]);
      
      setProgreso(progresoRes);
      setEvaluaciones(evaluacionesRes.evaluaciones || []);
      
    } catch (error) {
      console.error('Error cargando progreso:', error);
    } finally {
      setLoading(false);
    }
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
  
  // Preparar datos para gráfico
  const prepararDatosGrafico = () => {
    if (!progreso) return [];
    
    return Object.entries(progreso.progreso_por_categoria || {}).map(([cat, data]) => ({
      categoria: cat === 'habilidad' ? 'Habilidades' :
                 cat === 'ejercicio_accesorio' ? 'Ejercicios' : 'Posturas',
      completadas: data.completadas,
      total: data.total,
      porcentaje: data.porcentaje
    }));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Mi Progreso</h1>
          {deportista && (
            <p className="text-gray-600">
              {deportista.nombre} • Nivel: {getNivelNombre(deportista.nivel_actual)}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/deportista')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
        >
          ← Volver al Dashboard
        </button>
      </div>
      
      {/* PROGRESO GENERAL */}
      {progreso && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Progreso General</h2>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">Progreso del Nivel Actual</span>
              <span className="font-bold">{progreso.progreso_total?.completadas || 0}/{progreso.progreso_total?.total || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progreso.progreso_total?.porcentaje || 0}%` }}
              >
                <span className="text-xs font-bold text-white flex items-center justify-end h-full pr-3">
                  {progreso.progreso_total?.porcentaje > 10 && `${progreso.progreso_total?.porcentaje}%`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Porcentaje Total</p>
              <p className="text-2xl font-bold text-blue-600">{progreso.progreso_total?.porcentaje || 0}%</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{progreso.progreso_total?.completadas || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-yellow-600">{progreso.progreso_total?.total || 0}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Faltantes</p>
              <p className="text-2xl font-bold text-purple-600">{progreso.progreso_total?.faltantes || 0}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* GRÁFICO DE PROGRESO POR CATEGORÍA */}
      {progreso && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Progreso por Categoría</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepararDatosGrafico()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completadas" fill="#3b82f6" name="Completadas" />
                <Bar dataKey="total" fill="#e5e7eb" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* DETALLE POR CATEGORÍA */}
      {progreso && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(progreso.progreso_por_categoria || {}).map(([cat, data]) => (
            <div key={cat} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">
                  {cat === 'habilidad' ? '🏆' :
                   cat === 'ejercicio_accesorio' ? '💪' : '🧘'}
                </span>
                <div>
                  <h4 className="font-bold text-gray-800">
                    {cat === 'habilidad' ? 'Habilidades' :
                     cat === 'ejercicio_accesorio' ? 'Ejercicios' : 'Posturas'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {data.completadas}/{data.total} completadas
                  </p>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.porcentaje}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-bold">{data.porcentaje}%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="text-sm">
                <p className="text-gray-600">Faltan: <span className="font-bold">{data.faltantes}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Progreso;