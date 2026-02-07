const { sequelize } = require('./src/models');

async function fixEnumCompleto() {
    try {
        console.log('🔧 LIMPIANDO MIGRACIÓN INCOMPLETA DEL ENUM...\n');

        // PASO 1: Verificar estado actual
        console.log('📊 Paso 1: Verificando estado actual de la base de datos...');
        try {
            const result = await sequelize.query(`
                SELECT typname FROM pg_type 
                WHERE typname LIKE '%deportistas_estado%'
            `);
            console.log('   ENUMs encontrados:', result[0].map(r => r.typname));
        } catch (e) {
            console.log('   Error verificando ENUMs (puede ser normal)');
        }

        // PASO 2: Limpiar ENUMs viejos si existen
        console.log('\n🧹 Paso 2: Limpiando ENUMs antiguos...');
        
        try {
            // Primero cambiar la columna a VARCHAR temporalmente
            await sequelize.query(`
                ALTER TABLE deportistas 
                ALTER COLUMN estado TYPE VARCHAR(50);
            `);
            console.log('   ✅ Columna cambiada a VARCHAR temporalmente');
        } catch (e) {
            console.log('   ⚠️  Columna ya es VARCHAR o no existe');
        }

        // Eliminar ENUMs viejos si existen
        try {
            await sequelize.query(`DROP TYPE IF EXISTS enum_deportistas_estado_old CASCADE;`);
            console.log('   ✅ ENUM viejo eliminado');
        } catch (e) {
            console.log('   ℹ️  ENUM viejo no existía');
        }

        try {
            await sequelize.query(`DROP TYPE IF EXISTS enum_deportistas_estado CASCADE;`);
            console.log('   ✅ ENUM actual eliminado');
        } catch (e) {
            console.log('   ℹ️  ENUM actual no existía');
        }

        // PASO 3: Crear ENUM nuevo y correcto
        console.log('\n🎨 Paso 3: Creando ENUM nuevo y correcto...');
        
        await sequelize.query(`
            CREATE TYPE enum_deportistas_estado AS ENUM (
                'activo',
                'pendiente',
                'pendiente_de_pago',
                'inactivo',
                'lesionado',
                'descanso'
            );
        `);
        console.log('   ✅ ENUM creado con todos los valores correctos');

        // PASO 4: Convertir valores antiguos
        console.log('\n🔄 Paso 4: Normalizando valores en la tabla...');
        
        await sequelize.query(`
            UPDATE deportistas 
            SET estado = 'pendiente_de_pago' 
            WHERE estado = 'falta de pago';
        `);
        console.log('   ✅ Valores "falta de pago" → "pendiente_de_pago"');

        // PASO 5: Aplicar ENUM a la columna
        console.log('\n🔗 Paso 5: Aplicando ENUM a la columna estado...');
        
        await sequelize.query(`
            ALTER TABLE deportistas 
            ALTER COLUMN estado TYPE enum_deportistas_estado 
            USING estado::enum_deportistas_estado;
        `);
        console.log('   ✅ ENUM aplicado correctamente a la columna');

        // PASO 6: Verificar resultado
        console.log('\n📊 Paso 6: Verificando migración...');
        
        const finalCheck = await sequelize.query(`
            SELECT typname FROM pg_type 
            WHERE typname LIKE '%deportistas_estado%'
        `);
        console.log('   ENUMs finales:', finalCheck[0].map(r => r.typname));

        const enumValues = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid FROM pg_type WHERE typname = 'enum_deportistas_estado'
            )
            ORDER BY enumsortorder;
        `);
        console.log('   Valores del ENUM:', enumValues[0].map(r => r.enumlabel));

        console.log('\n✅✅✅ MIGRACIÓN COMPLETADA EXITOSAMENTE ✅✅✅\n');
        console.log('Ahora puedes usar los siguientes estados:');
        console.log('  - activo');
        console.log('  - pendiente');
        console.log('  - pendiente_de_pago  ← NUEVO');
        console.log('  - inactivo');
        console.log('  - lesionado');
        console.log('  - descanso\n');

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR EN LA MIGRACIÓN:', error.message);
        console.error('\n📋 Stack trace:', error);
        await sequelize.close();
        process.exit(1);
    }
}

fixEnumCompleto();
