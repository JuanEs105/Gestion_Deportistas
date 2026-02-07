const bcrypt = require('bcryptjs');
const { User, Habilidad, Evaluacion, sequelize } = require('../models');

const initDatabase = async () => {
    try {
        console.log('🔧 Iniciando datos de la base de datos...');

        // ==========================================
        // 1. VERIFICAR Y CREAR USUARIOS
        // ==========================================
        
        // Usuario Admin
        const adminExists = await User.findOne({ where: { email: 'admin@deportes.com' } });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                nombre: 'Administrador',
                apellidos: 'Sistema',
                email: 'admin@deportes.com',
                password: hashedPassword,
                role: 'admin',
                activo: true
            });
            console.log('✅ Usuario admin creado: admin@deportes.com / admin123');
        } else {
            console.log('ℹ️  Usuario admin ya existe');
        }

        // Usuario Entrenador
        const entrenadorExists = await User.findOne({ where: { email: 'entrenador@deportes.com' } });

        if (!entrenadorExists) {
            const hashedPassword = await bcrypt.hash('entrenador123', 10);
            await User.create({
                nombre: 'Juan',
                apellidos: 'Pérez',
                email: 'entrenador@deportes.com',
                password: hashedPassword,
                role: 'entrenador',
                activo: true
            });
            console.log('✅ Usuario entrenador creado: entrenador@deportes.com / entrenador123');
        } else {
            console.log('ℹ️  Usuario entrenador ya existe');
        }

        // ==========================================
        // 2. VERIFICAR Y CARGAR HABILIDADES
        // ==========================================
        
        const habilidadesCount = await Habilidad.count();

        if (habilidadesCount === 0) {
            console.log('📥 No hay habilidades en la base de datos');
            console.log('🔄 Cargando 90 habilidades de PORRISMO Y GIMNASIA - TITANES EVOLUTION...');
            
            // Importar habilidades de PORRISMO Y GIMNASIA - TITANES EVOLUTION
            const habilidades = [
                // ========================================
                // NIVEL 1 BÁSICO
                // ========================================

                // Habilidades Nivel 1 Básico
                { nombre: 'Rollo adelante', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 1, activa: true },
                { nombre: 'Arco', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 2, activa: true },
                { nombre: 'Medialuna', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 3, activa: true },
                { nombre: 'Rollo atrás agrupado', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 4, activa: true },
                { nombre: 'Parada de manos contra la pared', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 5, activa: true },
                { nombre: 'Parada de manos', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 6, activa: true },
                { nombre: 'Rollo atrás carpado', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 7, activa: true },
                { nombre: 'Rollo atrás extendido', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 8, activa: true },
                { nombre: 'Bajar en arco', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 9, activa: true },
                { nombre: 'Salto T y salto touchdown', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 10, activa: true },
                { nombre: 'Bajada en arco atrás y devuelta a pararse', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 11, activa: true },
                { nombre: 'Bajar en arco pasada', nivel: '1_basico', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 12, activa: true },

                // Ejercicios Accesorios Nivel 1 Básico
                { nombre: 'Pateo con una sola pierna a la pared', nivel: '1_basico', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 13, activa: true },
                { nombre: 'Pateo a la pared con cambio de pierna', nivel: '1_basico', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 14, activa: true },
                { nombre: 'Arco pasar con ayuda de la pared (dominar cada uno de los niveles de arco pasada)', nivel: '1_basico', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 15, activa: true },
                { nombre: 'Parada de manos caída supino', nivel: '1_basico', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 16, activa: true },
                { nombre: 'Parada de manos desde la pared rollo adelante', nivel: '1_basico', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 17, activa: true },
                { nombre: 'Parada de manos arco hacia adelante', nivel: '1_basico', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 18, activa: true },
                { nombre: 'Parada de manos con pique caída supino', nivel: '1_basico', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 19, activa: true },

                // Posturas Nivel 1 Básico
                { nombre: 'Canoa', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 20, activa: true },
                { nombre: 'Posición gimnástica supino', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 21, activa: true },
                { nombre: 'Posición vela', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 22, activa: true },
                { nombre: 'Salto extensión', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 23, activa: true },
                { nombre: 'Yo - yo', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 24, activa: true },
                { nombre: 'Posiciones básicas parkour gimnos', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 25, activa: true },
                { nombre: 'Puntas de pies', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 26, activa: true },
                { nombre: 'Extensión de perfil', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 27, activa: true },
                { nombre: 'Extensión de arco', nivel: '1_basico', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 28, activa: true },

                // ========================================
                // NIVEL 1 MEDIO
                // ========================================

                // Habilidades Nivel 1 Medio
                { nombre: 'Tercera', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 29, activa: true },
                { nombre: 'Parada de manos rollo', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 30, activa: true },
                { nombre: 'Carrera a pique', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 31, activa: true },
                { nombre: 'Cuarta', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 32, activa: true },
                { nombre: 'Pasada atrás', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 33, activa: true },
                { nombre: 'Pasada adelante', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 34, activa: true },
                { nombre: 'Pasada atrás con cambio', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 35, activa: true },
                { nombre: 'Ante salto medialuna', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 36, activa: true },
                { nombre: 'Pescado', nivel: '1_medio', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 37, activa: true },

                // Ejercicios Accesorios Nivel 1 Medio
                { nombre: 'Pasada de arco piernas juntas con altura', nivel: '1_medio', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 38, activa: true },
                { nombre: 'Media luna a caer con dos pies (uno a uno)', nivel: '1_medio', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 39, activa: true },
                { nombre: 'Ante salto', nivel: '1_medio', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 40, activa: true },
                { nombre: 'Parada de cabeza', nivel: '1_medio', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 41, activa: true },

                // Posturas Nivel 1 Medio
                { nombre: 'Split', nivel: '1_medio', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 42, activa: true },
                { nombre: 'Spagatt', nivel: '1_medio', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 43, activa: true },
                { nombre: 'Y', nivel: '1_medio', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 44, activa: true },
                { nombre: 'Clasis', nivel: '1_medio', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 45, activa: true },
                { nombre: 'Salto extensión con medio giro', nivel: '1_medio', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 46, activa: true },
                { nombre: 'Posiciones básicas de ante salto', nivel: '1_medio', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 47, activa: true },
                { nombre: 'Canoa con brazos arriba', nivel: '1_medio', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 48, activa: true },

                // ========================================
                // NIVEL 1 AVANZADO
                // ========================================

                // Habilidades Nivel 1 Avanzado
                { nombre: 'Quinta', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 49, activa: true },
                { nombre: 'Valdez', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 50, activa: true },
                { nombre: 'Rondada', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 51, activa: true },
                { nombre: 'Pescado', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 52, activa: true },
                { nombre: 'Paloma', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 53, activa: true },
                { nombre: 'Entrada en tigre caída supino', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 54, activa: true },
                { nombre: 'Tigre', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 55, activa: true },
                { nombre: 'Paloma Rondada', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 56, activa: true },
                { nombre: 'Flick en tumbl track a postura', nivel: '1_avanzado', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 57, activa: true },

                // Ejercicios Accesorios Nivel 1 Avanzado
                { nombre: 'Pasada de arco atrás con dos piernas', nivel: '1_avanzado', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 58, activa: true },

                // Posturas Nivel 1 Avanzado
                { nombre: 'Salto extensión con giro completo', nivel: '1_avanzado', categoria: 'postura', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 59, activa: true },

                // ========================================
                // NIVEL 2
                // ========================================

                // Habilidades Nivel 2
                { nombre: 'Flick estático', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 60, activa: true },
                { nombre: 'Rondada Flick', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 61, activa: true },
                { nombre: 'Rondada dos flick', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 62, activa: true },
                { nombre: 'Flick a una pierna', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 63, activa: true },
                { nombre: 'Pasada atrás flick', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 64, activa: true },
                { nombre: 'Quinta flick', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 65, activa: true },
                { nombre: 'Media luna flick', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 66, activa: true },
                { nombre: 'Paloma a dos pies', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 67, activa: true },
                { nombre: 'Dos Flick desde estático', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 68, activa: true },
                { nombre: 'Salto T/Touchdown con flick', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 69, activa: true },
                { nombre: 'Rondada 3 flick', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 70, activa: true },
                { nombre: '3 flick desde estático', nivel: '2', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 71, activa: true },

                // Ejercicios Accesorios Nivel 2
                { nombre: 'Mortal en tumbl track', nivel: '2', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 72, activa: true },
                { nombre: 'Parada de manos caída con medio giro carpado', nivel: '2', categoria: 'ejercicio_accesorio', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 73, activa: true },

                // ========================================
                // NIVEL 3
                // ========================================

                // Habilidades Nivel 3
                { nombre: 'Mortal adelante', nivel: '3', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 74, activa: true },
                { nombre: 'Rondada mortal atrás', nivel: '3', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 75, activa: true },
                { nombre: 'Rueda libre', nivel: '3', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 76, activa: true },
                { nombre: 'Rondada flick Mortal atrás', nivel: '3', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 77, activa: true },
                { nombre: 'Paloma a dos pies mortal adelante', nivel: '3', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 78, activa: true },

                // ========================================
                // NIVEL 4
                // ========================================

                // Habilidades Nivel 4
                { nombre: 'Mortal atrás agrupado', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 79, activa: true },
                { nombre: 'Media luna mortal atrás', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 80, activa: true },
                { nombre: 'Rondada tempo', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 81, activa: true },
                { nombre: '2 flick mortal atrás', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 82, activa: true },
                { nombre: 'Rondada flick mortal atrás extendido', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 83, activa: true },
                { nombre: 'Pasada mortal atrás', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 84, activa: true },
                { nombre: 'Salto ruso/ front dos flick mortal atrás agrupado', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 85, activa: true },
                { nombre: 'Rondada mortal atrás extendido', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 86, activa: true },
                { nombre: 'Rondada flick mortal atrás extendido', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 87, activa: true },
                { nombre: 'Mortal adelante a desigualar rondada', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 88, activa: true },
                { nombre: 'Mortal adelante rondada flick mortal agrupado', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 89, activa: true },
                { nombre: 'Rondada tempo flick', nivel: '4', categoria: 'habilidad', obligatoria: true, puntuacion_minima: 4, tipo: 'fisica', orden: 90, activa: true }
            ];

            await Habilidad.bulkCreate(habilidades);
            console.log(`✅ ${habilidades.length} habilidades de PORRISMO importadas correctamente`);
        } else {
            console.log(`ℹ️  Ya existen ${habilidadesCount} habilidades en la base de datos`);
        }

        console.log('✅ Inicialización de base de datos completada');
        
    } catch (error) {
        console.error('❌ Error en inicialización de base de datos:', error);
        throw error;
    }
};

module.exports = initDatabase;