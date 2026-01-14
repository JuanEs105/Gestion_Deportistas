const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('🔄 Inicializando EmailService...');
    console.log('📧 EMAIL_USER configurado:', !!process.env.EMAIL_USER);
    console.log('🔑 EMAIL_PASS configurado:', !!process.env.EMAIL_PASS);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ ERROR: Credenciales de email no configuradas en .env');
      console.error('   EMAIL_USER:', process.env.EMAIL_USER || 'NO DEFINIDO');
      console.error('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'DEFINIDO' : 'NO DEFINIDO');
    }
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Verificar conexión al crear el servicio
    this.verifyConnection();
  }

  generateCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Código generado:', code);
    return code;
  }

  async sendRecoveryCode(email, code, userName) {
    console.log('\n📧 === INICIANDO ENVÍO DE EMAIL ===');
    console.log('👤 Para:', email);
    console.log('🔑 Código:', code);
    console.log('📛 Nombre:', userName);
    console.log('📤 Desde:', process.env.EMAIL_USER);
    
    const mailOptions = {
      from: {
        name: 'Titanes Cheer Evolution',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🔐 Código de Recuperación de Contraseña',
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #000000 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .code-box { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #dc2626; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center; }
    .code { font-size: 48px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperación de Contraseña</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
      <p style="color: #6b7280;">Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código de verificación:</p>
      <div class="code-box">
        <p style="margin: 0; color: #dc2626; font-weight: bold; font-size: 14px;">TU CÓDIGO DE VERIFICACIÓN</p>
        <div class="code">${code}</div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">Este código expira en 15 minutos</p>
      </div>
      <div class="warning">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
      <p style="margin: 5px 0; font-size: 12px;">Sistema de Gestión Deportiva</p>
    </div>
  </div>
</body>
</html>`
    };

    try {
      console.log('🔄 Enviando email...');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ EMAIL ENVIADO EXITOSAMENTE');
      console.log('📧 Message ID:', info.messageId);
      console.log('📨 Destinatario:', info.envelope.to);
      console.log('📤 Remitente:', info.envelope.from);
      console.log('📦 Respuesta:', info.response);
      console.log('📧 === EMAIL ENVIADO ===\n');
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO EMAIL:');
      console.error('🔍 Código de error:', error.code);
      console.error('📝 Mensaje:', error.message);
      console.error('🔧 Stack completo:');
      console.error(error.stack);
      
      // Errores comunes de Gmail
      if (error.code === 'EAUTH') {
        console.error('\n⚠️ PROBLEMA DE AUTENTICACIÓN CON GMAIL:');
        console.error('1. Verifica que la "Verificación en 2 pasos" esté ACTIVADA');
        console.error('2. Genera una NUEVA "Contraseña de aplicación" en:');
        console.error('   https://myaccount.google.com/apppasswords');
        console.error('3. Actualiza tu archivo .env con la nueva contraseña de 16 caracteres');
      } else if (error.code === 'ECONNECTION') {
        console.error('\n⚠️ PROBLEMA DE CONEXIÓN:');
        console.error('Verifica tu conexión a internet o firewall');
      }
      
      console.error('📧 === ERROR EN ENVÍO ===\n');
      throw error;
    }
  }

  // Verificar conexión SMTP
  async verifyConnection() {
    try {
      console.log('🔌 Verificando conexión con Gmail...');
      await this.transporter.verify();
      console.log('✅ CONEXIÓN CON GMAIL EXITOSA');
      console.log('📧 Servidor de email listo para enviar');
      return true;
    } catch (error) {
      console.error('❌ ERROR DE CONEXIÓN CON GMAIL:');
      console.error('🔍 Código:', error.code);
      console.error('📝 Mensaje:', error.message);
      console.error('🔧 Verifica:');
      console.error('   1. Credenciales en .env');
      console.error('   2. Contraseña de aplicación (no la normal)');
      console.error('   3. Acceso a aplicaciones menos seguras');
      return false;
    }
  }
}

module.exports = new EmailService();