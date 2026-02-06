// backend/src/config/emailService.js - VERSIÓN CON REPLY-TO
const SibApiV3Sdk = require('@getbrevo/brevo');

class EmailService {
  constructor() {
    console.log('📧 Inicializando EmailService con Brevo API v3...');
    
    const apiKey = process.env.BREVO_API_KEY;
    console.log('📤 BREVO_API_KEY:', apiKey ? 'Configurado ✅' : 'NO CONFIGURADO ❌');

    if (!apiKey) {
      console.error('❌ ERROR CRÍTICO: BREVO_API_KEY no configurada');
      this.isConfigured = false;
      return;
    }

    if (!apiKey.startsWith('xkeysib-')) {
      console.error('❌ ERROR: BREVO_API_KEY tiene formato inválido');
      this.isConfigured = false;
      return;
    }

    try {
      // CONFIGURACIÓN CORRECTA PARA @getbrevo/brevo
      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      
      // Configurar API Key
      this.apiInstance.setApiKey(
        SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
        apiKey
      );
      
      this.isConfigured = true;
      console.log('✅ Cliente de Brevo API v3 configurado correctamente');
      console.log('📧 Servicio de email listo para enviar');
      
    } catch (error) {
      console.error('❌ Error al configurar Brevo API:', error.message);
      this.isConfigured = false;
    }
  }

  _checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('EmailService no está configurado correctamente. Verifica BREVO_API_KEY.');
    }
  }

  _getSenderEmail() {
    const emailFrom = process.env.EMAIL_FROM;
    
    // Si EMAIL_FROM tiene el formato "Nombre <email>", extraer solo el email
    if (emailFrom && emailFrom.includes('<')) {
      const match = emailFrom.match(/<(.+)>/);
      return match ? match[1] : emailFrom;
    }
    
    // Retornar directamente EMAIL_FROM (ya configurado en Railway)
    return emailFrom;
  }

  // ====================
  // REGISTRO DE ENTRENADOR
  // ====================
  async enviarEmailRegistroEntrenador(email, nombre, tokenRegistro) {
    this._checkConfiguration();
    
    try {
      console.log('\n📧 === ENVIANDO EMAIL DE REGISTRO A ENTRENADOR ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', nombre);
      console.log('🔗 Token:', tokenRegistro.substring(0, 20) + '...');

      if (!email || !nombre || !tokenRegistro) {
        throw new Error('Faltan parámetros requeridos');
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const registroUrl = `${frontendUrl}/auth/registro-entrenador/${tokenRegistro}`;

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: 'Titanes Cheer Evolution',
        email: this._getSenderEmail()
      };

      // AGREGAR REPLY-TO para mejorar entregabilidad
      sendSmtpEmail.replyTo = {
        email: 'juanes1052@gmail.com',
        name: 'Titanes Evolution'
      };
      
      sendSmtpEmail.to = [{ email: email, name: nombre }];
      sendSmtpEmail.subject = '🏋️‍♂️ ¡Bienvenido a Titanes Evolution - Completa tu Registro!';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
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
          Has sido registrado como entrenador. Para comenzar a usar tu cuenta, completa tu registro.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${registroUrl}" class="btn-registro" style="color: white; text-decoration: none;">
          🔐 COMPLETAR MI REGISTRO
        </a>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
          O copia este enlace en tu navegador:<br>
          <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-size: 12px;">${registroUrl}</code>
        </p>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #075985;">
          <strong>⏰ Importante:</strong> Este enlace expirará en 7 días.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
      <p style="margin: 5px 0;">Sistema de Gestión Deportiva</p>
    </div>
  </div>
</body>
</html>`;

      console.log('📤 Enviando email vía Brevo API...');
      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ EMAIL DE REGISTRO ENVIADO EXITOSAMENTE VÍA BREVO API');
      console.log('📧 Message ID:', data.messageId || 'sent');
      console.log('📨 Destinatario:', email);
      console.log('🔗 Enlace de registro:', registroUrl);
      console.log('📧 === EMAIL ENVIADO ===\n');

      return {
        success: true,
        messageId: data.messageId || 'sent',
        registroUrl: registroUrl
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO EMAIL DE REGISTRO:');
      console.error('🔍 Mensaje:', error.message);
      
      if (error.response) {
        console.error('🔍 Status:', error.response.status);
        console.error('🔍 Body:', error.response.body);
      }
      
      throw error;
    }
  }

  // ====================
  // RECORDATORIO DE REGISTRO
  // ====================
  async enviarRecordatorioRegistro(email, nombre, tokenRegistro) {
    this._checkConfiguration();
    
    try {
      console.log('\n📧 === ENVIANDO RECORDATORIO DE REGISTRO ===');
      console.log('👤 Para:', email);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const registroUrl = `${frontendUrl}/auth/registro-entrenador/${tokenRegistro}`;

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: 'Titanes Evolution', email: this._getSenderEmail() };
      
      // AGREGAR REPLY-TO
      sendSmtpEmail.replyTo = {
        email: 'juanes1052@gmail.com',
        name: 'Titanes Evolution'
      };
      
      sendSmtpEmail.to = [{ email: email, name: nombre }];
      sendSmtpEmail.subject = '⏰ Recordatorio - Completa tu Registro';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; padding: 30px;">
    <h2>Hola ${nombre},</h2>
    <p>Detectamos que aún no has completado tu registro como entrenador.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${registroUrl}" style="display: inline-block; background: #E21B23; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
        Completar Registro
      </a>
    </div>
  </div>
</body>
</html>`;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ RECORDATORIO ENVIADO');
      return { success: true };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO RECORDATORIO:', error.message);
      throw error;
    }
  }

  // ====================
  // CÓDIGO DE ACTIVACIÓN
  // ====================
  async sendActivationCode(email, code, userName) {
    this._checkConfiguration();
    
    try {
      console.log('\n📧 === ENVIANDO CÓDIGO DE ACTIVACIÓN ===');
      console.log('👤 Para:', email);
      console.log('🔢 Código:', code);

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: 'Titanes Evolution', email: this._getSenderEmail() };
      
      // AGREGAR REPLY-TO
      sendSmtpEmail.replyTo = {
        email: 'juanes1052@gmail.com',
        name: 'Titanes Evolution'
      };
      
      sendSmtpEmail.to = [{ email: email, name: userName }];
      sendSmtpEmail.subject = '🎯 Código de Activación - Titanes Evolution';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #E21B23 0%, #000 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0;">🎯 Activación de Cuenta</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2>¡Hola ${userName}!</h2>
      <p>Usa el siguiente código para activar tu cuenta:</p>
      <div style="background: #fee2e2; border-left: 4px solid #E21B23; padding: 20px; margin: 30px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #E21B23; font-weight: bold;">TU CÓDIGO DE ACTIVACIÓN</p>
        <div style="font-size: 48px; font-weight: bold; color: #E21B23; letter-spacing: 8px; font-family: monospace;">${code}</div>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">⏰ Válido por 15 minutos</p>
      </div>
    </div>
  </div>
</body>
</html>`;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ CÓDIGO DE ACTIVACIÓN ENVIADO');
      return { success: true };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO CÓDIGO:', error.message);
      throw error;
    }
  }

  // ====================
  // CÓDIGO DE RECUPERACIÓN
  // ====================
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendRecoveryCode(email, code, userName) {
    this._checkConfiguration();
    
    try {
      console.log('\n📧 === ENVIANDO CÓDIGO DE RECUPERACIÓN ===');
      console.log('👤 Para:', email);

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: 'Titanes Evolution', email: this._getSenderEmail() };
      
      // AGREGAR REPLY-TO
      sendSmtpEmail.replyTo = {
        email: 'juanes1052@gmail.com',
        name: 'Titanes Evolution'
      };
      
      sendSmtpEmail.to = [{ email: email, name: userName }];
      sendSmtpEmail.subject = '🔐 Código de Recuperación de Contraseña';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #000 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0;">🔐 Recuperación de Contraseña</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Usa el siguiente código para restablecer tu contraseña:</p>
      <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 30px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: bold;">TU CÓDIGO DE VERIFICACIÓN</p>
        <div style="font-size: 48px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: monospace;">${code}</div>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">Expira en 15 minutos</p>
      </div>
    </div>
  </div>
</body>
</html>`;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ CÓDIGO DE RECUPERACIÓN ENVIADO');
      return { success: true };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO RECUPERACIÓN:', error.message);
      throw error;
    }
  }

  async verifyConnection() {
    this._checkConfiguration();
    return true;
  }
}

module.exports = new EmailService();