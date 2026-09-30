import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-2 text-xs font-medium text-slate-400 select-none">
      <span className="font-mono text-slate-300 font-semibold tracking-wide">
        {currentTime || '09:41'}
      </span>
      <div className="flex items-center gap-2">
        <Signal className="w-3.5 h-3.5 text-slate-400" />
        <Wifi className="w-3.5 h-3.5 text-slate-400" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-400">100%</span>
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
