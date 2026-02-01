// backend/test-direct.js
require('dotenv').config();

async function testDirect() {
  console.log('🎯 === PRUEBA DIRECTA DEL FLUJO ===\n');
  
  // Cargar módulos
  const EmailService = require('./src/config/emailService');
  const { sequelize } = require('./src/config/database');
  const { User } = require('./src/models');
  
  try {
    // 1. Buscar usuario existente
    console.log('1. 🔍 Buscando usuario existente...');
    const user = await User.findOne({
      where: { email: 'elsocio43215@gmail.com' },
      raw: true
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('   ✅ Usuario:', user.nombre);
    console.log('   📧 Email:', user.email);
    console.log('   🔑 Código actual:', user.reset_password_code || 'Ninguno');
    
    // 2. Generar nuevo código
    console.log('\n2. 🔑 Generando nuevo código...');
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('   Nuevo código:', newCode);
    
    // 3. Enviar email
    console.log('\n3. 📧 Enviando email...');
    const emailResult = await EmailService.sendRecoveryCode(
      user.email,
      newCode,
      user.nombre
    );
    
    console.log('   ✅ Email enviado!');
    console.log('   📨 Message ID:', emailResult.messageId);
    
    // 4. Actualizar en BD (simulando authController)
    console.log('\n4. 💾 Actualizando en BD...');
    await User.update({
      reset_password_code: newCode,
      reset_password_expires: new Date(Date.now() + 15 * 60 * 1000)
    }, {
      where: { id: user.id }
    });
    
    console.log('   ✅ BD actualizada');
    
    // 5. Verificar
    console.log('\n5. ✅ Verificación final...');
    const updatedUser = await User.findByPk(user.id, { raw: true });
    
    console.log('   🔑 Código en BD:', updatedUser.reset_password_code);
    console.log('   🕐 Expira:', updatedUser.reset_password_expires);
    
    console.log('\n🎉 ¡PRUEBA EXITOSA!');
    console.log('📧 El código', newCode, 'fue enviado a', user.email);
    console.log('💾 Y guardado en la base de datos.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testDirect();