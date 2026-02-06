// backend/src/services/emailService.js - VERSIÓN CON BREVO API (HTTP)
const SibApiV3Sdk = require('@getbrevo/brevo');

class EmailService {
  constructor() {
    console.log('📧 Inicializando EmailService con Brevo API...');
    console.log('📤 BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'Configurado ✅' : 'NO CONFIGURADO ❌');

    if (!process.env.BREVO_API_KEY) {
      console.error('❌ ERROR: BREVO_API_KEY no configurada');
      console.error('   Agrega esta variable en Railway:');
      console.error('   BREVO_API_KEY=xkeysib-tu-api-key-aqui');
      return;
    }

    // Configurar cliente de Brevo API
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    console.log('✅ Cliente de Brevo API configurado correctamente');
    console.log('📧 Servidor de email listo para enviar vía API HTTP');
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

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: 'Titanes Cheer Evolution - Administración',
        email: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'juanes1052u@gmail.com'
      };
      
      sendSmtpEmail.to = [{ email: email, name: nombre }];
      sendSmtpEmail.subject = '🏋️‍♂️ ¡Bienvenido a Titanes Evolution - Completa tu Registro!';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
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
</html>`;

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ EMAIL DE REGISTRO ENVIADO EXITOSAMENTE VÍA BREVO API');
      console.log('📧 Message ID:', result.messageId);
      console.log('📨 Destinatario:', email);
      console.log('🔗 Enlace de registro:', registroUrl);
      console.log('📧 === EMAIL ENVIADO ===\n');

      return {
        success: true,
        messageId: result.messageId,
        registroUrl: registroUrl
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO EMAIL DE REGISTRO:');
      console.error('🔍 Error:', error.response?.body || error.message);
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

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: 'Titanes Cheer Evolution - Recordatorio',
        email: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'juanes1052u@gmail.com'
      };
      
      sendSmtpEmail.to = [{ email: email, name: nombre }];
      sendSmtpEmail.subject = '⏰ Recordatorio - Completa tu Registro en Titanes Evolution';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
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
</html>`;

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ RECORDATORIO ENVIADO EXITOSAMENTE VÍA BREVO API');
      console.log('📧 Message ID:', result.messageId);

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO RECORDATORIO:', error.response?.body || error.message);
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

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: 'Titanes Evolution - Activación de Cuenta',
        email: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'juanes1052u@gmail.com'
      };
      
      sendSmtpEmail.to = [{ email: email, name: userName }];
      sendSmtpEmail.subject = '🎯 Código de Activación - Titanes Evolution';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
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
</html>`;

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ CÓDIGO DE ACTIVACIÓN ENVIADO EXITOSAMENTE VÍA BREVO API');
      console.log('📧 Message ID:', result.messageId);
      console.log('📧 === ACTIVACIÓN ENVIADA ===\n');

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO CÓDIGO DE ACTIVACIÓN:');
      console.error('🔍 Error:', error.response?.body || error.message);
      throw error;
    }
  }

  // ====================
  // CÓDIGO DE RECUPERACIÓN
  // ====================
  generateCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Código generado:', code);
    return code;
  }

  async sendRecoveryCode(email, code, userName) {
    try {
      console.log('\n📧 === ENVIANDO CÓDIGO DE RECUPERACIÓN ===');

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: 'Titanes Cheer Evolution',
        email: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'juanes1052u@gmail.com'
      };
      
      sendSmtpEmail.to = [{ email: email, name: userName }];
      sendSmtpEmail.subject = '🔐 Código de Recuperación de Contraseña';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
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
</html>`;

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ CÓDIGO DE RECUPERACIÓN ENVIADO VÍA BREVO API');
      console.log('📧 Message ID:', result.messageId);

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO CÓDIGO DE RECUPERACIÓN:', error.response?.body || error.message);
      throw error;
    }
  }

  // ====================
  // VERIFICACIÓN DE CONEXIÓN (no es necesaria con API)
  // ====================
  async verifyConnection() {
    // La API no requiere verificación previa
    return true;
  }
}

module.exports = new EmailService();