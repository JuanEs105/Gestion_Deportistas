// backend/src/models/Habilidad.js - ACTUALIZADO CON PUNTUACIÓN 1-5
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Habilidad = sequelize.define('Habilidad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nivel: {
    type: DataTypes.ENUM(
        'baby_titans',
        '1_basico', 
        '1_medio', 
        '1_avanzado', 
        '2', 
        '3', 
        '4'
    ),
    allowNull: false
  },
  categoria: {
    type: DataTypes.ENUM('habilidad', 'ejercicio_accesorio', 'postura'),
    defaultValue: 'habilidad',
    allowNull: false,
    comment: 'Categoría de la habilidad'
  },
  obligatoria: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si es obligatoria para pasar de nivel'
  },
  puntuacion_minima: {
    type: DataTypes.INTEGER,
    defaultValue: 3, // 🔥 CAMBIADO: Ahora 3/5 es el mínimo (antes era 7/10)
    validate: {
      min: 1,
      max: 5  // 🔥 CAMBIADO: Máximo ahora es 5 (antes era 10)
    },
    comment: 'Puntuación mínima (1-5) para considerar completada la habilidad'
  },
  tipo: {
    type: DataTypes.STRING,
    defaultValue: 'habilidad',
    comment: 'Tipo de habilidad (legado, usar categoria en su lugar)'
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Orden de visualización dentro del nivel'
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si la habilidad está activa en el sistema'
  }
}, {
  tableName: 'habilidades',
  timestamps: true,
  indexes: [
    {
      fields: ['nivel']
    },
    {
      fields: ['categoria']
    },
    {
      fields: ['activa']
    }
  ]
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Verifica si una habilidad está completada según la puntuación
 * @param {number} puntuacion - Puntuación obtenida (1-5)
 * @returns {boolean}
 */
Habilidad.prototype.estaCompletada = function(puntuacion) {
  return puntuacion >= this.puntuacion_minima;
};

/**
 * Obtiene el nivel de desempeño según la puntuación
 * @param {number} puntuacion - Puntuación obtenida (1-5)
 * @returns {string}
 */
Habilidad.prototype.getNivelDesempeno = function(puntuacion) {
  if (puntuacion >= 5) return 'Excelente';
  if (puntuacion >= 4) return 'Bueno';
  if (puntuacion >= 3) return 'Regular';
  if (puntuacion >= 2) return 'Deficiente';
  return 'Malo';
};

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Obtener habilidades por nivel y opcionalmente por categoría
 * @param {string} nivel - Nivel de la habilidad
 * @param {string|null} categoria - Categoría opcional
 * @returns {Promise<Array>}
 */
Habilidad.obtenerPorNivelYCategoria = async function(nivel, categoria = null) {
  const where = { nivel, activa: true };
  if (categoria) {
    where.categoria = categoria;
  }
  
  return await this.findAll({
    where,
    order: [['orden', 'ASC'], ['nombre', 'ASC']]
  });
};

/**
 * Obtener estadísticas de habilidades por nivel
 * @param {string} nivel - Nivel a consultar
 * @returns {Promise<Object>}
 */
Habilidad.obtenerEstadisticasPorNivel = async function(nivel) {
  const habilidades = await this.findAll({
    where: { nivel, activa: true },
    attributes: [
      'categoria',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total']
    ],
    group: ['categoria'],
    raw: true
  });
  
  return habilidades.reduce((acc, curr) => {
    acc[curr.categoria] = parseInt(curr.total);
    return acc;
  }, {});
};

/**
 * Obtener habilidades con estado de evaluación para un deportista
 * @param {string} deportistaId - ID del deportista
 * @param {string} nivel - Nivel a consultar
 * @returns {Promise<Array>}
 */
Habilidad.getConEstadoEvaluacion = async function(deportistaId, nivel) {
  const habilidades = await this.findAll({
    where: { nivel, activa: true },
    order: [['categoria', 'ASC'], ['orden', 'ASC']]
  });
  
  // Obtener evaluaciones del deportista
  const { Evaluacion } = require('./index');
  const habilidadesIds = habilidades.map(h => h.id);
  
  const evaluaciones = await Evaluacion.findAll({
    where: {
      deportista_id: deportistaId,
      habilidad_id: habilidadesIds
    },
    attributes: [
      'habilidad_id',
      [sequelize.fn('MAX', sequelize.col('puntuacion')), 'mejor_puntuacion'],
      [sequelize.fn('MAX', sequelize.col('fecha_evaluacion')), 'ultima_fecha']
    ],
    group: ['habilidad_id'],
    raw: true
  });
  
  // Mapear habilidades con su estado
  return habilidades.map(h => {
    const evalu = evaluaciones.find(e => e.habilidad_id === h.id);
    return {
      ...h.toJSON(),
      evaluacion: evalu ? {
        mejor_puntuacion: evalu.mejor_puntuacion,
        ultima_fecha: evalu.ultima_fecha,
        completada: evalu.mejor_puntuacion >= h.puntuacion_minima
      } : null
    };
  });
};

// ==========================================
// ASOCIACIONES
// ==========================================

Habilidad.associate = function(models) {
  Habilidad.hasMany(models.Evaluacion, {
    foreignKey: 'habilidad_id',
    as: 'evaluaciones'
  });
};

module.exports = Habilidad;