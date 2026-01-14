// backend/test-reportes.js - Script de prueba
// Ejecuta este archivo para verificar que el controlador se carga correctamente

console.log('🧪 Probando carga del controlador de reportes...\n');

try {
  // Intentar cargar el controlador
  const ReportesController = require('./src/controllers/reportesController');
  
  console.log('✅ Controlador cargado exitosamente\n');
  
  // Verificar que todas las funciones existen
  const funcionesRequeridas = [
    'generarExcelConFiltros',
    'generarPDFDeportista',
    'generarPDFProgresoNivel',
    'descargarDocumentoPDF',
    'obtenerEstadisticasFiltros'
  ];
  
  console.log('🔍 Verificando funciones:\n');
  
  let todasExisten = true;
  
  funcionesRequeridas.forEach(nombreFuncion => {
    if (typeof ReportesController[nombreFuncion] === 'function') {
      console.log(`   ✅ ${nombreFuncion} - Encontrada`);
    } else {
      console.log(`   ❌ ${nombreFuncion} - NO ENCONTRADA`);
      todasExisten = false;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (todasExisten) {
    console.log('✅ TODAS LAS FUNCIONES EXISTEN - CONTROLADOR OK');
  } else {
    console.log('❌ FALTAN FUNCIONES - REVISAR CONTROLADOR');
  }
  
  console.log('='.repeat(60) + '\n');
  
} catch (error) {
  console.error('❌ Error cargando el controlador:\n');
  console.error(error.message);
  console.error('\n📋 Stack trace:');
  console.error(error.stack);
}

// Probar carga de rutas
console.log('\n🧪 Probando carga de rutas...\n');

try {
  const reportesRoutes = require('./src/routes/reportesRoutes');
  console.log('✅ Rutas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas:\n');
  console.error(error.message);
}