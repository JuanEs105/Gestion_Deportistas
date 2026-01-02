// backend/src/models/Habilidad.js - ACTUALIZADO
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
    type: DataTypes.ENUM('1_basico', '1_medio', '1_avanzado', '2', '3', '4'),
    allowNull: false,
    defaultValue: '1_basico',
    comment: 'Nivel de dificultad: 1_basico, 1_medio, 1_avanzado, 2, 3, 4'
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
    defaultValue: 7,
    validate: {
      min: 1,
      max: 10
    },
    comment: 'Puntuación mínima (1-10) para considerar completada'
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

// Métodos de instancia
Habilidad.prototype.estaCompletada = function(puntuacion) {
  return puntuacion >= this.puntuacion_minima;
};

// Métodos estáticos
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

// Asociaciones
Habilidad.associate = function(models) {
  Habilidad.hasMany(models.Evaluacion, {
    foreignKey: 'habilidad_id',
    as: 'evaluaciones'
  });
};

// Método para obtener habilidades con estado de evaluación
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

module.exports = Habilidad;