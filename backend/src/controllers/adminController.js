const { User, Deportista, Evaluacion, Habilidad } = require('../models');
const { sequelize } = require('../config/database');

class AdminController {

  // ==========================================
  // ESTADÍSTICAS GENERALES
  // ==========================================

  static async getStats(req, res) {
    try {
      console.log('📊 getStats - Calculando estadísticas...');
      
      // ✅ Contar desde users (más confiable)
      const totalEntrenadores = await User.count({ 
        where: { role: 'entrenador', activo: true } 
      });
      
      // ✅ Contar deportistas desde users (no desde deportistas)
      const totalDeportistas = await User.count({ 
        where: { role: 'deportista' } 
      });
      console.log(`✅ Total deportistas: ${totalDeportistas}`);
      
      const totalEvaluaciones = await Evaluacion.count();

      // Deportistas activos (desde la tabla deportistas)
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

      // Promedio general
      const promedioGeneral = await Evaluacion.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('puntuacion')), 'promedio']
        ],
        raw: true
      });

      const stats = {
        total_entrenadores: totalEntrenadores,
        total_deportistas: totalDeportistas,  // ← Ahora será 22
        deportistas_activos: deportistasActivos,
        total_evaluaciones: totalEvaluaciones,
        evaluaciones_este_mes: evaluacionesEsteMes,
        promedio_general: promedioGeneral?.promedio ? parseFloat(promedioGeneral.promedio).toFixed(2) : 0
      };
      
      console.log('📊 Stats finales:', stats);

      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        error: 'Error en el servidor',
        details: error.message 
      });
    }
  }

  static async getDeportistasStats(req, res) {
    try {
      // Deportistas por nivel
      const porNivel = await Deportista.findAll({
        attributes: [
          'nivel_actual',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['nivel_actual'],
        raw: true
      });

      // Deportistas por estado
      const porEstado = await Deportista.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['estado'],
        raw: true
      });

      res.json({
        success: true,
        por_nivel: porNivel,
        por_estado: porEstado
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async getEvaluacionesStats(req, res) {
    try {
      // Evaluaciones por mes (últimos 6 meses)
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
  // GESTIÓN DE ENTRENADORES
  // ==========================================

  static async getAllEntrenadores(req, res) {
    try {
      console.log('📥 Obteniendo SOLO entrenadores...');

      // ✅ CORREGIDO: Filtrar SOLO por role = 'entrenador'
      const entrenadores = await User.findAll({
        where: {
          role: 'entrenador'  // ⚠️ ESTO ES LO IMPORTANTE
        },
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo', 'niveles_asignados', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      console.log(`✅ ${entrenadores.length} entrenadores encontrados`);

      res.json({
        success: true,
        total: entrenadores.length,
        entrenadores
      });

    } catch (error) {
      console.error('❌ Error obteniendo entrenadores:', error);
      res.status(500).json({
        error: 'Error obteniendo entrenadores'
      });
    }
  }

  static async getEntrenadorById(req, res) {
    try {
      const { id } = req.params;

      const entrenador = await User.findOne({
        where: { id, role: 'entrenador' },
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo', 'created_at']
      });

      if (!entrenador) {
        return res.status(404).json({ error: 'Entrenador no encontrado' });
      }

      res.json({
        success: true,
        entrenador
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async createEntrenador(req, res) {
    try {
      const { nombre, email, password, telefono, niveles_asignados } = req.body;

      if (!nombre || !email || !password) {
        return res.status(400).json({
          error: 'Nombre, email y contraseña son requeridos'
        });
      }

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }

      // Validar niveles asignados
      const nivelesValidos = ['1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
      const nivelesArray = Array.isArray(niveles_asignados) ? niveles_asignados : [];
      const nivelesFinales = nivelesArray.filter(n => nivelesValidos.includes(n));

      // Crear entrenador
      const entrenador = await User.create({
        nombre,
        email,
        password,
        telefono,
        role: 'entrenador',
        activo: true,
        niveles_asignados: nivelesFinales.length > 0 ? nivelesFinales : nivelesValidos
      });

      console.log('✅ Entrenador creado por admin:', entrenador.email);
      console.log('   Niveles asignados:', entrenador.niveles_asignados);

      res.status(201).json({
        success: true,
        message: 'Entrenador creado exitosamente',
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          email: entrenador.email,
          telefono: entrenador.telefono,
          activo: entrenador.activo,
          niveles_asignados: entrenador.niveles_asignados
        }
      });
    } catch (error) {
      console.error('Error creando entrenador:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async updateEntrenador(req, res) {
    try {
      const { id } = req.params;
      const { nombre, email, telefono, password, niveles_asignados } = req.body;

      const entrenador = await User.findOne({
        where: { id, role: 'entrenador' }
      });

      if (!entrenador) {
        return res.status(404).json({ error: 'Entrenador no encontrado' });
      }

      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (email) updateData.email = email;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (password) updateData.password = password;

      // Actualizar niveles asignados
      if (Array.isArray(niveles_asignados)) {
        const nivelesValidos = ['1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
        updateData.niveles_asignados = niveles_asignados.filter(n => nivelesValidos.includes(n));
      }

      await entrenador.update(updateData);

      console.log('✅ Entrenador actualizado:', entrenador.email);
      console.log('   Nuevos niveles:', entrenador.niveles_asignados);

      res.json({
        success: true,
        message: 'Entrenador actualizado exitosamente',
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          email: entrenador.email,
          telefono: entrenador.telefono,
          activo: entrenador.activo,
          niveles_asignados: entrenador.niveles_asignados
        }
      });
    } catch (error) {
      console.error('Error actualizando entrenador:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async deleteEntrenador(req, res) {
    try {
      const { id } = req.params;

      const entrenador = await User.findOne({
        where: { id, role: 'entrenador' }
      });

      if (!entrenador) {
        return res.status(404).json({ error: 'Entrenador no encontrado' });
      }

      const nombreEntrenador = entrenador.nombre;

      await entrenador.destroy();

      console.log('✅ Entrenador eliminado por admin:', nombreEntrenador);

      res.json({
        success: true,
        message: `Entrenador ${nombreEntrenador} eliminado exitosamente`
      });
    } catch (error) {
      console.error('Error eliminando entrenador:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async toggleEntrenadorStatus(req, res) {
    try {
      const { id } = req.params;

      const entrenador = await User.findOne({
        where: { id, role: 'entrenador' }
      });

      if (!entrenador) {
        return res.status(404).json({ error: 'Entrenador no encontrado' });
      }

      await entrenador.update({ activo: !entrenador.activo });

      res.json({
        success: true,
        message: `Entrenador ${entrenador.activo ? 'activado' : 'desactivado'}`,
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          activo: entrenador.activo
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  // ==========================================
  // VISTA GLOBAL DE DEPORTISTAS
  // ==========================================

  static async getAllDeportistasGlobal(req, res) {
    try {
      console.log('📥 getAllDeportistasGlobal - Inicio');
      console.log('🔐 Usuario que hace la solicitud:', req.user);

      // Verificar que el usuario tenga permisos
      if (req.user.role !== 'admin') {
        console.log('❌ Usuario no es admin:', req.user.role);
        return res.status(403).json({
          error: 'Acceso denegado. Se requiere rol de administrador'
        });
      }

      // Hacer query RAW con JOIN explícito
      const [deportistas] = await sequelize.query(`
        SELECT 
          d.id,
          d.user_id,
          d.nivel_actual,
          d.estado,
          d.altura,
          d.peso,
          d.nivel_deportivo,
          d.foto_perfil,
          d.contacto_emergencia_nombre,
          d.contacto_emergencia_telefono,
          d.contacto_emergencia_parentesco,
          d.fecha_nacimiento,
          d.created_at,
          d.updated_at,
          u.nombre,
          u.email,
          u.telefono,
          u.activo
        FROM deportistas d
        INNER JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
      `);

      console.log(`✅ ${deportistas.length} deportistas encontrados`);

      if (deportistas.length > 0) {
        console.log('📊 PRIMER DEPORTISTA:', JSON.stringify(deportistas[0], null, 2));
      }

      // ✅ CORREGIDO SEGÚN INSTRUCCIONES: Agregar User con U mayúscula
      const deportistasFormateados = deportistas.map(d => ({
        id: d.id,
        user_id: d.user_id,
        nombre: d.nombre || 'Sin nombre',
        email: d.email || 'Sin email',
        telefono: d.telefono,
        activo: d.activo,
        nivel_actual: d.nivel_actual,
        estado: d.estado,
        altura: d.altura,
        peso: d.peso,
        nivel_deportivo: d.nivel_deportivo,
        foto_perfil: d.foto_perfil,
        contacto_emergencia_nombre: d.contacto_emergencia_nombre,
        contacto_emergencia_telefono: d.contacto_emergencia_telefono,
        contacto_emergencia_parentesco: d.contacto_emergencia_parentesco,
        fecha_nacimiento: d.fecha_nacimiento,
        created_at: d.created_at,
        updated_at: d.updated_at,
        // ✅ CRÍTICO: Agregar objeto User para compatibilidad con frontend
        User: {  // ⚠️ MAYÚSCULA - El frontend busca "User" no "user"
          id: d.user_id,
          nombre: d.nombre,
          email: d.email,
          telefono: d.telefono,
          activo: d.activo
        },
        // También mantener user minúscula para compatibilidad
        user: {
          id: d.user_id,
          nombre: d.nombre,
          email: d.email,
          telefono: d.telefono,
          activo: d.activo
        }
      }));

      console.log('✅ PRIMER DEPORTISTA FORMATEADO:', JSON.stringify(deportistasFormateados[0], null, 2));
      console.log(`✅ Enviando ${deportistasFormateados.length} deportistas al frontend`);

      res.json({
        success: true,
        total: deportistasFormateados.length,
        deportistas: deportistasFormateados
      });

    } catch (error) {
      console.error('❌ Error en getAllDeportistasGlobal:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        error: 'Error en el servidor',
        details: error.message
      });
    }
  }

  static async getDeportistasByEntrenador(req, res) {
    try {
      const { entrenador_id } = req.params;

      // Obtener deportistas únicos que este entrenador ha evaluado
      const evaluaciones = await Evaluacion.findAll({
        where: { entrenador_id },
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('deportista_id')), 'deportista_id']],
        raw: true
      });

      const deportistasIds = evaluaciones.map(e => e.deportista_id);

      const deportistas = await Deportista.findAll({
        where: {
          id: deportistasIds
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['nombre', 'email']
        }]
      });

      res.json({
        success: true,
        total: deportistas.length,
        deportistas
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
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
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async getReporteProgresoGlobal(req, res) {
    try {
      // Progreso promedio por nivel
      const deportistasPorNivel = await Deportista.findAll({
        attributes: ['nivel_actual'],
        group: ['nivel_actual']
      });

      res.json({
        success: true,
        progreso_global: deportistasPorNivel
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async getReporteActividad(req, res) {
    try {
      // Últimas 20 evaluaciones
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
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  // Método interno para obtener stats
  static async getStatsInternal() {
    const totalEntrenadores = await User.count({ where: { role: 'entrenador', activo: true } });
    const totalDeportistas = await Deportista.count();
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
  // GESTIÓN DE ADMINISTRADORES
  // ==========================================

  static async getAllAdministradores(req, res) {
    try {
      console.log('\n========================================');
      console.log('📥 getAllAdministradores - DEBUG');
      console.log('========================================');
      
      // Primero, ver TODOS los usuarios
      const todosUsuarios = await User.findAll({
        attributes: ['id', 'nombre', 'email', 'role'],
        raw: true
      });
      
      console.log('👥 TODOS LOS USUARIOS:', JSON.stringify(todosUsuarios, null, 2));
      console.log('Total usuarios:', todosUsuarios.length);
      
      // Contar por role
      const porRole = {};
      todosUsuarios.forEach(u => {
        porRole[u.role] = (porRole[u.role] || 0) + 1;
      });
      console.log('📊 Usuarios por role:', porRole);
      
      // Ahora filtrar solo admins
      const administradores = await User.findAll({
        where: { 
          role: 'admin'
        },
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo', 'role', 'created_at'],
        order: [['created_at', 'DESC']],
        raw: true
      });

      console.log('👑 ADMINISTRADORES FILTRADOS:', JSON.stringify(administradores, null, 2));
      console.log(`✅ ${administradores.length} administradores con role='admin'`);
      console.log('========================================\n');

      res.json({
        success: true,
        total: administradores.length,
        administradores,
        // Debug info (quitar en producción)
        debug: {
          total_usuarios: todosUsuarios.length,
          por_role: porRole
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo administradores:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        error: 'Error obteniendo administradores',
        details: error.message
      });
    }
  }

  static async createAdministrador(req, res) {
    try {
      const { nombre, email, password, telefono } = req.body;

      if (!nombre || !email || !password) {
        return res.status(400).json({
          error: 'Nombre, email y contraseña son requeridos'
        });
      }

      // Verificar email único
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'El email ya está registrado'
        });
      }

      // Crear administrador
      const admin = await User.create({
        nombre,
        email,
        password,
        telefono,
        role: 'admin',
        activo: true
      });

      console.log('✅ Administrador creado:', admin.email);

      res.status(201).json({
        success: true,
        message: 'Administrador creado exitosamente',
        administrador: {
          id: admin.id,
          nombre: admin.nombre,
          email: admin.email,
          telefono: admin.telefono,
          activo: admin.activo
        }
      });
    } catch (error) {
      console.error('Error creando administrador:', error);
      res.status(500).json({ error: 'Error en el servidor' });
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
        return res.status(404).json({ error: 'Administrador no encontrado' });
      }

      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (email) updateData.email = email;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (password) updateData.password = password;

      await admin.update(updateData);

      console.log('✅ Administrador actualizado:', admin.email);

      res.json({
        success: true,
        message: 'Administrador actualizado exitosamente',
        administrador: {
          id: admin.id,
          nombre: admin.nombre,
          email: admin.email,
          telefono: admin.telefono,
          activo: admin.activo
        }
      });
    } catch (error) {
      console.error('Error actualizando administrador:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async deleteAdministrador(req, res) {
    try {
      const { id } = req.params;

      // No permitir auto-eliminación
      if (id === req.user.id) {
        return res.status(400).json({
          error: 'No puedes eliminar tu propia cuenta de administrador'
        });
      }

      const admin = await User.findOne({
        where: { id, role: 'admin' }
      });

      if (!admin) {
        return res.status(404).json({ error: 'Administrador no encontrado' });
      }

      const nombreAdmin = admin.nombre;
      await admin.destroy();

      console.log('✅ Administrador eliminado:', nombreAdmin);

      res.json({
        success: true,
        message: `Administrador ${nombreAdmin} eliminado exitosamente`
      });
    } catch (error) {
      console.error('Error eliminando administrador:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  static async toggleAdministradorStatus(req, res) {
    try {
      const { id } = req.params;

      // No permitir auto-desactivación
      if (id === req.user.id) {
        return res.status(400).json({
          error: 'No puedes cambiar el estado de tu propia cuenta'
        });
      }

      const admin = await User.findOne({
        where: { id, role: 'admin' }
      });

      if (!admin) {
        return res.status(404).json({ error: 'Administrador no encontrado' });
      }

      await admin.update({ activo: !admin.activo });

      res.json({
        success: true,
        message: `Administrador ${admin.activo ? 'activado' : 'desactivado'}`,
        administrador: {
          id: admin.id,
          nombre: admin.nombre,
          activo: admin.activo
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
}

module.exports = AdminController;