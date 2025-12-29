const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Deportista } = require('../models');
const { validationResult } = require('express-validator');

class AuthController {
  // Registro de usuario
  static async register(req, res) {
    try {
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

      // HASH DE CONTRASEÑA (FALTA EN TU CÓDIGO)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = await User.create({
        nombre,
        email,
        password: hashedPassword,  // Usar contraseña hasheada
        role: role || 'deportista',
        telefono,
        activo: true
      });

      // Si es deportista, crear perfil deportista
      if (user.role === 'deportista') {
        await Deportista.create({
          user_id: user.id,
          grupo: 'principiante',
          nivel_actual: 'básico',
          estado: 'activo'
        });
      }

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret-key-desarrollo',
        { expiresIn: '7d' }
      );

      // RESPUESTA MODIFICADA: Agregar 'tipo' y usar 'nombre' consistente
      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        tipo: user.role,  // <-- CLAVE: Agregar 'tipo' para frontend
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
      console.error('Error en registro:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Login de usuario
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const user = await User.findOne({ 
        where: { email },
        include: [{
          model: Deportista,
          as: 'deportista',
          attributes: ['id', 'grupo', 'nivel_actual', 'estado', 'foto_perfil']
        }]
      });

      if (!user) {
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña CON BCRYPT (corrección)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      // Verificar si está activo
      if (!user.activo) {
        return res.status(401).json({
          error: 'Usuario inactivo'
        });
      }

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret-key-desarrollo',
        { expiresIn: '7d' }
      );

      // RESPUESTA MODIFICADA: Agregar 'tipo' y estructura consistente
      const userResponse = {
        id: user.id,
        nombre: user.nombre,      // <-- Usar 'nombre' (no 'name')
        email: user.email,
        tipo: user.role,          // <-- CLAVE: Agregar 'tipo' para frontend
        role: user.role,
        telefono: user.telefono,
        activo: user.activo,
        createdAt: user.createdAt
      };

      // Agregar perfil deportista si existe
      if (user.deportista) {
        userResponse.deportista = {
          id: user.deportista.id,
          grupo: user.deportista.grupo,
          nivel_actual: user.deportista.nivel_actual,
          estado: user.deportista.estado
        };
      }

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: userResponse  // <-- Enviar con 'tipo'
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        error: 'Error en el servidor'
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

      // RESPUESTA MODIFICADA: Agregar 'tipo'
      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        tipo: user.role,  // <-- Agregar 'tipo'
        role: user.role,
        telefono: user.telefono,
        activo: user.activo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      if (deportistaProfile) {
        userResponse.deportista = deportistaProfile;
      }

      res.json({
        success: true,
        user: userResponse
      });

    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }
}

module.exports = AuthController;