// backend/src/models/index.js - VERSIÓN FINAL Y COMPLETA
const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');

console.log('🔗 Inicializando modelos...');

// Cargar modelos
const User = require('./User');
const Deportista = require('./Deportista');
const Habilidad = require('./Habilidad');
const Evaluacion = require('./Evaluacion');
const HistorialNivel = require('./HistorialNivel');

// Intentar cargar CalendarioEvento (puede no existir todavía)
let CalendarioEvento;
try {
  CalendarioEvento = require('./CalendarioEvento');
  console.log('✅ CalendarioEvento cargado');
} catch (error) {
  console.log('⚠️  CalendarioEvento no encontrado, continuando sin él');
  console.log('   Para usar el calendario, crea el archivo: backend/src/models/CalendarioEvento.js');
  CalendarioEvento = null;
}

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

// Agregar CalendarioEvento si existe
if (CalendarioEvento) {
  models.CalendarioEvento = CalendarioEvento;
}

// Ejecutar asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName] && typeof models[modelName].associate === 'function') {
    try {
      models[modelName].associate(models);
      console.log(`✅ Asociaciones para ${modelName} configuradas`);
    } catch (error) {
      console.error(`❌ Error en asociaciones para ${modelName}:`, error.message);
    }
  }
});

console.log('📦 Modelos listos y asociados');

// Crear objeto db para compatibilidad con código existente
const db = {
  sequelize,
  Sequelize,
  User,
  Deportista,
  Habilidad,
  Evaluacion,
  HistorialNivel
};

// Agregar CalendarioEvento si existe
if (CalendarioEvento) {
  db.CalendarioEvento = CalendarioEvento;
}

// Exportar de ambas formas para compatibilidad
module.exports = db;