// backend/test-email-directo.js
require('dotenv').config();

console.log('📧 === PRUEBA DIRECTA DE EMAIL SERVICE ===');
console.log('Cargando desde: ./src/config/emailService.js');

try {
  const EmailService = require('./src/config/emailService');
  console.log('✅ EmailService cargado correctamente');
  
  // Probar envío
  async function probarEnvio() {
    try {
      console.log('\n🔄 Iniciando prueba de envío...');
      console.log('EMAIL_USER desde .env:', process.env.EMAIL_USER);
      
      const resultado = await EmailService.sendRecoveryCode(
        'elsocio43215@gmail.com',
        '123456',
        'Usuario Prueba'
      );
      
      console.log('✅ ÉXITO: Email enviado:', resultado);
      
    } catch (error) {
      console.error('❌ ERROR en envío:');
      console.error('Mensaje:', error.message);
      
      if (error.message.includes('EAUTH') || error.code === 'EAUTH') {
        console.error('\n🔧 PROBLEMA DE AUTENTICACIÓN GMAIL:');
        console.error('Solución:');
        console.error('1. Ve a: https://myaccount.google.com/apppasswords');
        console.error('2. Genera nueva contraseña para "Mail"');
        console.error('3. Usa los 16 caracteres SIN ESPACIOS en .env');
        console.error('   Ejemplo: "skll bhuj eodc urcz" → "skllbhujeodcurcz"');
      }
    }
  }
  
  probarEnvio();
  
} catch (error) {
  console.error('❌ Error cargando EmailService:', error.message);
  console.error('Stack:', error.stack);
}