package com.racha.app.data.repository

import com.racha.app.data.local.StudyLogDao
import com.racha.app.data.local.StudyLogEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate

data class StreakInfo(
    val currentStreak: Int,
    val totalDays: Int,
    val isStudiedToday: Boolean
)

data class DayStatusItem(
    val date: LocalDate,
    val dayLabel: String,
    val shortDate: String,
    val isStudied: Boolean,
    val isToday: Boolean
)

/**
 * Repositorio de control y lógica de datos de Racha.
 */
class StreakRepository(private val dao: StudyLogDao) {

    val allDatesFlow: Flow<List<String>> = dao.observeAllStudyDates()

    suspend fun registerStudyToday(): Boolean {
        val todayStr = LocalDate.now().toString()
        val rowId = dao.insertStudyDay(StudyLogEntity(studyDate = todayStr))
        return rowId != -1L
    }

    suspend fun undoStudyToday() {
        val todayStr = LocalDate.now().toString()
        dao.deleteStudyDay(todayStr)
    }

    suspend fun toggleDay(dateStr: String) {
        val exists = dao.isDayStudied(dateStr)
        if (exists) {
            dao.deleteStudyDay(dateStr)
        } else {
            dao.insertStudyDay(StudyLogEntity(studyDate = dateStr))
        }
    }

    suspend fun calculateStreak(): StreakInfo {
        val dates = dao.getAllStudyDates().toSet()
        val today = LocalDate.now()
        val yesterday = today.minusDays(1)
        val todayStr = today.toString()
        val yesterdayStr = yesterday.toString()

        val isStudiedToday = dates.contains(todayStr)
        var streak = 0
        var cursor: LocalDate? = null

        if (isStudiedToday) {
            cursor = today
        } else if (dates.contains(yesterdayStr)) {
            cursor = yesterday
        }

        if (cursor != null) {
            while (dates.contains(cursor.toString())) {
                streak++
                cursor = cursor?.minusDays(1)
            }
        }

        val total = dao.getTotalDaysCount()
        return StreakInfo(currentStreak = streak, totalDays = total, isStudiedToday = isStudiedToday)
    }

    suspend fun getLastSevenDays(): List<DayStatusItem> {
        val today = LocalDate.now()
        val dates = dao.getAllStudyDates().toSet()

        return (6 downTo 0).map { offset ->
            val date = today.minusDays(offset.toLong())
            val dateStr = date.toString()
            val isToday = (offset == 0)
            val isYesterday = (offset == 1)

            val dayLabel = when {
                isToday -> "Hoy"
                isYesterday -> "Ayer"
                else -> when (date.dayOfWeek.value) {
                    1 -> "Lun"
                    2 -> "Mar"
                    3 -> "Mié"
                    4 -> "Jue"
                    5 -> "Vie"
                    6 -> "Sáb"
                    else -> "Dom"
                }
            }

            DayStatusItem(
                date = date,
                dayLabel = dayLabel,
                shortDate = "${date.dayOfMonth}/${date.monthValue}",
                isStudied = dates.contains(dateStr),
                isToday = isToday
            )
        }
    }

    suspend fun resetAll() {
        dao.clearAll()
    }
}
