// backend/src/controllers/deportistaController.js
const { Deportista, User, Evaluacion, Habilidad } = require('../models');
const { sequelize } = require('../config/database');

class DeportistaController {

  // Obtener perfil del deportista autenticado
  static async getMe(req, res) {
    try {
      const userId = req.user.id;

      console.log('🔍 Buscando deportista para user_id:', userId);

      const deportista = await Deportista.findOne({
        where: { user_id: userId },
        include: [{
          model: User,
          as: 'user',
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
      console.log('👤 Usuario:', req.user?.role);

      const deportistas = await Deportista.findAll({
        include: [{
          model: User,
          as: 'user',  // ✅ Esto es LO QUE DEBES USAR según tu modelo Deportista
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }],
        order: [['created_at', 'DESC']]
      });

      console.log(`✅ ${deportistas.length} deportistas encontrados`);

      const deportistasFormateados = deportistas.map(d => {
        const deportistaObj = d.toJSON();
        const user = deportistaObj.user || {};

        return {
          id: deportistaObj.id,
          user_id: deportistaObj.user_id,
          nombre: user.nombre || 'Sin nombre',
          email: user.email || 'Sin email',
          telefono: user.telefono || null,
          activo: user.activo ?? true,
          nivel_actual: deportistaObj.nivel_actual,
          estado: deportistaObj.estado,
          altura: deportistaObj.altura,
          peso: deportistaObj.peso,
          foto_perfil: deportistaObj.foto_perfil,
          equipo_competitivo: deportistaObj.equipo_competitivo || 'sin_equipo',
          contacto_emergencia_nombre: deportistaObj.contacto_emergencia_nombre,
          contacto_emergencia_telefono: deportistaObj.contacto_emergencia_telefono,
          contacto_emergencia_parentesco: deportistaObj.contacto_emergencia_parentesco,
          fecha_nacimiento: deportistaObj.fecha_nacimiento,
          created_at: deportistaObj.created_at,
          updated_at: deportistaObj.updated_at,
          User: user,
          user: user
        };
      });

      return res.status(200).json(deportistasFormateados);

    } catch (error) {
      console.error('❌ Error en getAll deportistas:', error);
      console.error('Stack:', error.stack);

      return res.status(500).json({
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
          as: 'user',
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

  // Crear nuevo deportista
  static async create(req, res) {
    const transaction = await sequelize.transaction();

    try {
      console.log('📥 CREAR DEPORTISTA - Usuario autenticado:', req.user);

      // Verificar permisos
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

      console.log('📥 CREAR DEPORTISTA - Inicio');
      console.log('Body recibido:', JSON.stringify(req.body, null, 2));

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

      // Paso 1: Validaciones básicas
      if (!nombre || !email || !password) {
        console.log('❌ Validación fallida: Faltan campos requeridos');
        await transaction.rollback();
        return res.status(400).json({
          error: 'Nombre, email y contraseña son requeridos'
        });
      }

      // Paso 2: Verificar email único
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

      // Paso 3: Crear usuario
      console.log('👤 Creando usuario...');
      const user = await User.create({
        nombre,
        email,
        password,
        telefono: telefono || null,
        role: 'deportista',
        activo: true
      }, { transaction });

      console.log('✅ Usuario creado con ID:', user.id);

      // Paso 4: Crear perfil deportista
      console.log('🏃 Creando perfil deportista...');

      const deportistaData = {
        user_id: user.id,
        fecha_nacimiento: fecha_nacimiento || null,
        altura: altura ? parseFloat(altura) : null,
        peso: peso ? parseFloat(peso) : null,
        nivel_actual: nivel_actual || 'pendiente',
        estado: 'activo',
        equipo_competitivo: 'sin_equipo',
        contacto_emergencia_nombre: contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: contacto_emergencia_telefono || null,
        contacto_emergencia_parentesco: contacto_emergencia_parentesco || null,
        foto_perfil: req.file ? req.file.path : null
      };

      console.log('Datos del deportista:', deportistaData);

      const deportista = await Deportista.create(deportistaData, { transaction });
      console.log('✅ Deportista creado con ID:', deportista.id);

      // Paso 5: Confirmar transacción
      await transaction.commit();
      console.log('✅ Transacción confirmada exitosamente');

      // Paso 6: Obtener deportista completo
      const deportistaCompleto = await Deportista.findByPk(deportista.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }]
      });

      console.log('✅ DEPORTISTA CREADO EXITOSAMENTE');

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Deportista creado exitosamente',
        deportista: deportistaCompleto
      });

    } catch (error) {
      await transaction.rollback();
      console.error('❌ ERROR CREANDO DEPORTISTA:', error.message);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Error de validación',
          detalles: error.errors.map(e => ({
            campo: e.path,
            mensaje: e.message
          }))
        });
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }

      res.status(500).json({
        error: 'Error creando deportista',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Actualizar deportista
  static async update(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const {
        estado,
        peso,
        altura,
        telefono
        // Solo estos campos son editables por el entrenador
      } = req.body;

      console.log('📝 UPDATE deportista - ID:', id);
      console.log('📦 Datos recibidos para actualizar:', req.body);

      const deportista = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'user'
        }],
        transaction
      });

      if (!deportista) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      // ✅ ACTUALIZAR ESTADO (incluyendo pendiente_de_pago)
      if (estado !== undefined) {
        const estadosValidos = ['activo', 'lesionado', 'descanso', 'inactivo', 'pendiente', 'pendiente_de_pago'];

        if (!estadosValidos.includes(estado)) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
          });
        }

        deportista.estado = estado;
        console.log(`✅ Estado actualizado a: ${estado}`);
      }

      // ✅ ACTUALIZAR CAMPOS EDITABLES
      if (peso !== undefined) deportista.peso = peso;
      if (altura !== undefined) deportista.altura = altura;

      // Actualizar teléfono del usuario si se proporciona
      if (telefono !== undefined && deportista.user) {
        deportista.user.telefono = telefono;
        await deportista.user.save({ transaction });
      }

      // Guardar cambios del deportista
      await deportista.save({ transaction });

      // Confirmar transacción
      await transaction.commit();

      // Obtener deportista actualizado
      const deportistaActualizado = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nombre', 'email', 'telefono']
        }]
      });

      console.log(`✅ Deportista ${deportistaActualizado.user?.nombre} actualizado correctamente`);

      return res.json({
        success: true,
        message: 'Deportista actualizado exitosamente',
        deportista: deportistaActualizado
      });

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error actualizando deportista:', error);

      return res.status(500).json({
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
          as: 'user'
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      const nombreDeportista = deportista.user?.nombre;
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
  static async updateMiPerfil(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const userId = req.user.id;

      console.log('📝 UPDATE mi perfil - User ID:', userId);
      console.log('📦 Datos recibidos:', req.body);

      // Buscar deportista por user_id
      const deportista = await Deportista.findOne({
        where: { user_id: userId },
        include: [{
          model: User,
          as: 'user'
        }],
        transaction
      });

      if (!deportista) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Perfil no encontrado'
        });
      }

      const {
        telefono,
        direccion,
        eps,
        talla_camiseta,
        contacto_emergencia_nombre,
        contacto_emergencia_telefono,
        contacto_emergencia_parentesco
      } = req.body;

      console.log('📋 Campos a actualizar:');
      console.log('- Teléfono:', telefono);
      console.log('- Dirección:', direccion);
      console.log('- EPS:', eps);
      console.log('- Talla camiseta:', talla_camiseta);
      console.log('- Contacto emergencia:', contacto_emergencia_nombre);

      // ✅ ACTUALIZAR CAMPOS DEL DEPORTISTA
      if (direccion !== undefined) deportista.direccion = direccion;
      if (eps !== undefined) deportista.eps = eps;
      if (talla_camiseta !== undefined) deportista.talla_camiseta = talla_camiseta;
      if (contacto_emergencia_nombre !== undefined) deportista.contacto_emergencia_nombre = contacto_emergencia_nombre;
      if (contacto_emergencia_telefono !== undefined) deportista.contacto_emergencia_telefono = contacto_emergencia_telefono;
      if (contacto_emergencia_parentesco !== undefined) deportista.contacto_emergencia_parentesco = contacto_emergencia_parentesco;

      // ✅ ACTUALIZAR TELÉFONO DEL USUARIO
      if (telefono !== undefined && deportista.user) {
        deportista.user.telefono = telefono;
        await deportista.user.save({ transaction });
      }

      // Guardar cambios
      await deportista.save({ transaction });

      // Confirmar transacción
      await transaction.commit();

      console.log('✅ Perfil actualizado exitosamente');

      // Obtener datos actualizados
      const deportistaActualizado = await Deportista.findOne({
        where: { user_id: userId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
        }]
      });

      return res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        deportista: deportistaActualizado
      });

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error actualizando perfil:', error);

      return res.status(500).json({
        error: 'Error actualizando tu perfil',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Asignar Equipo de Competencia
  static async asignarEquipo(req, res) {
    try {
      const { id } = req.params;
      const { equipo_competitivo } = req.body;

      const equiposValidos = [
        'sin_equipo',
        'rocks_titans',
        'lightning_titans',
        'storm_titans',
        'fire_titans',
        'electric_titans',
        'nova_titans'
      ];

      if (!equiposValidos.includes(equipo_competitivo)) {
        return res.status(400).json({
          error: `Equipo inválido. Debe ser uno de: ${equiposValidos.join(', ')}`
        });
      }

      const deportista = await Deportista.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['nombre', 'email']
        }]
      });

      if (!deportista) {
        return res.status(404).json({ error: 'Deportista no encontrado' });
      }

      const equipoAnterior = deportista.equipo_competitivo;

      await deportista.update({ equipo_competitivo });

      console.log(`✅ Equipo asignado: ${deportista.user?.nombre} cambió de "${equipoAnterior}" a "${equipo_competitivo}"`);

      res.json({
        success: true,
        message: `Equipo "${equipo_competitivo}" asignado exitosamente a ${deportista.user?.nombre}`,
        deportista: {
          id: deportista.id,
          nombre: deportista.user?.nombre,
          equipo_anterior: equipoAnterior,
          equipo_actual: deportista.equipo_competitivo
        }
      });

    } catch (error) {
      console.error('❌ Error asignando equipo:', error);
      res.status(500).json({
        error: 'Error asignando equipo de competencia',
        details: error.message
      });
    }
  }
}

module.exports = DeportistaController;