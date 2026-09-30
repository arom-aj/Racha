import React, { useState } from 'react';
import { Sparkles, RefreshCw, Quote } from 'lucide-react';
import { MotivationalQuote } from '../data/quotes';

interface MotivationalCardProps {
  quote: MotivationalQuote;
  onRefresh: () => void;
}

export const MotivationalCard: React.FC<MotivationalCardProps> = ({ quote, onRefresh }) => {
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    onRefresh();
    setTimeout(() => setIsRotating(false), 500);
  };

  return (
    <div
      onClick={handleRefresh}
      className="group relative w-full p-4 rounded-2xl bg-[#0d121c] border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
            Mensaje motivador
          </span>
        </div>

        <button
          onClick={handleRefresh}
          className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
          title="Ver otra frase motivacional"
          aria-label="Cambiar mensaje motivacional"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 transition-transform duration-500 ${
              isRotating ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </button>
      </div>

      {/* Quote Text */}
      <div className="flex items-start gap-2.5">
        <Quote className="w-5 h-5 text-cyan-400/40 shrink-0 rotate-180 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-100 leading-relaxed italic">
            "{quote.text}"
          </p>
          <p className="text-xs font-semibold text-cyan-400/80 text-right mt-1.5 tracking-wide">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
};
