// backend/src/controllers/authController.js - VERSIÓN CORREGIDA COMPLETA
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Deportista } = require('../models');
const { validationResult } = require('express-validator');
// ✅ IMPORTAR EMAIL SERVICE DESDE LA RUTA CORRECTA
const EmailService = require('../config/emailService');

class AuthController {
  // Login de usuario - JWT OPTIMIZADO
  static async login(req, res) {
    try {
      console.log('📥 Petición de login recibida:', req.body.email);

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos'
        });
      }

      console.log('🔍 Buscando usuario en BD...');
      const user = await User.findOne({
        where: { email },
        attributes: ['id', 'nombre', 'email', 'password', 'role', 'activo', 'telefono', 'niveles_asignados']
      });

      if (!user) {
        console.log('❌ Usuario no encontrado:', email);
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      console.log('✅ Usuario encontrado:', user.email);
    
    // 🔥 AGREGAR ESTE DEBUG DETALLADO
    console.log('\n🔍 === VERIFICACIÓN DE LOGIN ===');
    console.log('📧 Email:', email);
    console.log('🔐 Contraseña recibida (length):', password.length);
    console.log('🔐 Primeros 3 chars:', password.substring(0, 3) + '...');
    console.log('🔒 Hash en BD:', user.password.substring(0, 20) + '...');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('✅ Resultado comparación:', isPasswordValid ? 'VÁLIDA ✓' : 'INVÁLIDA ✗');

    if (!isPasswordValid) {
      console.log('❌ Contraseña incorrecta');
      console.log('   - Email usado:', email);
      console.log('   - Password usado:', password);
      console.log('   - Hash en BD:', user.password);
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

      console.log('✅ Contraseña válida');

      if (!user.activo) {
        console.log('❌ Usuario inactivo');
        return res.status(401).json({
          error: 'Usuario inactivo'
        });
      }

      // ✅ JWT MÍNIMO - Solo datos esenciales
      console.log('🔑 Generando token optimizado...');
      
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'secret-key-desarrollo',
        { expiresIn: '7d' }
      );

      console.log('📏 Token length:', token.length, 'caracteres');

      // Respuesta completa del usuario
      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        telefono: user.telefono,
        activo: user.activo,
        niveles_asignados: user.niveles_asignados || []
      };

      // Solo buscar deportista si es necesario
      if (user.role === 'deportista') {
        const deportista = await Deportista.findOne({
          where: { user_id: user.id },
          attributes: ['id', 'altura', 'peso', 'nivel_actual', 'estado', 'foto_perfil']
        });
        
        if (deportista) {
          userResponse.deportista = deportista;
        }
      }

      console.log('✅ Login exitoso para:', user.email);

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Registro de usuario
  static async register(req, res) {
    try {
      console.log('📥 Petición de registro recibida');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nombre, email, password, role, telefono } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        nombre,
        email,
        password: hashedPassword,
        role: role || 'deportista',
        telefono,
        activo: true
      });

      console.log('✅ Usuario creado:', user.email);

      if (user.role === 'deportista') {
        await Deportista.create({
          user_id: user.id,
          nivel_actual: 'pendiente',
          estado: 'activo'
        });
      }

      // ✅ JWT optimizado
      const tokenPayload = { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      };
      
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'secret-key-desarrollo',
        { expiresIn: '7d' }
      );

      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        telefono: user.telefono,
        activo: user.activo
      };

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: userResponse,
        token
      });

    } catch (error) {
      console.error('❌ Error en registro:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Registro deportista con archivos
  static async registroDeportista(req, res) {
    try {
      const {
        nombre,
        email,
        password,
        telefono,
        fecha_nacimiento,
        contacto_emergencia_nombre,
        contacto_emergencia_telefono
      } = req.body;

      if (!nombre || !email || !password) {
        return res.status(400).json({
          error: 'Nombre, email y contraseña son obligatorios'
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        nombre,
        email,
        password: hashedPassword,
        role: 'deportista',
        telefono,
        activo: true
      });

      const deportista = await Deportista.create({
        user_id: user.id,
        nivel_actual: 'pendiente',
        estado: 'activo',
        fecha_nacimiento: fecha_nacimiento || null,
        contacto_emergencia_nombre: contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: contacto_emergencia_telefono || null
      });

      // ✅ JWT optimizado
      const tokenPayload = { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      };
      
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'secret-key-desarrollo',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: '¡Registro exitoso!',
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('❌ Error en registroDeportista:', error);
      res.status(500).json({
        error: 'Error en el registro',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Perfil del usuario
  static async getProfile(req, res) {
    try {
      const user = req.user;

      const userComplete = await User.findByPk(user.id, {
        attributes: ['id', 'nombre', 'email', 'role', 'telefono', 'activo', 'niveles_asignados']
      });

      let deportistaProfile = null;
      if (user.role === 'deportista') {
        deportistaProfile = await Deportista.findOne({
          where: { user_id: user.id },
          attributes: ['id', 'altura', 'peso', 'nivel_actual', 'estado', 'foto_perfil']
        });
      }

      const userResponse = {
        id: userComplete.id,
        nombre: userComplete.nombre,
        email: userComplete.email,
        role: userComplete.role,
        telefono: userComplete.telefono,
        activo: userComplete.activo,
        niveles_asignados: userComplete.niveles_asignados || []
      };

      if (deportistaProfile) {
        userResponse.deportista = deportistaProfile;
      }

      res.json({
        success: true,
        user: userResponse
      });

    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // ✅✅✅ MÉTODO CORREGIDO: Recuperación de contraseña
  static async solicitarRecuperacion(req, res) {
    try {
      const { email } = req.body;

      console.log('\n📧 === SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA ===');
      console.log('Email solicitado:', email);

      if (!email) {
        return res.status(400).json({ error: 'Email es requerido' });
      }

      const user = await User.findOne({ where: { email } });

      // Por seguridad, siempre devolver éxito incluso si el usuario no existe
      if (!user) {
        console.log('⚠️  Email no encontrado en la base de datos');
        return res.json({
          success: true,
          message: 'Si el email existe, recibirás un código'
        });
      }

      console.log('✅ Usuario encontrado:', user.nombre, `(${user.email})`);

      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('🔑 Código generado:', code);

      // Guardar en base de datos con expiración de 15 minutos
      user.reset_password_code = code;
      user.reset_password_expires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      console.log('💾 Código guardado en BD para usuario ID:', user.id);

      // ✅✅✅ ENVIAR EL EMAIL - ESTA ES LA PARTE CRÍTICA QUE FALTABA ✅✅✅
      try {
        console.log('📤 Enviando email a través de EmailService...');
        const emailResult = await EmailService.sendRecoveryCode(
          email, 
          code, 
          user.nombre || 'Usuario'
        );
        console.log('✅ Email enviado exitosamente');
        console.log('📨 Message ID:', emailResult.messageId);
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError.message);
        // Aún así devolver éxito para no revelar información
        return res.json({
          success: true,
          message: 'Si el email existe, recibirás un código'
        });
      }

      console.log('🏁 Proceso de recuperación completado con éxito');

      res.json({
        success: true,
        message: 'Código enviado a tu email'
      });

    } catch (error) {
      console.error('❌ Error en solicitarRecuperacion:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Verificar código y cambiar contraseña
  static async verificarYCambiarPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;

      console.log('\n🔐 === VERIFICACIÓN Y CAMBIO DE CONTRASEÑA ===');
      console.log('Email:', email);
      console.log('Código recibido:', code);

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          error: 'Email, código y nueva contraseña son requeridos'
        });
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      if (!user.reset_password_code || user.reset_password_code !== code) {
        console.log('❌ Código inválido');
        return res.status(400).json({
          error: 'Código inválido o expirado'
        });
      }

      if (new Date() > user.reset_password_expires) {
        console.log('❌ Código expirado');
        user.reset_password_code = null;
        user.reset_password_expires = null;
        await user.save();
        return res.status(400).json({
          error: 'El código ha expirado. Solicita uno nuevo.'
        });
      }

      console.log('✅ Código verificado correctamente');
      console.log('🔐 Cambiando contraseña...');

      user.password = await bcrypt.hash(newPassword, 10);
      user.reset_password_code = null;
      user.reset_password_expires = null;
      await user.save();

      console.log('✅ Contraseña actualizada exitosamente para:', user.email);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en verificarYCambiarPassword:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  static async verificarCodigo(req, res) {
    try {
      const { email, code } = req.body;

      console.log('\n🔐 === VERIFICACIÓN DE CÓDIGO (SOLO VERIFICAR) ===');
      console.log('Email:', email);
      console.log('Código recibido:', code);

      if (!email || !code) {
        return res.status(400).json({
          error: 'Email y código son requeridos'
        });
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Código inválido o expirado'
        });
      }

      if (!user.reset_password_code || user.reset_password_code !== code) {
        console.log('❌ Código inválido');
        return res.status(400).json({
          success: false,
          error: 'Código inválido o expirado'
        });
      }

      if (new Date() > user.reset_password_expires) {
        console.log('❌ Código expirado');
        user.reset_password_code = null;
        user.reset_password_expires = null;
        await user.save();
        return res.status(400).json({
          success: false,
          error: 'El código ha expirado. Solicita uno nuevo.'
        });
      }

      console.log('✅ Código verificado correctamente (solo verificación)');

      res.json({
        success: true,
        message: 'Código verificado correctamente',
        email: user.email
      });

    } catch (error) {
      console.error('❌ Error en verificarCodigo:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor'
      });
    }
  }  
  
  
}


module.exports = AuthController;