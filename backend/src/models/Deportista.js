const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); 

const Deportista = sequelize.define('Deportista', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  altura: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0.5,
      max: 2.5
    }
  },
  peso: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 20,
      max: 200
    }
  },
  posicion: {
    type: DataTypes.ENUM('delantero', 'defensa', 'portero', 'medio', 'basico', 'avanzado'),
    allowNull: true
  },
  grupo: {
    type: DataTypes.ENUM('élite', 'intermedio', 'principiante'),
    defaultValue: 'principiante'
  },
  nivel_actual: {
    type: DataTypes.ENUM('básico', 'medio', 'avanzado'),
    defaultValue: 'básico'
  },
  estado: {
    type: DataTypes.ENUM('activo', 'lesionado', 'descanso', 'inactivo'),
    defaultValue: 'activo'
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contacto_emergencia_nombre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contacto_emergencia_telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contacto_emergencia_parentesco: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'deportistas',
  timestamps: true
});

// Asociaciones
Deportista.associate = function(models) {
  Deportista.belongsTo(models.User, {
    foreignKey: 'user_id'
  });
  
  Deportista.hasMany(models.Evaluacion, {
    foreignKey: 'deportista_id',
    as: 'evaluaciones'
  });
};

module.exports = Deportista;