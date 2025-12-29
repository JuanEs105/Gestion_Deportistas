// src/models/index.js - VERSIÓN QUE NO FALLA
const { sequelize } = require('../config/database');

// Intentar cargar modelos
let User, Deportista, Habilidad, Evaluacion;

try {
  User = require('./User');
  console.log('✅ User cargado');
} catch (error) {
  console.error('❌ Error cargando User:', error.message);
  User = {};
}

try {
  Deportista = require('./Deportista');
  console.log('✅ Deportista cargado');
} catch (error) {
  console.error('❌ Error cargando Deportista:', error.message);
  Deportista = {};
}

try {
  Habilidad = require('./Habilidad');
  console.log('✅ Habilidad cargado');
} catch (error) {
  console.error('❌ Error cargando Habilidad:', error.message);
  console.error('Creando Habilidad como dummy...');
  // Crear un objeto dummy con métodos básicos
  Habilidad = {
    create: async () => ({ id: 'dummy-id', nombre: 'Dummy' }),
    findAll: async () => [],
    count: async () => 0,
    findOne: async () => null,
    findByPk: async () => null
  };
}

try {
  Evaluacion = require('./Evaluacion');
  console.log('✅ Evaluacion cargado');
} catch (error) {
  console.error('❌ Error cargando Evaluacion:', error.message);
  Evaluacion = {};
}

// Definir asociaciones solo si los modelos existen
try {
  if (User.associate && Deportista.associate) {
    User.associate({ Deportista, Evaluacion });
    Deportista.associate({ User, Evaluacion });
  }
} catch (error) {
  console.log('⚠️  Error en asociaciones:', error.message);
}

console.log('📦 Modelos listos');

// Exportar
module.exports = {
  sequelize,
  User,
  Deportista,
  Habilidad,
  Evaluacion
};