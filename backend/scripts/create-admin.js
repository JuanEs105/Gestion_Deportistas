// backend/scripts/create-admin.js
const { User } = require('../src/models');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    console.log('🔄 Creando usuario administrador...');
    
    // Verificar si ya existe
    const existingAdmin = await User.findOne({ 
      where: { email: 'administrador@gmail.com' } 
    });
    
    if (existingAdmin) {
      console.log('⚠️  El administrador ya existe');
      console.log('   Email:', existingAdmin.email);
      console.log('   Rol:', existingAdmin.role);
      
      // Actualizar contraseña si se desea
      const updatePassword = true; // Cambiar a true si quieres actualizar la contraseña
      
      if (updatePassword) {
        const newPassword = 'Admin2024$';
        existingAdmin.password = newPassword; // El hook del modelo lo hasheará
        await existingAdmin.save();
        console.log('✅ Contraseña actualizada');
        console.log('   Nueva contraseña:', newPassword);
      }
      
      process.exit(0);
    }
    
    // Crear nuevo administrador
    const admin = await User.create({
      nombre: 'Administrador Principal',
      email: 'administrador@gmail.com',
      password: 'Admin2024$', // Se hasheará automáticamente por el hook
      role: 'admin',
      telefono: '+57 300 000 0000',
      activo: true
    });
    
    console.log('✅ Administrador creado exitosamente');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Contraseña: Admin2024$');
    console.log('👑 Rol:', admin.role);
    console.log('\n🎉 ¡Ya puedes iniciar sesión!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();