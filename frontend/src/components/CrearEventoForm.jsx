// frontend/src/components/CrearEventoForm.jsx - FORMULARIO MEJORADO
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CrearEventoForm = ({ onEventoCreado, onCancelar }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    nivel: '',
    grupo_competitivo: '',
    tipo: 'general'
  });
  
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  useEffect(() => {
    cargarGruposCompetitivos();
  }, []);
  
  const cargarGruposCompetitivos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/calendario/grupos-competitivos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGruposDisponibles(response.data.grupos || []);
    } catch (error) {
      console.error('Error cargando grupos:', error);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Validar que al menos un filtro esté presente
      if (!formData.nivel && !formData.grupo_competitivo) {
        setMensaje('⚠️ Debes seleccionar al menos un filtro (nivel o grupo competitivo)');
        setLoading(false);
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/calendario',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMensaje('✅ Evento creado exitosamente');
      
      // Limpiar formulario
      setFormData({
        titulo: '',
        descripcion: '',
        fecha: '',
        nivel: '',
        grupo_competitivo: '',
        tipo: 'general'
      });
      
      // Notificar al componente padre
      if (onEventoCreado) {
        onEventoCreado(response.data.evento);
      }
      
    } catch (error) {
      console.error('Error creando evento:', error);
      setMensaje(`❌ Error: ${error.response?.data?.error || 'Error al crear evento'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const niveles = [
    { value: '', label: 'Seleccionar nivel (opcional)' },
    { value: 'todos', label: 'Todos los niveles' },
    { value: '1_basico', label: '1 Básico' },
    { value: '1_medio', label: '1 Medio' },
    { value: '1_avanzado', label: '1 Avanzado' },
    { value: '2', label: 'Nivel 2' },
    { value: '3', label: 'Nivel 3' },
    { value: '4', label: 'Nivel 4' }
  ];
  
  const tiposEvento = [
    { value: 'general', label: 'General' },
    { value: 'competencia', label: 'Competencia' },
    { value: 'entrenamiento', label: 'Entrenamiento' },
    { value: 'evaluacion', label: 'Evaluación' },
    { value: 'festivo', label: 'Festivo' }
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-2">📅</span>
        Crear Nuevo Evento
      </h2>
      
      {mensaje && (
        <div className={`mb-4 p-3 rounded-lg ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título del Evento *
          </label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Competencia Regional"
          />
        </div>
        
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Detalles del evento..."
          />
        </div>
        
        {/* Fecha y tipo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Evento
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tiposEvento.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* FILTROS: Nivel y Grupo Competitivo */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Filtros de Destinatarios
            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
              Selecciona al menos uno
            </span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel
              </label>
              <select
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {niveles.map(nivel => (
                  <option key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Dejar en blanco si no aplica
              </p>
            </div>
            
            {/* Grupo Competitivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo Competitivo
              </label>
              <select
                name="grupo_competitivo"
                value={formData.grupo_competitivo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar grupo (opcional)</option>
                {gruposDisponibles.map(grupo => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
                <option value="personalizado">Otro (especificar abajo)</option>
              </select>
              
              {formData.grupo_competitivo === 'personalizado' && (
                <input
                  type="text"
                  placeholder="Nombre del grupo"
                  className="w-full mt-2 px-3 py-1 border border-gray-300 rounded text-sm"
                  onChange={(e) => setFormData(prev => ({ ...prev, grupo_competitivo: e.target.value }))}
                />
              )}
            </div>
          </div>
          
          <div className="mt-3 text-sm text-blue-600">
            <p className="font-semibold">📌 Comportamiento de los filtros:</p>
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>Si seleccionas solo Nivel → Evento para todo ese nivel</li>
              <li>Si seleccionas solo Grupo → Evento para ese grupo en todos los niveles</li>
              <li>Si seleccionas ambos → Evento específico para nivel+grupo</li>
              <li>Si no seleccionas ninguno → Error (debes elegir al menos uno)</li>
            </ul>
          </div>
        </div>
        
        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading || (!formData.nivel && !formData.grupo_competitivo)}
            className={`px-6 py-2 rounded-lg font-medium ${
              loading || (!formData.nivel && !formData.grupo_competitivo)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Creando...
              </>
            ) : (
              'Crear Evento'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearEventoForm;