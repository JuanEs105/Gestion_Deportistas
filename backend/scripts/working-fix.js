// GUÁRDALO COMO: backend/scripts/working-fix.js
const path = require('path');

// Determinar la ruta correcta
let sequelize;
try {
  // Desde scripts/
  sequelize = require('../src/config/database').sequelize;
  console.log('✅ Cargado desde scripts/');
} catch (error) {
  try {
    // Desde backend/
    sequelize = require('./src/config/database').sequelize;
    console.log('✅ Cargado desde backend/');
  } catch (error2) {
    // Ruta absoluta
    const configPath = path.join(__dirname, '..', 'src', 'config', 'database.js');
    sequelize = require(configPath).sequelize;
    console.log('✅ Cargado con ruta absoluta');
  }
}

const bcrypt = require('bcryptjs');

async function workingFix() {
  console.log('🔧 REPARACIÓN EN CURSO...\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. Generar HASH CORRECTO
    const salt = await bcrypt.genSalt(10);
    const correctHash = await bcrypt.hash('password123', salt);
    console.log('🔑 Hash para "password123":');
    console.log(correctHash.substring(0, 60) + '...\n');

    // 2. ACTUALIZAR SOLO EL ENTRENADOR (más simple)
    console.log('🔄 Actualizando entrenador@deportes.com...');
    
    const result = await sequelize.query(
      'UPDATE users SET password = :hash WHERE email = :email RETURNING email',
      {
        replacements: { 
          hash: correctHash, 
          email: 'entrenador@deportes.com' 
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    if (result[1] > 0) {
      console.log('✅ Entrenador actualizado\n');
    } else {
      console.log('⚠️  Entrenador no encontrado, creando...');
      await sequelize.query(
        `INSERT INTO users (id, nombre, email, password, role, telefono, activo, created_at, updated_at)
         VALUES (gen_random_uuid(), 'Entrenador Principal', 'entrenador@deportes.com', :hash, 'entrenador', '3001234567', true, NOW(), NOW())`,
        {
          replacements: { hash: correctHash },
          type: sequelize.QueryTypes.INSERT
        }
      );
      console.log('✅ Entrenador creado\n');
    }

    // 3. VERIFICAR
    console.log('🧪 Verificando...');
    const [user] = await sequelize.query(
      'SELECT password FROM users WHERE email = :email',
      {
        replacements: { email: 'entrenador@deportes.com' },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (user) {
      const isValid = await bcrypt.compare('password123', user.password);
      console.log(`🔍 Verificación: ${isValid ? '✅ ÉXITO' : '❌ FALLO'}`);
      
      if (isValid) {
        console.log('\n🎉 ¡CONTRASEÑA CORREGIDA!');
        console.log('\n================================');
        console.log('🔑 CREDENCIALES:');
        console.log('================================');
        console.log('Email: entrenador@deportes.com');
        console.log('Password: password123');
        console.log('================================\n');
        
        console.log('🚀 Prueba el login ahora:');
        console.log('curl -X POST http://localhost:5000/api/auth/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"email":"entrenador@deportes.com","password":"password123"}\'');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

workingFix();