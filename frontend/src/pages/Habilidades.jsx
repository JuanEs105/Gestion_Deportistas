// frontend/src/pages/Habilidades.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { habilidadesAPI } from '../services/api';

const Habilidades = () => {
  const [deportista, setDeportista] = useState(null);
  const [habilidades, setHabilidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
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
      let nivelActual = user.deportistaProfile?.nivel_actual;
      
      setDeportista({
        nombre: user.nombre || user.name,
        nivel_actual: nivelActual || '1_basico'
      });
      
      // Cargar habilidades
      const habilidadesRes = await habilidadesAPI.getByNivel(nivelActual || '1_basico', deportistaId);
      setHabilidades(habilidadesRes.habilidades || []);
      
    } catch (error) {
      console.error('Error cargando habilidades:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCategoriaIcon = (cat) => {
    const iconos = {
      'habilidad': '🏆',
      'ejercicio_accesorio': '💪',
      'postura': '🧘'
    };
    return iconos[cat] || '📋';
  };
  
  const getCategoriaNombre = (cat) => {
    return cat === 'habilidad' ? 'Habilidades Técnicas' :
           cat === 'ejercicio_accesorio' ? 'Ejercicios Accesorios' :
           'Posturas Corporales';
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
  
  // Filtrar habilidades
  const habilidadesFiltradas = categoriaSeleccionada === 'todas' 
    ? habilidades 
    : habilidades.filter(h => h.categoria === categoriaSeleccionada);
  
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
          <h1 className="text-3xl font-bold text-gray-800">🎯 Mis Habilidades</h1>
          {deportista && (
            <p className="text-gray-600">
              {deportista.nombre} • Nivel: {getNivelNombre(deportista.nivel_actual)} • {habilidades.length} habilidades
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
      
      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filtrar por Categoría</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaSeleccionada('todas')}
            className={`px-4 py-2 rounded-lg font-medium ${
              categoriaSeleccionada === 'todas'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setCategoriaSeleccionada('habilidad')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center ${
              categoriaSeleccionada === 'habilidad'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span className="mr-2">🏆</span> Habilidades
          </button>
          <button
            onClick={() => setCategoriaSeleccionada('ejercicio_accesorio')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center ${
              categoriaSeleccionada === 'ejercicio_accesorio'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span className="mr-2">💪</span> Ejercicios
          </button>
          <button
            onClick={() => setCategoriaSeleccionada('postura')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center ${
              categoriaSeleccionada === 'postura'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span className="mr-2">🧘</span> Posturas
          </button>
        </div>
      </div>
      
      {/* LISTA DE HABILIDADES */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {categoriaSeleccionada === 'todas' 
              ? 'Todas las Habilidades' 
              : getCategoriaNombre(categoriaSeleccionada)}
          </h3>
          <span className="text-sm text-gray-500">
            {habilidadesFiltradas.length} de {habilidades.length}
          </span>
        </div>
        
        {habilidadesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>No hay habilidades en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-4">
            {habilidadesFiltradas.map(habilidad => {
              const evaluacion = habilidad.evaluacion;
              const estado = !evaluacion ? 'pendiente' :
                            evaluacion.completada ? 'completada' : 'en_progreso';
              
              return (
                <div
                  key={habilidad.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoriaIcon(habilidad.categoria)}</span>
                      <div>
                        <h4 className="font-bold text-gray-800">{habilidad.nombre}</h4>
                        <p className="text-xs text-gray-500">
                          Código: {habilidad.codigo || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      estado === 'completada' ? 'bg-green-100 text-green-800' :
                      estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {estado === 'completada' ? '✅ Completada' :
                       estado === 'en_progreso' ? '🔄 En Progreso' :
                       '⏳ Pendiente'}
                    </span>
                  </div>
                  
                  {habilidad.descripcion && (
                    <p className="text-sm text-gray-600 mb-3">{habilidad.descripcion}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Mínimo: <span className="font-bold text-blue-600">{habilidad.puntuacion_minima}/10</span>
                    </span>
                    {evaluacion && (
                      <span className="font-semibold">
                        Tu mejor: <span className={
                          evaluacion.completada ? 'text-green-600' : 'text-yellow-600'
                        }>
                          {evaluacion.mejor_puntuacion || evaluacion.puntuacion || 0}/10
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Habilidades;