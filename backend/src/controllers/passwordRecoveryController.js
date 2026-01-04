// backend/src/controllers/passwordRecoveryController.js
const { User } = require('../models');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class PasswordRecoveryController {
  
  // Configurar transporter de email
  static getEmailTransporter() {
    return nodemailer.createTransporter({
      service: 'gmail', // o tu servicio de email
      auth: {
        user: process.env.EMAIL_USER || 'tu-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'tu-contraseña-app'
      }
    });
  }
  
  // Solicitar código de recuperación
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: 'El email es requerido'
        });
      }
      
      // Buscar usuario
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Por seguridad, no revelamos si el usuario existe
        return res.json({
          success: true,
          message: 'Si el email existe, recibirás un código de recuperación'
        });
      }
      
      // Generar código de 6 dígitos
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Guardar código con expiración de 15 minutos
      const resetExpires = new Date(Date.now() + 15 * 60 * 1000);
      
      await user.update({
        reset_password_code: resetCode,
        reset_password_expires: resetExpires
      });
      
      // Enviar email
      try {
        const transporter = this.getEmailTransporter();
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: '🔐 Código de Recuperación - Sistema Deportivo',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">🏆 Sistema Deportivo</h1>
              </div>
              
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #333;">Recuperación de Contraseña</h2>
                <p style="color: #666; font-size: 16px;">
                  Hola <strong>${user.nombre}</strong>,
                </p>
                <p style="color: #666; font-size: 16px;">
                  Recibimos una solicitud para restablecer tu contraseña. 
                  Usa el siguiente código para continuar:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                  <p style="color: #999; font-size: 14px; margin: 0;">Tu código de verificación es:</p>
                  <h1 style="color: #667eea; font-size: 48px; margin: 10px 0; letter-spacing: 8px;">
                    ${resetCode}
                  </h1>
                  <p style="color: #999; font-size: 14px; margin: 0;">Válido por 15 minutos</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  Si no solicitaste este cambio, ignora este mensaje.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Este es un mensaje automático, por favor no respondas.
                  </p>
                </div>
              </div>
            </div>
          `
        });
        
        console.log('✅ Email de recuperación enviado a:', email);
        
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        return res.status(500).json({
          error: 'Error enviando el email. Intenta de nuevo más tarde.'
        });
      }
      
      res.json({
        success: true,
        message: 'Código de recuperación enviado al email'
      });
      
    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }
  
  // Verificar código
  static async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({
          error: 'Email y código son requeridos'
        });
      }
      
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }
      
      // Verificar código
      if (user.reset_password_code !== code) {
        return res.status(400).json({
          error: 'Código inválido'
        });
      }
      
      // Verificar expiración
      if (new Date() > user.reset_password_expires) {
        return res.status(400).json({
          error: 'El código ha expirado. Solicita uno nuevo.'
        });
      }
      
      res.json({
        success: true,
        message: 'Código verificado correctamente'
      });
      
    } catch (error) {
      console.error('Error en verifyResetCode:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }
  
  // Restablecer contraseña
  static async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({
          error: 'Todos los campos son requeridos'
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }
      
      // Verificar código
      if (user.reset_password_code !== code) {
        return res.status(400).json({
          error: 'Código inválido'
        });
      }
      
      // Verificar expiración
      if (new Date() > user.reset_password_expires) {
        return res.status(400).json({
          error: 'El código ha expirado'
        });
      }
      
      // Actualizar contraseña y limpiar código
      await user.update({
        password: newPassword, // Se hashea automáticamente por el hook
        reset_password_code: null,
        reset_password_expires: null
      });
      
      console.log('✅ Contraseña restablecida para:', user.email);
      
      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
      });
      
    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }
}

module.exports = PasswordRecoveryController;