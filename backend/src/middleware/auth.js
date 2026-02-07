// backend/src/middleware/auth.js - MIDDLEWARE COMPLETO
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ============================================
// 1. MIDDLEWARE DE AUTENTICACIÓN BÁSICO
// ============================================
const authMiddleware = async (req, res, next) => {
  try {
    // 🔥 INTENTAR DESDE HEADER PRIMERO
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 🔥 SI NO HAY EN HEADER, BUSCAR EN QUERY STRING
    if (!token && req.query.token) {
      token = req.query.token;
      console.log('🔑 Token recibido desde query string');
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
    }
    
    // Verificar token (el resto sigue igual)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui_12345_2024');
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      tipo: user.role
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Error en authMiddleware:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Error en la autenticación'
    });
  }
};

// ============================================
// 2. MIDDLEWARE PARA VERIFICAR ROL ADMIN
// ============================================
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de administrador'
    });
  }
  
  next();
};

// ============================================
// 3. MIDDLEWARE PARA VERIFICAR ROL ENTRENADOR
// ============================================
const isEntrenador = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado'
    });
  }
  
  // Permitir tanto a entrenadores como a admins
  if (req.user.role !== 'entrenador' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de entrenador o administrador'
    });
  }
  
  next();
};

// ============================================
// 4. MIDDLEWARE PARA VERIFICAR ROL DEPORTISTA
// ============================================
const isDeportista = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado'
    });
  }
  
  if (req.user.role !== 'deportista') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de deportista'
    });
  }
  
  next();
};

// ============================================
// 5. MIDDLEWARE PARA VERIFICAR ADMIN O ENTRENADOR
// ============================================
const isAdminOrEntrenador = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado'
    });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'entrenador') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de administrador o entrenador'
    });
  }
  
  next();
};

// ============================================
// 6. MIDDLEWARE OPCIONAL (NO REQUIERE AUTH)
// ============================================
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui_12345_2024');
      
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (user && user.activo) {
        req.user = {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          role: user.role,
          tipo: user.role
        };
      }
    }
    
    next();
    
  } catch (error) {
    // Si hay error en el token opcional, simplemente continuar sin usuario
    next();
  }
};

// ============================================
// EXPORTAR MIDDLEWARE
// ============================================
module.exports = {
  authMiddleware,
  isAdmin,
  isEntrenador,
  isDeportista,
  isAdminOrEntrenador,
  optionalAuth
};