// backend/scripts/find-structure.js
const fs = require('fs');
const path = require('path');

console.log('🔍 ANALIZANDO ESTRUCTURA DEL PROYECTO\n');
console.log('📂 Directorio actual:', process.cwd());

// Función para listar directorios y archivos
function listDir(dir, prefix = '', depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return;
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dir, item.name);
      console.log(prefix + (item.isDirectory() ? '📁 ' : '📄 ') + item.name);
      
      if (item.isDirectory() && 
          !item.name.startsWith('.') && 
          !item.name.includes('node_modules') &&
          item.name !== 'dist' &&
          item.name !== 'build') {
        listDir(itemPath, prefix + '  ', depth + 1, maxDepth);
      }
    }
  } catch (error) {
    console.log(prefix + '❌ No se puede acceder:', error.message);
  }
}

// Listar estructura principal
console.log('\n📋 ESTRUCTURA DEL PROYECTO:');
listDir(process.cwd());

// Buscar archivos clave específicos
console.log('\n🔍 BUSCANDO ARCHIVOS CLAVE:');
const keyFiles = [
  'deportista.js',
  'user.js',
  'config/database.js',
  'package.json',
  'app.js',
  'index.js',
  'server.js'
];

function findFile(startDir, filename) {
  try {
    const files = fs.readdirSync(startDir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(startDir, file.name);
      if (file.isDirectory() && 
          !file.name.startsWith('.') && 
          !file.name.includes('node_modules')) {
        const found = findFile(fullPath, filename);
        if (found) return found;
      } else if (file.name === filename) {
        return fullPath;
      }
    }
  } catch (error) {
    // Ignorar errores
  }
  return null;
}

keyFiles.forEach(filename => {
  const found = findFile(process.cwd(), filename);
  if (found) {
    console.log(`✅ ${filename}: ${path.relative(process.cwd(), found)}`);
  } else {
    console.log(`❌ ${filename}: No encontrado`);
  }
});

// Buscar archivos .js en directorios importantes
console.log('\n📂 ARCHIVOS .js EN DIRECTORIOS IMPORTANTES:');
const importantDirs = ['src', 'models', 'controllers', 'config', 'routes'];
importantDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`\n📁 ${dir}:`);
    try {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        if (file.endsWith('.js')) {
          console.log(`  📄 ${file}`);
        }
      });
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
});

console.log('\n🎯 RECOMENDACIONES:');
console.log('1. Comparte la salida de este script');
console.log('2. O comparte la ubicación exacta de:');
console.log('   - deportista.js');
console.log('   - config/database.js');
console.log('   - Tu archivo principal del servidor');