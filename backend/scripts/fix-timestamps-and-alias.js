// backend/scripts/fix-timestamps-and-alias.js
const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGIENDO TIMESTAMPS Y ALIAS\n');

// 1. Corregir Deportista.js
const deportistaPath = path.join(__dirname, '..', 'src', 'models', 'Deportista.js');
let deportistaContent = fs.readFileSync(deportistaPath, 'utf8');

// Asegurar timestamps
if (!deportistaContent.includes("createdAt: 'created_at'")) {
  deportistaContent = deportistaContent.replace(
    /tableName: 'deportistas',/,
    `tableName: 'deportistas',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',`
  );
  fs.writeFileSync(deportistaPath, deportistaContent, 'utf8');
  console.log('✅ Deportista.js: timestamps corregidos');
}

// 2. Corregir deportistaController.js
const controllerPath = path.join(__dirname, '..', 'src', 'controllers', 'deportistaController.js');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Reemplazar createdAt por created_at en order
controllerContent = controllerContent.replace(
  /order: \[\['createdAt', 'DESC'\]\]/g,
  "order: [['created_at', 'DESC']]"
);

// Asegurar que todos los include tengan el alias 'User'
controllerContent = controllerContent.replace(
  /include: \[\{\s*model: User\s*\}\]/g,
  "include: [{ model: User, as: 'User' }]"
);

fs.writeFileSync(controllerPath, controllerContent, 'utf8');
console.log('✅ deportistaController.js: corregido');

console.log('\n🎯 REINICIA EL SERVIDOR Y PRUEBA DE NUEVO');