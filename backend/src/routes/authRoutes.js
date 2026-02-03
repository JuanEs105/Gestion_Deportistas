// backend/src/routes/authRoutes.js - VERSIÓN COMPLETA CON TODOS LOS ENDPOINTS

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { uploadRegistro } = require('../config/cloudinary');
const { authMiddleware } = require('../middleware/auth');

// ====================
// ✅ NUEVAS RUTAS PARA REGISTRO DE ENTRENADOR
// ====================

// ✅ PASO 1: Solicitar código de registro
router.post('/solicitar-codigo-registro', [
    body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
    try {
        console.log('📧 RUTA: Solicitud de código de registro para entrenador');
        
        // Importar el controlador correctamente
        const { User } = require('../models');
        const bcrypt = require('bcryptjs');
        const EmailService = require('../config/emailService');
        
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email es requerido'
            });
        }
        
        console.log('🔍 Buscando entrenador pendiente con email:', email);
        
        // Buscar entrenador PENDIENTE de registro
        const entrenador = await User.findOne({
            where: {
                email: email.toLowerCase().trim(),
                role: 'entrenador',
                requiere_registro: true,
                activo: false
            }
        });
        
        if (!entrenador) {
            console.log('❌ No hay entrenador pendiente con ese email');
            return res.status(404).json({
                success: false,
                error: 'No se encontró un entrenador pendiente de registro con este email. Contacta al administrador.'
            });
        }
        
        console.log('✅ Entrenador encontrado:', entrenador.nombre);
        
        // Verificar si ya tiene una contraseña (ya está registrado)
        if (entrenador.password) {
            console.log('⚠️  Este entrenador ya tiene contraseña configurada');
            return res.status(400).json({
                success: false,
                error: 'Este entrenador ya completó su registro. Inicia sesión directamente.'
            });
        }
        
        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔑 Código generado:', codigo);
        
        // Guardar código en la base de datos (15 minutos de validez)
        entrenador.reset_password_code = codigo;
        entrenador.reset_password_expires = new Date(Date.now() + 15 * 60 * 1000);
        await entrenador.save();
        
        console.log('💾 Código guardado en BD para:', entrenador.email);
        
        // Enviar email con el código
        try {
            await EmailService.sendActivationCode(
                entrenador.email,
                codigo,
                entrenador.nombre
            );
            
            console.log('📤 Email enviado exitosamente');
        } catch (emailError) {
            console.error('❌ Error enviando email:', emailError.message);
            // Aún así responder éxito para no revelar información
            return res.json({
                success: true,
                message: 'Si el email existe, recibirás un código de activación'
            });
        }
        
        res.json({
            success: true,
            message: 'Código de activación enviado a tu email',
            expiresIn: 15 // minutos
        });
        
    } catch (error) {
        console.error('❌ Error en solicitar-codigo-registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ✅ PASO 2: Verificar código de registro
router.post('/verificar-codigo-registro', [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código debe tener 6 dígitos')
], async (req, res) => {
    try {
        console.log('🔍 RUTA: Verificación de código de registro');
        
        const { User } = require('../models');
        const crypto = require('crypto');
        
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                error: 'Email y código son requeridos'
            });
        }
        
        console.log('🔍 Buscando entrenador:', email);
        
        // Buscar entrenador
        const entrenador = await User.findOne({
            where: {
                email: email.toLowerCase().trim(),
                role: 'entrenador',
                requiere_registro: true
            }
        });
        
        if (!entrenador) {
            console.log('❌ Entrenador no encontrado');
            return res.status(404).json({
                success: false,
                error: 'No se encontró un entrenador pendiente con este email'
            });
        }
        
        // Verificar que el código coincida
        if (!entrenador.reset_password_code || entrenador.reset_password_code !== code) {
            console.log('❌ Código incorrecto');
            return res.status(400).json({
                success: false,
                error: 'Código incorrecto'
            });
        }
        
        // Verificar que el código no haya expirado
        if (new Date() > entrenador.reset_password_expires) {
            console.log('❌ Código expirado');
            
            // Limpiar código expirado
            entrenador.reset_password_code = null;
            entrenador.reset_password_expires = null;
            await entrenador.save();
            
            return res.status(400).json({
                success: false,
                error: 'El código ha expirado. Solicita uno nuevo.'
            });
        }
        
        console.log('✅ Código verificado correctamente para:', entrenador.email);
        
        // Generar token de verificación para el paso 3
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Guardar token (30 minutos de validez)
        entrenador.verification_token = verificationToken;
        entrenador.verification_token_expires = new Date(Date.now() + 30 * 60 * 1000);
        
        // Limpiar código de verificación
        entrenador.reset_password_code = null;
        entrenador.reset_password_expires = null;
        
        await entrenador.save();
        
        console.log('🔐 Token de verificación generado:', verificationToken.substring(0, 20) + '...');
        
        res.json({
            success: true,
            message: 'Código verificado correctamente',
            verificationToken: verificationToken,
            expiresIn: 30 // minutos
        });
        
    } catch (error) {
        console.error('❌ Error en verificar-codigo-registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ✅ PASO 3: Completar registro con contraseña
router.post('/completar-registro-contrasena', [
    body('email').isEmail().withMessage('Email inválido'),
    body('verificationToken').notEmpty().withMessage('Token de verificación requerido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('La contraseña debe contener letras y números'),
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Las contraseñas no coinciden')
], async (req, res) => {
    try {
        console.log('🔐 RUTA: Completar registro con contraseña');
        
        const { User } = require('../models');
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        
        const { email, verificationToken, password, confirmPassword } = req.body;
        
        console.log('📋 Datos recibidos para activar cuenta:', { email });
        
        // Validaciones básicas
        if (!email || !verificationToken || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }
        
        // Verificar que las contraseñas coincidan
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Las contraseñas no coinciden'
            });
        }
        
        // Validar fortaleza de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        if (!hasLetter || !hasNumber) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe contener letras y números'
            });
        }
        
        // Buscar entrenador con el token de verificación
        const entrenador = await User.findOne({
            where: {
                email: email.toLowerCase().trim(),
                verification_token: verificationToken,
                role: 'entrenador',
                requiere_registro: true
            }
        });
        
        if (!entrenador) {
            console.log('❌ Token de verificación inválido o ya usado');
            return res.status(404).json({
                success: false,
                error: 'Token de verificación inválido o expirado'
            });
        }
        
        // Verificar que el token no haya expirado
        if (entrenador.verification_token_expires && 
            entrenador.verification_token_expires < new Date()) {
            console.log('❌ Token expirado');
            return res.status(400).json({
                success: false,
                error: 'El token de verificación ha expirado. Vuelve a solicitar un código.'
            });
        }
        
        console.log('✅ Token válido. Activando cuenta de:', entrenador.email);
        
        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Actualizar usuario: activar cuenta, guardar contraseña, limpiar tokens
        entrenador.password = hashedPassword;
        entrenador.activo = true;
        entrenador.requiere_registro = false;
        entrenador.reset_password_code = null;
        entrenador.reset_password_expires = null;
        entrenador.verification_token = null;
        entrenador.verification_token_expires = null;
        entrenador.token_registro = null;
        
        await entrenador.save();
        
        console.log('✅✅✅ REGISTRO COMPLETADO EXITOSAMENTE:', entrenador.email);
        
        // Generar token de sesión para login automático
        const sessionToken = jwt.sign(
            {
                id: entrenador.id,
                email: entrenador.email,
                role: entrenador.role
            },
            process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui_12345_2024',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: '¡Registro completado exitosamente! Tu cuenta ha sido activada.',
            token: sessionToken,
            user: {
                id: entrenador.id,
                nombre: entrenador.nombre,
                email: entrenador.email,
                role: entrenador.role,
                activo: entrenador.activo
            },
            redirectTo: '/login?role=entrenador&registered=true'
        });
        
    } catch (error) {
        console.error('❌ Error en completar-registro-contrasena:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ✅ VERIFICAR TOKEN DE REGISTRO (para validar en frontend)
router.get('/verificar-token-registro/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        console.log('🔍 RUTA: Verificación de token de registro');
        
        const { User } = require('../models');
        
        // Buscar entrenador con el token de verificación
        const entrenador = await User.findOne({
            where: {
                verification_token: token,
                role: 'entrenador',
                requiere_registro: true
            },
            attributes: ['id', 'nombre', 'email', 'verification_token_expires']
        });
        
        if (!entrenador) {
            console.log('❌ Token no encontrado o ya fue utilizado');
            return res.status(404).json({
                success: false,
                error: 'Token de verificación inválido o ya fue utilizado'
            });
        }
        
        // Verificar si el token ha expirado
        if (entrenador.verification_token_expires && 
            entrenador.verification_token_expires < new Date()) {
            console.log('❌ Token expirado');
            return res.status(400).json({
                success: false,
                error: 'El token de verificación ha expirado. Vuelve a solicitar un código.'
            });
        }
        
        console.log('✅ Token válido para:', entrenador.email);
        
        res.json({
            success: true,
            message: 'Token válido. Puedes establecer tu contraseña.',
            entrenador: {
                id: entrenador.id,
                nombre: entrenador.nombre,
                email: entrenador.email
            }
        });
        
    } catch (error) {
        console.error('❌ Error en verificar-token-registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ====================
// RUTAS EXISTENTES DE AUTENTICACIÓN (NO MODIFICAR)
// ====================

// Login de usuario
router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], AuthController.login);

// Recuperación de contraseña
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email inválido')
], AuthController.solicitarRecuperacion);

// Verificar código (para recuperación)
router.post('/verify-code', [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código debe tener 6 dígitos')
], AuthController.verificarCodigo);

// Restablecer contraseña
router.post('/reset-password', [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código debe tener 6 dígitos'),
    body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], AuthController.verificarYCambiarPassword);

// Registro estándar (admin/deportista)
router.post('/register', [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    body('role').isIn(['entrenador', 'admin', 'deportista']).withMessage('Rol inválido')
], AuthController.register);

// Registro deportista con archivos
router.post('/registro-deportista',
    uploadRegistro.fields([
        { name: 'foto', maxCount: 1 },
        { name: 'documento', maxCount: 1 }
    ]),
    AuthController.registroDeportista  // ✅ SOLO ESTO
);

// Confirmar registro (aceptar términos)
router.post('/confirmar-registro', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }
        
        const { User, Deportista } = require('../models');
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        user.activo = true;
        user.acepta_terminos = true;
        await user.save();
        
        const deportista = await Deportista.findOne({ where: { user_id: userId } });
        if (deportista) {
            deportista.acepta_terminos = true;
            await deportista.save();
        }
        
        console.log('✅ Registro confirmado para:', user.email);
        
        res.json({
            success: true,
            message: 'Registro confirmado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error confirmando registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error confirmando el registro'
        });
    }
});

// ====================
// RUTAS PROTEGIDAS
// ====================
router.get('/profile', authMiddleware, AuthController.getProfile);

// ====================
// RUTAS DE PRUEBA Y DIAGNÓSTICO
// ====================

// Prueba del servicio de email
router.get('/test-email-service', async (req, res) => {
    try {
        console.log('🧪 Probando EmailService...');
        
        const EmailService = require('../config/emailService');
        console.log('✅ EmailService importado correctamente');
        
        const testCode = EmailService.generateCode();
        console.log('🔑 Código de prueba generado:', testCode);
        
        res.json({
            success: true,
            message: 'EmailService funciona correctamente',
            testCode: testCode,
            methods: {
                generateCode: typeof EmailService.generateCode,
                sendActivationCode: typeof EmailService.sendActivationCode,
                sendRecoveryCode: typeof EmailService.sendRecoveryCode
            }
        });
        
    } catch (error) {
        console.error('❌ Error probando EmailService:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar estado del servidor
router.get('/health', async (req, res) => {
    try {
        const { sequelize } = require('../config/database');
        await sequelize.authenticate();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'auth-service',
            endpoints: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                registroEntrenador: [
                    'POST /api/auth/solicitar-codigo-registro',
                    'POST /api/auth/verificar-codigo-registro',
                    'POST /api/auth/completar-registro-contrasena'
                ]
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});
router.post('/activar-cuenta-entrenador', async (req, res) => {
    try {
        console.log('🔄 Alias /activar-cuenta-entrenador redirigiendo a /completar-registro-contrasena');
        
        // Redirigir la petición al endpoint correcto
        const { User } = require('../models');
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        
        const { email, verificationToken, password, confirmPassword } = req.body;
        
        // Validaciones básicas
        if (!email || !verificationToken || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }
        
        // Verificar que las contraseñas coincidan
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Las contraseñas no coinciden'
            });
        }
        
        // Buscar entrenador con el token de verificación
        const entrenador = await User.findOne({
            where: {
                email: email.toLowerCase().trim(),
                verification_token: verificationToken,
                role: 'entrenador',
                requiere_registro: true
            }
        });
        
        if (!entrenador) {
            console.log('❌ Token de verificación inválido o ya usado');
            return res.status(404).json({
                success: false,
                error: 'Token de verificación inválido o expirado'
            });
        }
        
        // Verificar que el token no haya expirado
        if (entrenador.verification_token_expires && 
            entrenador.verification_token_expires < new Date()) {
            console.log('❌ Token expirado');
            return res.status(400).json({
                success: false,
                error: 'El token de verificación ha expirado. Vuelve a solicitar un código.'
            });
        }
        
        console.log('✅ Token válido. Activando cuenta de:', entrenador.email);
        
        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Actualizar usuario: activar cuenta, guardar contraseña, limpiar tokens
        entrenador.password = hashedPassword;
        entrenador.activo = true;
        entrenador.requiere_registro = false;
        entrenador.reset_password_code = null;
        entrenador.reset_password_expires = null;
        entrenador.verification_token = null;
        entrenador.verification_token_expires = null;
        entrenador.token_registro = null;
        
        await entrenador.save();
        
        console.log('✅✅✅ CUENTA ACTIVADA EXITOSAMENTE:', entrenador.email);
        
        // Generar token de sesión para login automático
        const sessionToken = jwt.sign(
            {
                id: entrenador.id,
                email: entrenador.email,
                role: entrenador.role
            },
            process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui_12345_2024',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: '¡Cuenta activada exitosamente!',
            token: sessionToken,
            user: {
                id: entrenador.id,
                nombre: entrenador.nombre,
                email: entrenador.email,
                role: entrenador.role,
                activo: entrenador.activo
            }
        });
        
    } catch (error) {
        console.error('❌ Error en activar-cuenta-entrenador:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;