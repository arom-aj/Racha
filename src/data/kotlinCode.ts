export interface KotlinFile {
  filename: string;
  path: string;
  description: string;
  code: string;
}

export const KOTLIN_PROJECT_FILES: KotlinFile[] = [
  {
    filename: "MainActivity.kt",
    path: "app/src/main/java/com/racha/app/MainActivity.kt",
    description: "Punto de entrada de la app Android con Jetpack Compose y tema oscuro neón",
    code: `package com.racha.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.racha.app.ui.RachaScreen

// Paleta de colores neón sobre fondo oscuro
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
}
`
  },
  {
    filename: "RachaScreen.kt",
    path: "app/src/main/java/com/racha/app/ui/RachaScreen.kt",
    description: "Pantalla única en Jetpack Compose con contador de racha, botón neón, lista de 7 días y frases motivacionales",
    code: `package com.racha.app.ui

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Brush
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

    // Fechas estudiadas guardadas localmente (sin internet, persistente en el dispositivo)
    var savedDates by remember {
        mutableStateOf(prefs.getStringSet("studied_dates", emptySet()) ?: emptySet())
    }

    val today = remember { LocalDate.now() }
    val todayStr = remember(today) { today.toString() }
    val isStudiedToday = remember(savedDates, todayStr) { savedDates.contains(todayStr) }

    // Frase motivacional aleatoria
    var currentQuote by remember { mutableStateOf(quotes.random()) }

    // Cálculo de racha consecutiva
    val currentStreak = remember(savedDates, today) {
        var streak = 0
        var cursor = today
        // Si hoy ya se marcó, contamos desde hoy
        if (savedDates.contains(today.toString())) {
            while (savedDates.contains(cursor.toString())) {
                streak++
                cursor = cursor.minusDays(1)
            }
        } else {
            // Si hoy no se marcó, verificamos si ayer se estudió
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

    // Últimos 7 días
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

    // Animación de pulso para el fuego
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
        // Encabezado
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

            // Indicador offline sin publicidad
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(NeonGreen)
                )
                Text(
                    text = "100% OFFLINE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted
                )
            }
        }

        // CONTADOR GRANDE DE DÍAS CONSECUTIVOS
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
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 28.dp, horizontal = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Icono de fuego neón animado
                Icon(
                    imageVector = Icons.Default.LocalFireDepartment,
                    contentDescription = "Fuego de Racha",
                    tint = NeonOrange,
                    modifier = Modifier
                        .size(56.dp)
                        .scale(flameScale)
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Número gigante
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

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = if (isStudiedToday) "¡Misión de hoy completada!" else "Falta estudiar hoy para mantener la racha",
                    fontSize = 13.sp,
                    color = if (isStudiedToday) NeonGreen else TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // BOTÓN «HOY SÍ ESTUDIÉ»
        Button(
            onClick = {
                // Vibración táctil
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE))
                }

                // Guardar en el teléfono
                val newDates = savedDates.toMutableSet().apply { add(todayStr) }
                savedDates = newDates
                prefs.edit().putStringSet("studied_dates", newDates).apply()

                // Cambiar frase motivacional
                currentQuote = quotes.filter { it.text != currentQuote.text }.random()
            },
            enabled = !isStudiedToday,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .shadow(
                    elevation = if (isStudiedToday) 0.dp else 18.dp,
                    spotColor = NeonGreen.copy(alpha = 0.6f),
                    shape = RoundedCornerShape(18.dp)
                ),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isStudiedToday) Color(0xFF1E293B) else NeonGreen,
                contentColor = if (isStudiedToday) TextMuted else Color.Black,
                disabledContainerColor = Color(0xFF131D24),
                disabledContentColor = NeonGreen
            ),
            shape = RoundedCornerShape(18.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                if (isStudiedToday) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Completado",
                        tint = NeonGreen,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "HOY YA ESTUDIASTE",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                        color = NeonGreen
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Estudiado",
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "HOY SÍ ESTUDIÉ",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.5.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // LISTA DE LOS ÚLTIMOS SIETE DÍAS
        Text(
            text = "ÚLTIMOS 7 DÍAS",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.5.sp,
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
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = day.dayName,
                                    fontSize = 15.sp,
                                    fontWeight = if (day.isToday) FontWeight.Bold else FontWeight.Medium,
                                    color = if (day.isToday) NeonCyan else Color.White
                                )
                                if (day.isToday) {
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "(hoy)",
                                        fontSize = 11.sp,
                                        color = NeonCyan
                                    )
                                }
                            }
                            Text(
                                text = day.dateText,
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }

                        // Estado visual: Neón verde si estudió, gris si no
                        if (day.isStudied) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(NeonGreen.copy(alpha = 0.15f))
                                    .border(1.5.dp, NeonGreen, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Estudiado",
                                    tint = NeonGreen,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF1E293B))
                                    .border(1.dp, Color(0xFF334155), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "—",
                                    fontSize = 16.sp,
                                    color = Color(0xFF64748B)
                                )
                            }
                        }
                    }

                    if (index < lastSevenDays.lastIndex) {
                        Divider(
                            color = Color(0xFF1E293B),
                            thickness = 0.8.dp,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // MENSAJE MOTIVADOR DISTINTO CADA VEZ
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
                .clickable {
                    currentQuote = quotes.filter { it.text != currentQuote.text }.random()
                },
            colors = CardDefaults.cardColors(containerColor = CardSurface),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, NeonCyan.copy(alpha = 0.3f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "MENSAJE DEL DÍA",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp,
                        color = NeonCyan
                    )
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Cambiar frase",
                        tint = NeonCyan,
                        modifier = Modifier.size(16.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "“\${currentQuote.text}”",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White,
                    lineHeight = 20.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "— \${currentQuote.author}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextMuted,
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}
`
  },
  {
    filename: "build.gradle.kts",
    path: "app/build.gradle.kts",
    description: "Configuración de dependencias de Jetpack Compose y Material 3 para Android Studio",
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
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

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.material.icons.extended)
}
`
  }
];
