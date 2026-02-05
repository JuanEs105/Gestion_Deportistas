const bcrypt = require('bcryptjs');
const { User, Habilidad } = require('../models');

const initDatabase = async () => {
    try {
        console.log('🔧 Iniciando datos de la base de datos...');

        // 1. Verificar si ya existe el usuario admin
        const adminExists = await User.findOne({ where: { email: 'admin@deportes.com' } });

        if (!adminExists) {
            // Crear usuario admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                nombre: 'Administrador',
                apellidos: 'Sistema',  // ✅ CAMBIADO (era "apellido")
                email: 'admin@deportes.com',
                password: hashedPassword,
                role: 'admin',  // ✅ CORREGIDO
                activo: true
            });
            console.log('✅ Usuario admin creado: admin@deportes.com / admin123');
        } else {
            console.log('ℹ️  Usuario admin ya existe');
        }
        
        const entrenadorExists = await User.findOne({ where: { email: 'entrenador@deportes.com' } });

        if (!entrenadorExists) {
            const hashedPassword = await bcrypt.hash('entrenador123', 10);
            await User.create({
                nombre: 'Juan',
                apellidos: 'Pérez',  // ✅ CAMBIADO (era "apellido")
                email: 'entrenador@deportes.com',
                password: hashedPassword,
                role: 'entrenador',  // ✅ CORREGIDO
                activo: true
            });
            console.log('✅ Usuario entrenador creado: entrenador@deportes.com / entrenador123');
        }

        // 2. Verificar si ya existen habilidades
        const habilidadesCount = await Habilidad.count();

        if (habilidadesCount === 0) {
            // Importar habilidades con niveles ENUM correctos
            const habilidades = [
                // Baby Titans
                { nombre: 'Cartwheel', nivel: 'baby_titans', categoria: 'habilidad' },
                { nombre: 'Forward roll', nivel: 'baby_titans', categoria: 'habilidad' },
                { nombre: 'Backward roll', nivel: 'baby_titans', categoria: 'habilidad' },
                { nombre: 'Bridge', nivel: 'baby_titans', categoria: 'habilidad' },
                { nombre: 'High V', nivel: 'baby_titans', categoria: 'habilidad' },
                { nombre: 'T Jump', nivel: 'baby_titans', categoria: 'habilidad' },

                // Nivel 1 Básico
                { nombre: 'Roundoff', nivel: '1_basico', categoria: 'habilidad' },
                { nombre: 'Handstand', nivel: '1_basico', categoria: 'habilidad' },
                { nombre: 'Splits (right/left/middle)', nivel: '1_basico', categoria: 'habilidad' },
                { nombre: 'Tuck Jump', nivel: '1_basico', categoria: 'habilidad' },
                { nombre: 'Thigh Stand', nivel: '1_basico', categoria: 'habilidad' },
                { nombre: 'Shoulder Stand', nivel: '1_basico', categoria: 'habilidad' },
                { nombre: 'Prep (Elevator)', nivel: '1_basico', categoria: 'habilidad' },

                // Nivel 1 Medio
                { nombre: 'Back Walkover', nivel: '1_medio', categoria: 'habilidad' },
                { nombre: 'Front Walkover', nivel: '1_medio', categoria: 'habilidad' },
                { nombre: 'Star Jump', nivel: '1_medio', categoria: 'habilidad' },
                { nombre: 'Chair', nivel: '1_medio', categoria: 'habilidad' },

                // Nivel 1 Avanzado
                { nombre: 'Front Handspring', nivel: '1_avanzado', categoria: 'habilidad' },
                { nombre: 'Standing Back Handspring', nivel: '1_avanzado', categoria: 'habilidad' },

                // Nivel 2
                { nombre: 'Back Handspring', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Roundoff Back Handspring', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Standing Tuck', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Toe Touch', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Pike Jump', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Hurdler', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Extension (Liberty)', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Heel Stretch', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Arabesque', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Scorpion', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Cradle', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Scale', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Spread Eagle', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Torch', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Bow and Arrow', nivel: '2', categoria: 'habilidad' },
                { nombre: 'Handspring Step Out', nivel: '2', categoria: 'habilidad' },

                // Nivel 3
                { nombre: 'Back Tuck', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Roundoff Back Handspring Back Tuck', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Front Tuck', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Aerial', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Whip', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Switch Leap', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Double Hook', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Around the World', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Basket Toss', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Tick Tock', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Full Up', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Rewind', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Switch Up', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Needle', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Scorpion Flexibility', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Cupie', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Wolf Wall', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Pike Basket', nivel: '3', categoria: 'habilidad' },
                { nombre: 'Pike Jump Roundoff', nivel: '3', categoria: 'habilidad' },

                // Nivel 4
                { nombre: 'Back Layout', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Roundoff Back Handspring Back Layout', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Front Layout', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Standing Back Tuck', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Toe Touch Back Handspring', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Pike Jump Back Handspring', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Full Twist Basket', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Double Full Up', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Twisting Cradle', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Kick Double Full', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Lib Switch Lib', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Front Flip Basket', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Back Flip Basket', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Layout Basket', nivel: '4', categoria: 'habilidad' },
                { nombre: 'Group Synchronized Tumbling', nivel: '4', categoria: 'habilidad' }
            ];

            await Habilidad.bulkCreate(habilidades);
            console.log(`✅ ${habilidades.length} habilidades importadas correctamente`);
        } else {
            console.log(`ℹ️  Ya existen ${habilidadesCount} habilidades en la base de datos`);
        }

        console.log('✅ Inicialización de base de datos completada');
    } catch (error) {
        console.error('❌ Error en inicialización de base de datos:', error);
        throw error;
    }
};

module.exports = initDatabase;  // ✅ Sin llaves