// Script para resetear habilidades
// Ejecutar con: node resetear-habilidades.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function resetearHabilidades() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        
        // Crear conexión a la base de datos
        const sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            dialectOptions: {
                ssl: process.env.NODE_ENV === 'production' ? {
                    require: true,
                    rejectUnauthorized: false
                } : false
            },
            logging: false
        });

        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos');

        // Eliminar todas las habilidades
        console.log('🗑️  Eliminando habilidades antiguas...');
        const [results] = await sequelize.query('DELETE FROM habilidades;');
        console.log(`✅ ${results.rowCount || 'Todas las'} habilidades eliminadas`);

        // Cerrar conexión
        await sequelize.close();
        console.log('✅ Proceso completado');
        console.log('\n📋 SIGUIENTE PASO:');
        console.log('   Reinicia el servidor backend para que se carguen las nuevas 90 habilidades\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetearHabilidades();
