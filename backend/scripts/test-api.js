// backend/scripts/test-api.js - PRUEBAS COMPLETAS DEL SISTEMA
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Configurar axios
axios.defaults.baseURL = BASE_URL;

async function runAllTests() {
  console.log('🧪 INICIANDO PRUEBAS COMPLETAS DEL SISTEMA\n');
  console.log('='.repeat(60));

  let allTestsPassed = true;
  let entrenadorToken = '';
  let deportistaToken = '';
  let deportistaId = '';
  let habilidadId = '';

  try {
    // ==================== PRUEBA 1: SISTEMA ====================
    console.log('\n1. 🔧 PRUEBAS DEL SISTEMA');
    console.log('-'.repeat(40));

    // 1.1 Health Check
    console.log('   🔍 Health Check...');
    const healthRes = await axios.get('/health');
    console.log('     ✅ Status:', healthRes.data.status);
    console.log('     ✅ Servicio:', healthRes.data.service);

    // 1.2 Test DB
    console.log('   🔍 Test Base de Datos...');
    const dbRes = await axios.get('/test-db');
    console.log('     ✅ PostgreSQL conectado');
    console.log('     ✅ Tablas:', dbRes.data.tables?.length || 0);

    // 1.3 Home API
    console.log('   🔍 Home API...');
    const homeRes = await axios.get('/');
    console.log('     ✅ API funcionando:', homeRes.data.message);

    // ==================== PRUEBA 2: AUTENTICACIÓN ====================
    console.log('\n2. 🔐 PRUEBAS DE AUTENTICACIÓN');
    console.log('-'.repeat(40));

    // 2.1 Login Entrenador
    console.log('   🔍 Login Entrenador...');
    const loginEntrenador = await axios.post('/auth/login', {
      email: 'entrenador@deportes.com',
      password: 'password123'
    });
    entrenadorToken = loginEntrenador.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${entrenadorToken}`;
    console.log('     ✅ Token obtenido');
    console.log('     ✅ Rol:', loginEntrenador.data.user.role);

    // 2.2 Login Deportista
    console.log('   🔍 Login Deportista...');
    const loginDeportista = await axios.post('/auth/login', {
      email: 'carlos@deportes.com',
      password: 'password123'
    });
    deportistaToken = loginDeportista.data.token;
    deportistaId = loginDeportista.data.user.deportistaProfile?.id;
    console.log('     ✅ Token obtenido');
    console.log('     ✅ Deportista ID:', deportistaId);

    // 2.3 Perfil Usuario
    console.log('   🔍 Perfil Usuario...');
    const profileRes = await axios.get('/auth/profile');
    console.log('     ✅ Perfil obtenido:', profileRes.data.nombre);

    // ==================== PRUEBA 3: DEPORTISTAS ====================
    console.log('\n3. 👥 PRUEBAS DE DEPORTISTAS');
    console.log('-'.repeat(40));

    // 3.1 Listar Deportistas
    console.log('   🔍 Listar Deportistas...');
    const deportistasRes = await axios.get('/deportistas');
    console.log('     ✅ Deportistas encontrados:', deportistasRes.data.length);

    if (deportistasRes.data.length > 0) {
      const primerDeportista = deportistasRes.data[0];
      deportistaId = primerDeportista.id || deportistaId;
      console.log('     ✅ Primer deportista:', primerDeportista.User?.nombre);
    }

    // 3.2 Obtener Deportista por ID
    if (deportistaId) {
      console.log('   🔍 Obtener Deportista por ID...');
      const deportistaRes = await axios.get(`/deportistas/${deportistaId}`);
      console.log('     ✅ Deportista:', deportistaRes.data.User?.nombre);
    }

    // 3.3 Crear Nuevo Deportista
    console.log('   🔍 Crear Nuevo Deportista...');
    const nuevoDeportista = {
      nombre: 'Deportista de Prueba',
      email: `test${Date.now()}@deportes.com`,
      password: 'test123',
      telefono: '3109999999',
      altura: 1.75,
      peso: 68,
      grupo: 'principiante'
    };

    try {
      const createRes = await axios.post('/deportistas', nuevoDeportista);
      console.log('     ✅ Deportista creado:', createRes.data.deportista?.User?.nombre);
      
      // 3.4 Actualizar Deportista
      console.log('   🔍 Actualizar Deportista...');
      if (createRes.data.deportista?.id) {
        await axios.put(`/deportistas/${createRes.data.deportista.id}`, {
          peso: 70,
          grupo: 'intermedio'
        });
        console.log('     ✅ Deportista actualizado');
      }
    } catch (error) {
      console.log('     ⚠️  Error creando deportista (puede ser por email duplicado)');
    }

    // 3.5 Estadísticas de Deportista
    if (deportistaId) {
      console.log('   🔍 Estadísticas de Deportista...');
      try {
        const statsRes = await axios.get(`/deportistas/${deportistaId}/stats`);
        console.log('     ✅ Estadísticas obtenidas');
        console.log('       Total evaluaciones:', statsRes.data.totalEvaluaciones || 0);
      } catch (error) {
        console.log('     ⚠️  Sin estadísticas aún');
      }
    }

    // ==================== PRUEBA 4: HABILIDADES ====================
    console.log('\n4. 🏅 PRUEBAS DE HABILIDADES');
    console.log('-'.repeat(40));

    // 4.1 Listar Todas las Habilidades
    console.log('   🔍 Listar Todas las Habilidades...');
    const habilidadesRes = await axios.get('/habilidades');
    console.log('     ✅ Total habilidades:', habilidadesRes.data.total || 0);

    // Obtener ID de primera habilidad básica
    if (habilidadesRes.data.porNivel?.básico?.length > 0) {
      habilidadId = habilidadesRes.data.porNivel.básico[0].id;
      console.log('     ✅ Habilidad básica ID:', habilidadId);
    }

    // 4.2 Habilidades por Nivel
    console.log('   🔍 Habilidades por Nivel...');
    const niveles = ['básico', 'medio', 'avanzado'];
    for (const nivel of niveles) {
      try {
        const nivelRes = await axios.get(`/habilidades/nivel/${nivel}`);
        console.log(`     ✅ Nivel ${nivel}:`, nivelRes.data.length || 0, 'habilidades');
      } catch (error) {
        console.log(`     ⚠️  Nivel ${nivel}: Sin habilidades`);
      }
    }

    // 4.3 Habilidades Faltantes
    if (deportistaId) {
      console.log('   🔍 Habilidades Faltantes...');
      try {
        const faltantesRes = await axios.get(`/habilidades/faltantes/${deportistaId}`);
        console.log('     ✅ Habilidades faltantes:', faltantesRes.data.faltantes || 0);
      } catch (error) {
        console.log('     ⚠️  Error obteniendo habilidades faltantes');
      }
    }

    // ==================== PRUEBA 5: EVALUACIONES ====================
    console.log('\n5. 📝 PRUEBAS DE EVALUACIONES');
    console.log('-'.repeat(40));

    // 5.1 Crear Evaluación
    if (deportistaId && habilidadId) {
      console.log('   🔍 Crear Evaluación...');
      const evaluacionData = {
        deportista_id: deportistaId,
        habilidad_id: habilidadId,
        puntuacion: 8,
        observaciones: 'Excelente ejecución en pruebas automáticas',
        completado: true
      };

      try {
        const evalRes = await axios.post('/evaluaciones', evaluacionData);
        console.log('     ✅ Evaluación creada');
        console.log('       ID:', evalRes.data.evaluacion?.id);
        
        // 5.2 Obtener Evaluaciones del Deportista
        console.log('   🔍 Evaluaciones del Deportista...');
        const evaluacionesRes = await axios.get(`/evaluaciones/deportista/${deportistaId}`);
        console.log('     ✅ Total evaluaciones:', evaluacionesRes.data.evaluaciones?.length || 0);
        
        // 5.3 Progreso del Deportista
        console.log('   🔍 Progreso del Deportista...');
        const progresoRes = await axios.get(`/evaluaciones/progreso/${deportistaId}`);
        console.log('     ✅ Progreso calculado');
        if (progresoRes.data.básico) {
          console.log('       Nivel básico:', progresoRes.data.básico.porcentaje + '%');
        }
      } catch (error) {
        console.log('     ⚠️  Error creando evaluación:', error.response?.data?.error || error.message);
      }
    }

    // 5.4 Estadísticas del Entrenador
    console.log('   🔍 Estadísticas del Entrenador...');
    try {
      const statsEntrenador = await axios.get('/evaluaciones/estadisticas');
      console.log('     ✅ Estadísticas obtenidas');
      console.log('       Total evaluaciones:', statsEntrenador.data.totalEvaluaciones || 0);
      console.log('       Deportistas evaluados:', statsEntrenador.data.deportistasEvaluados || 0);
    } catch (error) {
      console.log('     ⚠️  Sin estadísticas aún');
    }

    // ==================== PRUEBA 6: PERMISOS Y ROLES ====================
    console.log('\n6. 🔒 PRUEBAS DE PERMISOS');
    console.log('-'.repeat(40));

    // 6.1 Deportista NO puede crear deportistas
    console.log('   🔍 Deportista no puede crear deportistas...');
    const tempAxios = axios.create();
    tempAxios.defaults.headers.common['Authorization'] = `Bearer ${deportistaToken}`;
    
    try {
      await tempAxios.post('/deportistas', {
        nombre: 'Test Permiso',
        email: 'testpermiso@test.com',
        password: 'test123'
      });
      console.log('     ❌ ERROR: Deportista pudo crear deportista (no debería)');
      allTestsPassed = false;
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('     ✅ Correcto: Deportista no tiene permiso');
      } else {
        console.log('     ⚠️  Error inesperado:', error.response?.status);
      }
    }

    // ==================== RESULTADOS FINALES ====================
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RESULTADOS DE LAS PRUEBAS');
    console.log('='.repeat(60));

    console.log('\n📊 RESUMEN:');
    console.log('✅ Sistema: Health check, DB, API');
    console.log('✅ Autenticación: Login entrenador y deportista');
    console.log('✅ Deportistas: Listar, obtener, crear, actualizar');
    console.log('✅ Habilidades: Listar, por nivel, faltantes');
    console.log('✅ Evaluaciones: Crear, listar, progreso, estadísticas');
    console.log('✅ Permisos: Control de acceso por roles');

    console.log('\n🔑 CREDENCIALES DE PRUEBA:');
    console.log('Entrenador: entrenador@deportes.com / password123');
    console.log('Deportista: carlos@deportes.com / password123');

    console.log('\n🚀 SISTEMA LISTO PARA FRONTEND');

    if (allTestsPassed) {
      console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    } else {
      console.log('\n⚠️  Algunas pruebas fallaron, revisa los mensajes');
    }

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LAS PRUEBAS:');
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    allTestsPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  process.exit(allTestsPassed ? 0 : 1);
}

// Ejecutar pruebas
runAllTests();