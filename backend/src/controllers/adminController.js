// backend/src/controllers/adminController.js
const { User, Deportista, Evaluacion, Habilidad } = require('../models');
const { sequelize } = require('../config/database');

class AdminController {
  
  // ==========================================
  // ESTADÍSTICAS GENERALES
  // ==========================================
  
  static async getStats(req, res) {
    try {
      // Total de usuarios por rol
      const totalEntrenadores = await User.count({ where: { role: 'entrenador', activo: true } });
      const totalDeportistas = await Deportista.count();
      const totalEvaluaciones = await Evaluacion.count();
      
      // Deportistas activos
      const deportistasActivos = await Deportista.count({ where: { estado: 'activo' } });
      
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
      
      // Promedio general de puntuaciones
      const promedioGeneral = await Evaluacion.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('puntuacion')), 'promedio']
        ],
        raw: true
      });
      
      res.json({
        success: true,
        stats: {
          total_entrenadores: totalEntrenadores,
          total_deportistas: totalDeportistas,
          deportistas_activos: deportistasActivos,
          total_evaluaciones: totalEvaluaciones,
          evaluaciones_este_mes: evaluacionesEsteMes,
          promedio_general: promedioGeneral?.promedio ? parseFloat(promedioGeneral.promedio).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error en el servidor' });
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
      const entrenadores = await User.findAll({
        where: { role: 'entrenador' },
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo', 'created_at'],
        order: [['created_at', 'DESC']]
      });
      
      // Contar deportistas por entrenador (evaluaciones únicas)
      const entrenadoresConStats = await Promise.all(
        entrenadores.map(async (entrenador) => {
          const deportistasUnicos = await Evaluacion.findAll({
            where: { entrenador_id: entrenador.id },
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('deportista_id')), 'deportista_id']],
            raw: true
          });
          
          const totalEvaluaciones = await Evaluacion.count({
            where: { entrenador_id: entrenador.id }
          });
          
          return {
            ...entrenador.toJSON(),
            deportistas_asignados: deportistasUnicos.length,
            total_evaluaciones: totalEvaluaciones
          };
        })
      );
      
      res.json({
        success: true,
        total: entrenadoresConStats.length,
        entrenadores: entrenadoresConStats
      });
    } catch (error) {
      console.error('Error obteniendo entrenadores:', error);
      res.status(500).json({ error: 'Error en el servidor' });
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
      const { nombre, email, password, telefono } = req.body;
      
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
      
      // Crear entrenador
      const entrenador = await User.create({
        nombre,
        email,
        password,
        telefono,
        role: 'entrenador',
        activo: true
      });
      
      console.log('✅ Entrenador creado por admin:', entrenador.email);
      
      res.status(201).json({
        success: true,
        message: 'Entrenador creado exitosamente',
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          email: entrenador.email,
          telefono: entrenador.telefono,
          activo: entrenador.activo
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
      const { nombre, email, telefono, password } = req.body;
      
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
      if (password) updateData.password = password; // Se hasheará automáticamente
      
      await entrenador.update(updateData);
      
      res.json({
        success: true,
        message: 'Entrenador actualizado exitosamente',
        entrenador: {
          id: entrenador.id,
          nombre: entrenador.nombre,
          email: entrenador.email,
          telefono: entrenador.telefono,
          activo: entrenador.activo
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
      const deportistas = await Deportista.findAll({
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'nombre', 'email', 'telefono']
        }],
        order: [['created_at', 'DESC']]
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
          as: 'User',
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
              as: 'User',
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
}

module.exports = AdminController;