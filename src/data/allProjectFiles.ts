export interface ProjectFileEntry {
  path: string;
  name: string;
  category: 'Android Kotlin' | 'Base de Datos (SQL)' | 'Configuración Gradle' | 'Documentación';
  content: string;
}

export const ALL_PROJECT_FILES: ProjectFileEntry[] = [
  // 1. Database Schema
  {
    path: "database/schema.sql",
    name: "schema.sql",
    category: "Base de Datos (SQL)",
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
    duration_minutes INTEGER DEFAULT 30,
    notes TEXT DEFAULT NULL
);

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

INSERT OR IGNORE INTO streak_state (id, current_streak, max_streak, total_days_studied) 
VALUES (1, 0, 0, 0);

-- 3. Tabla de Frases Motivacionales
CREATE TABLE IF NOT EXISTS motivational_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_text TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT CHECK(category IN ('disciplina', 'enfoque', 'constancia', 'grandeza')) DEFAULT 'constancia',
    times_displayed INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

-- 4. Triggers Automáticos para Control de Datos
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

  // 2. Database Queries
  {
    path: "database/control_queries.sql",
    name: "control_queries.sql",
    category: "Base de Datos (SQL)",
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

  // 3. Database Seed
  {
    path: "database/seed_data.sql",
    name: "seed_data.sql",
    category: "Base de Datos (SQL)",
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
('El fuego que enciende una racha no se apaga con el cansancio; se alimenta de tu compromiso.', 'RACHA Dev', 'grandeza'),
('Si estudias 30 minutos al día, al año habrás acumulado más de 180 horas de ventaja competitiva.', 'Regla del 1%', 'constancia'),
('Concéntrate en el proceso, no en el resultado inmediato. El conocimiento es acumulativo.', 'Carl Sagan', 'enfoque'),
('La suerte favorece a la mente preparada.', 'Louis Pasteur', 'grandeza'),
('Hoy superaste la pereza. Tu versión del futuro te lo va a agradecer con creces.', 'Mentalidad RACHA', 'disciplina'),
('El éxito no es más que la suma de pequeños esfuerzos repetidos día tras día.', 'Robert Collier', 'constancia'),
('Quien domina su atención y sus libros domina su destino.', 'Marco Aurelio', 'enfoque'),
('Cada concepto que aprendes hoy es un ladrillo más en el imperio de tus habilidades.', 'RACHA Dev', 'grandeza'),
('No busques el momento perfecto: toma el momento y hazlo productivo.', 'Séneca', 'enfoque'),
('Tu cerebro se adapta a lo que le exiges con regularidad. Estás reprogramando tus límites.', 'Andrew Huberman', 'disciplina'),
('La racha no es solo un número: es el reflejo de tu palabra cumplida consigo mismo.', 'Filosofía RACHA', 'constancia');`
  },

  // 4. Database Python Controller
  {
    path: "database/db_controller.py",
    name: "db_controller.py",
    category: "Base de Datos (SQL)",
    content: `#!/usr/bin/env python3
"""
PROYECTO RACHA - SCRIPT CONTROLADOR DE BASE DE DATOS (OFFLINE)
Uso:
    python3 db_controller.py init
    python3 db_controller.py estudiar
    python3 db_controller.py ultimos7
    python3 db_controller.py estado
"""
import sys, os, sqlite3, datetime, json

DB_FILE = os.path.join(os.path.dirname(__file__), "racha.db")
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "schema.sql")
SEED_FILE = os.path.join(os.path.dirname(__file__), "seed_data.sql")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM motivational_quotes")
    if cur.fetchone()[0] == 0:
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("✅ Base de datos 'racha.db' inicializada con éxito.")

def mark_studied_today():
    init_db()
    today_str = datetime.date.today().isoformat()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT OR IGNORE INTO study_logs (study_date, duration_minutes) VALUES (?, ?)", (today_str, 30))
    conn.commit()
    conn.close()
    print(f"🔥 ¡Estudio registrado para hoy: {today_str}!")

def show_last_7_days():
    init_db()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT study_date FROM study_logs")
    studied_set = {r["study_date"] for r in cur.fetchall()}
    conn.close()
    
    today = datetime.date.today()
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    print("\\n📅 ÚLTIMOS 7 DÍAS:")
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        d_str = d.isoformat()
        label = "Hoy" if i == 0 else ("Ayer" if i == 1 else day_names[d.weekday()])
        status = "✅ ESTUDIADO" if d_str in studied_set else "❌ SIN REGISTRO"
        print(f"  [{label:<9}] {d_str}  -->  {status}")
    print()

if __name__ == "__main__":
    cmd = sys.argv[1].lower() if len(sys.argv) > 1 else "estado"
    if cmd == "init": init_db()
    elif cmd in ("estudiar", "study"): mark_studied_today()
    elif cmd in ("ultimos7", "7dias"): show_last_7_days()
    else: print("Comandos: init | estudiar | ultimos7")`
  },

  // 5. Android MainActivity.kt
  {
    path: "android/app/src/main/java/com/racha/app/MainActivity.kt",
    name: "MainActivity.kt",
    category: "Android Kotlin",
    content: `package com.racha.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.racha.app.ui.RachaScreen

val NeonGreen = Color(0xFF00FF88)
val NeonOrange = Color(0xFFFF6A00)
val NeonCyan = Color(0xFF00E5FF)
val DarkBackground = Color(0xFF07090E)
val CardSurface = Color(0xFF111622)
val TextMuted = Color(0xFF94A3B8)

private val DarkColorScheme = darkColorScheme(
    primary = NeonGreen,
    secondary = NeonOrange,
    tertiary = NeonCyan,
    background = DarkBackground,
    surface = CardSurface,
    onPrimary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme(colorScheme = DarkColorScheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RachaScreen()
                }
            }
        }
    }
}`
  },

  // 6. Android RachaScreen.kt
  {
    path: "android/app/src/main/java/com/racha/app/ui/RachaScreen.kt",
    name: "RachaScreen.kt",
    category: "Android Kotlin",
    content: `package com.racha.app.ui

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.racha.app.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

data class MotivationalQuote(val text: String, val author: String)

val quotes = listOf(
    MotivationalQuote("No se trata de motivación, se trata de disciplina. La disciplina siempre termina el trabajo.", "Jocko Willink"),
    MotivationalQuote("Somos lo que hacemos día a día. De modo que la excelencia no es un acto sino un hábito.", "Aristóteles"),
    MotivationalQuote("Un pequeño avance cada día suma grandes resultados que transforman tu futuro.", "James Clear"),
    MotivationalQuote("Hazlo incluso cuando no tengas ganas. Ahí es donde se forjan los mejores.", "David Goggins"),
    MotivationalQuote("No cuentes los días, haz que los días cuenten.", "Muhammad Ali"),
    MotivationalQuote("La suerte favorece a la mente preparada y constante.", "Louis Pasteur"),
    MotivationalQuote("Hoy superaste la pereza. Tu versión del futuro te lo va a agradecer con creces.", "Mentalidad RACHA")
)

data class DayItem(
    val date: LocalDate,
    val dayName: String,
    val dateText: String,
    val isStudied: Boolean,
    val isToday: Boolean
)

@Composable
fun RachaScreen() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("racha_prefs", Context.MODE_PRIVATE) }

    var savedDates by remember {
        mutableStateOf(prefs.getStringSet("studied_dates", emptySet()) ?: emptySet())
    }

    val today = remember { LocalDate.now() }
    val todayStr = remember(today) { today.toString() }
    val isStudiedToday = remember(savedDates, todayStr) { savedDates.contains(todayStr) }

    var currentQuote by remember { mutableStateOf(quotes.random()) }

    val currentStreak = remember(savedDates, today) {
        var streak = 0
        var cursor = today
        if (savedDates.contains(today.toString())) {
            while (savedDates.contains(cursor.toString())) {
                streak++
                cursor = cursor.minusDays(1)
            }
        } else {
            val yesterday = today.minusDays(1)
            if (savedDates.contains(yesterday.toString())) {
                cursor = yesterday
                while (savedDates.contains(cursor.toString())) {
                    streak++
                    cursor = cursor.minusDays(1)
                }
            }
        }
        streak
    }

    val lastSevenDays = remember(savedDates, today) {
        val formatter = DateTimeFormatter.ofPattern("d MMM", Locale("es"))
        (6 downTo 0).map { offset ->
            val date = today.minusDays(offset.toLong())
            val dayName = when (offset) {
                0 -> "Hoy"
                1 -> "Ayer"
                else -> date.dayOfWeek.getDisplayName(java.time.format.TextStyle.SHORT, Locale("es"))
                    .replaceFirstChar { it.uppercase() }
            }
            DayItem(
                date = date,
                dayName = dayName,
                dateText = date.format(formatter),
                isStudied = savedDates.contains(date.toString()),
                isToday = offset == 0
            )
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "flame")
    val flameScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "flameScale"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "RACHA",
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 2.sp,
                color = NeonGreen
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(8.dp).clip(CircleShape).background(NeonGreen)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "100% OFFLINE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted
                )
            }
        }

        // CONTADOR GRANDE
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .shadow(elevation = 16.dp, spotColor = NeonOrange.copy(alpha = 0.5f), shape = RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(containerColor = CardSurface),
            shape = RoundedCornerShape(24.dp),
            border = BorderStroke(1.5.dp, NeonOrange.copy(alpha = 0.4f))
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(vertical = 28.dp, horizontal = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.LocalFireDepartment,
                    contentDescription = "Fuego",
                    tint = NeonOrange,
                    modifier = Modifier.size(56.dp).scale(flameScale)
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "$currentStreak",
                    fontSize = 76.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )

                Text(
                    text = if (currentStreak == 1) "DÍA CONSECUTIVO" else "DÍAS CONSECUTIVOS",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 2.sp,
                    color = NeonOrange
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // BOTÓN «HOY SÍ ESTUDIÉ»
        Button(
            onClick = {
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE))
                }

                val newDates = savedDates.toMutableSet().apply { add(todayStr) }
                savedDates = newDates
                prefs.edit().putStringSet("studied_dates", newDates).apply()
                currentQuote = quotes.filter { it.text != currentQuote.text }.random()
            },
            enabled = !isStudiedToday,
            modifier = Modifier.fillMaxWidth().height(64.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isStudiedToday) Color(0xFF1E293B) else NeonGreen,
                contentColor = if (isStudiedToday) TextMuted else Color.Black
            ),
            shape = RoundedCornerShape(18.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isStudiedToday) "HOY YA ESTUDIASTE" else "HOY SÍ ESTUDIÉ",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // LISTA DE ÚLTIMOS 7 DÍAS
        Text(
            text = "ÚLTIMOS 7 DÍAS",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = TextMuted,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CardSurface),
            shape = RoundedCornerShape(18.dp),
            border = BorderStroke(1.dp, Color(0xFF1E293B))
        ) {
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                lastSevenDays.forEachIndexed { index, day ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = day.dayName,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (day.isToday) NeonCyan else Color.White
                            )
                            Text(text = day.dateText, fontSize = 12.sp, color = TextMuted)
                        }

                        if (day.isStudied) {
                            Box(
                                modifier = Modifier.size(30.dp).clip(CircleShape).background(NeonGreen.copy(alpha = 0.2f)).border(1.5.dp, NeonGreen, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = NeonGreen, modifier = Modifier.size(16.dp))
                            }
                        } else {
                            Text(text = "—", fontSize = 16.sp, color = Color(0xFF64748B))
                        }
                    }
                    if (index < lastSevenDays.lastIndex) {
                        HorizontalDivider(color = Color(0xFF1E293B), thickness = 0.8.dp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // FRASE MOTIVACIONAL
        Card(
            modifier = Modifier.fillMaxWidth().clickable { currentQuote = quotes.filter { it.text != currentQuote.text }.random() },
            colors = CardDefaults.cardColors(containerColor = CardSurface),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, NeonCyan.copy(alpha = 0.3f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "MENSAJE DEL DÍA", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = NeonCyan)
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(16.dp))
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "“\${currentQuote.text}”", fontSize = 13.sp, color = Color.White)
                Text(text = "— \${currentQuote.author}", fontSize = 11.sp, color = TextMuted, textAlign = TextAlign.End, modifier = Modifier.fillMaxWidth())
            }
        }
    }
}`
  },

  // 7. Android Room Database Entity
  {
    path: "android/app/src/main/java/com/racha/app/data/local/StudyLogEntity.kt",
    name: "StudyLogEntity.kt",
    category: "Android Kotlin",
    content: `package com.racha.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "study_logs",
    indices = [Index(value = ["studyDate"], unique = true)]
)
data class StudyLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val studyDate: String, // YYYY-MM-DD
    val timestamp: Long = System.currentTimeMillis(),
    val durationMinutes: Int = 30,
    val note: String? = null
)`
  },

  // 8. Android Room DAO
  {
    path: "android/app/src/main/java/com/racha/app/data/local/StudyLogDao.kt",
    name: "StudyLogDao.kt",
    category: "Android Kotlin",
    content: `package com.racha.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface StudyLogDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertStudyDay(log: StudyLogEntity): Long

    @Query("SELECT EXISTS(SELECT 1 FROM study_logs WHERE studyDate = :dateStr)")
    suspend fun isDayStudied(dateStr: String): Boolean

    @Query("SELECT studyDate FROM study_logs ORDER BY studyDate DESC")
    suspend fun getAllStudyDates(): List<String>

    @Query("DELETE FROM study_logs WHERE studyDate = :dateStr")
    suspend fun deleteStudyDay(dateStr: String): Int

    @Query("SELECT COUNT(*) FROM study_logs")
    suspend fun getTotalDaysCount(): Int
}`
  },

  // 9. Android Room Database
  {
    path: "android/app/src/main/java/com/racha/app/data/local/RachaDatabase.kt",
    name: "RachaDatabase.kt",
    category: "Android Kotlin",
    content: `package com.racha.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [StudyLogEntity::class], version = 1, exportSchema = false)
abstract class RachaDatabase : RoomDatabase() {
    abstract fun studyLogDao(): StudyLogDao

    companion object {
        @Volatile
        private var INSTANCE: RachaDatabase? = null

        fun getInstance(context: Context): RachaDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    RachaDatabase::class.java,
                    "racha_study.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },

  // 10. Android StreakRepository
  {
    path: "android/app/src/main/java/com/racha/app/data/repository/StreakRepository.kt",
    name: "StreakRepository.kt",
    category: "Android Kotlin",
    content: `package com.racha.app.data.repository

import com.racha.app.data.local.StudyLogDao
import com.racha.app.data.local.StudyLogEntity
import java.time.LocalDate

class StreakRepository(private val dao: StudyLogDao) {
    suspend fun registerStudyToday(): Boolean {
        val todayStr = LocalDate.now().toString()
        val rowId = dao.insertStudyDay(StudyLogEntity(studyDate = todayStr))
        return rowId != -1L
    }

    suspend fun calculateCurrentStreak(): Int {
        val dates = dao.getAllStudyDates().toSet()
        val today = LocalDate.now()
        val yesterday = today.minusDays(1)
        var streak = 0
        var cursor: LocalDate? = null

        if (dates.contains(today.toString())) {
            cursor = today
        } else if (dates.contains(yesterday.toString())) {
            cursor = yesterday
        }

        if (cursor != null) {
            while (dates.contains(cursor.toString())) {
                streak++
                cursor = cursor?.minusDays(1)
            }
        }
        return streak
    }
}`
  },

  // 11. AndroidManifest.xml
  {
    path: "android/app/src/main/AndroidManifest.xml",
    name: "AndroidManifest.xml",
    category: "Configuración Gradle",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.VIBRATE" />
    <application
        android:allowBackup="true"
        android:icon="@android:drawable/star_big_on"
        android:label="RACHA"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  },

  // 12. build.gradle.kts
  {
    path: "android/app/build.gradle.kts",
    name: "build.gradle.kts",
    category: "Configuración Gradle",
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.racha.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.racha.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.2")

    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")
}`
  },

  // 13. README
  {
    path: "README_DATABASE_Y_PROYECTO.md",
    name: "README_DATABASE_Y_PROYECTO.md",
    category: "Documentación",
    content: `# RACHA - PROYECTO ANDROID Y SCRIPTS DE BASE DE DATOS
App en Kotlin Jetpack Compose, 100% offline, modo oscuro neón.

## Estructura
- database/schema.sql: Tablas SQLite (study_logs, streak_state, motivational_quotes) y triggers.
- database/control_queries.sql: Consultas para cálculo de racha y últimos 7 días.
- database/seed_data.sql: 20 frases motivacionales en español.
- database/db_controller.py: Script de gestión offline por terminal.
- android/: Proyecto completo para Android Studio con Room Database.`
  }
];
