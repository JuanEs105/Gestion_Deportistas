// Script para importar habilidades a Railway
const { Habilidad } = require('./src/models');
const habilidadesData = require('./habilidades-data');

async function importarHabilidades() {
  try {
    console.log('🚀 Iniciando importación de habilidades...');
    console.log(`📊 Total de habilidades a importar: ${habilidadesData.length}`);
    
    // Crear todas las habilidades
    await Habilidad.bulkCreate(habilidadesData, {
      ignoreDuplicates: true // Por si algunas ya existen
    });
    
    console.log('✅ Habilidades importadas exitosamente');
    
    // Mostrar resumen por nivel
    const niveles = ['1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
    
    console.log('\n📋 Resumen por nivel:');
    for (const nivel of niveles) {
      const count = habilidadesData.filter(h => h.nivel === nivel).length;
      const nombreNivel = {
        '1_basico': 'Nivel 1 Básico',
        '1_medio': 'Nivel 1 Medio',
        '1_avanzado': 'Nivel 1 Avanzado',
        '2': 'Nivel 2',
        '3': 'Nivel 3',
        '4': 'Nivel 4'
      }[nivel];
      console.log(`   ${nombreNivel}: ${count} habilidades`);
    }
    
    console.log('\n📋 Resumen por categoría:');
    const categorias = ['habilidad', 'ejercicio_accesorio', 'postura'];
    for (const categoria of categorias) {
      const count = habilidadesData.filter(h => h.categoria === categoria).length;
      const nombreCategoria = {
        'habilidad': 'Habilidades',
        'ejercicio_accesorio': 'Ejercicios Accesorios',
        'postura': 'Posturas'
      }[categoria];
      console.log(`   ${nombreCategoria}: ${count}`);
    }
    
    console.log('\n🎉 Importación completada con éxito');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error importando habilidades:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importarHabilidades();
