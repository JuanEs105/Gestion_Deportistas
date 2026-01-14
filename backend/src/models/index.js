// backend/src/models/index.js - ACTUALIZADO
const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');

console.log('🔗 Inicializando modelos...');

// Cargar modelos base (obligatorios)
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

// Intentar cargar modelos opcionales
let CalendarioEvento, Notificacion;

try {
  CalendarioEvento = require('./CalendarioEvento');
  console.log('✅ CalendarioEvento cargado');
} catch (error) {
  console.log('⚠️  CalendarioEvento no encontrado, continuando sin él');
  CalendarioEvento = null;
}

try {
  Notificacion = require('./Notificacion');
  console.log('✅ Notificacion cargado');
} catch (error) {
  console.log('⚠️  Notificacion no encontrado, continuando sin él');
  Notificacion = null;
}

// Objeto con todos los modelos
const models = {
  User,
  Deportista,
  Habilidad,
  Evaluacion,
  HistorialNivel
};

// Agregar modelos opcionales si existen
if (CalendarioEvento) {
  models.CalendarioEvento = CalendarioEvento;
}

if (Notificacion) {
  models.Notificacion = Notificacion;
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

// Crear objeto db para compatibilidad
const db = {
  sequelize,
  Sequelize,
  User,
  Deportista,
  Habilidad,
  Evaluacion,
  HistorialNivel
};

// Agregar modelos opcionales si existen
if (CalendarioEvento) {
  db.CalendarioEvento = CalendarioEvento;
}

if (Notificacion) {
  db.Notificacion = Notificacion;
}

module.exports = db;