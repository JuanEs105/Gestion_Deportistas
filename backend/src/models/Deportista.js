// backend/src/models/Deportista.js - CON EQUIPOS DE COMPETENCIA
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
  ciudad_nacimiento: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ciudad de nacimiento'
  },
  altura: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Altura en metros (ej: 1.65)'
  },
  peso: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Peso en kilogramos (ej: 55.5)'
  },
  nivel_deportivo: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nivel deportivo general (ej: Intermedio)'
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Dirección de residencia'
  },
  eps: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'EPS o sistema de salud'
  },
  talla_camiseta: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Talla de camiseta (S, M, L, XL, etc)'
  },

  // ==========================================
  // NIVELES (SISTEMA ORIGINAL + BABY TITANS)
  // ==========================================
  nivel_actual: {
    type: DataTypes.ENUM(
      'pendiente',
      'baby_titans',     // ✅ NUEVO NIVEL
      '1_basico',
      '1_medio',
      '1_avanzado',
      '2',
      '3',
      '4'
    ),
    defaultValue: 'pendiente',
    allowNull: false,
    comment: 'Nivel actual del deportista'
  },
  nivel_sugerido: {
    type: DataTypes.ENUM(
      'baby_titans',     // ✅ NUEVO NIVEL
      '1_basico',
      '1_medio',
      '1_avanzado',
      '2',
      '3',
      '4'
    ),
    allowNull: true,
    comment: 'Siguiente nivel sugerido cuando completa el 100%'
  },

  // ==========================================
  // EQUIPOS DE COMPETENCIA (NUEVO SISTEMA)
  // ==========================================
  equipo_competitivo: {
    type: DataTypes.ENUM(
      'sin_equipo',           // Por defecto
      'rocks_titans',
      'lightning_titans',
      'storm_titans',
      'fire_titans',
      'electric_titans'
    ),
    defaultValue: 'sin_equipo',
    allowNull: false,
    comment: 'Equipo de competencia asignado (independiente del nivel)'
  },

  cambio_nivel_pendiente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si hay un cambio de nivel pendiente de aprobación'
  },
  fecha_ultimo_cambio_nivel: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del último cambio de nivel aprobado'
  },
  // ✅ DESPUÉS
  estado: {
    type: DataTypes.ENUM('activo', 'pendiente', 'pendiente_de_pago', 'inactivo', 'lesionado', 'descanso'),
    defaultValue: 'activo',
    allowNull: false
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  documento_identidad: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL del documento de identidad en PDF (Cloudinary)'
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
  },

  acepta_terminos: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si aceptó términos y condiciones (sincronizado con User)'
  }
}, {
  tableName: 'deportistas',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Deportista.associate = function (models) {
  Deportista.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  Deportista.hasMany(models.Evaluacion, {
    foreignKey: 'deportista_id',
    as: 'evaluaciones'
  });
};

module.exports = Deportista;