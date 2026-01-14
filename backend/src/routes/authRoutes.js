const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { uploadRegistro, uploadToCloudinary } = require('../config/cloudinary');

// ====================
// VALIDACIONES
// ====================
const registroDeportistaValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),

  body('telefono')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;

      const soloDigitos = value.replace(/\D/g, '');

      console.log('📞 Teléfono recibido:', value);
      console.log('🔢 Dígitos limpios:', soloDigitos);
      console.log('📏 Longitud:', soloDigitos.length);

      if (soloDigitos.length < 10) {
        throw new Error('El teléfono debe tener al menos 10 dígitos');
      }

      if (soloDigitos.length === 10 && soloDigitos.startsWith('3')) {
        return true;
      }

      if (soloDigitos.length > 10) {
        console.log('🌍 Número internacional detectado');
        return true;
      }

      if (soloDigitos.length === 10 && !soloDigitos.startsWith('3')) {
        throw new Error('Para números colombianos, debe comenzar con 3 (ej: 3128636931)');
      }

      return true;
    })
    .withMessage('Teléfono inválido'),

  body('fecha_nacimiento')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida'),

  body('contacto_emergencia_nombre').optional({ checkFalsy: true }),

  body('contacto_emergencia_telefono')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;

      const soloDigitos = value.replace(/\D/g, '');

      if (soloDigitos.length < 10) {
        throw new Error('El teléfono del contacto debe tener al menos 10 dígitos');
      }

      return true;
    })
    .withMessage('Teléfono de contacto inválido'),

  body('contacto_emergencia_parentesco').optional({ checkFalsy: true })
];

// ====================
// RUTAS PÚBLICAS
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

// Restablecer contraseña
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email inválido'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Código debe tener 6 dígitos'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], AuthController.verificarYCambiarPassword);

// Registro estándar (admin/entrenador)
router.post('/register', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('role').isIn(['entrenador', 'admin']).withMessage('Rol inválido')
], AuthController.register);

// ====================
// REGISTRO DEPORTISTA CON ARCHIVOS
// ====================
router.post('/registro-deportista',
  uploadRegistro.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'documento', maxCount: 1 }
  ]),
  registroDeportistaValidation,
  async (req, res) => {
    try {
      console.log('📥 Registro deportista recibido:', req.body.email);
      console.log('📎 Archivos recibidos:', req.files);

      const {
        nombre,
        email,
        password,
        telefono,
        fecha_nacimiento,
        contacto_emergencia_nombre,
        contacto_emergencia_telefono,
        contacto_emergencia_parentesco
      } = req.body;

      const errors = require('express-validator').validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Errores de validación:', JSON.stringify(errors.array(), null, 2));
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      if (!req.files || !req.files.documento) {
        return res.status(400).json({
          success: false,
          error: 'El documento de identidad (PDF) es obligatorio'
        });
      }

      const { User, Deportista } = require('../models');
      const bcrypt = require('bcryptjs');

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está registrado'
        });
      }

      console.log('🔐 Hasheando contraseña...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log('✅ Contraseña hasheada');

      let fotoUrl = null;
      let documentoUrl = null;

      if (req.files.foto && req.files.foto[0]) {
        try {
          console.log('📸 Subiendo foto a Cloudinary...');
          const fotoResult = await uploadToCloudinary(req.files.foto[0].buffer, {
            folder: 'deportistas/fotos',
            resource_type: 'image',
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' }
            ]
          });
          fotoUrl = fotoResult.secure_url;
          console.log('✅ Foto subida:', fotoUrl);
        } catch (error) {
          console.log('⚠️  Error subiendo foto:', error.message);
        }
      }

      try {
        console.log('📄 Subiendo documento a Cloudinary...');
        const documentoResult = await uploadToCloudinary(req.files.documento[0].buffer, {
          folder: 'deportistas/documentos',
          resource_type: 'raw',
          format: 'pdf'
        });
        documentoUrl = documentoResult.secure_url;
        console.log('✅ Documento subido:', documentoUrl);
      } catch (error) {
        console.error('❌ Error subiendo documento:', error);
        return res.status(500).json({
          success: false,
          error: 'Error al subir el documento de identidad'
        });
      }

      const user = await User.create({
        nombre,
        email,
        password: hashedPassword,
        role: 'deportista',
        telefono: telefono || null,
        activo: true,
        acepta_terminos: true
      }, {
        hooks: false
      });

      console.log('✅ Usuario deportista creado:', user.email);

      const deportista = await Deportista.create({
        user_id: user.id,
        nivel_actual: 'pendiente',  // ✅ PENDIENTE hasta que entrenador lo asigne
        estado: 'activo',            // ✅ ACTIVO para que pueda hacer login
        fecha_nacimiento: fecha_nacimiento || null,
        foto_perfil: fotoUrl,
        documento_identidad: documentoUrl,
        contacto_emergencia_nombre: contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: contacto_emergencia_telefono || null,
        contacto_emergencia_parentesco: contacto_emergencia_parentesco || null,
        altura: null,
        peso: null,
        nivel_deportivo: null,
        acepta_terminos: true
      });

      console.log('✅ Perfil deportista creado');
      console.log('   - Estado:', deportista.estado);  // activo
      console.log('   - Nivel:', deportista.nivel_actual);  // pendiente
      
      const tempData = {
        userId: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        deportistaId: deportista.id,
        foto_perfil: fotoUrl,
        documento_identidad: documentoUrl
      };

      res.status(201).json({
        success: true,
        message: 'Registro deportista completado. Redirigiendo a términos y condiciones.',
        tempData,
        nextStep: '/terminos-condiciones'
      });

    } catch (error) {
      console.error('❌ Error en registro deportista:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el registro deportista',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
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

module.exports = router;