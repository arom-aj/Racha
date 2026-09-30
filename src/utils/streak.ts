export interface DayStatus {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Hoy", "Ayer", or "Lun", "Mar", etc.
  fullDateLabel: string; // "Miércoles, 30 Sep"
  shortDate: string; // "30/09"
  studied: boolean;
  isToday: boolean;
  isYesterday: boolean;
}

export interface StreakState {
  currentStreak: number;
  recordStreak: number;
  totalDaysStudied: number;
  isStudiedToday: boolean;
  studiedDates: string[]; // List of YYYY-MM-DD
  last7Days: DayStatus[];
}

const STORAGE_KEY = 'racha_app_data';

export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // midday to avoid daylight savings jumps
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function calculateStreak(dates: string[]): { current: number; record: number } {
  if (dates.length === 0) return { current: 0, record: 0 };

  const uniqueSortedDates = Array.from(new Set(dates)).sort();
  const dateSet = new Set(uniqueSortedDates);

  const todayStr = formatDateToYMD(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToYMD(yesterday);

  // Calculate current streak
  let current = 0;
  let cursor = new Date();

  // If today is studied, count starting from today
  if (dateSet.has(todayStr)) {
    while (dateSet.has(formatDateToYMD(cursor))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else if (dateSet.has(yesterdayStr)) {
    // If today is not yet studied but yesterday was, streak is still active from yesterday
    cursor = yesterday;
    while (dateSet.has(formatDateToYMD(cursor))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else {
    // Both today and yesterday were missed
    current = 0;
  }

  // Calculate historical record streak
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of uniqueSortedDates) {
    const curDate = parseYMD(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = curDate;
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
  }

  return { current, record: Math.max(maxStreak, current) };
}

export function getLast7Days(studiedDates: Set<string>): DayStatus[] {
  const result: DayStatus[] = [];
  const today = new Date();
  const todayStr = formatDateToYMD(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToYMD(yesterday);

  // Generate 7 days: from 6 days ago up to today
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = formatDateToYMD(d);

    const isToday = dateStr === todayStr;
    const isYesterday = dateStr === yesterdayStr;

    let dayLabel = DAY_NAMES[d.getDay()];
    if (isToday) dayLabel = 'Hoy';
    else if (isYesterday) dayLabel = 'Ayer';

    const dayNameLong = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d.getDay()];
    const fullDateLabel = `${dayNameLong}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
    const shortDate = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;

    result.push({
      dateStr,
      dayLabel,
      fullDateLabel,
      shortDate,
      studied: studiedDates.has(dateStr),
      isToday,
      isYesterday,
    });
  }

  return result;
}

export function loadStreakState(): StreakState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    let dates: string[] = [];

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.studiedDates)) {
        dates = parsed.studiedDates;
      }
    }

    const dateSet = new Set(dates);
    const { current, record } = calculateStreak(dates);
    const todayStr = formatDateToYMD(new Date());

    return {
      currentStreak: current,
      recordStreak: record,
      totalDaysStudied: dateSet.size,
      isStudiedToday: dateSet.has(todayStr),
      studiedDates: dates,
      last7Days: getLast7Days(dateSet),
    };
  } catch {
    const emptySet = new Set<string>();
    return {
      currentStreak: 0,
      recordStreak: 0,
      totalDaysStudied: 0,
      isStudiedToday: false,
      studiedDates: [],
      last7Days: getLast7Days(emptySet),
    };
  }
}

export function saveStudyToday(): StreakState {
  const current = loadStreakState();
  const todayStr = formatDateToYMD(new Date());
  const dateSet = new Set(current.studiedDates);

  dateSet.add(todayStr);
  const updatedDates = Array.from(dateSet).sort();

  const { current: streak, record } = calculateStreak(updatedDates);
  const newState: StreakState = {
    currentStreak: streak,
    recordStreak: record,
    totalDaysStudied: updatedDates.length,
    isStudiedToday: true,
    studiedDates: updatedDates,
    last7Days: getLast7Days(dateSet),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
}

export function toggleStudyDay(dateStr: string): StreakState {
  const current = loadStreakState();
  const dateSet = new Set(current.studiedDates);

  if (dateSet.has(dateStr)) {
    dateSet.delete(dateStr);
  } else {
    dateSet.add(dateStr);
  }

  const updatedDates = Array.from(dateSet).sort();
  const { current: streak, record } = calculateStreak(updatedDates);
  const todayStr = formatDateToYMD(new Date());

  const newState: StreakState = {
    currentStreak: streak,
    recordStreak: record,
    totalDaysStudied: updatedDates.length,
    isStudiedToday: dateSet.has(todayStr),
    studiedDates: updatedDates,
    last7Days: getLast7Days(dateSet),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
}

export function resetAllData(): StreakState {
  localStorage.removeItem(STORAGE_KEY);
  return loadStreakState();
}

export function simulateStreak(daysCount: number): StreakState {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(formatDateToYMD(d));
  }

  const dateSet = new Set(dates);
  const { current, record } = calculateStreak(dates);
  const todayStr = formatDateToYMD(today);

  const newState: StreakState = {
    currentStreak: current,
    recordStreak: Math.max(record, daysCount),
    totalDaysStudied: dates.length,
    isStudiedToday: dateSet.has(todayStr),
    studiedDates: dates.sort(),
    last7Days: getLast7Days(dateSet),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
}
