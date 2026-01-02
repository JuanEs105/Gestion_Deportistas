-- backend/migrations/02-fix-evaluation-system.sql
-- ============================================
-- CORRECCIÓN: Sistema de Evaluación
-- ============================================

-- 1. Verificar y agregar campos faltantes en deportistas
DO $$ 
BEGIN
    -- nivel_sugerido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deportistas' AND column_name = 'nivel_sugerido'
    ) THEN
        ALTER TABLE deportistas ADD COLUMN nivel_sugerido VARCHAR(50);
    END IF;
    
    -- cambio_nivel_pendiente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deportistas' AND column_name = 'cambio_nivel_pendiente'
    ) THEN
        ALTER TABLE deportistas ADD COLUMN cambio_nivel_pendiente BOOLEAN DEFAULT false;
    END IF;
    
    -- fecha_ultimo_cambio_nivel
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deportistas' AND column_name = 'fecha_ultimo_cambio_nivel'
    ) THEN
        ALTER TABLE deportistas ADD COLUMN fecha_ultimo_cambio_nivel TIMESTAMP;
    END IF;
END $$;

-- 2. Verificar y agregar campos en evaluaciones
DO $$ 
BEGIN
    -- completado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluaciones' AND column_name = 'completado'
    ) THEN
        ALTER TABLE evaluaciones ADD COLUMN completado BOOLEAN DEFAULT false;
    END IF;
    
    -- fecha_evaluacion
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluaciones' AND column_name = 'fecha_evaluacion'
    ) THEN
        ALTER TABLE evaluaciones ADD COLUMN fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 3. Verificar foreign keys
DO $$
BEGIN
    -- FK evaluaciones -> deportistas
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_evaluaciones_deportista'
    ) THEN
        ALTER TABLE evaluaciones 
        ADD CONSTRAINT fk_evaluaciones_deportista 
        FOREIGN KEY (deportista_id) REFERENCES deportistas(id) ON DELETE CASCADE;
    END IF;
    
    -- FK evaluaciones -> habilidades
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_evaluaciones_habilidad'
    ) THEN
        ALTER TABLE evaluaciones 
        ADD CONSTRAINT fk_evaluaciones_habilidad 
        FOREIGN KEY (habilidad_id) REFERENCES habilidades(id) ON DELETE CASCADE;
    END IF;
    
    -- FK evaluaciones -> users (entrenador)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_evaluaciones_entrenador'
    ) THEN
        ALTER TABLE evaluaciones 
        ADD CONSTRAINT fk_evaluaciones_entrenador 
        FOREIGN KEY (entrenador_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_evaluaciones_deportista ON evaluaciones(deportista_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_habilidad ON evaluaciones(habilidad_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha ON evaluaciones(fecha_evaluacion);

-- 5. Verificación final
SELECT 
    'evaluaciones' as tabla,
    COUNT(*) as registros,
    COUNT(CASE WHEN completado IS NOT NULL THEN 1 END) as con_completado,
    COUNT(CASE WHEN fecha_evaluacion IS NOT NULL THEN 1 END) as con_fecha
FROM evaluaciones;