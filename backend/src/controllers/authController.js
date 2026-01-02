// backend/src/controllers/authController.js - VERSIÓN CORREGIDA
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Deportista } = require('../models');
const { validationResult } = require('express-validator');

class AuthController {
  // Login de usuario
  static async login(req, res) {
    try {
      console.log('📥 Petición de login recibida:', req.body.email);

      const { email, password } = req.body;

      // Validación básica
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario
      console.log('🔍 Buscando usuario en BD...');
      const user = await User.findOne({
        where: { email },
        include: [{
          model: Deportista,
          as: 'deportista',
          required: false,
          attributes: ['id', 'nivel_actual', 'estado', 'foto_perfil']
        }]
      });

      if (!user) {
        console.log('❌ Usuario no encontrado:', email);
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      console.log('✅ Usuario encontrado:', user.email);

      // Verificar contraseña CON BCRYPT
      console.log('🔐 Verificando contraseña...');
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log('❌ Contraseña incorrecta');
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      console.log('✅ Contraseña válida');

      // Verificar si está activo
      if (!user.activo) {
        console.log('❌ Usuario inactivo');
        return res.status(401).json({
          error: 'Usuario inactivo'
        });
      }

      // Generar token
      console.log('🔑 Generando token...');
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret-key-desarrollo',
        { expiresIn: '7d' }
      );

      // Preparar respuesta del usuario
      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        tipo: user.role,
        role: user.role,
        telefono: user.telefono,
        activo: user.activo,
        createdAt: user.createdAt
      };

      // Agregar perfil deportista si existe
      if (user.deportista) {
        userResponse.deportistaProfile = {
          id: user.deportista.id,
          nivel_actual: user.deportista.nivel_actual,
          estado: user.deportista.estado,
          foto_perfil: user.deportista.foto_perfil
        };
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
      console.error('Stack:', error.stack);

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

      // Validar errores
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nombre, email, password, role, telefono } = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }

      // Crear usuario (el modelo hashea automáticamente la contraseña)
      const user = await User.create({
        nombre,
        email,
        password,
        role: role || 'deportista',
        telefono,
        activo: true
      });

      console.log('✅ Usuario creado:', user.email);

      // Si es deportista, crear perfil deportista
      if (user.role === 'deportista') {
        await Deportista.create({
          user_id: user.id,
          nivel_actual: 'básico',
          estado: 'activo'
        });
        console.log('✅ Perfil deportista creado');
      }

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret-key-desarrollo',
        { expiresIn: '7d' }
      );

      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        tipo: user.role,
        role: user.role,
        telefono: user.telefono,
        activo: user.activo,
        createdAt: user.createdAt
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

  // Perfil del usuario autenticado
  static async getProfile(req, res) {
    try {
      const user = req.user;

      // Buscar deportista si aplica
      let deportistaProfile = null;
      if (user.role === 'deportista') {
        deportistaProfile = await Deportista.findOne({
          where: { user_id: user.id }
        });
      }

      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        tipo: user.role,
        role: user.role,
        telefono: user.telefono,
        activo: user.activo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      if (deportistaProfile) {
        userResponse.deportistaProfile = deportistaProfile;
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
}

module.exports = AuthController;