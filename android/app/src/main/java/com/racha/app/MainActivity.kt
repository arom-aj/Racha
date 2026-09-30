package com.racha.app

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
