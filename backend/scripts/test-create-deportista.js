// backend/scripts/test-create-deportista.js
const axios = require('axios');

async function testCreateDeportista() {
  console.log('🧪 TEST DE CREACIÓN DE DEPORTISTA\n');
  console.log('='.repeat(60));

  const API_URL = 'http://localhost:5000/api';
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@test.com`;

  try {
    // 1. Login como entrenador
    console.log('1️⃣ LOGIN COMO ENTRENADOR...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'entrenador@deportes.com',
      password: 'password123'
    });

    const token = loginRes.data.token;
    console.log('✅ Token obtenido:', token.substring(0, 30) + '...\n');

    // 2. Intentar crear deportista (Formato JSON simple)
    console.log('2️⃣ INTENTANDO CREAR DEPORTISTA...');
    console.log('📝 Datos de prueba:');
    console.log('   Email:', testEmail);
    console.log('   Nombre: "Test Deportista"');
    console.log('   Nivel: "1_basico"');

    const deportistaData = {
      nombre: 'Test Deportista',
      email: testEmail,
      password: 'password123',
      telefono: '3101234567',
      fecha_nacimiento: '2000-01-01',
      altura: '1.75',
      peso: '70',
      nivel: '1_basico',
      contacto_emergencia_nombre: 'Contacto Test',
      contacto_emergencia_telefono: '3109876543',
      contacto_emergencia_parentesco: 'padre'
    };

    console.log('\n🚀 Enviando solicitud POST a /api/deportistas...');
    
    const createRes = await axios.post(`${API_URL}/deportistas`, deportistaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('\n✅ ¡ÉXITO! Deportista creado:');
    console.log('   Status:', createRes.status);
    console.log('   Mensaje:', createRes.data.message);
    console.log('   ID:', createRes.data.deportista?.id);
    console.log('   Nivel:', createRes.data.deportista?.nivel_actual);
    console.log('   Estado:', createRes.data.deportista?.estado);
    
    if (createRes.data.deportista?.User) {
      console.log('   Nombre:', createRes.data.deportista.User.nombre);
      console.log('   Email:', createRes.data.deportista.User.email);
    }

    // 3. Verificar que se creó en la BD
    console.log('\n3️⃣ VERIFICANDO EN BASE DE DATOS...');
    
    const verifyRes = await axios.get(`${API_URL}/deportistas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const deportistaCreado = verifyRes.data.data?.find(d => 
      d.User?.email === testEmail || d.email === testEmail
    );

    if (deportistaCreado) {
      console.log('✅ Deportista encontrado en BD:');
      console.log('   ID:', deportistaCreado.id);
      console.log('   Nivel:', deportistaCreado.nivel_actual);
      console.log('   Estado:', deportistaCreado.estado);
    } else {
      console.log('⚠️  Deportista no encontrado en lista (puede ser normal si la respuesta no incluye data.data)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:\n');
    
    if (error.response) {
      // Error de respuesta del servidor
      console.log('📊 DATOS DEL ERROR:');
      console.log('   Status:', error.response.status);
      console.log('   Status Text:', error.response.statusText);
      console.log('   URL:', error.response.config?.url);
      console.log('   Método:', error.response.config?.method);
      
      if (error.response.data) {
        console.log('\n📝 RESPUESTA DEL SERVIDOR:');
        console.log('   Success:', error.response.data.success);
        console.log('   Error:', error.response.data.error);
        console.log('   Message:', error.response.data.message);
        
        if (error.response.data.details) {
          console.log('   Details:', JSON.stringify(error.response.data.details, null, 2));
        }
        
        if (error.response.data.debug) {
          console.log('   Debug:', JSON.stringify(error.response.data.debug, null, 2));
        }
      }
      
      // Mostrar headers si hay error de validación
      if (error.response.status === 400) {
        console.log('\n🔍 HEADERS ENVIADOS:');
        console.log('   Content-Type:', error.response.config?.headers?.['Content-Type']);
        console.log('   Authorization:', error.response.config?.headers?.Authorization ? 'Presente' : 'Ausente');
      }
    } else if (error.request) {
      // Error de red
      console.log('🌐 ERROR DE RED:');
      console.log('   No se recibió respuesta del servidor');
      console.log('   Verifica que el backend esté corriendo en http://localhost:5000');
    } else {
      // Error en la configuración
      console.log('⚙️ ERROR DE CONFIGURACIÓN:');
      console.log('   Message:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔧 DIAGNÓSTICO:');
    console.log('1. Verifica que el backend esté corriendo: http://localhost:5000');
    console.log('2. Revisa los logs del servidor backend');
    console.log('3. Verifica la estructura del modelo Deportista.js');
    console.log('4. Asegúrate de que el token sea válido');
    console.log('='.repeat(60));
  }
}

// Ejecutar el test
testCreateDeportista();