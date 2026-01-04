// backend/src/routes/passwordRecoveryRoutes.js
const express = require('express');
const router = express.Router();
const PasswordRecoveryController = require('../controllers/passwordRecoveryController');

// Solicitar código de recuperación
router.post('/request-reset', PasswordRecoveryController.requestPasswordReset);

// Verificar código
router.post('/verify-code', PasswordRecoveryController.verifyResetCode);

// Restablecer contraseña
router.post('/reset-password', PasswordRecoveryController.resetPassword);

module.exports = router;