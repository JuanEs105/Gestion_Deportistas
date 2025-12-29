const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Validaciones para registro
const registerValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role').optional().isIn(['entrenador', 'deportista', 'admin'])
];

// Validaciones para login
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

// Rutas públicas
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);

// Rutas protegidas
router.get('/profile', authMiddleware, AuthController.getProfile);
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

module.exports = router;