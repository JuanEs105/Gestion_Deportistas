// backend/src/services/emailService.js - VERSIÓN COMPLETA CON RESEND Y GMAIL
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('📧 Inicializando EmailService...');
    
    // Detectar si usar Resend o Gmail
    this.useResend = process.env.EMAIL_SERVICE === 'resend' && process.env.RESEND_API_KEY;
    
    if (this.useResend) {
      console.log('📮 Usando RESEND para envío de emails');
      const { Resend } = require('resend');
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.log('📮 Usando GMAIL para envío de emails');
      console.log('📤 EMAIL_USER:', process.env.EMAIL_USER ? 'Configurado' : 'NO CONFIGURADO');
      console.log('📤 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Configurado' : 'NO CONFIGURADO');

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.verifyConnection();
    }
  }

  // ====================
  // CÓDIGO DE ACTIVACIÓN
  // ====================
  async sendActivationCode(email, code, userName) {
    try {
      console.log('\n📧 === ENVIANDO CÓDIGO DE ACTIVACIÓN ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', userName);
      console.log('🔢 Código:', code);

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #E21B23 0%, #000000 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .activation-box {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-left: 4px solid #E21B23;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
      text-align: center;
    }
    .code {
      font-size: 48px;
      font-weight: bold;
      color: #E21B23;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 15px 0;
    }
    .footer {
      background-color: #1f2937;
      color: #9ca3af;
      padding: 20px;
      text-align: center;
      font-size: 12px;
    }
    @media only screen and (max-width: 600px) {
      .code {
        font-size: 36px;
        letter-spacing: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Activación de Cuenta</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Titanes Evolution</p>
    </div>
    <div class="content">
      <h2 style="color: #1f2937; margin-top: 0;">¡Hola ${userName}!</h2>
      <p style="color: #6b7280; font-size: 16px;">Usa este código de 6 dígitos para activar tu cuenta:</p>
      <div class="activation-box">
        <p style="margin: 0; color: #E21B23; font-weight: bold; font-size: 14px; text-transform: uppercase;">Tu código de activación</p>
        <div class="code">${code}</div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">⏰ Válido por 15 minutos</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
      <p style="margin: 10px 0 0 0;">Sistema de Gestión Deportiva</p>
    </div>
  </div>
</body>
</html>`;

      if (this.useResend) {
        // Usar Resend
        const data = await this.resend.emails.send({
          from: 'Titanes Evolution <onboarding@resend.dev>',
          to: [email],
          subject: '🎯 Código de Activación - Titanes Evolution',
          html: htmlContent
        });

        console.log('✅ CÓDIGO ENVIADO VÍA RESEND');
        console.log('📧 Message ID:', data.id);
        return { success: true, messageId: data.id };
        
      } else {
        // Usar Gmail
        const mailOptions = {
          from: {
            name: 'Titanes Evolution',
            address: process.env.EMAIL_USER
          },
          to: email,
          subject: '🎯 Código de Activación - Titanes Evolution',
          html: htmlContent
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ CÓDIGO ENVIADO VÍA GMAIL');
        console.log('📧 Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
      }

    } catch (error) {
      console.error('❌ ERROR ENVIANDO CÓDIGO:', error.message);
      throw error;
    }
  }

  // ====================
  // CÓDIGO DE RECUPERACIÓN
  // ====================
  async sendRecoveryCode(email, code, userName) {
    try {
      console.log('\n🔐 === ENVIANDO CÓDIGO DE RECUPERACIÓN ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', userName);
      console.log('🔢 Código:', code);

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .recovery-box {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-left: 4px solid #dc2626;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
      text-align: center;
    }
    .code {
      font-size: 48px;
      font-weight: bold;
      color: #dc2626;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 15px 0;
    }
    .footer {
      background-color: #1f2937;
      color: #9ca3af;
      padding: 20px;
      text-align: center;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperación de Contraseña</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Titanes Evolution</p>
    </div>
    <div class="content">
      <h2 style="color: #1f2937; margin-top: 0;">¡Hola ${userName}!</h2>
      <p style="color: #6b7280; font-size: 16px;">Has solicitado recuperar tu contraseña. Usa este código de 6 dígitos:</p>
      <div class="recovery-box">
        <p style="margin: 0; color: #dc2626; font-weight: bold; font-size: 14px; text-transform: uppercase;">Código de recuperación</p>
        <div class="code">${code}</div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">⏰ Válido por 15 minutos</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste recuperar tu contraseña, ignora este mensaje. Tu cuenta permanecerá segura.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
      <p style="margin: 10px 0 0 0;">Sistema de Gestión Deportiva</p>
    </div>
  </div>
</body>
</html>`;

      if (this.useResend) {
        const data = await this.resend.emails.send({
          from: 'Titanes Evolution <onboarding@resend.dev>',
          to: [email],
          subject: '🔐 Código de Recuperación - Titanes Evolution',
          html: htmlContent
        });

        console.log('✅ CÓDIGO DE RECUPERACIÓN ENVIADO VÍA RESEND');
        console.log('📧 Message ID:', data.id);
        return { success: true, messageId: data.id };
        
      } else {
        const mailOptions = {
          from: {
            name: 'Titanes Evolution',
            address: process.env.EMAIL_USER
          },
          to: email,
          subject: '🔐 Código de Recuperación - Titanes Evolution',
          html: htmlContent
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ CÓDIGO DE RECUPERACIÓN ENVIADO VÍA GMAIL');
        console.log('📧 Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
      }

    } catch (error) {
      console.error('❌ ERROR ENVIANDO CÓDIGO DE RECUPERACIÓN:', error.message);
      throw error;
    }
  }

  // ====================
  // EMAIL DE REGISTRO
  // ====================
  async enviarEmailRegistroEntrenador(email, nombre, codigoActivacion) {
    try {
      console.log('\n👋 === ENVIANDO EMAIL DE BIENVENIDA ===');
      console.log('👤 Para:', email);
      console.log('📛 Nombre:', nombre);

      const frontendUrl = process.env.FRONTEND_URL || 'https://web-k0bmgijdoire.up-de-fra1-k8s-1.apps.run-on-seenode.com';

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #E21B23 0%, #000000 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: #E21B23; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a Titanes Evolution! 🎯</h1>
    </div>
    <div class="content">
      <h2 style="color: #1f2937;">¡Hola ${nombre}!</h2>
      <p style="color: #6b7280;">Tu cuenta ha sido creada exitosamente. Ya puedes acceder al sistema de gestión deportiva.</p>
      <p style="color: #6b7280;">Para completar tu registro, activa tu cuenta con el código:</p>
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 36px; font-weight: bold; color: #E21B23; letter-spacing: 4px;">${codigoActivacion}</div>
      </div>
      <p style="text-align: center;">
        <a href="${frontendUrl}/activar-cuenta" class="button">Activar Cuenta</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
    </div>
  </div>
</body>
</html>`;

      if (this.useResend) {
        const data = await this.resend.emails.send({
          from: 'Titanes Evolution <onboarding@resend.dev>',
          to: [email],
          subject: '¡Bienvenido a Titanes Evolution! 🎯',
          html: htmlContent
        });

        console.log('✅ EMAIL DE BIENVENIDA ENVIADO VÍA RESEND');
        return { success: true, messageId: data.id };
        
      } else {
        const mailOptions = {
          from: { name: 'Titanes Evolution', address: process.env.EMAIL_USER },
          to: email,
          subject: '¡Bienvenido a Titanes Evolution! 🎯',
          html: htmlContent
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ EMAIL DE BIENVENIDA ENVIADO VÍA GMAIL');
        return { success: true, messageId: info.messageId };
      }

    } catch (error) {
      console.error('❌ ERROR ENVIANDO EMAIL DE REGISTRO:', error.message);
      throw error;
    }
  }

  // ====================
  // RECORDATORIO
  // ====================
  async enviarRecordatorioRegistro(email, nombre, codigoActivacion) {
    try {
      console.log('\n⏰ === ENVIANDO RECORDATORIO ===');
      console.log('👤 Para:', email);

      const frontendUrl = process.env.FRONTEND_URL || 'https://web-k0bmgijdoire.up-de-fra1-k8s-1.apps.run-on-seenode.com';

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Activación</h1>
    </div>
    <div class="content">
      <h2 style="color: #1f2937;">¡Hola ${nombre}!</h2>
      <p style="color: #6b7280;">Tu cuenta aún no ha sido activada. No olvides completar tu registro.</p>
      <p style="color: #6b7280;">Tu código de activación es:</p>
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 36px; font-weight: bold; color: #d97706; letter-spacing: 4px;">${codigoActivacion}</div>
      </div>
      <p style="text-align: center;">
        <a href="${frontendUrl}/activar-cuenta" class="button">Activar Ahora</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Titanes Cheer Evolution</p>
    </div>
  </div>
</body>
</html>`;

      if (this.useResend) {
        const data = await this.resend.emails.send({
          from: 'Titanes Evolution <onboarding@resend.dev>',
          to: [email],
          subject: '⏰ Recordatorio: Activa tu cuenta - Titanes Evolution',
          html: htmlContent
        });

        console.log('✅ RECORDATORIO ENVIADO VÍA RESEND');
        return { success: true, messageId: data.id };
        
      } else {
        const mailOptions = {
          from: { name: 'Titanes Evolution', address: process.env.EMAIL_USER },
          to: email,
          subject: '⏰ Recordatorio: Activa tu cuenta - Titanes Evolution',
          html: htmlContent
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ RECORDATORIO ENVIADO VÍA GMAIL');
        return { success: true, messageId: info.messageId };
      }

    } catch (error) {
      console.error('❌ ERROR ENVIANDO RECORDATORIO:', error.message);
      throw error;
    }
  }

  // ====================
  // VERIFICAR CONEXIÓN
  // ====================
  async verifyConnection() {
    if (this.useResend) {
      console.log('✅ Resend configurado correctamente');
      return true;
    }
    
    try {
      console.log('🔌 Verificando conexión con Gmail...');
      await this.transporter.verify();
      console.log('✅ CONEXIÓN CON GMAIL EXITOSA');
      return true;
    } catch (error) {
      console.error('❌ ERROR DE CONEXIÓN CON GMAIL:');
      console.error('🔍 Código:', error.code);
      console.error('📝 Mensaje:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();