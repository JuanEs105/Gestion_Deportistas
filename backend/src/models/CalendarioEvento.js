// backend/src/models/CalendarioEvento.js - VERSIÓN COMPLETA Y CORREGIDA
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
      },
      len: {
        args: [3, 200],
        msg: 'El título debe tener entre 3 y 200 caracteres'
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
  hora: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora del evento'
  },
  ubicacion: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ubicación del evento'
  },
  nivel: {
    type: DataTypes.ENUM('baby_titans','1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos'),
    allowNull: false,
    defaultValue: 'todos',
    validate: {
      notNull: {
        msg: 'El nivel es requerido'
      },
      isIn: {
        args: [['baby_titans','1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos']],
        msg: 'Nivel inválido'
      }
    },
    comment: 'Nivel al que aplica el evento'
  },
  grupo_competitivo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'Grupo competitivo específico. Null = para todos los grupos',
    set(value) {
      if (value) {
        const normalized = value.toLowerCase().replace(/\s+/g, '_');
        this.setDataValue('grupo_competitivo', normalized);
      } else {
        this.setDataValue('grupo_competitivo', null);
      }
    },
    get() {
      const rawValue = this.getDataValue('grupo_competitivo');
      if (!rawValue) return null;
      
      return rawValue.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  },
  tipo: {
    type: DataTypes.ENUM('competencia', 'entrenamiento', 'evaluacion', 'festivo', 'general', 'otro'),
    defaultValue: 'general',
    allowNull: false,
    comment: 'Tipo de evento'
  },
  tipo_personalizado: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo personalizado cuando tipo = "otro"'
  },
  entrenador_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
      fields: ['grupo_competitivo']
    },
    {
      fields: ['tipo']
    },
    {
      fields: ['entrenador_id']
    }
  ],
  hooks: {
    beforeUpdate: (evento) => {
      evento.updatedAt = new Date();
    }
  }
});

// Asociaciones
CalendarioEvento.associate = function(models) {
  CalendarioEvento.belongsTo(models.User, {
    foreignKey: 'entrenador_id',
    as: 'entrenador'
  });
};

module.exports = CalendarioEvento;