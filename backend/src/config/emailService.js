// backend/src/config/emailService.js - VERSIÓN COMPLETA CON BIENVENIDA DEPORTISTA
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
  // ✅✅✅ NUEVO: EMAIL DE BIENVENIDA DEPORTISTA
  // ====================
  async enviarEmailBienvenidaDeportista(email, nombre, apellidos) {
    this._checkConfiguration();
    
    try {
      console.log('\n📧 === ENVIANDO EMAIL DE BIENVENIDA A DEPORTISTA ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', nombre, apellidos);

      if (!email || !nombre) {
        throw new Error('Faltan parámetros requeridos');
      }

      const nombreCompleto = `${nombre} ${apellidos || ''}`.trim();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const loginUrl = `${frontendUrl}/auth/acceso-deportista.html`;

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
      
      sendSmtpEmail.to = [{ email: email, name: nombreCompleto }];
      sendSmtpEmail.subject = '🔥 ¡Bienvenido a Titanes Evolution!';
      sendSmtpEmail.htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'Arial', sans-serif; 
      background-color: #0A0A0A; 
      margin: 0; 
      padding: 0; 
    }
    .container { 
      max-width: 650px; 
      margin: 40px auto; 
      background-color: #1A1A1A; 
      border-radius: 15px; 
      overflow: hidden; 
      box-shadow: 0 10px 40px rgba(226, 27, 35, 0.3);
      border: 2px solid rgba(226, 27, 35, 0.3);
    }
    .header { 
      background: linear-gradient(135deg, #E21B23 0%, #8B0000 100%); 
      color: white; 
      padding: 50px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 3s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.3; }
    }
    .header h1 { 
      margin: 0; 
      font-size: 42px; 
      font-weight: 900; 
      font-style: italic;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
      position: relative;
      z-index: 1;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 3px;
      font-weight: 700;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    .fire-icon {
      font-size: 60px;
      margin: 20px 0;
      display: block;
      animation: fire 1.5s ease-in-out infinite;
    }
    @keyframes fire {
      0%, 100% { transform: scale(1) rotate(-5deg); }
      50% { transform: scale(1.1) rotate(5deg); }
    }
    .content { 
      padding: 50px 40px; 
      color: #E5E7EB;
    }
    .welcome-box { 
      background: linear-gradient(135deg, rgba(226, 27, 35, 0.1) 0%, rgba(139, 0, 0, 0.1) 100%);
      border-left: 6px solid #E21B23; 
      padding: 30px; 
      margin: 30px 0; 
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(226, 27, 35, 0.2);
    }
    .welcome-box h2 {
      margin: 0 0 15px 0;
      color: #E21B23;
      font-size: 28px;
      font-weight: 900;
      font-style: italic;
      text-transform: uppercase;
    }
    .quote-box {
      background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%);
      border: 2px solid #E21B23;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
      position: relative;
      box-shadow: 0 0 30px rgba(226, 27, 35, 0.4);
    }
    .quote-box::before {
      content: '"';
      position: absolute;
      top: -20px;
      left: 20px;
      font-size: 100px;
      color: #E21B23;
      opacity: 0.3;
      font-family: Georgia, serif;
    }
    .quote-text {
      font-size: 24px;
      font-weight: 700;
      font-style: italic;
      color: #FFFFFF;
      line-height: 1.6;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      margin: 0;
      position: relative;
      z-index: 1;
    }
    .highlight {
      color: #E21B23;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 28px;
    }
    .btn-login { 
      display: inline-block; 
      background: linear-gradient(135deg, #E21B23 0%, #8B0000 100%); 
      color: white; 
      padding: 18px 40px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 900; 
      font-size: 18px; 
      margin: 30px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-style: italic;
      box-shadow: 0 6px 20px rgba(226, 27, 35, 0.4);
      transition: all 0.3s ease;
    }
    .info-box { 
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(3, 105, 161, 0.1) 100%);
      border-left: 4px solid #0ea5e9; 
      padding: 20px; 
      margin: 25px 0; 
      border-radius: 8px;
      color: #93C5FD;
    }
    .footer { 
      background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%);
      color: #9ca3af; 
      padding: 30px; 
      text-align: center; 
      font-size: 13px;
      border-top: 2px solid rgba(226, 27, 35, 0.3);
    }
    .footer p {
      margin: 8px 0;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      color: #E21B23;
      text-decoration: none;
      margin: 0 10px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="fire-icon">🔥</span>
      <h1>TITANES EVOLUTION</h1>
      <p>Cheer • Passion • Victory</p>
    </div>
    
    <div class="content">
      <h2 style="color: #E21B23; font-size: 32px; font-weight: 900; font-style: italic; margin-bottom: 20px;">
        ¡BIENVENIDO ${nombreCompleto.toUpperCase()}! 🎉
      </h2>
      
      <div class="welcome-box">
        <h2>¡Eres oficialmente un TITÁN!</h2>
        <p style="margin: 0; color: #E5E7EB; font-size: 16px; line-height: 1.8;">
          Has dado el primer paso para formar parte de la familia más apasionada del cheerleading en Colombia. 
          Estamos emocionados de acompañarte en este viaje hacia la grandeza deportiva.
        </p>
      </div>
      
      <div class="quote-box">
        <p class="quote-text">
          ¡Que todo el mundo sepa que<br>
          <span class="highlight">EL GRAN ROJO</span><br>
          está en la casa!
        </p>
      </div>
      
      <p style="color: #D1D5DB; font-size: 16px; line-height: 1.8; margin: 25px 0;">
        Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a tu portal personal donde encontrarás:
      </p>
      
      <ul style="color: #D1D5DB; font-size: 15px; line-height: 2; margin: 20px 0;">
        <li>📊 <strong style="color: #E21B23;">Tu progreso</strong> y evaluaciones</li>
        <li>📅 <strong style="color: #E21B23;">Calendario</strong> de entrenamientos y eventos</li>
        <li>🏆 <strong style="color: #E21B23;">Habilidades</strong> y metas por alcanzar</li>
        <li>📸 <strong style="color: #E21B23;">Galería</strong> de momentos memorables</li>
        <li>👥 <strong style="color: #E21B23;">Conexión</strong> con tu equipo</li>
      </ul>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${loginUrl}" class="btn-login" style="color: white;">
          🚀 ACCEDER A MI CUENTA
        </a>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #93C5FD; font-weight: 700;">
          💡 <strong>Consejo:</strong> Guarda este correo. Aquí está tu enlace de acceso directo.
        </p>
      </div>
      
      <div style="background: rgba(226, 27, 35, 0.05); border-radius: 10px; padding: 25px; margin: 30px 0;">
        <p style="margin: 0 0 15px 0; color: #E5E7EB; font-size: 15px;">
          <strong style="color: #E21B23;">📧 Tu email de acceso:</strong><br>
          <code style="background: rgba(0,0,0,0.5); padding: 8px 15px; border-radius: 5px; font-size: 14px; display: inline-block; margin-top: 8px;">${email}</code>
        </p>
        <p style="margin: 15px 0 0 0; color: #9CA3AF; font-size: 13px;">
          Usa la contraseña que creaste durante el registro para iniciar sesión.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0; font-weight: 700; font-size: 15px; color: #E21B23;">
        🔥 TITANES CHEER EVOLUTION
      </p>
      <p style="margin: 5px 0;">
        © ${new Date().getFullYear()} Titanes Cheer Evolution - Duitama, Boyacá
      </p>
      <p style="margin: 5px 0;">
        Sistema de Gestión Deportiva
      </p>
      <div class="social-links">
        <p style="margin: 15px 0 5px 0; color: #6B7280;">Síguenos en redes sociales:</p>
        <a href="#" style="color: #E21B23;">Instagram</a> | 
        <a href="#" style="color: #E21B23;">Facebook</a> | 
        <a href="#" style="color: #E21B23;">TikTok</a>
      </div>
      <p style="margin: 15px 0 5px 0; font-size: 11px; color: #6B7280;">
        ¿Tienes preguntas? Contáctanos en:<br>
        📧 titanesallstarscolombia@gmail.com<br>
        📱 313-3864382 | 314-4624936
      </p>
    </div>
  </div>
</body>
</html>`;

      console.log('📤 Enviando email de bienvenida vía Brevo API...');
      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ EMAIL DE BIENVENIDA ENVIADO EXITOSAMENTE');
      console.log('📧 Message ID:', data.messageId || 'sent');
      console.log('📨 Destinatario:', email);
      console.log('📧 === EMAIL DE BIENVENIDA ENVIADO ===\n');

      return {
        success: true,
        messageId: data.messageId || 'sent'
      };
    } catch (error) {
      console.error('❌ ERROR ENVIANDO EMAIL DE BIENVENIDA:');
      console.error('🔍 Mensaje:', error.message);
      
      if (error.response) {
        console.error('🔍 Status:', error.response.status);
        console.error('🔍 Body:', error.response.body);
      }
      
      throw error;
    }
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
      const registroUrl = `${frontendUrl}/auth/registro-entrenador-step1.html?token=${tokenRegistro}`;

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
      const registroUrl = `${frontendUrl}/auth/registro-entrenador-step1.html?token=${tokenRegistro}`;

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