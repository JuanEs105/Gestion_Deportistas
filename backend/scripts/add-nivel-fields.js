// backend/scripts/add-nivel-fields.js
const { sequelize } = require('../src/config/database');

const addNivelFields = async () => {
  try {
    console.log('🔄 Agregando campos de cambio de nivel...');
    
    await sequelize.getQueryInterface().addColumn('deportistas', 'nivel_sugerido', {
      type: sequelize.Sequelize.ENUM('1_basico', '1_medio', '1_avanzado', '2', '3', '4'),
      allowNull: true,
      comment: 'Siguiente nivel sugerido cuando completa el 100%'
    });
    
    await sequelize.getQueryInterface().addColumn('deportistas', 'cambio_nivel_pendiente', {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si hay un cambio de nivel pendiente de aprobación'
    });
    
    await sequelize.getQueryInterface().addColumn('deportistas', 'fecha_ultimo_cambio_nivel', {
      type: sequelize.Sequelize.DATE,
      allowNull: true,
      comment: 'Fecha del último cambio de nivel aprobado'
    });
    
    console.log('✅ Campos agregados exitosamente');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Los campos ya existen');
      process.exit(0);
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
};

addNivelFields();