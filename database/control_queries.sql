-- ====================================================================
-- PROYECTO RACHA - SCRIPTS DE CONSULTA Y CONTROL DE DATOS (CRUD & ANALYTICS)
-- Todas las operaciones de cálculo de racha, control de 7 días y reportes
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. REGISTRAR ESTUDIO DE HOY (Acción del botón «Hoy sí estudié»)
-- Inserta la fecha actual de forma idempotente (ignora si ya existe hoy)
-- --------------------------------------------------------------------
INSERT OR IGNORE INTO study_logs (study_date, duration_minutes, notes) 
VALUES (DATE('now', 'localtime'), 30, 'Estudio registrado con éxito');


-- --------------------------------------------------------------------
-- 2. DESHACER ESTUDIO DE HOY (En caso de clic accidental)
-- --------------------------------------------------------------------
DELETE FROM study_logs 
WHERE study_date = DATE('now', 'localtime');


-- --------------------------------------------------------------------
-- 3. CONSULTAR EL ESTADO DE LOS ÚLTIMOS 7 DÍAS
-- Genera una serie de los últimos 7 días y hace LEFT JOIN con study_logs
-- Devuelve: fecha, día de la semana, y si fue estudiado (1 ó 0)
-- --------------------------------------------------------------------
WITH RECURSIVE last_seven(day_offset, date_val) AS (
    SELECT 0, DATE('now', 'localtime')
    UNION ALL
    SELECT day_offset + 1, DATE('now', 'localtime', '-' || (day_offset + 1) || ' days')
    FROM last_seven
    WHERE day_offset < 6
)
SELECT 
    ls.date_val AS fecha,
    CASE STRFTIME('%w', ls.date_val)
        WHEN '0' THEN 'Domingo'
        WHEN '1' THEN 'Lunes'
        WHEN '2' THEN 'Martes'
        WHEN '3' THEN 'Miércoles'
        WHEN '4' THEN 'Jueves'
        WHEN '5' THEN 'Viernes'
        WHEN '6' THEN 'Sábado'
    END AS dia_semana,
    CASE 
        WHEN ls.date_val = DATE('now', 'localtime') THEN 'Hoy'
        WHEN ls.date_val = DATE('now', 'localtime', '-1 day') THEN 'Ayer'
        ELSE STRFTIME('%d/%m', ls.date_val)
    END AS etiqueta,
    CASE WHEN sl.id IS NOT NULL THEN 1 ELSE 0 END AS fue_estudiado
FROM last_seven ls
LEFT JOIN study_logs sl ON ls.date_val = sl.study_date
ORDER BY ls.date_val DESC;


-- --------------------------------------------------------------------
-- 4. OBTENER UNA FRASE MOTIVACIONAL ALEATORIA Y REGISTRAR SU MUESTRA
-- --------------------------------------------------------------------
-- A. Seleccionar una frase aleatoria activa
SELECT id, quote_text, author, category 
FROM motivational_quotes 
WHERE is_active = 1 
ORDER BY RANDOM() 
LIMIT 1;

-- B. Incrementar el contador de vistas para esa frase
-- UPDATE motivational_quotes SET times_displayed = times_displayed + 1 WHERE id = :selected_id;


-- --------------------------------------------------------------------
-- 5. CÁLCULO DE RACHA CONSECUTIVA ACTUAL (Algoritmo SQL)
-- Cuenta los días consecutivos hacia atrás desde hoy o ayer
-- --------------------------------------------------------------------
WITH RECURSIVE streak_calc(check_date, is_valid) AS (
    -- Comenzamos revisando si hoy fue estudiado, o si ayer fue estudiado
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM study_logs WHERE study_date = DATE('now', 'localtime')) 
                THEN DATE('now', 'localtime')
            WHEN EXISTS (SELECT 1 FROM study_logs WHERE study_date = DATE('now', 'localtime', '-1 day')) 
                THEN DATE('now', 'localtime', '-1 day')
            ELSE NULL 
        END,
        1
    UNION ALL
    SELECT 
        DATE(sc.check_date, '-1 day'),
        EXISTS (SELECT 1 FROM study_logs WHERE study_date = DATE(sc.check_date, '-1 day'))
    FROM streak_calc sc
    WHERE sc.check_date IS NOT NULL AND sc.is_valid = 1
)
SELECT 
    CASE 
        WHEN (SELECT check_date FROM streak_calc LIMIT 1) IS NULL THEN 0
        ELSE (SELECT COUNT(*) - 1 FROM streak_calc WHERE is_valid = 1)
    END AS racha_actual_dias;


-- --------------------------------------------------------------------
-- 6. ACTUALIZAR ESTADO MAESTRO DE RACHA (STREAK_STATE)
-- --------------------------------------------------------------------
UPDATE streak_state 
SET 
    current_streak = (
        WITH RECURSIVE streak_calc(check_date, is_valid) AS (
            SELECT 
                CASE 
                    WHEN EXISTS (SELECT 1 FROM study_logs WHERE study_date = DATE('now', 'localtime')) 
                        THEN DATE('now', 'localtime')
                    WHEN EXISTS (SELECT 1 FROM study_logs WHERE study_date = DATE('now', 'localtime', '-1 day')) 
                        THEN DATE('now', 'localtime', '-1 day')
                    ELSE NULL 
                END, 1
            UNION ALL
            SELECT DATE(sc.check_date, '-1 day'),
                   EXISTS (SELECT 1 FROM study_logs WHERE study_date = DATE(sc.check_date, '-1 day'))
            FROM streak_calc sc
            WHERE sc.check_date IS NOT NULL AND sc.is_valid = 1
        )
        SELECT CASE WHEN (SELECT check_date FROM streak_calc LIMIT 1) IS NULL THEN 0
                    ELSE (SELECT COUNT(*) - 1 FROM streak_calc WHERE is_valid = 1) END
    ),
    max_streak = MAX(max_streak, (
        SELECT CASE WHEN (SELECT check_date FROM streak_calc LIMIT 1) IS NULL THEN 0
                    ELSE (SELECT COUNT(*) - 1 FROM streak_calc WHERE is_valid = 1) END
        FROM streak_calc
    )),
    total_days_studied = (SELECT COUNT(*) FROM study_logs),
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;


-- --------------------------------------------------------------------
-- 7. REINICIAR TODOS LOS DATOS (RESET TOTAL)
-- --------------------------------------------------------------------
-- DELETE FROM study_logs;
-- UPDATE streak_state SET current_streak = 0, max_streak = 0, total_days_studied = 0, last_studied_date = NULL WHERE id = 1;
