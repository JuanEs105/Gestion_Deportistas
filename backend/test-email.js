require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Probando configuración de email...');
console.log('Usuario:', process.env.EMAIL_USER);
console.log('Contraseña:', process.env.EMAIL_PASS ? '✅ Configurada' : '❌ No configurada');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function testEmail() {
  try {
    // 1. Verificar conexión
    console.log('🔄 Verificando conexión con Gmail...');
    await transporter.verify();
    console.log('✅ Conexión exitosa con Gmail');

    // 2. Enviar correo de prueba
    console.log('📤 Enviando correo de prueba...');
    const info = await transporter.sendMail({
      from: `"Titanes Cheer" <${process.env.EMAIL_USER}>`,
      to: 'juanes1052u@gmail.com',  // ⚠️ PON TU CORREO PERSONAL AQUÍ
      subject: '✅ PRUEBA - Sistema Titanes Cheer',
      text: 'Este es un correo de prueba del sistema de recuperación de contraseña.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #dc2626;">✅ Prueba Exitosa</h2>
          <p>El sistema de email está funcionando correctamente.</p>
          <p>Ahora puedes enviar códigos de recuperación a los usuarios.</p>
          <hr>
          <p><small>Sistema Titanes Cheer Evolution</small></p>
        </div>
      `
    });

    console.log('✅ Correo enviado exitosamente');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Destinatario:', info.envelope.to);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('🔑 Problema de autenticación. Verifica:');
      console.log('1. ¿Activaste "Verificación en 2 pasos"?');
      console.log('2. ¿Usaste contraseña de aplicación (16 caracteres)?');
      console.log('3. ¿Copiaste TODO con espacios?');
    } else if (error.code === 'ECONNECTION') {
      console.log('🌐 Problema de conexión. Verifica tu internet.');
    } else {
      console.log('🔧 Error completo:', error);
    }
  }
}

testEmail();