// backend/test-simple.js - Prueba simple sin node-fetch
require('dotenv').config();

async function testRecuperacionDirecta() {
  console.log('🔐 === PRUEBA DIRECTA DEL SISTEMA ===\n');
  
  // 1. Cargar el authController directamente
  console.log('1. 🔧 CARGANDO MÓDULOS...');
  
  try {
    // Cargar EmailService para verificar
    const EmailService = require('./src/config/emailService');
    console.log('   ✅ EmailService cargado');
    
    // Cargar modelos
    const { sequelize, connectDB } = require('./src/config/database');
    const { User } = require('./src/models');
    
    // Conectar a BD
    await connectDB();
    console.log('   ✅ Base de datos conectada');
    
    // 2. Buscar el usuario
    console.log('\n2. 🔍 BUSCANDO USUARIO EN BD...');
    const user = await User.findOne({
      where: { email: 'elsocio43215@gmail.com' },
      attributes: ['id', 'nombre', 'email', 'reset_password_code', 'reset_password_expires']
    });
    
    if (!user) {
      console.log('   ❌ Usuario no encontrado en BD');
      console.log('   ℹ️  Creando usuario de prueba...');
      
      // Crear usuario de prueba
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newUser = await User.create({
        nombre: 'Usuario Prueba',
        email: 'elsocio43215@gmail.com',
        password: hashedPassword,
        role: 'deportista',
        activo: true
      });
      
      console.log('   ✅ Usuario creado:', newUser.email);
      console.log('   🔑 ID:', newUser.id);
      
      // Usar el nuevo usuario
      user = newUser;
    } else {
      console.log('   ✅ Usuario encontrado:');
      console.log('      ID:', user.id);
      console.log('      Nombre:', user.nombre);
      console.log('      Email:', user.email);
      console.log('      Código actual:', user.reset_password_code || 'Ninguno');
    }
    
    // 3. Probar EmailService directamente
    console.log('\n3. 📧 PROBANDO ENVÍO DE EMAIL...');
    
    const testCode = '999999';
    console.log('   🔑 Código de prueba:', testCode);
    
    try {
      const emailResult = await EmailService.sendRecoveryCode(
        user.email,
        testCode,
        user.nombre
      );
      
      console.log('   ✅ Email enviado exitosamente');
      console.log('   📨 Message ID:', emailResult.messageId);
      
    } catch (emailError) {
      console.error('   ❌ Error enviando email:', emailError.message);
      return;
    }
    
    // 4. Simular lo que hace authController
    console.log('\n4. 🧪 SIMULANDO AUTH CONTROLLER...');
    
    // Generar código real
    const realCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('   🔑 Código generado:', realCode);
    
    // Actualizar usuario en BD (como lo hace authController)
    user.reset_password_code = realCode;
    user.reset_password_expires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    
    console.log('   💾 Código guardado en BD');
    
    // Enviar email con el código real
    console.log('   📤 Enviando email con código real...');
    
    const realEmailResult = await EmailService.sendRecoveryCode(
      user.email,
      realCode,
      user.nombre
    );
    
    console.log('   ✅ Email con código real enviado');
    console.log('   📨 Message ID:', realEmailResult.messageId);
    
    // 5. Verificar que el código se guardó
    console.log('\n5. ✅ VERIFICACIÓN FINAL...');
    
    const usuarioVerificado = await User.findByPk(user.id, {
      attributes: ['id', 'email', 'reset_password_code', 'reset_password_expires']
    });
    
    if (usuarioVerificado.reset_password_code === realCode) {
      console.log('   🎉 ¡TODO FUNCIONA CORRECTAMENTE!');
      console.log('   📋 Resumen:');
      console.log('      - EmailService: ✅ Funciona');
      console.log('      - Base de datos: ✅ Conectada');
      console.log('      - Usuario: ✅ Encontrado/Creado');
      console.log('      - Código: ✅ Guardado en BD:', realCode);
      console.log('      - Email: ✅ Enviado correctamente');
      console.log('\n   🚀 El sistema está listo para usar.');
      console.log('   📧 Revisa el correo de', user.email, 'para ver el código.');
    } else {
      console.error('   ❌ Error: Código no se guardó correctamente en BD');
    }
    
  } catch (error) {
    console.error('❌ ERROR EN PRUEBA:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('Cannot find module')) {
      console.error('\n🔧 Módulo faltante. Instala las dependencias:');
      console.error('npm install bcryptjs');
    }
  }
  
  console.log('\n🏁 === FIN DE PRUEBA ===');
  
  // Cerrar conexión a BD
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Ejecutar prueba
testRecuperacionDirecta();