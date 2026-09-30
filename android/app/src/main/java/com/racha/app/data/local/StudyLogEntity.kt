package com.racha.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Entidad Room para representar un día de estudio en la base de datos local SQLite de Android.
 */
@Entity(
    tableName = "study_logs",
    indices = [Index(value = ["studyDate"], unique = true)]
)
data class StudyLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val studyDate: String, // Formato ISO "YYYY-MM-DD"
    val timestamp: Long = System.currentTimeMillis(),
    val durationMinutes: Int = 30,
    val note: String? = null
)
