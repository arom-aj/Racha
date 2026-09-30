/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  CheckCircle2,
  Trophy,
  Volume2,
  VolumeX,
  Code2,
  Undo2,
  Info,
  Check,
  Zap,
  RotateCcw,
  Database,
  Download,
  FolderArchive
} from 'lucide-react';
import {
  loadStreakState,
  saveStudyToday,
  toggleStudyDay,
  resetAllData,
  simulateStreak,
  StreakState
} from './utils/streak';
import { getRandomQuote, MotivationalQuote } from './data/quotes';
import { sounds } from './utils/sound';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { LastSevenDaysList } from './components/LastSevenDaysList';
import { MotivationalCard } from './components/MotivationalCard';
import { KotlinCodeModal } from './components/KotlinCodeModal';
import { DatabaseScriptsModal } from './components/DatabaseScriptsModal';
import { ProjectPackageModal } from './components/ProjectPackageModal';
import { downloadFullProjectZip } from './utils/zipDownloader';

export default function App() {
  const [streakState, setStreakState] = useState<StreakState>(() => loadStreakState());
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(() => getRandomQuote());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showKotlinModal, setShowKotlinModal] = useState<boolean>(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState<boolean>(false);
  const [showPackageModal, setShowPackageModal] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [justMarked, setJustMarked] = useState<boolean>(false);

  // Sync state on mount and reload
  useEffect(() => {
    setStreakState(loadStreakState());
  }, []);

  const handleDownloadZip = async () => {
    if (soundEnabled) sounds.playTap();
    setIsDownloadingZip(true);
    try {
      await downloadFullProjectZip();
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const triggerCelebration = useCallback(() => {
    // Sound
    if (soundEnabled) {
      sounds.playSuccess();
    }

    // Haptic vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 100]);
    }

    // Neon Confetti Burst (emerald, orange, cyan)
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#00ff88', '#ff6a00', '#00e5ff', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      // Confetti failover safely
    }
  }, [soundEnabled]);

  const handleStudyToday = () => {
    if (streakState.isStudiedToday) return;

    if (soundEnabled) {
      sounds.playTap();
    }

    const updated = saveStudyToday();
    setStreakState(updated);
    setJustMarked(true);
    triggerCelebration();

    // Select a fresh motivational quote
    const nextQuote = getRandomQuote(currentQuote.id);
    setCurrentQuote(nextQuote);

    setTimeout(() => setJustMarked(false), 2500);
  };

  const handleToggleDay = (dateStr: string) => {
    if (soundEnabled) {
      sounds.playTap();
    }
    const updated = toggleStudyDay(dateStr);
    setStreakState(updated);
  };

  const handleRotateQuote = () => {
    if (soundEnabled) {
      sounds.playWhoosh();
    }
    const next = getRandomQuote(currentQuote.id);
    setCurrentQuote(next);
  };

  const handleReset = () => {
    if (soundEnabled) sounds.playTap();
    if (window.confirm('¿Deseas reiniciar la racha a 0?')) {
      const updated = resetAllData();
      setStreakState(updated);
    }
  };

  const handleSimulate = (days: number) => {
    if (soundEnabled) sounds.playTap();
    const updated = simulateStreak(days);
    setStreakState(updated);
    triggerCelebration();
  };

  // Dynamic streak title & flame glow
  const streak = streakState.currentStreak;
  const isHighStreak = streak >= 7;
  const isBlazing = streak >= 14;

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col items-center justify-start selection:bg-emerald-500 selection:text-black">
      {/* Mobile container - looks and behaves like an authentic Android AMOLED device */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#07090f] shadow-[0_0_60px_rgba(0,0,0,0.8)] border-x border-slate-900/60 pb-8">
        
        {/* Android Native Status Bar */}
        <AndroidStatusBar />

        {/* Top App Bar */}
        <header className="px-5 py-3 flex items-center justify-between border-b border-slate-800/60 bg-[#080c14]/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <Flame className="w-5 h-5 text-orange-400 fill-orange-500/30 animate-flame" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white flex items-center gap-1.5 font-mono">
                RACHA
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  100% Offline · Sin Anuncios
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {/* Download Full Project ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/70 transition-all text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
              title="Descargar todo el proyecto en archivo .ZIP (Kotlin, Base de Datos y Web)"
            >
              {isDownloadingZip ? (
                <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">ZIP</span>
            </button>

            {/* View Database Scripts */}
            <button
              onClick={() => {
                if (soundEnabled) sounds.playTap();
                setShowDatabaseModal(true);
              }}
              className="p-1.5 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 border border-slate-700/60 transition-colors"
              title="Ver scripts SQL y control de base de datos"
              aria-label="Base de datos"
            >
              <Database className="w-4 h-4 text-emerald-400" />
            </button>

            {/* View Native Android Kotlin Jetpack Compose Code */}
            <button
              onClick={() => {
                if (soundEnabled) sounds.playTap();
                setShowKotlinModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 transition-all text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              title="Ver código nativo Android en Kotlin (Jetpack Compose)"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">Kotlin</span>
            </button>

            {/* Toggle Sound */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) sounds.playTap();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
              aria-label="Alternar sonido"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-5 pt-4 pb-2 flex flex-col gap-5">

          {/* 1. CONTADOR GRANDE DE DÍAS CONSECUTIVOS */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0f1422] to-[#0a0d16] border border-orange-500/25 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.6)] text-center">
            
            {/* Background ambient glow */}
            <div
              className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none transition-all duration-700 ${
                isBlazing
                  ? 'bg-orange-500/25 blur-3xl'
                  : isHighStreak
                  ? 'bg-amber-500/20 blur-3xl'
                  : streak > 0
                  ? 'bg-emerald-500/15 blur-3xl'
                  : 'bg-slate-800/20 blur-3xl'
              }`}
            />

            {/* Flame Icon with Dynamic Scale and Color */}
            <div className="relative inline-flex items-center justify-center mb-1">
              <div
                className={`relative p-3 rounded-2xl transition-all duration-300 ${
                  streak > 0
                    ? 'bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.35)]'
                    : 'bg-slate-800/40 border border-slate-700/40 text-slate-500'
                }`}
              >
                <Flame
                  className={`transition-all duration-300 ${
                    isBlazing
                      ? 'w-14 h-14 text-orange-400 fill-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.9)] animate-flame'
                      : isHighStreak
                      ? 'w-12 h-12 text-amber-400 fill-amber-500/80 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-flame'
                      : streak > 0
                      ? 'w-11 h-11 text-emerald-400 fill-emerald-500/40 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
                      : 'w-10 h-10 text-slate-600'
                  }`}
                />
              </div>

              {streak >= 3 && (
                <div className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-orange-600 text-[10px] font-black tracking-wider text-white shadow-md border border-orange-400/50 uppercase">
                  {streak >= 7 ? '¡En Fuego!' : 'Activo'}
                </div>
              )}
            </div>

            {/* Massive Consecutive Days Counter */}
            <div className="mt-2 flex flex-col items-center">
              <span
                className={`text-8xl sm:text-9xl font-black font-mono tracking-tighter transition-all duration-300 leading-none ${
                  streak > 0
                    ? isHighStreak
                      ? 'text-orange-400 neon-text-orange'
                      : 'text-emerald-400 neon-text-green'
                    : 'text-slate-600'
                }`}
              >
                {streak}
              </span>

              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-slate-300 mt-2">
                {streak === 1 ? 'Día Consecutivo' : 'Días Consecutivos'}
              </span>
            </div>

            {/* Status indicator line */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Récord: <strong className="text-slate-200 font-mono">{streakState.recordStreak}</strong> días
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Total: <strong className="text-slate-200 font-mono">{streakState.totalDaysStudied}</strong> días
                </span>
              </div>
            </div>
          </section>

          {/* 2. BOTÓN «HOY SÍ ESTUDIÉ» */}
          <section className="w-full">
            {!streakState.isStudiedToday ? (
              <button
                onClick={handleStudyToday}
                className="group relative w-full h-18 rounded-2xl bg-gradient-to-r from-[#00ff88] via-[#05ffa1] to-[#00df73] hover:from-[#15ff92] hover:to-[#00f57e] active:scale-[0.98] text-slate-950 font-black text-xl tracking-wider uppercase transition-all duration-150 shadow-[0_0_30px_rgba(0,255,136,0.45)] hover:shadow-[0_0_45px_rgba(0,255,136,0.65)] flex items-center justify-center gap-3 cursor-pointer select-none"
              >
                <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center">
                  <Check className="w-5 h-5 text-black stroke-[3.5]" />
                </div>
                <span>Hoy sí estudié</span>
                <span className="absolute -top-2 right-4 text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-emerald-400/40 uppercase shadow-md">
                  +1 Día
                </span>
              </button>
            ) : (
              <div className="relative w-full rounded-2xl bg-[#0d1618] border border-emerald-500/40 p-4 shadow-[0_0_25px_rgba(16,185,129,0.2)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-300 tracking-wide uppercase">
                        ¡Hoy ya estudiaste!
                      </p>
                      <p className="text-xs text-slate-400">
                        {justMarked ? '¡Racha actualizada con éxito!' : 'Misión diaria cumplida'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      handleToggleDay(todayStr);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Deshacer registro de hoy"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 3. MENSAJE MOTIVADOR DISTINTO CADA VEZ */}
          <MotivationalCard
            quote={currentQuote}
            onRefresh={handleRotateQuote}
          />

          {/* 4. LISTA DE LOS ÚLTIMOS SIETE DÍAS */}
          <LastSevenDaysList
            days={streakState.last7Days}
            onToggleDay={handleToggleDay}
          />

          {/* Download ZIP Callout Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-cyan-950/30 to-slate-900 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <FolderArchive className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  Proyecto Completo en ZIP
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    .ZIP
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Android Jetpack Compose + Scripts SQL SQLite
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (soundEnabled) sounds.playTap();
                  setShowPackageModal(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Ver archivos
              </button>

              <a
                href="/racha-proyecto-completo.zip"
                download="racha-proyecto-completo.zip"
                onClick={handleDownloadZip}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1 transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>{isDownloadingZip ? 'Descargando...' : 'Bajar ZIP'}</span>
              </a>
            </div>
          </div>

          {/* Simulation & Reset Drawer (collapsible tools for testing) */}
          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 py-1 px-2"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Herramientas de simulación y pruebas
              </span>
              <span className="text-[10px] font-mono text-cyan-400 underline">
                {showSimulator ? 'Ocultar' : 'Mostrar'}
              </span>
            </button>

            {showSimulator && (
              <div className="mt-2 p-3 rounded-xl bg-[#090d18] border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px] w-full mb-1">
                  Prueba la app simulando rachas previas:
                </span>
                <button
                  onClick={() => handleSimulate(3)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Simular 3 días
                </button>
                <button
                  onClick={() => handleSimulate(7)}
                  className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold"
                >
                  Simular 7 días
                </button>
                <button
                  onClick={() => handleSimulate(14)}
                  className="px-2.5 py-1 rounded bg-orange-950 hover:bg-orange-900 text-orange-300 border border-orange-800 text-xs font-semibold"
                >
                  Simular 14 días
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1 ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reiniciar
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer info */}
        <footer className="px-5 pt-2 text-center text-[11px] text-slate-400">
          <p>
            RACHA · Guarda tus días en tu dispositivo · Sin conexión · Sin publicidad
          </p>
        </footer>
      </div>

      {/* Kotlin Code Inspector Modal */}
      <KotlinCodeModal
        isOpen={showKotlinModal}
        onClose={() => setShowKotlinModal(false)}
      />

      {/* Database Scripts & Data Control Modal */}
      <DatabaseScriptsModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
      />

      {/* Complete Project ZIP & Files Explorer Modal */}
      <ProjectPackageModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
      />
    </div>
  );
}
