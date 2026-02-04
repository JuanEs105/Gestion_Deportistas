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
        apellido: 'Sistema',
        email: 'admin@deportes.com',
        password: hashedPassword,
        rol: 'admin',
        activo: true
      });
      console.log('✅ Usuario admin creado: admin@deportes.com / admin123');
    } else {
      console.log('ℹ️  Usuario admin ya existe');
    }

    // 2. Verificar si ya existen habilidades
    const habilidadesCount = await Habilidad.count();
    
    if (habilidadesCount === 0) {
      // Importar habilidades
      const habilidades = [
        // Nivel 1
        { nombre: 'Cartwheel', nivel: 1, categoria: 'Tumbling' },
        { nombre: 'Roundoff', nivel: 1, categoria: 'Tumbling' },
        { nombre: 'Forward roll', nivel: 1, categoria: 'Tumbling' },
        { nombre: 'Backward roll', nivel: 1, categoria: 'Tumbling' },
        { nombre: 'Handstand', nivel: 1, categoria: 'Tumbling' },
        { nombre: 'Bridge', nivel: 1, categoria: 'Flexibility' },
        { nombre: 'Splits (right/left/middle)', nivel: 1, categoria: 'Flexibility' },
        { nombre: 'High V', nivel: 1, categoria: 'Jumps' },
        { nombre: 'T Jump', nivel: 1, categoria: 'Jumps' },
        { nombre: 'Tuck Jump', nivel: 1, categoria: 'Jumps' },
        { nombre: 'Thigh Stand', nivel: 1, categoria: 'Stunts' },
        { nombre: 'Shoulder Stand', nivel: 1, categoria: 'Stunts' },
        { nombre: 'Prep (Elevator)', nivel: 1, categoria: 'Stunts' },
        
        // Nivel 2
        { nombre: 'Front Handspring', nivel: 2, categoria: 'Tumbling' },
        { nombre: 'Back Handspring', nivel: 2, categoria: 'Tumbling' },
        { nombre: 'Roundoff Back Handspring', nivel: 2, categoria: 'Tumbling' },
        { nombre: 'Standing Back Handspring', nivel: 2, categoria: 'Tumbling' },
        { nombre: 'Toe Touch', nivel: 2, categoria: 'Jumps' },
        { nombre: 'Pike Jump', nivel: 2, categoria: 'Jumps' },
        { nombre: 'Hurdler', nivel: 2, categoria: 'Jumps' },
        { nombre: 'Extension (Liberty)', nivel: 2, categoria: 'Stunts' },
        { nombre: 'Heel Stretch', nivel: 2, categoria: 'Stunts' },
        { nombre: 'Arabesque', nivel: 2, categoria: 'Stunts' },
        { nombre: 'Scorpion', nivel: 2, categoria: 'Stunts' },
        { nombre: 'Cradle', nivel: 2, categoria: 'Stunts' },
        
        // Nivel 3
        { nombre: 'Back Tuck', nivel: 3, categoria: 'Tumbling' },
        { nombre: 'Roundoff Back Handspring Back Tuck', nivel: 3, categoria: 'Tumbling' },
        { nombre: 'Front Tuck', nivel: 3, categoria: 'Tumbling' },
        { nombre: 'Aerial', nivel: 3, categoria: 'Tumbling' },
        { nombre: 'Switch Leap', nivel: 3, categoria: 'Jumps' },
        { nombre: 'Double Hook', nivel: 3, categoria: 'Jumps' },
        { nombre: 'Basket Toss', nivel: 3, categoria: 'Stunts' },
        { nombre: 'Tick Tock', nivel: 3, categoria: 'Stunts' },
        { nombre: 'Full Up', nivel: 3, categoria: 'Stunts' },
        { nombre: 'Rewind', nivel: 3, categoria: 'Stunts' },
        { nombre: 'Switch Up', nivel: 3, categoria: 'Stunts' },
        
        // Nivel 4
        { nombre: 'Back Layout', nivel: 4, categoria: 'Tumbling' },
        { nombre: 'Roundoff Back Handspring Back Layout', nivel: 4, categoria: 'Tumbling' },
        { nombre: 'Front Layout', nivel: 4, categoria: 'Tumbling' },
        { nombre: 'Standing Back Tuck', nivel: 4, categoria: 'Tumbling' },
        { nombre: 'Toe Touch Back Handspring', nivel: 4, categoria: 'Jumps & Tumbling' },
        { nombre: 'Pike Jump Back Handspring', nivel: 4, categoria: 'Jumps & Tumbling' },
        { nombre: 'Full Twist Basket', nivel: 4, categoria: 'Stunts' },
        { nombre: 'Double Full Up', nivel: 4, categoria: 'Stunts' },
        { nombre: 'Twisting Cradle', nivel: 4, categoria: 'Stunts' },
        { nombre: 'Kick Double Full', nivel: 4, categoria: 'Stunts' },
        
        // Nivel 5
        { nombre: 'Full Twisting Layout', nivel: 5, categoria: 'Tumbling' },
        { nombre: 'Double Full', nivel: 5, categoria: 'Tumbling' },
        { nombre: 'Arabian', nivel: 5, categoria: 'Tumbling' },
        { nombre: 'Punch Front', nivel: 5, categoria: 'Tumbling' },
        { nombre: 'Standing Full', nivel: 5, categoria: 'Tumbling' },
        { nombre: 'Double Toe Touch Back Handspring', nivel: 5, categoria: 'Jumps & Tumbling' },
        { nombre: 'Double Twist Basket', nivel: 5, categoria: 'Stunts' },
        { nombre: 'Quadruple Full Up', nivel: 5, categoria: 'Stunts' },
        { nombre: 'Double Twisting Cradle', nivel: 5, categoria: 'Stunts' },
        { nombre: 'Full Twisting Dismount', nivel: 5, categoria: 'Stunts' },
        
        // Nivel 6
        { nombre: 'Double Layout', nivel: 6, categoria: 'Tumbling' },
        { nombre: 'Full Twisting Double', nivel: 6, categoria: 'Tumbling' },
        { nombre: 'Triple Full', nivel: 6, categoria: 'Tumbling' },
        { nombre: 'Standing Double Full', nivel: 6, categoria: 'Tumbling' },
        { nombre: 'Triple Twist Basket', nivel: 6, categoria: 'Stunts' },
        { nombre: 'Quadruple Twist Basket', nivel: 6, categoria: 'Stunts' },
        { nombre: 'Triple Twisting Cradle', nivel: 6, categoria: 'Stunts' },
        { nombre: 'Double Twisting Dismount', nivel: 6, categoria: 'Stunts' },
        
        // Adicionales por categoría
        { nombre: 'Standing Tuck', nivel: 2, categoria: 'Tumbling' },
        { nombre: 'Back Walkover', nivel: 1, categoria: 'Tumbling' },
        { nombre: 'Front Walkover', nivel: 1, categoria: 'Tumbling' },
        { nombre: 'Scale', nivel: 2, categoria: 'Flexibility' },
        { nombre: 'Needle', nivel: 3, categoria: 'Flexibility' },
        { nombre: 'Scorpion Flexibility', nivel: 3, categoria: 'Flexibility' },
        { nombre: 'Star Jump', nivel: 1, categoria: 'Jumps' },
        { nombre: 'Spread Eagle', nivel: 2, categoria: 'Jumps' },
        { nombre: 'Around the World', nivel: 3, categoria: 'Jumps' },
        { nombre: 'Chair', nivel: 1, categoria: 'Stunts' },
        { nombre: 'Torch', nivel: 2, categoria: 'Stunts' },
        { nombre: 'Bow and Arrow', nivel: 2, categoria: 'Stunts' },
        { nombre: 'Cupie', nivel: 3, categoria: 'Stunts' },
        { nombre: 'Wolf Wall', nivel: 3, categoria: 'Stunts' },
        { nombre: 'Lib Switch Lib', nivel: 4, categoria: 'Stunts' },
        { nombre: 'Front Flip Basket', nivel: 4, categoria: 'Stunts' },
        { nombre: 'Back Flip Basket', nivel: 4, categoria: 'Stunts' },
        { nombre: 'Pike Basket', nivel: 3, categoria: 'Stunts' },
        { nombre: 'Layout Basket', nivel: 4, categoria: 'Stunts' },
        { nombre: 'Toss to Hands', nivel: 5, categoria: 'Stunts' },
        { nombre: 'Toss Cupie', nivel: 5, categoria: 'Stunts' },
        { nombre: 'Inversion Toss', nivel: 6, categoria: 'Stunts' },
        { nombre: 'Connected Tumbling', nivel: 5, categoria: 'Tumbling' },
        { nombre: 'Group Synchronized Tumbling', nivel: 4, categoria: 'Tumbling' },
        { nombre: 'Whip', nivel: 3, categoria: 'Tumbling' },
        { nombre: 'Handspring Step Out', nivel: 2, categoria: 'Tumbling' },
        { nombre: 'Pike Jump Roundoff', nivel: 3, categoria: 'Jumps & Tumbling' }
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

module.exports = { initDatabase };
