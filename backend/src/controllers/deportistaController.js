// backend/src/controllers/deportistaController.js
const { Deportista, User, Evaluacion, Habilidad } = require('../models');
const { sequelize } = require('../config/database');

class DeportistaController {
  
  // AGREGAR ESTA RUTA AL INICIO:
  static async getMe(req, res) {
    try {
      const userId = req.user.id;
      
      console.log('🔍 Buscando deportista para user_id:', userId);
      
      const deportista = await Deportista.findOne({
        where: { user_id: userId },
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }]
      });
      
      if (!deportista) {
        return res.status(404).json({
          error: 'No se encontró tu perfil de deportista'
        });
      }
      
      console.log('✅ Deportista encontrado:', deportista.id);
      
      res.json({
        success: true,
        deportista
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  // Obtener todos los deportistas
  static async getAll(req, res) {
    try {
      console.log('📥 Petición getAll deportistas recibida');
      
      const deportistas = await Deportista.findAll({
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }],
        order: [['created_at', 'DESC']]
      });

      console.log(`✅ ${deportistas.length} deportistas encontrados`);

      res.json({
        success: true,
        total: deportistas.length,
        deportistas
      });

    } catch (error) {
      console.error('❌ Error en getAll deportistas:', error);
      res.status(500).json({
        error: 'Error obteniendo deportistas',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener un deportista por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const deportista = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      res.json({
        success: true,
        deportista
      });

    } catch (error) {
      console.error('❌ Error obteniendo deportista:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Crear nuevo deportista - VERSIÓN CORREGIDA
  static async create(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('📥 CREAR DEPORTISTA - Usuario autenticado:', req.user);
      
      // VERIFICAR PERMISOS
      if (!req.user || !req.user.id) {
        console.log('❌ Sin usuario autenticado');
        await transaction.rollback();
        return res.status(401).json({
          error: 'No autenticado. Por favor inicia sesión.'
        });
      }
      
      if (req.user.role !== 'entrenador' && req.user.role !== 'admin') {
        console.log('❌ Sin permisos:', req.user.role);
        await transaction.rollback();
        return res.status(403).json({
          error: 'No tienes permisos para crear deportistas'
        });
      }

      console.log('\n========================================');
      console.log('📥 CREAR DEPORTISTA - Inicio');
      console.log('========================================');
      console.log('Body recibido:', JSON.stringify(req.body, null, 2));
      console.log('Archivo recibido:', req.file ? req.file.filename : 'Sin archivo');

      const {
        nombre,
        email,
        password,
        telefono,
        fecha_nacimiento,
        altura,
        peso,
        nivel_actual,
        contacto_emergencia_nombre,
        contacto_emergencia_telefono,
        contacto_emergencia_parentesco
      } = req.body;

      // ============================================
      // PASO 1: VALIDACIONES BÁSICAS
      // ============================================
      if (!nombre || !email || !password) {
        console.log('❌ Validación fallida: Faltan campos requeridos');
        await transaction.rollback();
        return res.status(400).json({
          error: 'Nombre, email y contraseña son requeridos'
        });
      }

      // ============================================
      // PASO 2: VERIFICAR EMAIL ÚNICO
      // ============================================
      console.log('🔍 Verificando si el email existe...');
      const existingUser = await User.findOne({ 
        where: { email },
        transaction 
      });
      
      if (existingUser) {
        console.log('❌ El email ya está registrado:', email);
        await transaction.rollback();
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }
      console.log('✅ Email disponible');

      // ============================================
      // PASO 3: CREAR USUARIO
      // ============================================
      console.log('👤 Creando usuario...');
      const user = await User.create({
        nombre,
        email,
        password, // Se hashea automáticamente por el hook
        telefono: telefono || null,
        role: 'deportista',
        activo: true
      }, { transaction });

      console.log('✅ Usuario creado con ID:', user.id);

      // ============================================
      // PASO 4: CREAR PERFIL DEPORTISTA
      // ============================================
      console.log('🏃 Creando perfil deportista...');
      
      const deportistaData = {
        user_id: user.id,
        fecha_nacimiento: fecha_nacimiento || null,
        altura: altura ? parseFloat(altura) : null,
        peso: peso ? parseFloat(peso) : null,
        nivel_actual: nivel_actual || '1_basico',
        estado: 'activo',
        contacto_emergencia_nombre: contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: contacto_emergencia_telefono || null,
        contacto_emergencia_parentesco: contacto_emergencia_parentesco || null,
        foto_perfil: req.file ? req.file.path : null
      };
      
      console.log('Datos del deportista:', deportistaData);

      const deportista = await Deportista.create(deportistaData, { transaction });
      console.log('✅ Deportista creado con ID:', deportista.id);

      // ============================================
      // PASO 5: CONFIRMAR TRANSACCIÓN
      // ============================================
      await transaction.commit();
      console.log('✅ Transacción confirmada exitosamente');

      // ============================================
      // PASO 6: OBTENER DEPORTISTA COMPLETO
      // ============================================
      const deportistaCompleto = await Deportista.findByPk(deportista.id, {
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }]
      });

      console.log('========================================');
      console.log('✅ DEPORTISTA CREADO EXITOSAMENTE');
      console.log('========================================\n');

      // ============================================
      // RESPUESTA EXITOSA
      // ============================================
      res.status(201).json({
        success: true,
        message: 'Deportista creado exitosamente',
        deportista: deportistaCompleto
      });

    } catch (error) {
      // ============================================
      // MANEJO DE ERRORES
      // ============================================
      console.log('\n========================================');
      console.error('❌❌❌ ERROR CREANDO DEPORTISTA ❌❌❌');
      console.log('========================================');
      
      await transaction.rollback();
      console.log('🔄 Transacción revertida');
      
      console.error('Tipo de error:', error.name);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      
      if (error.name === 'SequelizeValidationError') {
        console.error('\n📋 Errores de validación:');
        error.errors.forEach(e => {
          console.error(`  - Campo: ${e.path}`);
          console.error(`    Mensaje: ${e.message}`);
          console.error(`    Valor: ${e.value}`);
        });
        
        return res.status(400).json({
          error: 'Error de validación',
          detalles: error.errors.map(e => ({
            campo: e.path,
            mensaje: e.message
          }))
        });
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.error('\n🔗 Error de unicidad:');
        console.error('  Campo:', error.fields);
        
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }
      
      console.log('========================================\n');
      
      res.status(500).json({
        error: 'Error creando deportista',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Actualizar deportista
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre,
        email,
        telefono,
        fecha_nacimiento,
        altura,
        peso,
        nivel_actual,
        estado,
        contacto_emergencia_nombre,
        contacto_emergencia_telefono,
        contacto_emergencia_parentesco
      } = req.body;

      const deportista = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'User'
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      // Actualizar datos del usuario si se proporcionaron
      if (deportista.User) {
        const userUpdateData = {};
        if (nombre) userUpdateData.nombre = nombre;
        if (email) userUpdateData.email = email;
        if (telefono !== undefined) userUpdateData.telefono = telefono;
        
        await deportista.User.update(userUpdateData);
      }

      // Actualizar datos del deportista
      const deportistaUpdateData = {};
      if (fecha_nacimiento !== undefined) deportistaUpdateData.fecha_nacimiento = fecha_nacimiento || null;
      if (altura !== undefined) deportistaUpdateData.altura = altura ? parseFloat(altura) : null;
      if (peso !== undefined) deportistaUpdateData.peso = peso ? parseFloat(peso) : null;
      if (nivel_actual !== undefined) deportistaUpdateData.nivel_actual = nivel_actual;
      if (estado !== undefined) deportistaUpdateData.estado = estado;
      if (contacto_emergencia_nombre !== undefined) deportistaUpdateData.contacto_emergencia_nombre = contacto_emergencia_nombre || null;
      if (contacto_emergencia_telefono !== undefined) deportistaUpdateData.contacto_emergencia_telefono = contacto_emergencia_telefono || null;
      if (contacto_emergencia_parentesco !== undefined) deportistaUpdateData.contacto_emergencia_parentesco = contacto_emergencia_parentesco || null;

      await deportista.update(deportistaUpdateData);

      console.log('✅ Deportista actualizado:', id);

      // Obtener deportista actualizado con usuario
      const deportistaActualizado = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }]
      });

      res.json({
        success: true,
        message: 'Deportista actualizado exitosamente',
        deportista: deportistaActualizado
      });

    } catch (error) {
      console.error('❌ Error actualizando deportista:', error);
      res.status(500).json({
        error: 'Error actualizando deportista',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Eliminar deportista
  static async delete(req, res) {
    try {
      const { id } = req.params;

      console.log('🗑️  Intentando eliminar deportista:', id);

      const deportista = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'User'
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      const nombreDeportista = deportista.User?.nombre;
      const userId = deportista.user_id;

      // Eliminar evaluaciones primero
      await Evaluacion.destroy({
        where: { deportista_id: id }
      });

      // Eliminar deportista
      await deportista.destroy();

      // Eliminar usuario
      if (userId) {
        await User.destroy({
          where: { id: userId }
        });
      }

      console.log('✅ Deportista eliminado:', nombreDeportista);

      res.json({
        success: true,
        message: `Deportista ${nombreDeportista} eliminado exitosamente`
      });

    } catch (error) {
      console.error('❌ Error eliminando deportista:', error);
      res.status(500).json({
        error: 'Error eliminando deportista',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener estadísticas del deportista
  static async getStats(req, res) {
    try {
      const { id } = req.params;

      const deportista = await Deportista.findByPk(id);
      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      // Total de evaluaciones
      const totalEvaluaciones = await Evaluacion.count({
        where: { deportista_id: id }
      });

      // Evaluaciones completadas
      const evaluacionesCompletadas = await Evaluacion.count({
        where: {
          deportista_id: id,
          completado: true
        }
      });

      // Promedio de puntuaciones
      const promedio = await Evaluacion.findOne({
        where: { deportista_id: id },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('puntuacion')), 'promedio']
        ],
        raw: true
      });

      // Última evaluación
      const ultimaEvaluacion = await Evaluacion.findOne({
        where: { deportista_id: id },
        order: [['fecha_evaluacion', 'DESC']],
        include: [{
          model: Habilidad,
          as: 'habilidad',
          attributes: ['nombre']
        }]
      });

      res.json({
        success: true,
        stats: {
          total_evaluaciones: totalEvaluaciones,
          evaluaciones_completadas: evaluacionesCompletadas,
          promedio_puntuacion: promedio?.promedio ? parseFloat(promedio.promedio).toFixed(2) : 0,
          ultima_evaluacion: ultimaEvaluacion,
          nivel_actual: deportista.nivel_actual,
          estado: deportista.estado
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: 'Error obteniendo estadísticas'
      });
    }
  }
}

module.exports = DeportistaController;