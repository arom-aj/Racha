package com.racha.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

/**
 * Base de Datos Room (SQLite) local de la aplicación RACHA.
 * Funciona 100% Offline en el almacenamiento interno privado del teléfono.
 */
@Database(
    entities = [StudyLogEntity::class],
    version = 1,
    exportSchema = false
)
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
}
