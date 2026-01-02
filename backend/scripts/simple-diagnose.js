// backend/scripts/simple-diagnose.js
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO SIMPLE DEL SISTEMA\n');

// 1. Verificar archivos clave
console.log('1️⃣ VERIFICANDO ARCHIVOS CLAVE:');

const keyFiles = [
  { path: 'src/models/Deportista.js', name: 'Modelo Deportista' },
  { path: 'src/models/User.js', name: 'Modelo User' },
  { path: 'src/config/database.js', name: 'Configuración DB' },
  { path: 'src/controllers/deportistaController.js', name: 'Controlador Deportistas' },
  { path: 'src/index.js', name: 'Archivo principal' }
];

keyFiles.forEach(fileInfo => {
  const fullPath = path.join(process.cwd(), fileInfo.path);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`   ✅ ${fileInfo.name}: ${fileInfo.path} (${stats.size} bytes)`);
    
    // Leer primeras líneas
    if (fileInfo.path.includes('Deportista.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log('      📋 Columnas definidas:');
      const columnLines = content.split('\n').filter(line => line.includes(': {'));
      columnLines.forEach(line => {
        const colName = line.trim().split(':')[0];
        console.log(`         - ${colName}`);
      });
    }
  } else {
    console.log(`   ❌ ${fileInfo.name}: NO ENCONTRADO`);
  }
});

// 2. Verificar package.json
console.log('\n2️⃣ VERIFICANDO PACKAGE.JSON:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`   ✅ Nombre: ${packageJson.name}`);
  console.log(`   ✅ Versión: ${packageJson.version}`);
  console.log(`   ✅ Dependencias principales:`);
  console.log(`      - sequelize: ${packageJson.dependencies?.sequelize || 'No encontrada'}`);
  console.log(`      - express: ${packageJson.dependencies?.express || 'No encontrada'}`);
  console.log(`      - pg: ${packageJson.dependencies?.pg || 'No encontrada'}`);
}

// 3. Verificar estructura DB desde archivo de configuración
console.log('\n3️⃣ INTENTANDO CONECTAR A LA BASE DE DATOS:');
try {
  // Intenta cargar la configuración de database.js
  const dbConfigPath = path.join(process.cwd(), 'src', 'config', 'database.js');
  if (fs.existsSync(dbConfigPath)) {
    console.log('   ✅ Configuración DB encontrada');
    
    // Leer el archivo para mostrar info básica
    const dbContent = fs.readFileSync(dbConfigPath, 'utf8');
    if (dbContent.includes('localhost')) console.log('   📍 Host: localhost');
    if (dbContent.includes('5432')) console.log('   🔌 Puerto: 5432');
    
    // Intentar cargar y conectar
    const { sequelize } = require(dbConfigPath);
    
    (async () => {
      try {
        await sequelize.authenticate();
        console.log('   ✅ Conexión a PostgreSQL: EXITOSA');
        
        // Verificar tabla deportistas
        const [results] = await sequelize.query(`
          SELECT COUNT(*) as total FROM deportistas;
        `);
        console.log(`   📊 Total deportistas en DB: ${results[0].total}`);
        
        // Verificar estructura
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'deportistas'
          ORDER BY ordinal_position;
        `);
        console.log(`   🏗️  Columnas en tabla deportistas: ${columns.length}`);
        columns.slice(0, 5).forEach(col => {
          console.log(`      - ${col.column_name}: ${col.data_type}`);
        });
        if (columns.length > 5) {
          console.log(`      ... y ${columns.length - 5} más`);
        }
        
        await sequelize.close();
        
      } catch (dbError) {
        console.log(`   ❌ Error de conexión: ${dbError.message}`);
      }
    })();
    
  } else {
    console.log('   ❌ Configuración DB no encontrada');
  }
} catch (error) {
  console.log(`   ⚠️  No se pudo verificar conexión: ${error.message}`);
}

console.log('\n🎯 RECOMENDACIONES:');
console.log('1. Si el modelo Deportista.js tiene columnas obsoletas, corrígelo manualmente');
console.log('2. Reinicia el servidor backend después de los cambios');
console.log('3. Prueba crear un deportista con curl o desde el frontend');