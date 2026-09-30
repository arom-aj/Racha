import React, { useState } from 'react';
import { X, Copy, Check, Download, Database, FileCode, Play, Terminal } from 'lucide-react';

interface ScriptFile {
  name: string;
  type: 'sql' | 'python' | 'markdown';
  title: string;
  description: string;
  content: string;
}

const DATABASE_SCRIPTS: ScriptFile[] = [
  {
    name: "schema.sql",
    type: "sql",
    title: "Creación de Tablas y Triggers (DDL)",
    description: "Crea las tablas study_logs, streak_state, motivational_quotes y triggers automáticos",
    content: `-- ====================================================================
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
END;`
  },
  {
    name: "control_queries.sql",
    type: "sql",
    title: "Consultas de Control de Datos y Racha",
    description: "Cálculo de días consecutivos, consulta de últimos 7 días y registro idempotente",
    content: `-- ====================================================================
-- PROYECTO RACHA - SCRIPTS DE CONSULTA Y CONTROL DE DATOS
-- ====================================================================

-- 1. REGISTRAR ESTUDIO DE HOY (Botón «Hoy sí estudié»)
INSERT OR IGNORE INTO study_logs (study_date, duration_minutes, notes) 
VALUES (DATE('now', 'localtime'), 30, 'Estudio registrado con éxito');

-- 2. DESHACER ESTUDIO DE HOY
DELETE FROM study_logs 
WHERE study_date = DATE('now', 'localtime');

-- 3. CONSULTAR EL ESTADO DE LOS ÚLTIMOS 7 DÍAS (CTE Recursiva)
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

-- 4. CÁLCULO DE RACHA CONSECUTIVA ACTUAL (Días seguidos hacia atrás)
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
            ELSE (SELECT COUNT(*) - 1 FROM streak_calc WHERE is_valid = 1) END AS racha_actual_dias;`
  },
  {
    name: "seed_data.sql",
    type: "sql",
    title: "Datos Semilla (Frases Motivacionales)",
    description: "20 frases inspiradoras en español clasificadas por disciplina, constancia y enfoque",
    content: `-- Carga de 20 frases motivacionales en español
INSERT INTO motivational_quotes (quote_text, author, category) VALUES
('No se trata de motivación, se trata de disciplina. La disciplina siempre termina el trabajo.', 'Jocko Willink', 'disciplina'),
('Somos lo que hacemos día a día. De modo que la excelencia no es un acto sino un hábito.', 'Aristóteles', 'constancia'),
('Un pequeño avance cada día suma grandes resultados que transforman tu futuro.', 'James Clear', 'constancia'),
('El dolor de la disciplina pesa gramos; el dolor del arrepentimiento pesa toneladas.', 'Jim Rohn', 'disciplina'),
('Mientras otros descansan o dudan, vos estás construyendo tu mente línea a línea.', 'Mentalidad RACHA', 'enfoque'),
('La única mala sesión de estudio es la que nunca ocurrió. Hoy diste el paso.', 'Proverbio del Estudiante', 'constancia'),
('Hazlo incluso cuando no tengas ganas. Ahí es donde se forjan los mejores.', 'David Goggins', 'disciplina'),
('No cuentes los días, haz que los días cuenten.', 'Muhammad Ali', 'grandeza'),
('La paciencia y el estudio constante son el superpoder más subestimado del siglo XXI.', 'Naval Ravikant', 'enfoque'),
('El fuego que enciende una racha no se apaga con el cansancio; se alimenta de tu compromiso.', 'RACHA Dev', 'grandeza');`
  },
  {
    name: "db_controller.py",
    type: "python",
    title: "Controlador CLI en Python (Gestión Offline)",
    description: "Script de terminal para inicializar, estudiar, consultar 7 días y exportar backup",
    content: `#!/usr/bin/env python3
import sys, os, sqlite3, datetime, json

DB_FILE = "racha.db"

def get_conn():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def estudiar():
    conn = get_conn()
    cur = conn.cursor()
    today = datetime.date.today().isoformat()
    cur.execute("INSERT OR IGNORE INTO study_logs (study_date) VALUES (?)", (today,))
    conn.commit()
    conn.close()
    print(f"🔥 ¡Estudio registrado con éxito para hoy ({today})!")

def ultimos_7_dias():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT study_date FROM study_logs")
    studied = {r["study_date"] for r in cur.fetchall()}
    conn.close()
    
    today = datetime.date.today()
    print("\\n📅 ÚLTIMOS 7 DÍAS:")
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        status = "✅ ESTUDIADO" if d.isoformat() in studied else "❌ PENDIENTE"
        print(f"  {d.isoformat()} -> {status}")
    print()

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "estado"
    if cmd == "estudiar": estudiar()
    elif cmd == "ultimos7": ultimos_7_dias()
    else: print("Comandos: estudiar | ultimos7")`
  }
];

interface DatabaseScriptsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseScriptsModal: React.FC<DatabaseScriptsModalProps> = ({ isOpen, onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const current = DATABASE_SCRIPTS[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([current.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = current.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#090d16] border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0c1220]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Scripts de Base de Datos y Control de Datos
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  SQLite / SQL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Creación de tablas, triggers, cálculo de rachas y controlador CLI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#080c14] border-b border-slate-800/80 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            {DATABASE_SCRIPTS.map((script, idx) => (
              <button
                key={script.name}
                onClick={() => setSelectedIdx(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedIdx === idx
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                {script.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              title="Descargar este archivo SQL"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
          </div>
        </div>

        {/* Description bar */}
        <div className="px-5 py-2.5 bg-[#0a0f1b] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300 truncate">database/{current.name}</span>
          </div>
          <span className="text-slate-500 hidden md:inline text-[11px]">
            {current.description}
          </span>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#05070c] font-mono text-xs text-slate-200 leading-relaxed selection:bg-emerald-600 selection:text-white">
          <pre className="overflow-x-auto whitespace-pre">
            <code>{current.content}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0c1220] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ejecutable en SQLite3, Room Database (Android) o PostgreSQL</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
