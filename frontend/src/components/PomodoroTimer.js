import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, Coffee, X, Brain } from 'lucide-react';
import api from '../api/axios';

const MODES = {
  focus: { label: 'Odak',  seconds: 25 * 60, color: 'text-indigo-400', bg: 'bg-indigo-500' },
  short: { label: 'Kısa Mola', seconds: 5 * 60,  color: 'text-emerald-400', bg: 'bg-emerald-500' },
  long:  { label: 'Uzun Mola', seconds: 15 * 60, color: 'text-orange-400',  bg: 'bg-orange-500' },
};

export default function PomodoroTimer({ userId, topicId }) {
  const [mode, setMode]         = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.seconds);
  const [running, setRunning]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [sessions, setSessions] = useState(0);
  const [aiTip, setAiTip]       = useState('');
  const startRef  = useRef(null);
  const intervalRef = useRef(null);

  // Mod değişince sıfırla
  useEffect(() => {
    setTimeLeft(MODES[mode].seconds);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleComplete = async () => {
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    if (elapsed < 60 || mode !== 'focus') return; // 1 dakikadan kısa = kaydetme

    try {
      await api.post('/api/study-sessions', {
        userId, topicId: topicId || null,
        durationSeconds: elapsed,
        sessionType: 'POMODORO', completed: true
      });
      setSessions(s => s + 1);

      // AI ipucunu çek
      const statsRes = await api.get(`/api/study-sessions/user/${userId}/stats`);
      if (statsRes.data.aiTip) setAiTip(statsRes.data.aiTip);
    } catch (_) {}
  };

  const handleStop = async () => {
    if (!running) return;
    clearInterval(intervalRef.current);
    setRunning(false);
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    if (elapsed >= 60 && mode === 'focus') {
      try {
        await api.post('/api/study-sessions', {
          userId, topicId: topicId || null,
          durationSeconds: elapsed,
          sessionType: 'POMODORO', completed: false
        });
      } catch (_) {}
    }
    setTimeLeft(MODES[mode].seconds);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = ((MODES[mode].seconds - timeLeft) / MODES[mode].seconds) * 100;
  const m = MODES[mode];

  return (
    <>
      {/* Küçük floating buton */}
      <button onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all
          ${running ? 'bg-indigo-600 animate-pulse' : 'bg-[#1a2540] hover:bg-indigo-700'}`}>
        <Timer size={22} className="text-white" />
        {sessions > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {sessions}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-72 bg-[#1a2540] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Başlık */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-orange-400" />
              <span className="text-white text-sm font-bold">Pomodoro</span>
              {sessions > 0 && (
                <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {sessions} seans
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition">
              <X size={16} />
            </button>
          </div>

          {/* Mod seçici */}
          <div className="flex gap-1 px-4 pt-4">
            {Object.entries(MODES).map(([key, val]) => (
              <button key={key} onClick={() => setMode(key)}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition
                  ${mode === key ? `${val.bg} text-white` : 'text-slate-400 hover:text-white'}`}>
                {val.label}
              </button>
            ))}
          </div>

          {/* Zamanlayıcı */}
          <div className="px-5 py-6 text-center">
            {/* Çember progress */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={mode === 'focus' ? '#6366f1' : mode === 'short' ? '#10b981' : '#f97316'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold font-mono ${m.color}`}>{fmt(timeLeft)}</span>
                <span className="text-slate-400 text-[10px] mt-0.5">{m.label}</span>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-3 justify-center">
              <button onClick={() => setRunning(r => !r)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition
                  ${running ? 'bg-yellow-500 hover:bg-yellow-600' : `${m.bg} hover:opacity-90`}`}>
                {running ? <><Pause size={15} /> Duraklat</> : <><Play size={15} /> Başlat</>}
              </button>
              {running && (
                <button onClick={handleStop}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* AI ipucu */}
          {aiTip && (
            <div className="mx-4 mb-4 bg-indigo-500/10 border border-indigo-400/20 rounded-xl p-3">
              <p className="text-indigo-300 text-[10px] font-bold mb-1 flex items-center gap-1">
                <Brain size={10} /> AI Analiz
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">{aiTip}</p>
            </div>
          )}

          {/* Mola öneri */}
          {!running && sessions > 0 && sessions % 4 === 0 && mode === 'focus' && (
            <div className="mx-4 mb-4 bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3 flex items-center gap-2">
              <Coffee size={14} className="text-emerald-400 shrink-0" />
              <p className="text-emerald-300 text-[11px]">4 seans tamamlandı! Uzun mola zamanı.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
