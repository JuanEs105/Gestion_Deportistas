// backend/src/services/emailService.js - VERSIÓN CON BREVO SMTP
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('📧 Inicializando EmailService...');
    console.log('📤 BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? 'Configurado' : 'NO CONFIGURADO');

    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
      console.error('❌ ERROR: Credenciales de Brevo SMTP no configuradas');
      console.error('   Revisa tus variables de entorno y asegúrate de tener:');
      console.error('   BREVO_SMTP_HOST=smtp-relay.brevo.com');
      console.error('   BREVO_SMTP_PORT=587');
      console.error('   BREVO_SMTP_USER=a1b275001@smtp-brevo.com');
      console.error('   BREVO_SMTP_PASS=2bCGpqXmdMQEy1nr');
    }

    // Configuración de Brevo SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
      secure: false, // false para puerto 587 (STARTTLS)
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verificar conexión al iniciar
    this.verifyConnection();
  }

  // ====================
  // REGISTRO DE ENTRENADOR
  // ====================
  async enviarEmailRegistroEntrenador(email, nombre, tokenRegistro) {
    try {
      console.log('\n📧 === ENVIANDO EMAIL DE REGISTRO A ENTRENADOR ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', nombre);
      console.log('🔗 Token:', tokenRegistro.substring(0, 20) + '...');

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const registroUrl = `${frontendUrl}/auth/registro-entrenador/${tokenRegistro}`;

      const mailOptions = {
        from: {
          name: 'Titanes Cheer Evolution - Administración',
          address: process.env.EMAIL_FROM || 'juanes1052u@gmail.com'
        },
        to: email,
        subject: '🏋️‍♂️ ¡Bienvenido a Titanes Evolution - Completa tu Registro!',
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #E21B23 0%, #C81E1E 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .welcome { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #E21B23; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .btn-registro { display: inline-block; background: linear-gradient(135deg, #E21B23 0%, #C81E1E 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .info-box { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
    .steps { display: flex; justify-content: space-between; margin: 30px 0; }
    .step { text-align: center; flex: 1; padding: 10px; }
    .step-number { background: #E21B23; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️‍♂️ Titanes Evolution</h1>
      <p>Sistema de Gestión Deportiva</p>
    </div>
    
    <div class="content">
      <h2 style="color: #1f2937;">¡Hola ${nombre}!</h2>
      
      <div class="welcome">
        <p style="margin: 0; color: #374151;">
          <strong>🎉 ¡Bienvenido al equipo de entrenadores de Titanes Evolution!</strong>
        </p>
        <p style="margin: 10px 0 0 0; color: #6b7280;">
          Has sido registrado como entrenador por el administrador del sistema. Para comenzar a usar tu cuenta, necesitas completar el siguiente paso.
        </p>
      </div>
      
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">Recibes este correo</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">Completas tu registro</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">¡Empiezas a entrenar!</p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${registroUrl}" class="btn-registro" style="color: white; text-decoration: none;">
          🔐 COMPLETAR MI REGISTRO
        </a>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
          O copia y pega este enlace en tu navegador:<br>
          <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-size: 12px;">${registroUrl}</code>
        </p>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #075985;">
          <strong>⏰ Importante:</strong> Este enlace expirará en 7 días.
          Si no completas tu registro en ese tiempo, deberás solicitar uno nuevo al administrador.
        </p>
      </div>
      
      <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 5px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          <strong>📋 Información de tu cuenta:</strong><br>
          • Email: ${email}<br>
          • Rol: Entrenador<br>
          • Estado: Pendiente de registro<br>
          • Fecha de solicitud: ${new Date().toLocaleDateString('es-ES')}
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
      <p style="margin: 5px 0;">Sistema de Gestión Deportiva - Todos los derechos reservados</p>
      <p style="margin: 5px 0; font-size: 11px;">
        Si no solicitaste este registro, por favor ignora este correo y notifica al administrador.
      </p>
    </div>
  </div>
</body>
</html>`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ EMAIL DE REGISTRO ENVIADO EXITOSAMENTE VÍA BREVO');
      console.log('📧 Message ID:', info.messageId);
      console.log('📨 Destinatario:', info.envelope?.to || email);
      console.log('🔗 Enlace de registro:', registroUrl);
      console.log('📧 === EMAIL ENVIADO ===\n');

      return {
        success: true,
        messageId: info.messageId,
        registroUrl: registroUrl
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO EMAIL DE REGISTRO:');
      console.error('🔍 Código de error:', error.code);
      console.error('📝 Mensaje:', error.message);

      if (error.code === 'EAUTH') {
        console.error('\n⚠️ PROBLEMA DE AUTENTICACIÓN CON BREVO SMTP:');
        console.error('1. Verifica que BREVO_SMTP_USER sea correcto');
        console.error('2. Verifica que BREVO_SMTP_PASS sea correcto');
        console.error('3. Genera una nueva clave SMTP en Brevo si es necesario');
      }

      throw error;
    }
  }

  // ====================
  // RECORDATORIO DE REGISTRO
  // ====================
  async enviarRecordatorioRegistro(email, nombre, tokenRegistro) {
    try {
      console.log('\n📧 === ENVIANDO RECORDATORIO DE REGISTRO ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', nombre);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const registroUrl = `${frontendUrl}/auth/registro-entrenador/${tokenRegistro}`;

      const mailOptions = {
        from: {
          name: 'Titanes Cheer Evolution - Recordatorio',
          address: process.env.EMAIL_FROM || 'juanes1052u@gmail.com'
        },
        to: email,
        subject: '⏰ Recordatorio - Completa tu Registro en Titanes Evolution',
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 25px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .warning { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .btn-registro { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { background-color: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Registro</h1>
      <p>Titanes Evolution - Sistema de Entrenadores</p>
    </div>
    
    <div class="content">
      <h2 style="color: #1f2937;">Hola ${nombre},</h2>
      
      <p style="color: #6b7280;">
        Detectamos que aún no has completado tu registro como entrenador en Titanes Evolution.
      </p>
      
      <div class="warning">
        <p style="margin: 0; color: #92400e;">
          <strong>⚠️ Tu cuenta está pendiente de activación</strong><br>
          Para acceder al sistema y comenzar a gestionar deportistas, necesitas completar tu registro.
        </p>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${registroUrl}" class="btn-registro" style="color: white; text-decoration: none;">
          🔓 COMPLETAR REGISTRO AHORA
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        Si ya completaste tu registro, puedes ignorar este mensaje.<br>
        Si tienes problemas con el enlace, copia y pega esto en tu navegador:
      </p>
      
      <div style="background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 12px; color: #374151;">
        ${registroUrl}
      </div>
      
      <div style="margin-top: 25px; padding: 15px; background: #f9fafb; border-radius: 5px;">
        <p style="margin: 0; color: #6b7280; font-size: 13px;">
          <strong>📞 ¿Necesitas ayuda?</strong><br>
          Contacta al administrador del sistema si encuentras algún problema.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
      <p style="margin: 5px 0;">Este es un correo automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ RECORDATORIO ENVIADO EXITOSAMENTE VÍA BREVO');
      console.log('📧 Message ID:', info.messageId);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO RECORDATORIO:', error.message);
      throw error;
    }
  }

  // ====================
  // CÓDIGO DE ACTIVACIÓN PARA REGISTRO DE ENTRENADOR
  // ====================
  async sendActivationCode(email, code, userName) {
    try {
      console.log('\n📧 === ENVIANDO CÓDIGO DE ACTIVACIÓN ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', userName);
      console.log('🔢 Código:', code);

      const mailOptions = {
        from: {
          name: 'Titanes Evolution - Activación de Cuenta',
          address: process.env.EMAIL_FROM || 'juanes1052u@gmail.com'
        },
        to: email,
        subject: '🎯 Código de Activación - Titanes Evolution',
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #E21B23 0%, #000000 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .activation-box { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #E21B23; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center; }
    .code { font-size: 48px; font-weight: bold; color: #E21B23; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .steps { display: flex; justify-content: space-between; margin: 30px 0; }
    .step { text-align: center; flex: 1; padding: 10px; }
    .step-number { background: #E21B23; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    .info-box { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Activación de Cuenta</h1>
      <p>Titanes Evolution - Sistema de Entrenadores</p>
    </div>
    
    <div class="content">
      <h2 style="color: #1f2937;">¡Hola ${userName}!</h2>
      
      <p style="color: #6b7280;">
        Estás a un paso de activar tu cuenta como entrenador en Titanes Evolution. 
        Usa el siguiente código de 6 dígitos para continuar con tu registro:
      </p>
      
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">Recibes este código</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">Ingresa el código</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">Crea tu contraseña</p>
        </div>
      </div>
      
      <div class="activation-box">
        <p style="margin: 0; color: #E21B23; font-weight: bold; font-size: 14px;">TU CÓDIGO DE ACTIVACIÓN</p>
        <div class="code">${code}</div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">⏰ Válido por 15 minutos</p>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #075985; font-size: 14px;">
          <strong>📝 Proceso de activación:</strong><br>
          1. Ingresa este código en la página de verificación<br>
          2. Crea una contraseña segura para tu cuenta<br>
          3. ¡Listo! Tu cuenta quedará activa inmediatamente
        </p>
      </div>
      
      <div style="margin-top: 25px; padding: 15px; background: #f9fafb; border-radius: 5px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          <strong>🔐 Seguridad:</strong><br>
          • No compartas este código con nadie<br>
          • Si no solicitaste esta activación, ignora este correo<br>
          • Contacta al administrador si tienes dudas
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
      <p style="margin: 5px 0;">Sistema de Gestión Deportiva - Todos los derechos reservados</p>
      <p style="margin: 5px 0; font-size: 11px;">
        Este es un correo automático, por favor no respondas.
      </p>
    </div>
  </div>
</body>
</html>`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ CÓDIGO DE ACTIVACIÓN ENVIADO EXITOSAMENTE VÍA BREVO');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 === ACTIVACIÓN ENVIADA ===\n');

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO CÓDIGO DE ACTIVACIÓN:');
      console.error('🔍 Código de error:', error.code);
      console.error('📝 Mensaje:', error.message);

      if (error.code === 'EAUTH') {
        console.error('\n⚠️ PROBLEMA DE AUTENTICACIÓN CON BREVO SMTP');
        console.error('1. Revisa que BREVO_SMTP_USER y BREVO_SMTP_PASS sean correctos');
        console.error('2. Verifica que las credenciales estén activas en Brevo');
      }

      throw error;
    }
  }

  // ====================
  // CÓDIGO DE RECUPERACIÓN (existente)
  // ====================
  generateCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Código generado:', code);
    return code;
  }

  async sendRecoveryCode(email, code, userName) {
    try {
      console.log('\n📧 === ENVIANDO CÓDIGO DE RECUPERACIÓN ===');

      const mailOptions = {
        from: {
          name: 'Titanes Cheer Evolution',
          address: process.env.EMAIL_FROM || 'juanes1052u@gmail.com'
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

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ CÓDIGO DE RECUPERACIÓN ENVIADO VÍA BREVO');
      console.log('📧 Message ID:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO CÓDIGO DE RECUPERACIÓN:', error);
      throw error;
    }
  }

  // ====================
  // VERIFICACIÓN DE CONEXIÓN
  // ====================
  async verifyConnection() {
    try {
      console.log('🔌 Verificando conexión con Brevo SMTP...');
      await this.transporter.verify();
      console.log('✅ CONEXIÓN CON BREVO EXITOSA');
      console.log('📧 Servidor de email listo para enviar');
      return true;
    } catch (error) {
      console.error('❌ ERROR DE CONEXIÓN CON BREVO SMTP:');
      console.error('🔍 Código:', error.code);
      console.error('📝 Mensaje:', error.message);
      console.error('🔧 Solución:');
      console.error('   1. Verifica BREVO_SMTP_HOST=smtp-relay.brevo.com');
      console.error('   2. Verifica BREVO_SMTP_PORT=587');
      console.error('   3. Verifica BREVO_SMTP_USER (tu identificador de Brevo)');
      console.error('   4. Verifica BREVO_SMTP_PASS (tu contraseña SMTP de Brevo)');
      return false;
    }
  }
}

module.exports = new EmailService();