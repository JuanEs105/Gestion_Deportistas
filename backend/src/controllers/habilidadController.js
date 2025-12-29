const { Habilidad } = require('../models');

class HabilidadController {
  // Obtener todas las habilidades
  static async getAll(req, res) {
    try {
      const { nivel, tipo } = req.query;
      
      const whereClause = { activa: true };
      if (nivel) whereClause.nivel = nivel;
      if (tipo) whereClause.tipo = tipo;

      const habilidades = await Habilidad.findAll({
        where: whereClause,
        order: [
          ['nivel', 'ASC'],
          ['orden', 'ASC']
        ]
      });

      // Agrupar por nivel
      const habilidadesPorNivel = {};
      habilidades.forEach(h => {
        if (!habilidadesPorNivel[h.nivel]) {
          habilidadesPorNivel[h.nivel] = [];
        }
        habilidadesPorNivel[h.nivel].push(h);
      });

      res.json({
        total: habilidades.length,
        porNivel: habilidadesPorNivel
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

      const habilidades = await Habilidad.findAll({
        where: { nivel, activa: true },
        order: [['orden', 'ASC']]
      });

      res.json(habilidades);

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

      // Obtener evaluaciones del deportista
      const { sequelize } = require('../config/database');
      const evaluaciones = await sequelize.query(`
        SELECT DISTINCT habilidad_id 
        FROM evaluaciones 
        WHERE deportista_id = :deportista_id AND completado = true
      `, {
        replacements: { deportista_id },
        type: sequelize.QueryTypes.SELECT
      });

      const completadas = evaluaciones.map(e => e.habilidad_id);

      // Obtener todas las habilidades activas
      const todasHabilidades = await Habilidad.findAll({
        where: { activa: true },
        order: [
          ['nivel', 'ASC'],
          ['orden', 'ASC']
        ]
      });

      // Filtrar habilidades faltantes
      const faltantes = todasHabilidades.filter(
        h => !completadas.includes(h.id)
      );

      res.json({
        total: todasHabilidades.length,
        completadas: completadas.length,
        faltantes: faltantes.length,
        habilidades: faltantes
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