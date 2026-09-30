package com.racha.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object (DAO) para interactuar con la tabla de estudios en SQLite/Room.
 */
@Dao
interface StudyLogDao {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertStudyDay(log: StudyLogEntity): Long

    @Query("SELECT EXISTS(SELECT 1 FROM study_logs WHERE studyDate = :dateStr)")
    suspend fun isDayStudied(dateStr: String): Boolean

    @Query("SELECT EXISTS(SELECT 1 FROM study_logs WHERE studyDate = :dateStr)")
    fun observeIsDayStudied(dateStr: String): Flow<Boolean>

    @Query("SELECT studyDate FROM study_logs ORDER BY studyDate DESC")
    suspend fun getAllStudyDates(): List<String>

    @Query("SELECT studyDate FROM study_logs ORDER BY studyDate DESC")
    fun observeAllStudyDates(): Flow<List<String>>

    @Query("SELECT * FROM study_logs WHERE studyDate IN (:dates)")
    suspend fun getLogsForDates(dates: List<String>): List<StudyLogEntity>

    @Query("DELETE FROM study_logs WHERE studyDate = :dateStr")
    suspend fun deleteStudyDay(dateStr: String): Int

    @Query("SELECT COUNT(*) FROM study_logs")
    suspend fun getTotalDaysCount(): Int

    @Query("DELETE FROM study_logs")
    suspend fun clearAll()
}
