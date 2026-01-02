// backend/src/middleware/auth.js - VERSIÓN CORREGIDA
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado. Por favor autentícate.'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key-desarrollo');
    
    // Buscar usuario
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }
    
    if (!user.activo) {
      return res.status(401).json({
        error: 'Usuario inactivo'
      });
    }
    
    // Agregar usuario a la request
    req.user = {
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.role,
      tipo: user.role,  // Para compatibilidad con frontend
      activo: user.activo
    };
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    
    res.status(401).json({
      error: 'Por favor autentícate'
    });
  }
};

// Middleware para verificar rol de entrenador
const isEntrenador = (req, res, next) => {
  if (req.user.role !== 'entrenador' && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de entrenador'
    });
  }
  next();
};

// Middleware para verificar rol de admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de administrador'
    });
  }
  next();
};

// Middleware para verificar rol de deportista
const isDeportista = (req, res, next) => {
  if (req.user.role !== 'deportista') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de deportista'
    });
  }
  next();
};

// EXPORTAR CORRECTAMENTE
module.exports = { 
  authMiddleware, 
  isEntrenador, 
  isAdmin, 
  isDeportista 
};