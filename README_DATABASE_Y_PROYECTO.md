# 📱 RACHA - PROYECTO ANDROID JETPACK COMPOSE & SCRIPTS DE BASE DE DATOS

Aplicación Android en **Kotlin** con **Jetpack Compose** y **Material 3** en modo oscuro neón para el seguimiento de rachas de estudio diarias. 100% Offline, sin anuncios y sin dependencias externas.

---

## 📁 ESTRUCTURA DEL PROYECTO

```text
├── android/                             # PROYECTO NATIVO ANDROID STUDIO (KOTLIN)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml      # Manifiesto sin permisos de red
│   │   │   └── java/com/racha/app/
│   │   │       ├── MainActivity.kt      # Entrada con Jetpack Compose y tema neón
│   │   │       ├── ui/
│   │   │       │   └── RachaScreen.kt   # Pantalla única de racha, botón neón y 7 días
│   │   │       └── data/
│   │   │           ├── local/
│   │   │           │   ├── StudyLogEntity.kt   # Entidad Room Database
│   │   │           │   ├── StudyLogDao.kt      # DAO con consultas SQL
│   │   │           │   └── RachaDatabase.kt    # Base de datos local SQLite/Room
│   │   │           └── repository/
│   │   │               └── StreakRepository.kt # Lógica de control de racha
│   │   └── build.gradle.kts             # Dependencias de Compose, Room y Coroutines
│   ├── build.gradle.kts
│   └── settings.gradle.kts
│
├── database/                            # SCRIPTS DE BASE DE DATOS Y CONTROL
│   ├── schema.sql                       # DDL completo de creación de tablas y triggers
│   ├── seed_data.sql                    # Frases motivacionales en español y datos iniciales
│   ├── control_queries.sql              # Consultas SQL para control de datos y cálculo de racha
│   └── db_controller.py                 # Script CLI en Python para gestionar la BD offline
│
├── src/                                 # APLICACIÓN INTERACTIVA WEB / PWA
│   ├── App.tsx
│   ├── components/
│   └── utils/
│
└── racha-proyecto-completo.zip          # ARCHIVO ZIP CON TODO EL PROYECTO COMPLETO
```

---

## 🗄️ SCRIPTS DE BASE DE DATOS Y CONTROL DE DATOS

### 1. `database/schema.sql` (Creación de Tablas)
- **`study_logs`**: Guarda cada día de estudio con restricción `UNIQUE` en la fecha (`YYYY-MM-DD`).
- **`streak_state`**: Almacena el estado persistente de la racha actual, el récord máximo y el total de días.
- **`motivational_quotes`**: Almacena las frases motivacionales clasificadas por categoría.
- **`Triggers`**:
  - `trg_after_study_insert`: Actualiza automáticamente las estadísticas al registrar un día.
  - `trg_after_study_delete`: Recalcula el total al deshacer un día.

### 2. `database/control_queries.sql` (Consultas y Lógica de Datos)
- **Registrar estudio de hoy**: `INSERT OR IGNORE INTO study_logs (study_date) VALUES (DATE('now', 'localtime'))`
- **Deshacer estudio de hoy**: `DELETE FROM study_logs WHERE study_date = DATE('now', 'localtime')`
- **Consultar los últimos 7 días con CTE recursiva**: Genera los últimos 7 días y determina si fueron estudiados o no.
- **Cálculo de racha consecutiva**: Algoritmo SQL recursivo que cuenta días consecutivos hacia atrás.

### 3. `database/db_controller.py` (Script de Control por Terminal)
Puedes ejecutar directamente en tu terminal:
```bash
# Inicializar la base de datos SQLite 'racha.db' y cargar frases:
python3 database/db_controller.py init

# Marcar que hoy sí estudiaste:
python3 database/db_controller.py estudiar

# Ver el estado actual de tu racha:
python3 database/db_controller.py estado

# Ver la lista de los últimos 7 días:
python3 database/db_controller.py ultimos7

# Obtener una frase motivacional aleatoria:
python3 database/db_controller.py frase

# Simular una racha de 7 días para pruebas:
python3 database/db_controller.py simular 7

# Exportar copia de seguridad en JSON:
python3 database/db_controller.py exportar
```

---

## 🚀 CÓMO ABRIR EN ANDROID STUDIO

1. Descomprime el archivo **`racha-proyecto-completo.zip`**.
2. Abre **Android Studio** (Koala, Ladybug o superior).
3. Selecciona **Open** y elige la carpeta `android/`.
4. Espera que Gradle sincronice las dependencias (Jetpack Compose y Room Database).
5. Conecta tu teléfono Android o inicia un emulador y haz clic en **Run (▶)**.
