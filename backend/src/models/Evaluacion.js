const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Evaluacion = sequelize.define('Evaluacion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deportista_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'deportistas',
      key: 'id'
    }
  },
  habilidad_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'habilidades',
      key: 'id'
    }
  },
  entrenador_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fecha_evaluacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  puntuacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  completado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  video_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  intentos: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'evaluaciones',
  timestamps: true,
  underscored: true
});

// Asociaciones
Evaluacion.associate = function(models) {
  Evaluacion.belongsTo(models.Deportista, {
    foreignKey: 'deportista_id',
    as: 'deportista'
  });
  
  Evaluacion.belongsTo(models.Habilidad, {
    foreignKey: 'habilidad_id',
    as: 'habilidad'
  });
  
  Evaluacion.belongsTo(models.User, {
    foreignKey: 'entrenador_id',
    as: 'entrenador'
  });
};

module.exports = Evaluacion;