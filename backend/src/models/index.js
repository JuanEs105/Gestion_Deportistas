// backend/src/models/index.js - ACTUALIZADO
const { sequelize } = require('../config/database');

// Cargar modelos
const User = require('./User');
const Deportista = require('./Deportista');
const Habilidad = require('./Habilidad');
const Evaluacion = require('./Evaluacion');
const HistorialNivel = require('./HistorialNivel');

console.log('✅ User cargado');
console.log('✅ Deportista cargado');
console.log('✅ Habilidad cargado');
console.log('✅ Evaluacion cargado');
console.log('✅ HistorialNivel cargado');

// Objeto con todos los modelos
const models = {
  User,
  Deportista,
  Habilidad,
  Evaluacion,
  HistorialNivel
};

// Ejecutar asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

console.log('📦 Modelos listos y asociados');

// Exportar
module.exports = {
  sequelize,
  User,
  Deportista,
  Habilidad,
  Evaluacion,
  HistorialNivel
};