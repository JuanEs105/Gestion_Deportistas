// backend/scripts/test-evaluation-system.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let entrenadorToken = '';
let deportistaId = '';
let habilidadId = '';

const log = (emoji, message) => console.log(`${emoji} ${message}`);

async function testEvaluationSystem() {
  try {
    log('🚀', 'Iniciando pruebas del sistema de evaluación...\n');

    // 1. Login como entrenador
    log('1️⃣', 'Login como entrenador...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'entrenador@deportes.com',
      password: 'password123'
    });
    
    entrenadorToken = loginRes.data.token;
    log('✅', `Token obtenido: ${entrenadorToken.substring(0, 20)}...`);

    // 2. Obtener lista de deportistas
    log('\n2️⃣', 'Obteniendo lista de deportistas...');
    const deportistasRes = await axios.get(`${API_URL}/deportistas`, {
      headers: { Authorization: `Bearer ${entrenadorToken}` }
    });
    
    if (deportistasRes.data.length === 0) {
      log('❌', 'No hay deportistas en la BD');
      return;
    }
    
    deportistaId = deportistasRes.data[0].id;
    const deportistaNombre = deportistasRes.data[0].User?.nombre || 'Deportista';
    log('✅', `Deportista seleccionado: ${deportistaNombre} (${deportistaId})`);

    // 3. Obtener habilidades del nivel básico
    log('\n3️⃣', 'Obteniendo habilidades del nivel 1_basico...');
    const habilidadesRes = await axios.get(`${API_URL}/habilidades/nivel/1_basico`, {
      headers: { Authorization: `Bearer ${entrenadorToken}` }
    });
    
    log('✅', `${habilidadesRes.data.total} habilidades encontradas`);
    log('📊', 'Por categoría:');
    Object.entries(habilidadesRes.data.por_categoria).forEach(([cat, habs]) => {
      log('  ', `${cat}: ${habs.length} habilidades`);
    });

    habilidadId = habilidadesRes.data.habilidades[0].id;
    const habilidadNombre = habilidadesRes.data.habilidades[0].nombre;
    log('✅', `Habilidad seleccionada: ${habilidadNombre}`);

    // 4. Crear primera evaluación (puntuación baja)
    log('\n4️⃣', 'Creando primera evaluación (puntuación: 5/10)...');
    const eval1 = await axios.post(`${API_URL}/evaluaciones`, {
      deportista_id: deportistaId,
      habilidad_id: habilidadId,
      puntuacion: 5,
      observaciones: 'Primera evaluación - Necesita mejorar postura'
    }, {
      headers: { Authorization: `Bearer ${entrenadorToken}` }
    });
    
    log('✅', `Evaluación creada - Completada: ${eval1.data.evaluacion.completado}`);

    // 5. Crear segunda evaluación (puntuación alta)
    log('\n5️⃣', 'Creando segunda evaluación (puntuación: 8/10)...');
    const eval2 = await axios.post(`${API_URL}/evaluaciones`, {
      deportista_id: deportistaId,
      habilidad_id: habilidadId,
      puntuacion: 8,
      observaciones: 'Segunda evaluación - Excelente mejora!'
    }, {
      headers: { Authorization: `Bearer ${entrenadorToken}` }
    });
    
    log('✅', `Evaluación creada - Completada: ${eval2.data.evaluacion.completado}`);

    // 6. Ver historial de la habilidad
    log('\n6️⃣', 'Consultando historial de la habilidad...');
    const historialRes = await axios.get(
      `${API_URL}/evaluaciones/historial/${deportistaId}/${habilidadId}`,
      { headers: { Authorization: `Bearer ${entrenadorToken}` } }
    );
    
    log('✅', `Historial obtenido:`);
    log('  ', `Total intentos: ${historialRes.data.estadisticas.total_intentos}`);
    log('  ', `Mejor puntuación: ${historialRes.data.estadisticas.mejor_puntuacion}/10`);
    log('  ', `Mejoría: +${historialRes.data.estadisticas.mejoria} puntos`);
    log('  ', `Completada: ${historialRes.data.estadisticas.completada ? 'Sí ✅' : 'No ❌'}`);

    // 7. Ver progreso del deportista
    log('\n7️⃣', 'Consultando progreso del deportista...');
    const progresoRes = await axios.get(
      `${API_URL}/evaluaciones/progreso/${deportistaId}`,
      { headers: { Authorization: `Bearer ${entrenadorToken}` } }
    );
    
    log('✅', `Progreso obtenido:`);
    log('  ', `Nivel actual: ${progresoRes.data.nivel_actual}`);
    log('  ', `Progreso total: ${progresoRes.data.progreso_total.porcentaje}%`);
    log('  ', `Completadas: ${progresoRes.data.progreso_total.completadas}/${progresoRes.data.progreso_total.total}`);
    log('  ', `Faltantes: ${progresoRes.data.progreso_total.faltantes}`);
    
    log('\n📊', 'Progreso por categoría:');
    Object.entries(progresoRes.data.progreso_por_categoria).forEach(([cat, prog]) => {
      log('  ', `${cat}: ${prog.porcentaje}% (${prog.completadas}/${prog.total})`);
    });
    
    if (progresoRes.data.cambio_nivel_pendiente) {
      log('🎯', `¡Cambio de nivel pendiente! Sugerido: ${progresoRes.data.nivel_sugerido}`);
    }

    // 8. Evaluar todas las habilidades del nivel (para probar cambio de nivel)
    log('\n8️⃣', 'Evaluando todas las habilidades del nivel básico...');
    const todasHabilidades = habilidadesRes.data.habilidades.slice(0, 5); // Solo las primeras 5 para probar
    
    for (const hab of todasHabilidades) {
      await axios.post(`${API_URL}/evaluaciones`, {
        deportista_id: deportistaId,
        habilidad_id: hab.id,
        puntuacion: 8,
        observaciones: 'Evaluación de prueba'
      }, {
        headers: { Authorization: `Bearer ${entrenadorToken}` }
      });
      log('  ', `✅ ${hab.nombre} - 8/10`);
    }

    // 9. Ver deportistas con cambio pendiente
    log('\n9️⃣', 'Consultando deportistas con cambio de nivel pendiente...');
    const pendientesRes = await axios.get(
      `${API_URL}/evaluaciones/pendientes`,
      { headers: { Authorization: `Bearer ${entrenadorToken}` } }
    );
    
    log('✅', `Deportistas con cambio pendiente: ${pendientesRes.data.total}`);
    
    if (pendientesRes.data.total > 0) {
      pendientesRes.data.deportistas.forEach(d => {
        log('  ', `- ${d.User.nombre}: ${d.nivel_actual} → ${d.nivel_sugerido}`);
      });
    }

    log('\n🎉', '¡Todas las pruebas completadas exitosamente!');
    log('📌', 'Sistema de evaluación funcionando correctamente');

  } catch (error) {
    log('❌', 'Error en las pruebas:');
    if (error.response) {
      log('  ', `Status: ${error.response.status}`);
      log('  ', `Error: ${error.response.data.error || error.response.data.message}`);
    } else {
      log('  ', error.message);
    }
  }
}

testEvaluationSystem();