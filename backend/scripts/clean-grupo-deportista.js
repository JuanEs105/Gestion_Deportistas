// backend/scripts/clean-grupo-deportista.js
const fs = require('fs');
const path = require('path');

const modelPath = path.join(__dirname, '../src/models/Deportista.js');

if (!fs.existsSync(modelPath)) {
  console.error('❌ No se encontró el archivo Deportista.js');
  process.exit(1);
}

let content = fs.readFileSync(modelPath, 'utf8');

// Eliminar cualquier rastro de "grupo"
const patternsToRemove = [
  /grupo\s*:\s*\{[\s\S]*?\},?\n/g,
  /'grupo',?\s*/g,
  /grupo,\s*/g
];

patternsToRemove.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Guardar archivo limpio
fs.writeFileSync(modelPath, content, 'utf8');

console.log('✅ Modelo Deportista limpiado correctamente');
console.log('🧹 Campo "grupo" eliminado por completo');
