const { sequelize } = require('./src/config/database');
const { User, Deportista, Habilidad, Evaluacion } = require('./src/models');

const setupDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');
    
    // Desactivar foreign keys temporalmente
    await sequelize.query('SET session_replication_role = replica;');
    
    // Sincronizar en orden correcto
    console.log('🔄 Creando tabla users...');
    await User.sync({ force: false });
    
    console.log('🔄 Creando tabla deportistas...');
    await Deportista.sync({ force: false });
    
    console.log('🔄 Creando tabla habilidades...');
    await Habilidad.sync({ force: false });
    
    console.log('🔄 Creando tabla evaluaciones...');
    await Evaluacion.sync({ force: false });
    
    // Reactivar foreign keys
    await sequelize.query('SET session_replication_role = DEFAULT;');
    
    console.log('🎉 Base de datos configurada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

setupDatabase();