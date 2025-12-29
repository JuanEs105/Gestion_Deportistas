const { Evaluacion, Deportista, User, Habilidad } = require('../models');

class EvaluacionController {
  // Crear nueva evaluación
  static async create(req, res) {
    try {
      const { deportista_id, habilidad_id, puntuacion, observaciones, video_url, completado } = req.body;
      const entrenador_id = req.user.id;

      // Verificar si ya existe evaluación
      const existingEval = await Evaluacion.findOne({
        where: { deportista_id, habilidad_id }
      });

      let evaluacion;
      
      if (existingEval) {
        // Actualizar evaluación existente
        evaluacion = await existingEval.update({
          puntuacion,
          observaciones,
          video_url,
          completado: completado !== undefined ? completado : existingEval.completado,
          intentos: existingEval.intentos + 1,
          entrenador_id
        });

        return res.status(200).json({
          message: 'Evaluación actualizada',
          evaluacion
        });
      }

      // Crear nueva evaluación
      evaluacion = await Evaluacion.create({
        deportista_id,
        habilidad_id,
        entrenador_id,
        puntuacion: puntuacion || null,
        observaciones,
        video_url,
        completado: completado || false
      });

      res.status(201).json({
        message: 'Evaluación creada',
        evaluacion
      });

    } catch (error) {
      console.error('Error creando evaluación:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener evaluaciones de un deportista
  static async getByDeportista(req, res) {
    try {
      const { deportista_id } = req.params;

      const evaluaciones = await Evaluacion.findAll({
        where: { deportista_id },
        include: [
          {
            model: Habilidad,
            attributes: ['id', 'nombre', 'nivel', 'descripcion']
          },
          {
            model: User,
            attributes: ['id', 'nombre', 'email']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']]
      });

      // Calcular estadísticas
      const stats = {
        total: evaluaciones.length,
        completadas: evaluaciones.filter(e => e.completado).length,
        promedio: evaluaciones.length > 0 
          ? evaluaciones.reduce((sum, e) => sum + (e.puntuacion || 0), 0) / evaluaciones.length
          : 0,
        porNivel: {
          basico: evaluaciones.filter(e => e.Habilidad?.nivel === 'básico').length,
          medio: evaluaciones.filter(e => e.Habilidad?.nivel === 'medio').length,
          avanzado: evaluaciones.filter(e => e.Habilidad?.nivel === 'avanzado').length
        }
      };

      res.json({
        evaluaciones,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Obtener evaluación específica
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const evaluacion = await Evaluacion.findByPk(id, {
        include: [
          {
            model: Habilidad,
            attributes: ['id', 'nombre', 'nivel', 'descripcion']
          },
          {
            model: User,
            attributes: ['id', 'nombre', 'email']
          },
          {
            model: Deportista,
            include: [{
              model: User,
              attributes: ['id', 'nombre', 'email']
            }]
          }
        ]
      });

      if (!evaluacion) {
        return res.status(404).json({
          error: 'Evaluación no encontrada'
        });
      }

      res.json(evaluacion);

    } catch (error) {
      console.error('Error obteniendo evaluación:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Actualizar evaluación
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const evaluacion = await Evaluacion.findByPk(id);

      if (!evaluacion) {
        return res.status(404).json({
          error: 'Evaluación no encontrada'
        });
      }

      await evaluacion.update(updates);

      res.json({
        message: 'Evaluación actualizada',
        evaluacion
      });

    } catch (error) {
      console.error('Error actualizando evaluación:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Obtener progreso de deportista (porcentaje por nivel)
  static async getProgreso(req, res) {
    try {
      const { deportista_id } = req.params;

      // Obtener todas las habilidades agrupadas por nivel
      const { sequelize } = require('../config/database');
      
      const resultados = await sequelize.query(`
        SELECT 
          h.nivel,
          COUNT(h.id) as total_habilidades,
          COUNT(CASE WHEN e.completado = true THEN 1 END) as completadas
        FROM habilidades h
        LEFT JOIN evaluaciones e ON h.id = e.habilidad_id AND e.deportista_id = :deportista_id
        WHERE h.activa = true
        GROUP BY h.nivel
        ORDER BY 
          CASE h.nivel 
            WHEN 'básico' THEN 1
            WHEN 'medio' THEN 2
            WHEN 'avanzado' THEN 3
          END
      `, {
        replacements: { deportista_id },
        type: sequelize.QueryTypes.SELECT
      });

      const progreso = {};
      
      resultados.forEach(row => {
        const porcentaje = row.total_habilidades > 0 
          ? Math.round((row.completadas / row.total_habilidades) * 100)
          : 0;
          
        progreso[row.nivel] = {
          completadas: parseInt(row.completadas),
          total: parseInt(row.total_habilidades),
          porcentaje,
          faltantes: parseInt(row.total_habilidades) - parseInt(row.completadas),
          nivel: row.nivel
        };
      });

      // Asegurar que todos los niveles existan en la respuesta
      const niveles = ['básico', 'medio', 'avanzado'];
      niveles.forEach(nivel => {
        if (!progreso[nivel]) {
          progreso[nivel] = {
            completadas: 0,
            total: 0,
            porcentaje: 0,
            faltantes: 0,
            nivel
          };
        }
      });

      res.json(progreso);

    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener estadísticas generales (para dashboard)
  static async getEstadisticas(req, res) {
    try {
      const entrenador_id = req.user.id;

      const [totalEvaluaciones, evaluacionesRecientes, deportistasEvaluados] = await Promise.all([
        Evaluacion.count({
          where: { entrenador_id }
        }),
        Evaluacion.findAll({
          where: { entrenador_id },
          limit: 10,
          order: [['fecha_evaluacion', 'DESC']],
          include: [
            {
              model: Deportista,
              include: [{
                model: User,
                attributes: ['nombre']
              }]
            },
            {
              model: Habilidad,
              attributes: ['nombre']
            }
          ]
        }),
        Evaluacion.count({
          where: { entrenador_id },
          distinct: true,
          col: 'deportista_id'
        })
      ]);

      const completadas = await Evaluacion.count({
        where: { 
          entrenador_id,
          completado: true 
        }
      });

      res.json({
        totalEvaluaciones,
        deportistasEvaluados,
        evaluacionesRecientes,
        completadas,
        porcentajeCompletadas: totalEvaluaciones > 0 
          ? Math.round((completadas / totalEvaluaciones) * 100)
          : 0
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }
}

module.exports = EvaluacionController;