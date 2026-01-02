// backend/scripts/clean-deportista-model.js
const fs = require('fs');
const path = require('path');

const modelPath = path.join(__dirname, '../models/deportista.js');

// Lee el archivo actual
let content = fs.readFileSync(modelPath, 'utf8');

// Elimina las columnas que no existen en la DB
const columnsToRemove = [
  'nivel_sugerido',
  'cambio_nivel_pendiente', 
  'fecha_ultimo_cambio_nivel',
  
];

columnsToRemove.forEach(column => {
  const regex = new RegExp(`\\s+${column}: \\{[^}]+\\},?\\n`, 'g');
  content = content.replace(regex, '');
});

// Asegúrate de que los timestamps estén correctos
content = content.replace(
  /}, \{\s*tableName: 'deportistas',/,
  `}, {
  tableName: 'deportistas',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',`
);

// Escribe el archivo corregido
fs.writeFileSync(modelPath, content, 'utf8');
console.log('✅ Modelo Deportista limpiado');
console.log('❌ Columnas eliminadas:', columnsToRemove.join(', '));