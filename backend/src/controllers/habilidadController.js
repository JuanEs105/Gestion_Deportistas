// backend/src/controllers/habilidadController.js - ACTUALIZADO
const { Habilidad, Evaluacion } = require('../models');
const { sequelize } = require('../config/database');

class HabilidadController {
  // Obtener todas las habilidades
  static async getAll(req, res) {
    try {
      const { nivel, tipo, categoria } = req.query;
      
      const whereClause = { activa: true };
      if (nivel) whereClause.nivel = nivel;
      if (tipo) whereClause.tipo = tipo;
      if (categoria) whereClause.categoria = categoria;

      const habilidades = await Habilidad.findAll({
        where: whereClause,
        order: [
          ['nivel', 'ASC'],
          ['categoria', 'ASC'],
          ['orden', 'ASC']
        ]
      });

      // Agrupar por nivel y categoría
      const agrupadas = {};
      
      habilidades.forEach(h => {
        if (!agrupadas[h.nivel]) {
          agrupadas[h.nivel] = {};
        }
        if (!agrupadas[h.nivel][h.categoria]) {
          agrupadas[h.nivel][h.categoria] = [];
        }
        agrupadas[h.nivel][h.categoria].push(h);
      });

      res.json({
        total: habilidades.length,
        habilidades,
        agrupadas
      });

    } catch (error) {
      console.error('Error obteniendo habilidades:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Crear nueva habilidad
  static async create(req, res) {
    try {
      const habilidad = await Habilidad.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Habilidad creada',
        habilidad
      });

    } catch (error) {
      console.error('Error creando habilidad:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener habilidades para un nivel específico
  static async getByNivel(req, res) {
    try {
      const { nivel } = req.params;
      const { deportista_id } = req.query;

      let habilidades;

      if (deportista_id) {
        // Obtener habilidades con estado de evaluación
        habilidades = await Habilidad.getConEstadoEvaluacion(deportista_id, nivel);
      } else {
        // Obtener solo habilidades
        habilidades = await Habilidad.findAll({
          where: { nivel, activa: true },
          order: [['categoria', 'ASC'], ['orden', 'ASC']]
        });
      }

      // Agrupar por categoría
      const porCategoria = {
        habilidad: [],
        ejercicio_accesorio: [],
        postura: []
      };

      habilidades.forEach(h => {
        const categoria = h.categoria || 'habilidad';
        if (porCategoria[categoria]) {
          porCategoria[categoria].push(h);
        }
      });

      res.json({
        nivel,
        total: habilidades.length,
        habilidades,
        por_categoria: porCategoria
      });

    } catch (error) {
      console.error('Error obteniendo habilidades por nivel:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Obtener habilidades faltantes para un deportista
  static async getFaltantes(req, res) {
    try {
      const { deportista_id } = req.params;
      const { nivel } = req.query;

      // Si no se especifica nivel, usar el nivel actual del deportista
      let nivelBuscar = nivel;
      if (!nivelBuscar) {
        const { Deportista } = require('../models');
        const deportista = await Deportista.findByPk(deportista_id);
        if (!deportista) {
          return res.status(404).json({
            error: 'Deportista no encontrado'
          });
        }
        nivelBuscar = deportista.nivel_actual;
      }

      // Obtener evaluaciones del deportista
      const evaluaciones = await sequelize.query(`
        SELECT DISTINCT habilidad_id, MAX(puntuacion) as mejor_puntuacion
        FROM evaluaciones 
        WHERE deportista_id = :deportista_id
        GROUP BY habilidad_id
      `, {
        replacements: { deportista_id },
        type: sequelize.QueryTypes.SELECT
      });

      // Obtener todas las habilidades del nivel
      const todasHabilidades = await Habilidad.findAll({
        where: { nivel: nivelBuscar, activa: true },
        order: [
          ['categoria', 'ASC'],
          ['orden', 'ASC']
        ]
      });

      // Filtrar habilidades faltantes o no completadas
      const faltantes = [];
      
      for (const h of todasHabilidades) {
        const evalu = evaluaciones.find(e => e.habilidad_id === h.id);
        
        if (!evalu || evalu.mejor_puntuacion < h.puntuacion_minima) {
          faltantes.push({
            ...h.toJSON(),
            estado: !evalu ? 'no_evaluada' : 'en_progreso',
            mejor_puntuacion: evalu ? evalu.mejor_puntuacion : null
          });
        }
      }

      res.json({
        nivel: nivelBuscar,
        total_habilidades: todasHabilidades.length,
        completadas: todasHabilidades.length - faltantes.length,
        faltantes: faltantes.length,
        habilidades_faltantes: faltantes
      });

    } catch (error) {
      console.error('Error obteniendo habilidades faltantes:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }
}

module.exports = HabilidadController;