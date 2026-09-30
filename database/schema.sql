-- ====================================================================
-- PROYECTO RACHA - SCRIPT DDL DE CREACIÓN DE BASE DE DATOS (SQLITE / SQL)
-- Base de datos local para control de racha de estudio y frases motivacionales
-- 100% Offline, sin dependencias externas
-- ====================================================================

-- 1. Tabla de Registro Diario de Estudio
CREATE TABLE IF NOT EXISTS study_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    study_date TEXT NOT NULL UNIQUE, -- Formato ISO 8601: YYYY-MM-DD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER DEFAULT 30, -- Tiempo de estudio estimado
    notes TEXT DEFAULT NULL
);

-- Índice para acelerar consultas por rango de fechas (últimos 7 días)
CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs(study_date DESC);

-- 2. Tabla de Estado y Estadísticas de Racha (Singleton: id = 1)
CREATE TABLE IF NOT EXISTS streak_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    total_days_studied INTEGER NOT NULL DEFAULT 0,
    last_studied_date TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inicializar registro de estado si no existe
INSERT OR IGNORE INTO streak_state (id, current_streak, max_streak, total_days_studied) 
VALUES (1, 0, 0, 0);

-- 3. Tabla de Frases Motivacionales
CREATE TABLE IF NOT EXISTS motivational_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_text TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT CHECK(category IN ('disciplina', 'enfoque', 'constancia', 'grandeza')) DEFAULT 'constancia',
    times_displayed INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 -- 1 = Activa, 0 = Desactivada
);

-- 4. Triggers Automáticos para Control de Datos

-- Trigger: Al insertar un día de estudio, actualiza el total de días estudiados
CREATE TRIGGER IF NOT EXISTS trg_after_study_insert
AFTER INSERT ON study_logs
BEGIN
    UPDATE streak_state
    SET 
        total_days_studied = (SELECT COUNT(*) FROM study_logs),
        last_studied_date = NEW.study_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;
END;

-- Trigger: Al eliminar un registro de estudio (deshacer), actualiza el total
CREATE TRIGGER IF NOT EXISTS trg_after_study_delete
AFTER DELETE ON study_logs
BEGIN
    UPDATE streak_state
    SET 
        total_days_studied = (SELECT COUNT(*) FROM study_logs),
        last_studied_date = (SELECT study_date FROM study_logs ORDER BY study_date DESC LIMIT 1),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;
END;
