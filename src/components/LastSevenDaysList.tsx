import React from 'react';
import { Check, Minus, Calendar } from 'lucide-react';
import { DayStatus } from '../utils/streak';

interface LastSevenDaysListProps {
  days: DayStatus[];
  onToggleDay: (dateStr: string) => void;
}

export const LastSevenDaysList: React.FC<LastSevenDaysListProps> = ({ days, onToggleDay }) => {
  const completedCount = days.filter(d => d.studied).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-300 uppercase">
            Últimos 7 días
          </h2>
        </div>
        <span className="text-xs font-semibold text-emerald-400 font-mono">
          {completedCount}/7 cumplidos
        </span>
      </div>

      <div className="bg-[#0e1320] border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg divide-y divide-slate-800/60">
        {days.map((day) => {
          return (
            <div
              key={day.dateStr}
              onClick={() => onToggleDay(day.dateStr)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-slate-800/30 ${
                day.isToday ? 'bg-slate-800/20' : ''
              }`}
              title="Toca para marcar o desmarcar este día"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                    day.studied
                      ? 'bg-emerald-500/15 border border-emerald-400/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-400'
                  }`}
                >
                  {day.studied ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold tracking-wide ${
                        day.isToday
                          ? 'text-cyan-400 neon-text-cyan'
                          : day.studied
                          ? 'text-slate-100'
                          : 'text-slate-300'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/60">
                        Hoy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{day.shortDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {day.studied ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    Estudiado
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    {day.isToday ? 'Pendiente' : 'Sin registro'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 text-center mt-2">
        Tip: Puedes tocar cualquier día para actualizar tu registro si estudiaste ayer.
      </p>
    </div>
  );
};
