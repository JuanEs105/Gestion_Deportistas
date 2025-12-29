// backend/scripts/update-all-passwords.js - CON LA RUTA CORRECTA
const path = require('path');

// USAR LA MISMA ESTRUCTURA QUE working-fix.js
let sequelize;
try {
  sequelize = require('../src/config/database').sequelize;
  console.log('✅ Cargado desde scripts/');
} catch (error) {
  try {
    sequelize = require('./src/config/database').sequelize;
    console.log('✅ Cargado desde backend/');
  } catch (error2) {
    const configPath = path.join(__dirname, '..', 'src', 'config', 'database.js');
    sequelize = require(configPath).sequelize;
    console.log('✅ Cargado con ruta absoluta');
  }
}

const bcrypt = require('bcryptjs');

async function updateAllPasswords() {
  console.log('🔄 ACTUALIZANDO CONTRASEÑAS DE TODOS LOS USUARIOS...\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. Generar hash CORRECTO
    const salt = await bcrypt.genSalt(10);
    const correctHash = await bcrypt.hash('password123', salt);
    
    console.log('🔑 Hash para "password123":');
    console.log(correctHash.substring(0, 60) + '...\n');

    // 2. Lista de usuarios
    const users = [
      { email: 'entrenador@deportes.com', role: 'entrenador' },
      { email: 'carlos@deportes.com', role: 'deportista' },
      { email: 'ana@deportes.com', role: 'deportista' },
      { email: 'miguel@deportes.com', role: 'deportista' }
    ];

    console.log('👥 Procesando usuarios...\n');

    for (const user of users) {
      // Actualizar con SQL CRUDO
      const result = await sequelize.query(
        'UPDATE users SET password = :hash WHERE email = :email RETURNING email',
        {
          replacements: { hash: correctHash, email: user.email },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      if (result[1] > 0) {
        console.log(`✅ ${user.email} - ACTUALIZADO`);
      } else {
        console.log(`⚠️  ${user.email} no encontrado, ignorando...`);
      }
    }

    // 3. VERIFICAR
    console.log('\n🧪 VERIFICANDO...\n');
    const dbUsers = await sequelize.query(
      "SELECT email, password FROM users WHERE email LIKE '%@deportes.com' ORDER BY email",
      { type: sequelize.QueryTypes.SELECT }
    );

    for (const user of dbUsers) {
      const isValid = await bcrypt.compare('password123', user.password);
      console.log(`🔍 ${user.email}: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    }

    console.log('\n🎉 USUARIOS ACTUALIZADOS');
    console.log('\n🔑 Usar: email / password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

updateAllPasswords();