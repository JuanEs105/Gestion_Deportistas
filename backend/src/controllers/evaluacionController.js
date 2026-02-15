const { Evaluacion, Deportista, User, Habilidad, HistorialNivel } = require('../models');
const { sequelize } = require('../config/database');

class EvaluacionController {

  static async create(req, res) {
    console.log('\n========================================');
    console.log('📥 INICIO - Crear Evaluación');
    console.log('========================================');

    try {
      console.log('📝 Body recibido:', JSON.stringify(req.body, null, 2));
      console.log('👤 Usuario autenticado:', req.user);

      const { deportista_id, habilidad_id, puntuacion, observaciones, video_url } = req.body;
      const entrenador_id = req.user.id;

      // Validaciones
      if (!deportista_id || !habilidad_id || !puntuacion) {
        console.log('❌ Validación fallida: Faltan campos requeridos');
        return res.status(400).json({
          error: 'deportista_id, habilidad_id y puntuacion son requeridos'
        });
      }

      if (puntuacion < 1 || puntuacion > 5) {
        console.log('❌ Validación fallida: Puntuación fuera de rango:', puntuacion);
        return res.status(400).json({
          error: 'La puntuación debe estar entre 1 y 5'
        });
      }

      // Buscar habilidad
      console.log('\n🔍 Buscando habilidad ID:', habilidad_id);
      const habilidad = await Habilidad.findByPk(habilidad_id);

      if (!habilidad) {
        console.log('❌ Habilidad no encontrada');
        return res.status(404).json({
          error: 'Habilidad no encontrada'
        });
      }

      console.log('✅ Habilidad encontrada:');
      console.log('   - Nombre:', habilidad.nombre);
      console.log('   - Nivel:', habilidad.nivel);
      console.log('   - Puntuación mínima:', habilidad.puntuacion_minima);

      // Verificar deportista
      console.log('\n🔍 Buscando deportista ID:', deportista_id);
      const deportista = await Deportista.findByPk(deportista_id, {
        include: [{
          model: User,
          as: 'user',  // 🔥 CORREGIDO: 'User' → 'user' (minúscula)
          attributes: ['id', 'nombre']
        }]
      });

      if (!deportista) {
        console.log('❌ Deportista no encontrado');
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      console.log('✅ Deportista encontrado:');
      console.log('   - Nombre:', deportista.user?.nombre || 'N/A'); // 🔥 CORREGIDO: User → user
      console.log('   - Nivel actual:', deportista.nivel_actual);
      console.log('   - Estado:', deportista.estado);

      // Determinar si está completada
      const completado = puntuacion >= habilidad.puntuacion_minima;
      console.log(`\n📊 Evaluación: ${puntuacion}/${habilidad.puntuacion_minima}`);
      console.log(`   Completado: ${completado ? '✅ SÍ' : '❌ NO'}`);

      // Preparar datos
      const evaluacionData = {
        deportista_id,
        habilidad_id,
        entrenador_id,
        puntuacion,
        observaciones: observaciones || null,
        video_url: video_url || null,
        completado,
        fecha_evaluacion: new Date()
      };

      console.log('\n💾 Datos a guardar:');
      console.log(JSON.stringify(evaluacionData, null, 2));

      // Crear evaluación
      console.log('\n🔄 Creando registro en BD...');
      const evaluacion = await Evaluacion.create(evaluacionData);

      console.log('✅ Evaluación creada exitosamente');
      console.log('   ID:', evaluacion.id);
      console.log('   Fecha:', evaluacion.fecha_evaluacion);

      // Verificar progreso
      console.log('\n📊 Verificando progreso del deportista...');
      await EvaluacionController.verificarProgresoYSugerirCambio(deportista_id);

      // Obtener evaluación completa con relaciones
      console.log('\n🔄 Obteniendo evaluación con relaciones...');
      const evaluacionCompleta = await Evaluacion.findByPk(evaluacion.id, {
        include: [
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['id', 'nombre', 'nivel', 'categoria', 'puntuacion_minima']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['id', 'nombre', 'email']
          }
        ]
      });

      console.log('✅ Evaluación completa obtenida');
      console.log('========================================');
      console.log('✅ FIN - Crear Evaluación');
      console.log('========================================\n');

      res.status(201).json({
        success: true,
        message: completado ? 'Habilidad completada' : 'Evaluación registrada',
        evaluacion: evaluacionCompleta
      });

    } catch (error) {
      console.log('\n========================================');
      console.error('❌❌❌ ERROR EN CREATE ❌❌❌');
      console.log('========================================');
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
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        console.error('\n🔗 Error de clave foránea:');
        console.error('  Campo:', error.fields);
        console.error('  Tabla:', error.table);
      } else if (error.name === 'SequelizeDatabaseError') {
        console.error('\n🗄️ Error de base de datos:');
        console.error('  SQL:', error.sql);
        console.error('  Original:', error.original);
      }

      console.log('========================================\n');

      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          type: error.name
        } : undefined
      });
    }
  }

  static async verificarProgresoYSugerirCambio(deportista_id) {
    try {
      // 🔥 Volvemos a leer el deportista desde DB
      const deportista = await Deportista.findByPk(deportista_id);

      if (!deportista) return;

      const nivel_actual = deportista.nivel_actual;

      const progreso = await EvaluacionController.calcularProgresoInterno(
        deportista_id,
        nivel_actual
      );

      console.log('   Progreso calculado:', progreso);

      if (progreso.porcentaje === 100) {

        const siguienteNivel = {
          '1_basico': '1_medio',
          '1_medio': '1_avanzado',
          '1_avanzado': '2',
          '2': '3',
          '3': '4',
          '4': '4'
        };

        const nuevoNivel = siguienteNivel[nivel_actual];

        console.log('   🎯 ¡Nivel completado al 100%!');
        console.log(`   Siguiente nivel: ${nuevoNivel}`);

        if (
          nuevoNivel &&
          nuevoNivel !== nivel_actual &&
          !deportista.cambio_nivel_pendiente
        ) {
          await deportista.update({
            nivel_sugerido: nuevoNivel,
            cambio_nivel_pendiente: true
          });

          console.log('   ✅ Cambio de nivel pendiente guardado');
        }

      } else {
        console.log(
          `   📊 Progreso: ${progreso.porcentaje}% (${progreso.completadas}/${progreso.total})`
        );
      }

    } catch (error) {
      console.error('   ❌ Error verificando progreso:', error.message);
    }
  }

  static async calcularProgresoInterno(deportista_id, nivel) {
    const habilidades = await Habilidad.findAll({
      where: { nivel, activa: true }
    });

    const totalHabilidades = habilidades.length;

    if (totalHabilidades === 0) {
      return { total: 0, completadas: 0, porcentaje: 0, faltantes: 0 };
    }

    const habilidadesIds = habilidades.map(h => h.id);

    const evaluaciones = await Evaluacion.findAll({
      where: {
        deportista_id,
        habilidad_id: habilidadesIds
      },
      attributes: [
        'habilidad_id',
        [sequelize.fn('MAX', sequelize.col('puntuacion')), 'mejor_puntuacion']
      ],
      group: ['habilidad_id'],
      raw: true
    });

    let completadas = 0;

    // 🔥 Creamos mapa para acceso O(1)
    const habilidadesMap = new Map(
      habilidades.map(h => [h.id, h])
    );

    for (const evalu of evaluaciones) {
      const habilidad = habilidadesMap.get(evalu.habilidad_id);

      if (habilidad && evalu.mejor_puntuacion >= habilidad.puntuacion_minima) {
        completadas++;
      }
    }

    return {
      total: totalHabilidades,
      completadas,
      porcentaje: Math.round((completadas / totalHabilidades) * 100),
      faltantes: totalHabilidades - completadas
    };
  }

  static async getProgreso(req, res) {
    try {
      const { deportista_id } = req.params;

      const deportista = await Deportista.findByPk(deportista_id, {
        include: [{
          model: User,
          as: 'user',  // 🔥 CORREGIDO: 'User' → 'user' (minúscula)
          attributes: ['id', 'nombre']
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      const nivel = deportista.nivel_actual;
      const categorias = ['habilidad', 'ejercicio_accesorio', 'postura'];
      const progresoPorCategoria = {};

      for (const categoria of categorias) {
        const habilidades = await Habilidad.findAll({
          where: { nivel, categoria, activa: true }
        });

        const totalCategoria = habilidades.length;

        if (totalCategoria === 0) {
          progresoPorCategoria[categoria] = {
            total: 0,
            completadas: 0,
            porcentaje: 0,
            faltantes: 0
          };
          continue;
        }

        const habilidadesIds = habilidades.map(h => h.id);

        const evaluaciones = await Evaluacion.findAll({
          where: {
            deportista_id,
            habilidad_id: habilidadesIds
          },
          attributes: [
            'habilidad_id',
            [sequelize.fn('MAX', sequelize.col('puntuacion')), 'mejor_puntuacion']
          ],
          group: ['habilidad_id'],
          raw: true
        });

        let completadasCategoria = 0;

        for (const evalu of evaluaciones) {
          const habilidad = habilidades.find(h => h.id === evalu.habilidad_id);
          if (habilidad && evalu.mejor_puntuacion >= habilidad.puntuacion_minima) {
            completadasCategoria++;
          }
        }

        progresoPorCategoria[categoria] = {
          total: totalCategoria,
          completadas: completadasCategoria,
          porcentaje: Math.round((completadasCategoria / totalCategoria) * 100),
          faltantes: totalCategoria - completadasCategoria
        };
      }

      const progresoTotal = await EvaluacionController.calcularProgresoInterno(deportista_id, nivel);

      res.json({
        deportista_id,
        deportista_nombre: deportista.user?.nombre || 'Sin nombre', // 🔥 CORREGIDO: User → user
        nivel_actual: nivel,
        progreso_total: progresoTotal,
        progreso_por_categoria: progresoPorCategoria,
        cambio_nivel_pendiente: deportista.cambio_nivel_pendiente || false,
        nivel_sugerido: deportista.nivel_sugerido || null
      });

    } catch (error) {
      console.error('❌ Error obteniendo progreso:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getByDeportista(req, res) {
    try {
      const { deportista_id } = req.params;

      const evaluaciones = await Evaluacion.findAll({
        where: { deportista_id },
        include: [
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['id', 'nombre', 'nivel', 'categoria', 'puntuacion_minima']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['id', 'nombre', 'email']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']]
      });

      res.json({
        success: true,
        total: evaluaciones.length,
        evaluaciones
      });

    } catch (error) {
      console.error('❌ Error obteniendo evaluaciones:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  static async getHistorial(req, res) {
    try {
      const { deportista_id, habilidad_id } = req.params;

      const evaluaciones = await Evaluacion.findAll({
        where: {
          deportista_id,
          habilidad_id
        },
        include: [
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['nombre', 'puntuacion_minima']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['nombre']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']]
      });

      if (evaluaciones.length === 0) {
        return res.status(404).json({
          error: 'No hay evaluaciones para esta habilidad'
        });
      }

      const mejorPuntuacion = Math.max(...evaluaciones.map(e => e.puntuacion));
      const ultimaPuntuacion = evaluaciones[0].puntuacion;
      const primeraPuntuacion = evaluaciones[evaluaciones.length - 1].puntuacion;
      const mejoria = ultimaPuntuacion - primeraPuntuacion;

      res.json({
        success: true,
        habilidad: evaluaciones[0].habilidad,
        historial: evaluaciones,
        estadisticas: {
          total_intentos: evaluaciones.length,
          mejor_puntuacion: mejorPuntuacion,
          ultima_puntuacion: ultimaPuntuacion,
          primera_puntuacion: primeraPuntuacion,
          mejoria,
          completada: ultimaPuntuacion >= evaluaciones[0].habilidad.puntuacion_minima
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  static async aprobarCambioNivel(req, res) {
    try {
      const { deportista_id } = req.params;
      const { observaciones } = req.body;
      const entrenador_id = req.user.id;

      const deportista = await Deportista.findByPk(deportista_id, {
        include: [{
          model: User,
          as: 'user',  // 🔥 CORREGIDO: 'User' → 'user' (minúscula)
          attributes: ['nombre', 'email']
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      if (!deportista.cambio_nivel_pendiente) {
        return res.status(400).json({
          error: 'No hay cambio de nivel pendiente para este deportista'
        });
      }

      const nivel_anterior = deportista.nivel_actual;
      const nivel_nuevo = deportista.nivel_sugerido;

      await deportista.update({
        nivel_actual: nivel_nuevo,
        nivel_sugerido: null,
        cambio_nivel_pendiente: false,
        fecha_ultimo_cambio_nivel: new Date()
      });

      await HistorialNivel.create({
        deportista_id,
        nivel_anterior,
        nivel_nuevo,
        aprobado_por: entrenador_id,
        observaciones,
        fecha_cambio: new Date()
      });

      console.log(`✅ Cambio de nivel aprobado: ${deportista.user?.nombre} de ${nivel_anterior} a ${nivel_nuevo}`);

      res.json({
        success: true,
        message: `Deportista promovido de ${nivel_anterior} a ${nivel_nuevo}`,
        deportista: {
          id: deportista.id,
          nombre: deportista.user?.nombre, // 🔥 CORREGIDO: User → user
          nivel_anterior,
          nivel_nuevo
        }
      });

    } catch (error) {
      console.error('❌ Error aprobando cambio de nivel:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getDeportistasConCambioPendiente(req, res) {
    try {
      console.log('🔍 Buscando deportistas con cambio de nivel pendiente...');

      const deportistas = await Deportista.findAll({
        where: {
          cambio_nivel_pendiente: true
        },
        include: [{
          model: User,
          as: 'user',  // 🔥 CORREGIDO: 'User' → 'user' (minúscula)
          attributes: ['id', 'nombre', 'email']
        }]
      });

      console.log(`✅ ${deportistas.length} deportistas con cambio pendiente encontrados`);

      res.json({
        success: true,
        total: deportistas.length,
        deportistas: deportistas.map(d => ({
          id: d.id,
          nombre: d.user?.nombre || 'Sin nombre',
          email: d.user?.email,
          nivel_actual: d.nivel_actual,
          nivel_sugerido: d.nivel_sugerido,
          fecha_ultimo_cambio_nivel: d.fecha_ultimo_cambio_nivel,
          created_at: d.created_at
        }))
      });

    } catch (error) {
      console.error('❌ Error obteniendo deportistas con cambio pendiente:', error);
      console.error('Detalles del error:', error.message);

      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // NUEVO MÉTODO: Obtener evaluaciones pendientes para un entrenador
  static async getEvaluacionesPendientes(req, res) {
    try {
      const entrenador_id = req.user.id;

      console.log('🔍 Buscando evaluaciones pendientes para entrenador:', entrenador_id);

      // Obtener deportistas asignados a este entrenador
      // Asumiendo que hay una relación entre entrenador y deportistas
      // Si no hay, ajusta esta consulta
      const evaluaciones = await Evaluacion.findAll({
        where: {
          entrenador_id,
          completado: false  // Evaluaciones no completadas
        },
        include: [
          {
            model: Deportista,
            as: 'deportista',
            include: [{
              model: User,
              as: 'user',  // 🔥 CORREGIDO: 'User' → 'user' (minúscula)
              attributes: ['id', 'nombre', 'email']
            }]
          },
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['id', 'nombre', 'nivel', 'puntuacion_minima']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']],
        limit: 10  // Limitar resultados
      });

      console.log(`✅ ${evaluaciones.length} evaluaciones pendientes encontradas`);

      res.json({
        success: true,
        total: evaluaciones.length,
        evaluaciones: evaluaciones.map(e => ({
          id: e.id,
          deportista_nombre: e.deportista?.user?.nombre || 'Sin nombre', // 🔥 CORREGIDO: User → user
          habilidad_nombre: e.habilidad?.nombre || 'Sin habilidad',
          nivel: e.habilidad?.nivel,
          puntuacion: e.puntuacion,
          puntuacion_minima: e.habilidad?.puntuacion_minima,
          completado: e.completado,
          fecha_evaluacion: e.fecha_evaluacion,
          observaciones: e.observaciones
        }))
      });

    } catch (error) {
      console.error('❌ Error obteniendo evaluaciones pendientes:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // NUEVO MÉTODO: Obtener estadísticas de evaluaciones
  static async getStats(req, res) {
    try {
      const { deportista_id } = req.params;

      // Total evaluaciones
      const totalEvaluaciones = await Evaluacion.count({
        where: { deportista_id }
      });

      // Evaluaciones completadas
      const evaluacionesCompletadas = await Evaluacion.count({
        where: {
          deportista_id,
          completado: true
        }
      });

      // Promedio de puntuación
      const promedioResult = await Evaluacion.findOne({
        where: { deportista_id },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('puntuacion')), 'promedio']
        ],
        raw: true
      });

      // Última evaluación
      const ultimaEvaluacion = await Evaluacion.findOne({
        where: { deportista_id },
        include: [{
          model: Habilidad,
          as: 'habilidad',
          attributes: ['nombre', 'nivel']
        }],
        order: [['fecha_evaluacion', 'DESC']]
      });

      res.json({
        success: true,
        stats: {
          total_evaluaciones: totalEvaluaciones,
          evaluaciones_completadas: evaluacionesCompletadas,
          evaluaciones_pendientes: totalEvaluaciones - evaluacionesCompletadas,
          porcentaje_completado: totalEvaluaciones > 0 ?
            Math.round((evaluacionesCompletadas / totalEvaluaciones) * 100) : 0,
          promedio_puntuacion: promedioResult?.promedio ?
            parseFloat(promedioResult.promedio).toFixed(2) : '0.00',
          ultima_evaluacion: ultimaEvaluacion
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = EvaluacionController;