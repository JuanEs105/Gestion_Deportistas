-- ============================================
-- MIGRACIÓN: Sistema de Evaluación Mejorado
-- Fecha: Diciembre 2025
-- ============================================

-- 1. Agregar campos a tabla habilidades
ALTER TABLE habilidades 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'habilidad',
ADD COLUMN IF NOT EXISTS obligatoria BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS puntuacion_minima INTEGER DEFAULT 7;

-- Crear índice para búsquedas rápidas por categoría
CREATE INDEX IF NOT EXISTS idx_habilidades_categoria ON habilidades(categoria);
CREATE INDEX IF NOT EXISTS idx_habilidades_nivel ON habilidades(nivel);

-- 2. Agregar campo a tabla evaluaciones para tracking de intentos
ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS intentos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Agregar campo a tabla deportistas para tracking de nivel
ALTER TABLE deportistas
ADD COLUMN IF NOT EXISTS nivel_sugerido VARCHAR(50),
ADD COLUMN IF NOT EXISTS cambio_nivel_pendiente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio_nivel TIMESTAMP;

-- 4. Crear tabla para historial de cambios de nivel
CREATE TABLE IF NOT EXISTS historial_niveles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deportista_id UUID NOT NULL REFERENCES deportistas(id) ON DELETE CASCADE,
  nivel_anterior VARCHAR(50),
  nivel_nuevo VARCHAR(50) NOT NULL,
  aprobado_por UUID REFERENCES users(id),
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_deportista ON historial_niveles(deportista_id);

-- 5. Comentarios para documentación
COMMENT ON COLUMN habilidades.categoria IS 'Categoría: habilidad, ejercicio_accesorio, postura';
COMMENT ON COLUMN habilidades.obligatoria IS 'true si es obligatoria para pasar de nivel';
COMMENT ON COLUMN habilidades.puntuacion_minima IS 'Puntuación mínima (1-10) para considerar completada';
COMMENT ON COLUMN evaluaciones.intentos IS 'Número de veces que se ha evaluado esta habilidad';
COMMENT ON COLUMN deportistas.nivel_sugerido IS 'Nivel sugerido por el sistema cuando completa 100%';
COMMENT ON COLUMN deportistas.cambio_nivel_pendiente IS 'true si hay un cambio de nivel esperando aprobación';

-- 6. Valores por defecto para habilidades existentes
UPDATE habilidades 
SET categoria = 'habilidad', 
    obligatoria = true, 
    puntuacion_minima = 7
WHERE categoria IS NULL;

-- ============================================
-- Verificación
-- ============================================
SELECT 
  'habilidades' as tabla,
  COUNT(*) as registros,
  COUNT(CASE WHEN categoria IS NOT NULL THEN 1 END) as con_categoria
FROM habilidades
UNION ALL
SELECT 
  'evaluaciones' as tabla,
  COUNT(*) as registros,
  COUNT(CASE WHEN intentos IS NOT NULL THEN 1 END) as con_intentos
FROM evaluaciones;

ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS intentos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE habilidades 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'habilidad',
ADD COLUMN IF NOT EXISTS obligatoria BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS puntuacion_minima INTEGER DEFAULT 7;

ALTER TABLE deportistas
ADD COLUMN IF NOT EXISTS nivel_sugerido VARCHAR(50),
ADD COLUMN IF NOT EXISTS cambio_nivel_pendiente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio_nivel TIMESTAMP;