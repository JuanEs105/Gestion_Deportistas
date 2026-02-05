// backend/test-auth.js - Prueba completa del sistema
require('dotenv').config();

async function testRecuperacionCompleta() {
  console.log('🔐 === PRUEBA COMPLETA SISTEMA DE RECUPERACIÓN ===\n');
  
  // 1. Simular solicitud de recuperación
  console.log('1. 📧 SOLICITANDO CÓDIGO DE RECUPERACIÓN...');
  console.log('   Email: elsocio43215@gmail.com');
  
  try {
    // Simular la llamada al endpoint
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'elsocio43215@gmail.com'
      })
    });
    
    const data = await response.json();
    
    console.log('   📊 Respuesta del servidor:');
    console.log('   Status:', response.status);
    console.log('   Success:', data.success);
    console.log('   Message:', data.message);
    console.log('   ✅ Solicitud procesada\n');
    
    if (!data.success) {
      console.error('❌ Error en la solicitud:', data.error);
      return;
    }
    
    // 2. Verificar que el código se guardó en BD
    console.log('2. 🔍 VERIFICANDO BASE DE DATOS...');
    
    const { sequelize } = require('./src/config/database');
    const { User } = require('./src/models');
    
    const user = await User.findOne({
      where: { email: 'elsocio43215@gmail.com' },
      attributes: ['id', 'email', 'reset_password_code', 'reset_password_expires']
    });
    
    if (user && user.reset_password_code) {
      console.log('   ✅ Código encontrado en BD:', user.reset_password_code);
      console.log('   ⏰ Expira:', user.reset_password_expires);
      console.log('   📧 Usuario:', user.email);
      
      // 3. Probar cambio de contraseña
      console.log('\n3. 🔐 PROBANDO CAMBIO DE CONTRASEÑA...');
      
      const resetResponse = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'elsocio43215@gmail.com',
          code: user.reset_password_code,
          newPassword: 'NuevaContraseña123'
        })
      });
      
      const resetData = await resetResponse.json();
      
      console.log('   📊 Respuesta:', resetData.message);
      
      if (resetData.success) {
        console.log('   🎉 ¡PRUEBA COMPLETA EXITOSA!');
        console.log('   La contraseña ha sido cambiada exitosamente.');
      } else {
        console.error('   ❌ Error en cambio de contraseña:', resetData.error);
      }
      
    } else {
      console.error('   ❌ No se encontró código en BD');
      console.error('   Posible problema:');
      console.error('   - El usuario no existe en BD');
      console.error('   - Error en authController (no guarda el código)');
      console.error('   - Error en la consulta a BD');
    }
    
  } catch (error) {
    console.error('❌ ERROR EN PRUEBA:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🏁 === FIN DE PRUEBA ===');
}

// Ejecutar prueba
testRecuperacionCompleta();