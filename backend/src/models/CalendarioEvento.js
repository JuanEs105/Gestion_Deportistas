// backend/src/models/CalendarioEvento.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CalendarioEvento = sequelize.define('CalendarioEvento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El título es requerido'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'La fecha es requerida'
      },
      isDate: {
        msg: 'Debe ser una fecha válida'
      }
    }
  },
  nivel: {
    type: DataTypes.ENUM('1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos'),
    allowNull: false,
    defaultValue: '1_basico', // ← VALOR POR DEFECTO
    validate: {
      notNull: {
        msg: 'El nivel es requerido'
      },
      isIn: {
        args: [['1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos']],
        msg: 'Nivel inválido'
      }
    },
    comment: 'Nivel al que aplica el evento'
  },
  tipo: {
    type: DataTypes.ENUM('competencia', 'entrenamiento', 'evaluacion', 'festivo', 'general'),
    defaultValue: 'general',
    allowNull: false,
    comment: 'Tipo de evento'
  },
  entrenador_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE', // ← Si se elimina el entrenador, eliminar sus eventos
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'calendario_eventos',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['fecha']
    },
    {
      fields: ['nivel']
    },
    {
      fields: ['entrenador_id']
    }
  ]
});

// Asociaciones
CalendarioEvento.associate = function(models) {
  CalendarioEvento.belongsTo(models.User, {
    foreignKey: 'entrenador_id',
    as: 'entrenador'
  });
};

module.exports = CalendarioEvento;