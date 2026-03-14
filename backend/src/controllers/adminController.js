// backend/src/controllers/adminController.js - VERSIÓN COMPLETA Y CORREGIDA
const { User, Deportista, Evaluacion, Habilidad, HistorialNivel } = require('../models');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AdminController {
  // ==========================================
  // ESTADÍSTICAS GENERALES
  // ==========================================
  
  static async getStats(req, res) {
    try {
      console.log('📊 getStats - Calculando estadísticas...');

      // Total entrenadores
      const totalEntrenadores = await User.count({
        where: { role: 'entrenador' }
      });

      // Total deportistas
      const totalDeportistas = await Deportista.count();

      // Total evaluaciones
      const totalEvaluaciones = await Evaluacion.count();

      // Deportistas activos
      const deportistasActivos = await Deportista.count({
        where: { estado: 'activo' }
      });

      // Evaluaciones este mes
      const primerDiaMes = new Date();
      primerDiaMes.setDate(1);
      primerDiaMes.setHours(0, 0, 0, 0);

      const evaluacionesEsteMes = await Evaluacion.count({
        where: {
          fecha_evaluacion: {
            [sequelize.Sequelize.Op.gte]: primerDiaMes
          }
        }
      });

      // Promedio general de evaluaciones
      const promedioGeneral = await Evaluacion.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('puntuacion')), 'promedio']
        ],
        raw: true
      });

      const stats = {
        total_entrenadores: totalEntrenadores || 0,
        total_deportistas: totalDeportistas || 0,
        deportistas_activos: deportistasActivos || 0,
        total_evaluaciones: totalEvaluaciones || 0,
        evaluaciones_este_mes: evaluacionesEsteMes || 0,
        promedio_general: promedioGeneral?.promedio ? parseFloat(promedioGeneral.promedio).toFixed(2) : '0.00'
      };

      console.log('📊 Stats finales:', stats);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  static async getDeportistasStats(req, res) {
    try {
      console.log('📊 Obteniendo estadísticas de deportistas...');

      const porNivel = await Deportista.findAll({
        attributes: [
          'nivel_actual',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['nivel_actual'],
        raw: true
      });

      const porEstado = await Deportista.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['estado'],
        raw: true
      });

      // Procesar niveles para incluir todos los niveles posibles
      const nivelesPosibles = ['baby_titans', '1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'pendiente'];
      const porNivelCompleto = nivelesPosibles.map(nivel => {
        const encontrado = porNivel.find(n => n.nivel_actual === nivel);
        return {
          nivel_actual: nivel,
          cantidad: encontrado ? parseInt(encontrado.cantidad) : 0
        };
      });

      // Procesar estados para incluir todos los estados posibles
      const estadosPosibles = ['activo', 'lesionado', 'inactivo', 'descanso', 'pendiente'];
      const porEstadoCompleto = estadosPosibles.map(estado => {
        const encontrado = porEstado.find(e => e.estado === estado);
        return {
          estado: estado,
          cantidad: encontrado ? parseInt(encontrado.cantidad) : 0
        };
      });

      res.json({
        success: true,
        por_nivel: porNivelCompleto,
        por_estado: porEstadoCompleto
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de deportistas:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getEvaluacionesStats(req, res) {
    try {
      const hace6Meses = new Date();
      hace6Meses.setMonth(hace6Meses.getMonth() - 6);

      const evaluacionesPorMes = await Evaluacion.findAll({
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_evaluacion')), 'mes'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        where: {
          fecha_evaluacion: {
            [sequelize.Sequelize.Op.gte]: hace6Meses
          }
        },
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_evaluacion'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_evaluacion')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        por_mes: evaluacionesPorMes
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  // ==========================================
  // GESTIÓN DE ENTRENADORES - SISTEMA NUEVO SIN CONTRASEÑA
  // ==========================================

  static async getAllEntrenadores(req, res) {
    try {
      console.log('📥 Obteniendo todos los entrenadores...');

      // Obtener todos los usuarios con rol entrenador
      const entrenadores = await User.findAll({
        where: {
          role: 'entrenador'
        },
        attributes: [
          'id',
          'nombre',
          'email',
          'telefono',
          'activo',
          'fecha_nacimiento',
          'niveles_asignados',
          'grupos_competitivos',
          'requiere_registro',
          'created_at',
          'updated_at'
        ],
        order: [['created_at', 'DESC']],
        raw: true
      });

      console.log(`✅ ${entrenadores.length} entrenadores encontrados`);

      // Procesar datos para el frontend
      const entrenadoresProcesados = entrenadores.map(entrenador => {
        // Procesar niveles_asignados (puede ser string JSON o array)
        let niveles_asignados = [];
        if (entrenador.niveles_asignados) {
          if (typeof entrenador.niveles_asignados === 'string') {
            try {
              niveles_asignados = JSON.parse(entrenador.niveles_asignados);
            } catch (e) {
              // Si no es JSON, tratar como string separado por comas
              niveles_asignados = entrenador.niveles_asignados.split(',').map(n => n.trim()).filter(n => n);
            }
          } else if (Array.isArray(entrenador.niveles_asignados)) {
            niveles_asignados = entrenador.niveles_asignados;
          }
        }

        // Procesar grupos_competitivos
        let grupos_competitivos = [];
        if (entrenador.grupos_competitivos) {
          if (typeof entrenador.grupos_competitivos === 'string') {
            try {
              grupos_competitivos = JSON.parse(entrenador.grupos_competitivos);
            } catch (e) {
              grupos_competitivos = entrenador.grupos_competitivos.split(',').map(e => e.trim()).filter(e => e);
            }
          } else if (Array.isArray(entrenador.grupos_competitivos)) {
            grupos_competitivos = entrenador.grupos_competitivos;
          }
        }

        // Determinar si requiere registro
        // Un entrenador requiere registro si no tiene contraseña
        const requiere_registro = entrenador.requiere_registro === true;

        return {
          ...entrenador,
          niveles_asignados,
          grupos_competitivos,
          requiere_registro
        };
      });

      res.json({
        success: true,
        total: entrenadoresProcesados.length,
        entrenadores: entrenadoresProcesados
      });

    } catch (error) {
      console.error('❌ Error obteniendo entrenadores:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo entrenadores',
        details: error.message
      });
    }
  }

  static async getEntrenadorById(req, res) {
    try {
      const { id } = req.params;

      const entrenador = await User.findOne({
        where: { id, role: 'entrenador' },
        attributes: [
          'id',
          'nombre',
          'email',
          'telefono',
          'activo',
          'fecha_nacimiento',
          'niveles_asignados',
          'grupos_competitivos',
          'requiere_registro'
        ]
      });

      if (!entrenador) {
        return res.status(404).json({
          success: false,
          error: 'Entrenador no encontrado'
        });
      }

      // Procesar datos para respuesta
      const entrenadorData = entrenador.toJSON();

      // Procesar niveles_asignados
      if (entrenadorData.niveles_asignados && typeof entrenadorData.niveles_asignados === 'string') {
        try {
          entrenadorData.niveles_asignados = JSON.parse(entrenadorData.niveles_asignados);
        } catch (e) {
          entrenadorData.niveles_asignados = entrenadorData.niveles_asignados.split(',').map(n => n.trim()).filter(n => n);
        }
      }

      // Procesar grupos_competitivos
      if (entrenadorData.grupos_competitivos && typeof entrenadorData.grupos_competitivos === 'string') {
        try {
          entrenadorData.grupos_competitivos = JSON.parse(entrenadorData.grupos_competitivos);
        } catch (e) {
          entrenadorData.grupos_competitivos = entrenadorData.grupos_competitivos.split(',').map(e => e.trim()).filter(e => e);
        }
      }

      res.json({
        success: true,
        entrenador: entrenadorData
      });
    } catch (error) {
      console.error('Error obteniendo entrenador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor'
      });
    }
  }

  // ==========================================
  // ✅ 1. CREAR ENTRENADOR (Estado: Pendiente Registro)
  // ==========================================
  static async createEntrenador(req, res) {
    try {
      const {
        nombre,
        email,
        fecha_nacimiento,
        telefono,
        niveles_asignados,
        grupos_competitivos
      } = req.body;

      console.log('➕ Creando entrenador (PENDIENTE REGISTRO):', { nombre, email });

      // Validar campos obligatorios
      if (!nombre || !email) {
        return res.status(400).json({
          success: false,
          error: 'Nombre y email son requeridos'
        });
      }

      // Validar email único
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está registrado en el sistema'
        });
      }

      // Procesar niveles asignados
      const nivelesValidos = ['baby_titans', '1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
      let nivelesFinales = ['1_basico']; // Valor por defecto

      if (niveles_asignados && Array.isArray(niveles_asignados)) {
        nivelesFinales = niveles_asignados.filter(n => nivelesValidos.includes(n));
        if (nivelesFinales.length === 0) {
          nivelesFinales = ['1_basico'];
        }
      }

      // Procesar grupos competitivos
      const equiposValidos = ['rocks_titans', 'lightning_titans', 'storm_titans', 'fire_titans', 'electric_titans', 'baby_titans', 'nova_titans'];
      let equiposFinales = [];

      if (grupos_competitivos && Array.isArray(grupos_competitivos)) {
        equiposFinales = grupos_competitivos.filter(e => equiposValidos.includes(e));
      }

      // Crear entrenador CON estado pendiente de registro
      const entrenador = await User.create({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        fecha_nacimiento: fecha_nacimiento || null,
        telefono: telefono ? telefono.trim() : null,
        role: 'entrenador',
        activo: false, // ⚠️ INACTIVO hasta que complete registro
        requiere_registro: true, // ⚠️ REQUIERE COMPLETAR REGISTRO
        niveles_asignados: nivelesFinales,
        grupos_competitivos: equiposFinales,
        password: null, // ⚠️ SIN CONTRASEÑA (se creará en el registro)
        reset_password_code: null,
        reset_password_expires: null,
        verification_token: null,
        verification_token_expires: null
      });

      console.log('✅ Entrenador creado (pendiente):', entrenador.email);
      console.log('   - Estado: pendiente de registro');
      console.log('   - Requiere registro: sí');
      console.log('   - Contraseña: no establecida');

      // Enviar email de registro (OPCIONAL - para producción)
      try {
        const EmailService = require('../config/emailService');
        await EmailService.enviarEmailRegistroEntrenador(
          entrenador.email,
          entrenador.nombre,
          entrenador.id // Usaremos el ID como referencia
        );

        console.log('📧 Email de registro enviado');
      } catch (emailError) {
        console.warn('⚠️  Error enviando email:', emailError.message);
        // No falla el proceso si el email falla
      }

      res.status(201).json({
        success: true,
        message: '✅ Entrenador creado exitosamente. Debe completar su registro.',
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          email: entrenador.email,
          telefono: entrenador.telefono,
          activo: entrenador.activo,
          requiere_registro: entrenador.requiere_registro,
          niveles_asignados: entrenador.niveles_asignados,
          grupos_competitivos: entrenador.grupos_competitivos
        }
      });

    } catch (error) {
      console.error('❌ Error creando entrenador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor al crear entrenador',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ==========================================
  // ✅ 2. ENVIAR CÓDIGO DE REGISTRO (PASO 1)
  // ==========================================
  static async enviarCodigoRegistro(req, res) {
    try {
      const { email } = req.body;

      console.log('📧 === ENVÍO DE CÓDIGO DE REGISTRO (PASO 1) ===');
      console.log('Email solicitante:', email);

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email es requerido'
        });
      }

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
        console.log('❌ No hay entrenador pendiente con ese email:', email);
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
        const EmailService = require('../config/emailService');
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

      console.log('✅ Proceso de envío de código completado');

      res.json({
        success: true,
        message: 'Código de activación enviado a tu email',
        expiresIn: 15 // minutos
      });

    } catch (error) {
      console.error('❌ Error enviando código de registro:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ==========================================
  // ✅ 3. VERIFICAR CÓDIGO (PASO 2)
  // ==========================================
  static async verificarCodigoRegistro(req, res) {
    try {
      const { email, code } = req.body;

      console.log('🔍 === VERIFICACIÓN DE CÓDIGO (PASO 2) ===');
      console.log('Email:', email);
      console.log('Código recibido:', code);

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          error: 'Email y código son requeridos'
        });
      }

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
      const crypto = require('crypto');
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
      console.error('❌ Error verificando código:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ==========================================
  // ✅ 4. COMPLETAR REGISTRO CON CONTRASEÑA (PASO 3)
  // ==========================================
  static async completarRegistroConContraseña(req, res) {
    try {
      const { email, verificationToken, password, confirmPassword } = req.body;

      console.log('🔐 === COMPLETANDO REGISTRO (PASO 3) ===');
      console.log('Email:', email);
      console.log('Token recibido:', verificationToken ? verificationToken.substring(0, 20) + '...' : 'No proporcionado');

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
      console.log('   - Estado: ACTIVO');
      console.log('   - Contraseña: CONFIGURADA');
      console.log('   - Token: LIMPIADO');

      // Generar token de sesión para login automático
      const jwt = require('jsonwebtoken');
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
      console.error('❌ Error completando registro:', error);
      res.status(500).json({
        success: false,
        error: 'Error al completar el registro',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }


  // ==========================================
  // CORRECCIÓN CRÍTICA - updateEntrenador
  // ==========================================

  static async updateEntrenador(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre,
        fecha_nacimiento,
        telefono,
        niveles_asignados,
        grupos_competitivos
      } = req.body;

      console.log(`✏️ Actualizando entrenador ${id} (VERSIÓN CORREGIDA):`, {
        niveles_asignados,
        grupos_competitivos // ⬅️ VERIFICAR
      });

      // Buscar entrenador
      const entrenador = await User.findOne({
        where: { id, role: 'entrenador' }
      });

      if (!entrenador) {
        return res.status(404).json({
          success: false,
          error: 'Entrenador no encontrado'
        });
      }

      const updateData = {};

      if (nombre && nombre.trim() !== '') {
        updateData.nombre = nombre.trim();
      }

      if (fecha_nacimiento) {
        const fechaNac = new Date(fecha_nacimiento);
        const hoy = new Date();
        if (fechaNac > hoy) {
          return res.status(400).json({
            success: false,
            error: 'La fecha de nacimiento no puede ser futura'
          });
        }
        updateData.fecha_nacimiento = fecha_nacimiento;
      }

      if (telefono !== undefined) {
        updateData.telefono = telefono ? telefono.trim() : null;
      }

      // ✅ Actualizar niveles
      if (Array.isArray(niveles_asignados)) {
        const nivelesValidos = ['baby_titans', '1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
        const nivelesFiltrados = niveles_asignados.filter(n => nivelesValidos.includes(n));
        if (nivelesFiltrados.length > 0) {
          updateData.niveles_asignados = nivelesFiltrados;
        }
      }

      // ✅ CORRECCIÓN: Actualizar equipos correctamente
      if (Array.isArray(grupos_competitivos)) {
        const equiposValidos = ['rocks_titans', 'lightning_titans', 'storm_titans', 'fire_titans', 'electric_titans', 'baby_titans', 'nova_titans'];
        const equiposFiltrados = grupos_competitivos.filter(e => equiposValidos.includes(e));

        updateData.grupos_competitivos = equiposFiltrados; // Sin el if, permite array vacío
      }

      // Actualizar
      await entrenador.update(updateData);

      console.log('✅ Entrenador actualizado:', entrenador.email);
      console.log('   Niveles finales:', entrenador.niveles_asignados);
      console.log('   Equipos finales:', entrenador.grupos_competitivos); // ⬅️ VERIFICAR

      res.json({
        success: true,
        message: '✅ Entrenador actualizado exitosamente',
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          email: entrenador.email,
          telefono: entrenador.telefono,
          activo: entrenador.activo,
          niveles_asignados: entrenador.niveles_asignados,
          grupos_competitivos: entrenador.grupos_competitivos, // ⬅️ DEVOLVER
          fecha_nacimiento: entrenador.fecha_nacimiento
        }
      });
    } catch (error) {
      console.error('❌ Error actualizando entrenador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }


  static async toggleEntrenadorStatus(req, res) {
    try {
      const { id } = req.params;

      console.log(`🔄 Cambiando estado del entrenador ${id}`);

      const entrenador = await User.findOne({
        where: { id, role: 'entrenador' }
      });

      if (!entrenador) {
        return res.status(404).json({
          success: false,
          error: 'Entrenador no encontrado'
        });
      }

      // Cambiar estado activo/inactivo
      const nuevoEstado = !entrenador.activo;
      await entrenador.update({ activo: nuevoEstado });

      console.log(`✅ Estado del entrenador ${entrenador.email} cambiado a:`, nuevoEstado ? 'Activo' : 'Inactivo');

      res.json({
        success: true,
        message: `✅ Entrenador ${nuevoEstado ? 'activado' : 'desactivado'}`,
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          activo: entrenador.activo
        }
      });
    } catch (error) {
      console.error('❌ Error cambiando estado del entrenador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }
  static async deleteEntrenador(req, res) {
    try {
      const { id } = req.params;

      console.log(`🗑️ === ELIMINACIÓN SEGURA DE ENTRENADOR ${id} ===`);

      // 1. Buscar entrenador
      const entrenador = await User.findOne({
        where: {
          id,
          role: 'entrenador'
        }
      });

      if (!entrenador) {
        console.log(`❌ Entrenador ${id} no encontrado`);
        return res.status(404).json({
          success: false,
          error: 'Entrenador no encontrado'
        });
      }

      console.log(`✅ Entrenador encontrado: ${entrenador.nombre} (${entrenador.email})`);

      // 2. Verificar y manejar evaluaciones asociadas
      const evaluacionesCount = await Evaluacion.count({
        where: { entrenador_id: id }
      });

      console.log(`📊 Evaluaciones asociadas encontradas: ${evaluacionesCount}`);

      // 3. Si tiene evaluaciones, actualizarlas para quitar la referencia
      if (evaluacionesCount > 0) {
        console.log(`🔄 Actualizando ${evaluacionesCount} evaluaciones...`);

        await Evaluacion.update(
          {
            entrenador_id: null,
            observaciones: `[Entrenador eliminado: ${entrenador.nombre}] ${sequelize.fn('COALESCE', sequelize.col('observaciones'), '')}`
          },
          {
            where: { entrenador_id: id }
          }
        );

        console.log(`✅ ${evaluacionesCount} evaluaciones actualizadas (entrenador_id = null)`);
      }

      // 4. Manejar otros registros asociados (notificaciones, etc.)
      try {
        // Verificar notificaciones
        const { Notificacion } = require('../models');
        const notificacionesCount = await Notificacion.count({
          where: { usuario_id: id }
        });

        if (notificacionesCount > 0) {
          console.log(`📨 Eliminando ${notificacionesCount} notificaciones...`);
          await Notificacion.destroy({
            where: { usuario_id: id }
          });
          console.log(`✅ ${notificacionesCount} notificaciones eliminadas`);
        }
      } catch (error) {
        console.warn('⚠️  Error limpiando registros asociados:', error.message);
        // Continuar aunque falle
      }

      // 5. FINALMENTE eliminar el entrenador
      const nombreEntrenador = entrenador.nombre;
      const emailEntrenador = entrenador.email;

      await entrenador.destroy();

      console.log(`✅✅✅ ENTRENADOR ELIMINADO EXITOSAMENTE: ${nombreEntrenador}`);

      res.json({
        success: true,
        message: `✅ Entrenador "${nombreEntrenador}" eliminado exitosamente`,
        detalles: {
          evaluaciones_actualizadas: evaluacionesCount,
          id_entrenador: id,
          email: emailEntrenador
        }
      });

    } catch (error) {
      console.error('❌❌❌ ERROR ELIMINANDO ENTRENADOR:', error);

      let errorMessage = 'Error al eliminar entrenador';
      let statusCode = 500;

      if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = 'No se puede eliminar el entrenador porque tiene registros asociados. Intenta desactivar al entrenador en lugar de eliminarlo.';
        statusCode = 409; // Conflict

        // Información adicional útil
        console.error('🔍 Detalle FK:', error.parent?.detail);
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        detalles: process.env.NODE_ENV === 'development' ? {
          mensaje: error.message,
          constraint: error.parent?.constraint,
          tabla: error.parent?.table
        } : undefined,
        sugerencia: 'Utiliza la opción "Desactivar" en lugar de "Eliminar" si el entrenador tiene historial'
      });
    }
  }


  static async verificarTokenRegistro(req, res) {
    try {
      const { token } = req.params;

      console.log('🔍 === VERIFICANDO TOKEN DE REGISTRO (PASO 3) ===');
      console.log('Token:', token);

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
      console.error('❌ Error verificando token:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor al verificar el token'
      });
    }
  }

  // ==========================================
  // VISTA GLOBAL DE DEPORTISTAS
  // ==========================================

  static async getAllDeportistasGlobal(req, res) {
    try {
      console.log('📥 getAllDeportistasGlobal - Obteniendo deportistas para admin');

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado. Se requiere rol de administrador'
        });
      }

      // 🔥 CORRECCIÓN: Usar 'talla_camiseta' en lugar de 'talla'
      const deportistas = await Deportista.findAll({
        attributes: [
          'id',
          'user_id',
          'nivel_actual',
          'estado',
          'equipo_competitivo',
          'peso',
          'altura',
          'talla_camiseta', // ⬅️ CAMBIAR 'talla' por 'talla_camiseta'
          'fecha_nacimiento',
          'direccion', // ⬅️ Agregar si necesitas
          'eps', // ⬅️ Agregar si necesitas
          'nivel_sugerido', // ⬅️ Agregar si necesitas
          'nivel_deportivo', // ⬅️ Agregar si necesitas
          'contacto_emergencia_nombre',
          'contacto_emergencia_telefono',
          'contacto_emergencia_parentesco',
          'created_at',
          'updated_at'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: [
            'id',
            'nombre',
            'email',
            'telefono',
            'activo',
            'acepta_terminos',
            'created_at',
            'updated_at'
          ],
          required: true
        }],
        order: [['created_at', 'DESC']],
        raw: true,
        nest: true
      });

      console.log(`✅ ${deportistas.length} deportistas encontrados`);

      // 🔥 CORRECCIÓN: Usar 'talla_camiseta' en el mapeo también
      const deportistasJSON = deportistas.map(dep => {
        return {
          id: dep.id,
          user_id: dep.user_id,
          nombre: dep.user?.nombre || 'Sin nombre',
          email: dep.user?.email || 'Sin email',
          telefono: dep.user?.telefono || null,
          activo: dep.user?.activo || false,
          acepta_terminos: dep.user?.acepta_terminos || false,
          nivel_actual: dep.nivel_actual || 'pendiente',
          estado: dep.estado || 'activo',
          equipo_competitivo: dep.equipo_competitivo || 'sin_equipo',
          peso: dep.peso || null,
          altura: dep.altura || null,
          talla_camiseta: dep.talla_camiseta || null, // ⬅️ Usar 'talla_camiseta'
          fecha_nacimiento: dep.fecha_nacimiento || null,
          direccion: dep.direccion || null, // ⬅️ Agregar si necesitas
          eps: dep.eps || null, // ⬅️ Agregar si necesitas
          nivel_sugerido: dep.nivel_sugerido || null, // ⬅️ Agregar si necesitas
          nivel_deportivo: dep.nivel_deportivo || null, // ⬅️ Agregar si necesitas
          contacto_emergencia_nombre: dep.contacto_emergencia_nombre || null,
          contacto_emergencia_telefono: dep.contacto_emergencia_telefono || null,
          contacto_emergencia_parentesco: dep.contacto_emergencia_parentesco || null,
          created_at: dep.created_at,
          updated_at: dep.updated_at
        };
      });

      res.json({
        success: true,
        total: deportistasJSON.length,
        deportistas: deportistasJSON
      });

    } catch (error) {
      console.error('❌ Error obteniendo deportistas:', error);
      console.error('   Stack completo:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'Error obteniendo deportistas de la base de datos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ==========================================
  // GESTIÓN DE ADMINISTRADORES
  // ==========================================

  static async getAllAdministradores(req, res) {
    try {
      console.log('📥 Obteniendo todos los administradores...');

      const administradores = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo', 'role', 'created_at'],
        order: [['created_at', 'DESC']],
        raw: true
      });

      console.log(`✅ ${administradores.length} administradores encontrados`);

      res.json({
        success: true,
        total: administradores.length,
        administradores
      });

    } catch (error) {
      console.error('❌ Error obteniendo administradores:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo administradores',
        details: error.message
      });
    }
  }

  static async createAdministrador(req, res) {
    try {
      const { nombre, email, password, telefono } = req.body;

      // Validaciones
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nombre, email y contraseña son requeridos'
        });
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Email no válido'
        });
      }

      // Verificar email único
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está registrado'
        });
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear administrador
      const admin = await User.create({
        nombre,
        email,
        password: hashedPassword,
        telefono,
        role: 'admin',
        activo: true
      });

      console.log('✅ Administrador creado:', admin.email);

      // 🔥 AGREGAR ESTE DEBUG CRÍTICO
      console.log('\n🧪 === VERIFICACIÓN DE CONTRASEÑA ===');
      console.log('📧 Email guardado:', admin.email);
      console.log('🔐 Contraseña ORIGINAL:', password);
      console.log('🔒 Hash guardado en BD:', hashedPassword.substring(0, 20) + '...');

      // 🧪 PROBAR LA CONTRASEÑA INMEDIATAMENTE
      const testCompare = await bcrypt.compare(password, hashedPassword);
      console.log('✅ Test de contraseña:', testCompare ? 'PASS ✓' : 'FAIL ✗');

      if (!testCompare) {
        console.error('❌❌❌ ERROR CRÍTICO: La contraseña no coincide con su hash');
        return res.status(500).json({
          success: false,
          error: 'Error interno: problema con el hash de contraseña'
        });
      }

      console.log('🎉 Contraseña verificada correctamente\n');

      res.status(201).json({
        success: true,
        message: '✅ Administrador creado exitosamente',
        password_original: password, // Para debugging
        administrador: {
          id: admin.id,
          nombre: admin.nombre,
          email: admin.email,
          telefono: admin.telefono,
          activo: admin.activo
        }
      });

    } catch (error) {
      console.error('❌ Error creando administrador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  static async updateAdministrador(req, res) {
    try {
      const { id } = req.params;
      const { nombre, email, telefono, password } = req.body;

      const admin = await User.findOne({
        where: { id, role: 'admin' }
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'Administrador no encontrado'
        });
      }

      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (email) updateData.email = email;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await admin.update(updateData);

      console.log('✅ Administrador actualizado:', admin.email);

      res.json({
        success: true,
        message: '✅ Administrador actualizado exitosamente',
        administrador: {
          id: admin.id,
          nombre: admin.nombre,
          email: admin.email,
          telefono: admin.telefono,
          activo: admin.activo
        }
      });
    } catch (error) {
      console.error('❌ Error actualizando administrador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  static async deleteAdministrador(req, res) {
    try {
      const { id } = req.params;

      // No permitir auto-eliminación
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'No puedes eliminar tu propia cuenta de administrador'
        });
      }

      const admin = await User.findOne({
        where: { id, role: 'admin' }
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'Administrador no encontrado'
        });
      }

      const nombreAdmin = admin.nombre;
      await admin.destroy();

      console.log('✅ Administrador eliminado:', nombreAdmin);

      res.json({
        success: true,
        message: `✅ Administrador "${nombreAdmin}" eliminado exitosamente`
      });
    } catch (error) {
      console.error('❌ Error eliminando administrador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  static async toggleAdministradorStatus(req, res) {
    try {
      const { id } = req.params;

      // No permitir auto-desactivación
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'No puedes cambiar el estado de tu propia cuenta'
        });
      }

      const admin = await User.findOne({
        where: { id, role: 'admin' }
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'Administrador no encontrado'
        });
      }

      await admin.update({ activo: !admin.activo });

      res.json({
        success: true,
        message: `✅ Administrador ${admin.activo ? 'activado' : 'desactivado'}`,
        administrador: {
          id: admin.id,
          nombre: admin.nombre,
          activo: admin.activo
        }
      });
    } catch (error) {
      console.error('❌ Error cambiando estado del administrador:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  // ==========================================
  // EVALUACIONES
  // ==========================================

  static async getAllEvaluaciones(req, res) {
    try {
      console.log('📝 Obteniendo todas las evaluaciones...');

      const evaluaciones = await Evaluacion.findAll({
        include: [
          {
            model: Deportista,
            as: 'deportista',
            include: [{
              model: User,
              as: 'user',
              attributes: ['nombre']
            }]
          },
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['nombre']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['nombre']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']],
        limit: 100
      });

      console.log(`✅ ${evaluaciones.length} evaluaciones encontradas`);

      res.json({
        success: true,
        evaluaciones: evaluaciones.map(e => ({
          id: e.id,
          deportista_id: e.deportista_id,
          deportista_nombre: e.deportista?.user?.nombre,
          habilidad_nombre: e.habilidad?.nombre,
          puntuacion: e.puntuacion,
          observaciones: e.observaciones,
          video_url: e.video_url,
          fecha_evaluacion: e.fecha_evaluacion,
          entrenador_nombre: e.entrenador?.nombre,
          nivel: e.deportista?.nivel_actual
        }))
      });

    } catch (error) {
      console.error('❌ Error obteniendo evaluaciones:', error);
      res.status(500).json({ error: 'Error obteniendo evaluaciones' });
    }
  }

  static async getEvaluacionesRecientes(req, res) {
    try {
      console.log('📅 Obteniendo evaluaciones recientes...');

      const evaluaciones = await Evaluacion.findAll({
        include: [
          {
            model: Deportista,
            as: 'deportista',
            include: [{
              model: User,
              as: 'user',
              attributes: ['nombre']
            }]
          },
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['nombre']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['nombre']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']],
        limit: 20
      });

      console.log(`✅ ${evaluaciones.length} evaluaciones recientes encontradas`);

      res.json({
        success: true,
        evaluaciones: evaluaciones.map(e => ({
          id: e.id,
          deportista_nombre: e.deportista?.user?.nombre,
          habilidad_nombre: e.habilidad?.nombre,
          puntuacion: e.puntuacion,
          fecha_evaluacion: e.fecha_evaluacion,
          nivel: e.deportista?.nivel_actual
        }))
      });

    } catch (error) {
      console.error('❌ Error obteniendo evaluaciones recientes:', error);
      res.status(500).json({ error: 'Error obteniendo evaluaciones recientes' });
    }
  }

  // ==========================================
  // REPORTES
  // ==========================================

  static async getReporteResumen(req, res) {
    try {
      const stats = await AdminController.getStatsInternal();

      res.json({
        success: true,
        reporte: {
          fecha_generacion: new Date(),
          ...stats
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor'
      });
    }
  }

  static async getReporteActividad(req, res) {
    try {
      const ultimasEvaluaciones = await Evaluacion.findAll({
        limit: 20,
        order: [['fecha_evaluacion', 'DESC']],
        include: [
          {
            model: Deportista,
            as: 'deportista',
            include: [{
              model: User,
              as: 'user',
              attributes: ['nombre']
            }]
          },
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['nombre']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['nombre']
          }
        ]
      });

      res.json({
        success: true,
        actividad_reciente: ultimasEvaluaciones
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor'
      });
    }
  }

  // ==========================================
  // MÉTODOS INTERNOS
  // ==========================================

  static async getStatsInternal() {
    const totalEntrenadores = await User.count({ where: { role: 'entrenador' } });
    const totalDeportistas = await User.count({ where: { role: 'deportista' } });
    const totalEvaluaciones = await Evaluacion.count();
    const deportistasActivos = await Deportista.count({ where: { estado: 'activo' } });

    return {
      total_entrenadores: totalEntrenadores,
      total_deportistas: totalDeportistas,
      deportistas_activos: deportistasActivos,
      total_evaluaciones: totalEvaluaciones
    };
  }

  // ==========================================
  // NUEVOS MÉTODOS PARA ENTRENADORES
  // ==========================================

  static async getEntrenadoresPendientes(req, res) {
    try {
      console.log('⏳ Obteniendo entrenadores pendientes de registro...');

      const entrenadoresPendientes = await User.findAll({
        where: {
          role: 'entrenador',
          requiere_registro: true
        },
        attributes: [
          'id',
          'nombre',
          'email',
          'telefono',
          'fecha_nacimiento',
          'created_at'
        ],
        order: [['created_at', 'ASC']],
        raw: true
      });

      console.log(`✅ ${entrenadoresPendientes.length} entrenadores pendientes encontrados`);

      res.json({
        success: true,
        total: entrenadoresPendientes.length,
        entrenadores: entrenadoresPendientes
      });
    } catch (error) {
      console.error('❌ Error obteniendo entrenadores pendientes:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  // ==========================================
  // VERIFICACIÓN DE EMAIL (para el registro)
  // ==========================================

  static async verificarTokenRegistro(req, res) {
    try {
      const { token } = req.params;

      console.log('🔍 Verificando token de registro:', token.substring(0, 20) + '...');

      // Verificar token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui_12345_2024'
      );

      if (decoded.tipo !== 'registro_entrenador') {
        return res.status(400).json({
          success: false,
          error: 'Token inválido'
        });
      }

      // Buscar entrenador
      const entrenador = await User.findOne({
        where: {
          email: decoded.email,
          token_registro: token,
          requiere_registro: true
        },
        attributes: ['id', 'nombre', 'email']
      });

      if (!entrenador) {
        return res.status(404).json({
          success: false,
          error: 'Token inválido o expirado'
        });
      }

      res.json({
        success: true,
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          email: entrenador.email
        },
        token_valido: true
      });
    } catch (error) {
      console.error('❌ Error verificando token:', error);

      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({
          success: false,
          error: 'Token inválido'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          error: 'Token expirado'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  // ==========================================
  // GESTIÓN COMPLETA DE DEPORTISTAS
  // ==========================================

  // ==========================================
  // ✅ MÉTODO: Update deportista completo
  // ==========================================
  static async updateDeportista(req, res) {
    try {
        const { id } = req.params;
        const datos = req.body;
        
        console.log(`✏️ Actualizando deportista ${id}:`, datos);
        
        // 🔥 DEBUG EXTENDIDO - Verificar todos los datos recibidos
        console.log('🔍 DEBUG: Datos recibidos del frontend:');
        console.log('- Peso:', datos.peso);
        console.log('- Altura:', datos.altura);
        console.log('- Talla Camiseta:', datos.talla_camiseta);
        console.log('- Talla (alternativa):', datos.talla);
        console.log('- Nivel:', datos.nivel_actual);
        console.log('- Estado:', datos.estado);
        console.log('- Equipo:', datos.equipo_competitivo);
        
        // Buscar deportista
        const deportista = await Deportista.findByPk(id);
        
        if (!deportista) {
            return res.status(404).json({
                success: false,
                error: 'Deportista no encontrado'
            });
        }
        
        // 🔥 CORRECCIÓN: Agregar TODOS los campos posibles
        const camposPermitidos = [
            'peso', 'altura', 'talla_camiseta', 'talla',
            'nivel_actual', 'estado', 'equipo_competitivo',
            'fecha_nacimiento', 'eps', 'direccion',
            'contacto_emergencia_nombre', 'contacto_emergencia_telefono', 
            'contacto_emergencia_parentesco'
        ];
        
        const updates = {};
        
        // Procesar cada campo
        Object.keys(datos).forEach(key => {
            // Mapear 'talla' a 'talla_camiseta'
            if (key === 'talla') {
                updates['talla_camiseta'] = datos[key];
                console.log(`🔄 Mapeando 'talla' → 'talla_camiseta': ${datos[key]}`);
            }
            // Agregar otros campos permitidos
            else if (camposPermitidos.includes(key)) {
                updates[key] = datos[key];
                console.log(`✅ Agregando campo '${key}': ${datos[key]}`);
            }
            else {
                console.log(`⚠️  Campo '${key}' no permitido o ignorado`);
            }
        });
        
        console.log('📝 Campos que se actualizarán:', updates);
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron campos válidos para actualizar'
            });
        }
        
        // 🔥 DEBUG: Ver estado actual del deportista
        console.log('📊 Estado actual del deportista:');
        console.log('- Peso actual:', deportista.peso);
        console.log('- Altura actual:', deportista.altura);
        console.log('- Talla actual:', deportista.talla_camiseta);
        
        // Actualizar
        await deportista.update(updates);
        console.log('✅ Deportista actualizado en BD:', updates);
        
        // Si se actualiza el usuario (nombre, email, teléfono)
        if (datos.nombre || datos.email || datos.telefono) {
            const userUpdates = {};
            if (datos.nombre) userUpdates.nombre = datos.nombre;
            if (datos.email) userUpdates.email = datos.email;
            if (datos.telefono !== undefined) userUpdates.telefono = datos.telefono;
            
            if (Object.keys(userUpdates).length > 0) {
                await User.update(userUpdates, {
                    where: { id: deportista.user_id }
                });
                console.log('✅ Usuario actualizado:', userUpdates);
            }
        }
        
        // 🔥 DEBUG: Recargar para verificar cambios
        const deportistaActualizado = await Deportista.findByPk(id, {
            attributes: ['id', 'peso', 'altura', 'talla_camiseta', 'nivel_actual', 'estado', 'equipo_competitivo']
        });
        
        console.log('🔍 DEPORTISTA ACTUALIZADO EN BD:');
        console.log('- Nuevo peso:', deportistaActualizado.peso);
        console.log('- Nueva altura:', deportistaActualizado.altura);
        console.log('- Nueva talla camiseta:', deportistaActualizado.talla_camiseta);
        console.log('- Nuevo nivel:', deportistaActualizado.nivel_actual);
        console.log('- Nuevo estado:', deportistaActualizado.estado);
        console.log('- Nuevo equipo:', deportistaActualizado.equipo_competitivo);
        
        res.json({
            success: true,
            message: 'Deportista actualizado exitosamente',
            deportista: {
                id: deportista.id,
                peso: deportistaActualizado.peso,
                altura: deportistaActualizado.altura,
                talla_camiseta: deportistaActualizado.talla_camiseta,
                nivel_actual: deportistaActualizado.nivel_actual,
                estado: deportistaActualizado.estado,
                equipo_competitivo: deportistaActualizado.equipo_competitivo
            }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando deportista:', error);
        console.error('   Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error en el servidor',
            details: error.message
        });
    }
}

  // ==========================================
  // ✅ MÉTODO NUEVO: Actualizar campo específico (nivel, estado, equipo)
  // ==========================================
  static async updateDeportistaCampo(req, res) {
    try {
      const { id } = req.params;
      const { campo, valor } = req.body;

      console.log(`✏️ Actualizando campo ${campo} del deportista ID: ${id} -> ${valor}`);

      // Validar campos
      if (!campo || valor === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Campo y valor son requeridos'
        });
      }

      // Buscar deportista
      const deportista = await Deportista.findByPk(id);

      if (!deportista) {
        console.log(`❌ Deportista no encontrado con ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Deportista no encontrado'
        });
      }

      // Campos permitidos
      const camposPermitidos = [
        'nivel_actual',
        'estado',
        'equipo_competitivo',
        'peso',
        'altura',
        'talla_camiseta' // ⬅️ TALLA ESTÁ AQUÍ
      ];

      if (!camposPermitidos.includes(campo)) {
        return res.status(400).json({
          success: false,
          message: `Campo no permitido. Campos permitidos: ${camposPermitidos.join(', ')}`
        });
      }

      // Guardar valor anterior
      const valorAnterior = deportista[campo];

      // Actualizar campo
      deportista[campo] = valor;
      await deportista.save();

      console.log(`✅ Campo ${campo} actualizado: ${valorAnterior} → ${valor}`);

      // Crear historial si es cambio de nivel
      if (campo === 'nivel_actual') {
        try {
          // 🔥 CORREGIR: Asegurar que HistorialNivel esté importado
          await HistorialNivel.create({
            deportista_id: deportista.id,
            nivel_anterior: valorAnterior,
            nivel_nuevo: valor,
            fecha_cambio: new Date(),
            observaciones: `Cambio realizado por administrador`
          });
          console.log(`📝 Historial de nivel registrado`);
        } catch (histError) {
          console.warn(`⚠️  Error registrando historial:`, histError.message);
        }
      }

      res.json({
        success: true,
        message: 'Campo actualizado exitosamente',
        deportista: {
          id: deportista.id,
          [campo]: valor
        }
      });

    } catch (error) {
      console.error('❌ Error actualizando campo deportista:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar campo',
        error: error.message
      });
    }
  }
  // ==========================================
  // ✅ MÉTODO NUEVO: Actualizar información del deportista (peso, altura, talla)
  // ==========================================
  static async updateDeportistaInfo(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body; // { peso, altura, talla_camiseta }

      console.log(`✏️ Actualizando info física del deportista ${id}:`, updates);

      // Buscar deportista
      const deportista = await Deportista.findByPk(id);

      if (!deportista) {
        return res.status(404).json({
          success: false,
          message: 'Deportista no encontrado'
        });
      }

      // Campos permitidos para actualización física
      const camposFisicos = ['peso', 'altura', 'talla_camiseta'];
      const updatesPermitidos = {};

      Object.keys(updates).forEach(key => {
        if (camposFisicos.includes(key)) {
          updatesPermitidos[key] = updates[key];
        }
      });

      if (Object.keys(updatesPermitidos).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron campos válidos para actualizar'
        });
      }

      // Actualizar
      await deportista.update(updatesPermitidos);

      console.log(`✅ Info física actualizada:`, updatesPermitidos);

      res.json({
        success: true,
        message: 'Información física actualizada exitosamente',
        deportista: {
          id: deportista.id,
          ...updatesPermitidos
        }
      });

    } catch (error) {
      console.error('❌ Error actualizando info deportista:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar información',
        error: error.message
      });
    }
  }


  // ==========================================
  // ✅ MÉTODO: Get deportista by ID (corregido)
  // ==========================================
  static async getDeportistaById(req, res) {
    try {
      const { id } = req.params;

      console.log(`📋 Obteniendo deportista por ID: ${id}`);

      // Buscar en tabla Deportista, no User
      const deportista = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nombre', 'email', 'telefono', 'created_at']
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          success: false,
          error: 'Deportista no encontrado'
        });
      }

      // Formatear respuesta
      const deportistaData = {
        id: deportista.id,
        user_id: deportista.user_id,
        nombre: deportista.user?.nombre,
        email: deportista.user?.email,
        telefono: deportista.user?.telefono,
        nivel_actual: deportista.nivel_actual,
        estado: deportista.estado,
        equipo_competitivo: deportista.equipo_competitivo,
        peso: deportista.peso,
        altura: deportista.altura,
        talla_camiseta: deportista.talla_camiseta,
        fecha_nacimiento: deportista.fecha_nacimiento,
        eps: deportista.eps,
        direccion: deportista.direccion,
        contacto_emergencia_nombre: deportista.contacto_emergencia_nombre,
        contacto_emergencia_telefono: deportista.contacto_emergencia_telefono,
        contacto_emergencia_parentesco: deportista.contacto_emergencia_parentesco,
        fecha_ingreso: deportista.user?.created_at,
        created_at: deportista.created_at,
        updated_at: deportista.updated_at
      };

      res.json({
        success: true,
        deportista: deportistaData
      });

    } catch (error) {
      console.error('❌ Error obteniendo deportista:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }


  
  static async eliminarDeportista(req, res) {
    try {
      const { id } = req.params;

      console.log(`🗑️ Eliminando deportista ${id} (método DELETE estándar)`);

      // Llama al método existente
      return await AdminController.eliminarDeportistaCompleto(req, res);
    } catch (error) {
      console.error('❌ Error en eliminarDeportista:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor'
      });
    }
  }

  static async eliminarDeportistaCompleto(req, res) {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ === ELIMINACIÓN COMPLETA DE DEPORTISTA ${id} ===`);
        
        // 🔍 1. Buscar deportista
        const deportista = await Deportista.findByPk(id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'nombre', 'email']
            }]
        });
        
        if (!deportista) {
            console.log(`❌ Deportista no encontrado con ID: ${id}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Deportista no encontrado' 
            });
        }
        
        console.log(`✅ Deportista encontrado:`, {
            id: deportista.id,
            nombre: deportista.user?.nombre,
            email: deportista.user?.email,
            user_id: deportista.user_id
        });
        
        const userId = deportista.user_id;
        const nombreDeportista = deportista.user?.nombre || 'Desconocido';
        
        // 📊 2. Contar registros relacionados
        const evaluacionesCount = await Evaluacion.count({ 
            where: { deportista_id: id } 
        });
        
        // 🔥 CORREGIR: HistorialNivel debe estar importado
        const historialCount = await HistorialNivel.count({
            where: { deportista_id: id }
        });
        
        console.log(`📊 Registros relacionados encontrados:`, {
            evaluaciones: evaluacionesCount,
            historial_nivel: historialCount
        });
        
        // 🔥 3. ELIMINAR EN TRANSACCIÓN
        const transaction = await sequelize.transaction();
        
        try {
            // a) Eliminar evaluaciones
            if (evaluacionesCount > 0) {
                console.log(`🗑️ Eliminando ${evaluacionesCount} evaluaciones...`);
                await Evaluacion.destroy({
                    where: { deportista_id: id },
                    transaction
                });
                console.log(`✅ Evaluaciones eliminadas`);
            }
            
            // b) Eliminar historial de nivel
            if (historialCount > 0) {
                console.log(`🗑️ Eliminando ${historialCount} registros de historial...`);
                await HistorialNivel.destroy({
                    where: { deportista_id: id },
                    transaction
                });
                console.log(`✅ Historial eliminado`);
            }
            
            // c) Eliminar el deportista
            console.log(`🗑️ Eliminando registro de deportista...`);
            await deportista.destroy({ transaction });
            console.log(`✅ Deportista eliminado de la tabla deportistas`);
            
            // d) Eliminar el usuario asociado
            console.log(`🗑️ Eliminando usuario ${userId}...`);
            await User.destroy({
                where: { id: userId },
                transaction
            });
            console.log(`✅ Usuario eliminado`);
            
            // ✅ Confirmar transacción
            await transaction.commit();
            
            console.log(`✅✅✅ ELIMINACIÓN COMPLETADA: ${nombreDeportista}`);
            
            res.json({ 
                success: true, 
                message: `Deportista "${nombreDeportista}" eliminado exitosamente`,
                detalles: {
                    id_deportista: id,
                    id_usuario: userId,
                    nombre: nombreDeportista,
                    evaluaciones_eliminadas: evaluacionesCount,
                    historial_eliminado: historialCount
                }
            });
            
        } catch (transactionError) {
            // ❌ Revertir todo
            await transaction.rollback();
            console.error('❌❌❌ ERROR EN TRANSACCIÓN:', transactionError);
            throw transactionError;
        }
        
    } catch (error) {
        console.error('❌❌❌ ERROR ELIMINANDO DEPORTISTA:', error);
        
        let errorMessage = 'Error al eliminar deportista';
        let statusCode = 500;
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            errorMessage = 'No se puede eliminar el deportista porque tiene registros relacionados. Contacta al administrador de la base de datos.';
            statusCode = 409;
        }
        
        res.status(statusCode).json({ 
            success: false, 
            message: errorMessage,
            error: error.message,
            detalles: process.env.NODE_ENV === 'development' ? {
                tipo: error.name,
                constraint: error.parent?.constraint,
                tabla: error.parent?.table
            } : undefined
        });
    }
}

  static async toggleDeportistaStatus(req, res) {
    try {
      const { id } = req.params;

      console.log(`🔄 Cambiando estado del deportista ${id}...`);

      const deportista = await User.findOne({
        where: { id, role: 'deportista' }
      });

      if (!deportista) {
        return res.status(404).json({
          success: false,
          error: 'Deportista no encontrado'
        });
      }

      await deportista.update({ activo: !deportista.activo });

      res.json({
        success: true,
        message: `✅ Deportista ${deportista.activo ? 'activado' : 'desactivado'}`,
        deportista: {
          id: deportista.id,
          nombre: deportista.nombre,
          activo: deportista.activo
        }
      });
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  static async searchDeportistas(req, res) {
    try {
      const { q, nivel, estado, equipo } = req.query;

      console.log('🔍 Buscando deportistas con filtros:', { q, nivel, estado, equipo });

      const where = { role: 'deportista' };

      if (q) {
        where[sequelize.Sequelize.Op.or] = [
          { nombre: { [sequelize.Sequelize.Op.iLike]: `%${q}%` } },
          { email: { [sequelize.Sequelize.Op.iLike]: `%${q}%` } }
        ];
      }

      if (nivel) where.nivel_actual = nivel;
      if (estado) where.estado = estado;
      if (equipo) where.equipo_competitivo = equipo;

      const deportistas = await User.findAll({
        where,
        attributes: [
          'id', 'nombre', 'email', 'telefono',
          'nivel_actual', 'estado', 'equipo_competitivo',
          'peso', 'altura'
        ],
        order: [['nombre', 'ASC']]
      });

      res.json({
        success: true,
        deportistas
      });
    } catch (error) {
      console.error('❌ Error buscando deportistas:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }


}

module.exports = AdminController;