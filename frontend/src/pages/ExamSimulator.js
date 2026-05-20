import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Clock, ChevronRight, ChevronLeft, Flag,
  CheckCircle, AlertCircle, Brain, BarChart3,
  X, BookOpen, Pin, Sun, Moon
} from 'lucide-react';

/* ─── Ders sırası ──────────────────────────────────────────────── */
const SUBJECT_ORDER = {
  TYT:  ['Türkçe','Tarih','Coğrafya','Felsefe','Din Kültürü','Matematik','Fizik','Kimya','Biyoloji'],
  AYT:  ['Türk Dili ve Edebiyatı','Tarih','Coğrafya','Felsefe','Din Kültürü','Matematik','Fizik','Kimya','Biyoloji'],
  KPSS: ['Türkçe','Tarih','Coğrafya','Vatandaşlık','Matematik'],
  DEFAULT: ['Türkçe','Türk Dili ve Edebiyatı','Matematik','Tarih','Coğrafya','Felsefe','Din Kültürü','Fizik','Kimya','Biyoloji','Vatandaşlık'],
};

function detectExamType(title = '') {
  const t = title.toUpperCase();
  if (t.includes('KPSS')) return 'KPSS';
  if (t.includes('AYT'))  return 'AYT';
  return 'TYT';
}

function sortBySubject(questions, examType) {
  const order = SUBJECT_ORDER[examType] || SUBJECT_ORDER.DEFAULT;
  return [...questions].sort((a, b) => {
    const ai = order.indexOf(a.subject);
    const bi = order.indexOf(b.subject);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

/* ─── Ders renkleri ────────────────────────────────────────────── */
const SUBJECT_COLORS = {
  'Türkçe':                 { dot: 'bg-blue-400',    badge: 'bg-blue-500/20 text-blue-300',    jump: 'hover:bg-blue-500/30'    },
  'Türk Dili ve Edebiyatı': { dot: 'bg-blue-400',    badge: 'bg-blue-500/20 text-blue-300',    jump: 'hover:bg-blue-500/30'    },
  'Matematik':              { dot: 'bg-orange-400',  badge: 'bg-orange-500/20 text-orange-300', jump: 'hover:bg-orange-500/30'  },
  'Tarih':                  { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-300', jump: 'hover:bg-yellow-500/30'  },
  'Coğrafya':               { dot: 'bg-green-400',   badge: 'bg-green-500/20 text-green-300',   jump: 'hover:bg-green-500/30'   },
  'Felsefe':                { dot: 'bg-purple-400',  badge: 'bg-purple-500/20 text-purple-300', jump: 'hover:bg-purple-500/30'  },
  'Din Kültürü':            { dot: 'bg-teal-400',    badge: 'bg-teal-500/20 text-teal-300',     jump: 'hover:bg-teal-500/30'    },
  'Fizik':                  { dot: 'bg-red-400',     badge: 'bg-red-500/20 text-red-300',       jump: 'hover:bg-red-500/30'     },
  'Kimya':                  { dot: 'bg-pink-400',    badge: 'bg-pink-500/20 text-pink-300',     jump: 'hover:bg-pink-500/30'    },
  'Biyoloji':               { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', jump: 'hover:bg-emerald-500/30'},
  'Vatandaşlık':            { dot: 'bg-cyan-400',    badge: 'bg-cyan-500/20 text-cyan-300',     jump: 'hover:bg-cyan-500/30'    },
};
const DEFAULT_COLOR = { dot: 'bg-slate-400', badge: 'bg-slate-500/20 text-slate-300', jump: 'hover:bg-slate-500/30' };

/* ─── Tema token tablosu ───────────────────────────────────────── */
const THEME = {
  dark: {
    root:          'bg-[#0f1729]',
    topbar:        'bg-[#1a2540] border-b border-white/10 shadow-lg',
    tabbar:        'bg-[#131e35] border-b border-white/10',
    sidebar:       'bg-[#1a2540] border-r border-white/10',
    sectionBorder: 'border-b border-white/5',
    statBorder:    'border-t border-white/10',
    card:          'bg-[#1a2540] border border-white/10',
    optionBase:    'border-2 border-white/10 bg-[#1a2540] hover:border-white/30 hover:bg-[#243056]',
    optionSel:     'border-2 border-orange-400 bg-orange-500/10',
    textTitle:     'text-white',
    textSub:       'text-slate-400',
    textMuted:     'text-slate-500',
    textQ:         'text-white font-medium',
    textOpt:       'text-slate-300',
    textOptSel:    'text-white',
    letterBase:    'bg-white/10 text-slate-300',
    letterSel:     'bg-orange-500 text-white',
    gridEmpty:     'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white',
    gridDone:      'bg-emerald-500/70 text-white',
    gridMarked:    'bg-yellow-400/90 text-slate-900',
    gridActive:    'bg-orange-500 text-white ring-2 ring-orange-300 scale-110',
    themeBtn:      'bg-white/10 text-yellow-300 hover:bg-white/20',
    timeNormal:    'bg-white/10 text-white',
    timerText:     'text-orange-400',
    btnPrev:       'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white',
    btnNext:       'bg-orange-500 hover:bg-orange-600 text-white',
    btnFinish:     'bg-emerald-500 hover:bg-emerald-600 text-white',
    btnMark:       'bg-white/5 text-slate-500 hover:text-yellow-300 hover:bg-yellow-400/10',
    btnMarkOn:     'bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/40',
    btnDel:        'bg-white/5 text-slate-500 hover:text-slate-300',
    subjectDot:    (sc) => sc.dot.replace('bg-','text-'),
    tabActive:     (sc) => `${sc.badge} ring-1 ring-white/20`,
    tabInactive:   (sc) => `bg-white/5 text-slate-400 ${sc.jump}`,
    tabCount:      'text-slate-500',
    tabCountDone:  'text-emerald-400',
  },
  light: {
    root:          'bg-slate-100',
    topbar:        'bg-white border-b border-slate-200 shadow-md',
    tabbar:        'bg-slate-50 border-b border-slate-200',
    sidebar:       'bg-white border-r border-slate-200',
    sectionBorder: 'border-b border-slate-100',
    statBorder:    'border-t border-slate-200',
    card:          'bg-white border border-slate-200 shadow-sm',
    optionBase:    'border-2 border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30',
    optionSel:     'border-2 border-orange-400 bg-orange-50',
    textTitle:     'text-slate-800',
    textSub:       'text-slate-500',
    textMuted:     'text-slate-400',
    textQ:         'text-slate-800 font-medium',
    textOpt:       'text-slate-600',
    textOptSel:    'text-slate-900',
    letterBase:    'bg-slate-100 text-slate-600',
    letterSel:     'bg-orange-500 text-white',
    gridEmpty:     'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700',
    gridDone:      'bg-emerald-500 text-white',
    gridMarked:    'bg-yellow-400 text-slate-900',
    gridActive:    'bg-orange-500 text-white ring-2 ring-orange-300 scale-110',
    themeBtn:      'bg-slate-100 text-slate-700 hover:bg-slate-200',
    timeNormal:    'bg-slate-100 text-slate-800',
    timerText:     'text-orange-500',
    btnPrev:       'bg-slate-100 text-slate-600 hover:bg-slate-200',
    btnNext:       'bg-orange-500 hover:bg-orange-600 text-white',
    btnFinish:     'bg-emerald-500 hover:bg-emerald-600 text-white',
    btnMark:       'bg-slate-100 text-slate-500 hover:text-yellow-700 hover:bg-yellow-50',
    btnMarkOn:     'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300',
    btnDel:        'bg-slate-100 text-slate-500 hover:text-slate-700',
    subjectDot:    (sc) => sc.dot.replace('bg-','text-'),
    tabActive:     (sc) => `bg-white border border-slate-300 ${sc.dot.replace('bg-','text-')} shadow-sm`,
    tabInactive:   (_)  => 'bg-transparent text-slate-500 hover:bg-slate-200',
    tabCount:      'text-slate-400',
    tabCountDone:  'text-emerald-600',
  },
};

/* ═══════════════════════════════════════════════════════════════ */
export default function ExamSimulator() {
  const { examId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [exam, setExam]         = useState(null);
  const [questions, setQ]       = useState([]);
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});
  const [marked, setMarked]     = useState(new Set());
  const [timeLeft, setTime]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [finished, setFinished] = useState(false);
  const [result, setResult]     = useState(null);
  const [isDark, setIsDark]     = useState(true);   // ← Tema state'i

  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  const T = isDark ? THEME.dark : THEME.light;      // ← Aktif tema token'ı

  const toggleMark = () =>
    setMarked(prev => { const n = new Set(prev); n.has(current) ? n.delete(current) : n.add(current); return n; });

  /* ── Veri çek ── */
  useEffect(() => {
    Promise.all([
      api.get(`/api/practice-exams/${examId}`),
      api.get(`/api/practice-exams/${examId}/questions`),
    ]).then(([examRes, qRes]) => {
      const examData = examRes.data;
      const examType = detectExamType(examData.title || '');
      const sorted   = sortBySubject(qRes.data, examType);
      setExam(examData);
      setQ(sorted);
      setTime(examData.duration_minutes * 60);
      setLoading(false);
    }).catch(() => { toast.error('Sınav yüklenemedi.'); navigate('/practice-exams'); });
  }, [examId, navigate]);

  /* ── Geri sayım ── */
  useEffect(() => {
    if (loading || finished) return;
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleFinish(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, finished]);

  /* ── Ders grupları ── */
  const subjectGroups = useMemo(() => {
    const groups = [];
    let lastSubject = null;
    questions.forEach((q, i) => {
      if (q.subject !== lastSubject) {
        groups.push({ subject: q.subject, startIdx: i });
        lastSubject = q.subject;
      }
    });
    return groups;
  }, [questions]);

  /* ── Aktif ders grubu indeksi ── */
  const resolvedActiveIdx = useMemo(() => {
    const rev = [...subjectGroups].reverse().findIndex(g => g.startIdx <= current);
    return rev === -1 ? 0 : subjectGroups.length - 1 - rev;
  }, [subjectGroups, current]);

  /* ── ÖSYM tarzı ders-bazlı soru numarası ── */
  const localQuestionNum = useMemo(() => {
    const group = subjectGroups[resolvedActiveIdx];
    return group ? current - group.startIdx + 1 : current + 1;
  }, [current, subjectGroups, resolvedActiveIdx]);

  const handleAnswer = (letter) =>
    setAnswers(prev => ({ ...prev, [current]: letter }));

  /* ── Sınavı bitir ── */
  const handleFinish = useCallback((timeUp = false) => {
    clearInterval(timerRef.current);
    let correct = 0, wrong = 0, blank = 0;
    questions.forEach((q, i) => {
      const ans = answers[i];
      if (!ans) blank++;
      else if (ans === q.correct_answer) correct++;
      else wrong++;
    });
    const total    = questions.length;
    const score    = total > 0 ? Math.round((correct / total) * 100) : 0;
    const netScore = (correct - wrong / 4).toFixed(2);
    const duration = Math.round((Date.now() - startRef.current) / 1000);

    const subjectMap = {};
    questions.forEach((q, i) => {
      const sub = q.subject || 'Genel';
      if (!subjectMap[sub]) subjectMap[sub] = { correct: 0, wrong: 0, blank: 0 };
      const ans = answers[i];
      if (!ans) subjectMap[sub].blank++;
      else if (ans === q.correct_answer) subjectMap[sub].correct++;
      else subjectMap[sub].wrong++;
    });
    const subjectStats = Object.entries(subjectMap).map(([sub, data]) => ({
      subject: sub,
      correct: data.correct, wrong: data.wrong, blank: data.blank,
      total: data.correct + data.wrong + data.blank,
      pct: Math.round((data.correct / (data.correct + data.wrong + data.blank || 1)) * 100),
    })).sort((a, b) => b.pct - a.pct);

    const weakSubs = subjectStats.filter(s => s.pct < 50).map(s => s.subject);
    let aiMsg = '';
    if (score >= 80)      aiMsg = `Mükemmel performans! %${score} ile üst seviyedesin.`;
    else if (score >= 60) aiMsg = `İyi gidiyor! Geliştirmen gereken dersler: ${weakSubs.slice(0,2).join(', ')}.`;
    else                  aiMsg = `${weakSubs.join(', ')} derslerini konu bazlı çalışmanı öneririz.`;

    const resultData = {
      correct, wrong, blank, score, netScore, duration, subjectStats, aiMsg, timeUp,
      questions: questions.map((q, i) => ({ ...q, userAnswer: answers[i] || null })),
    };
    sessionStorage.setItem('practiceExamReview', JSON.stringify(resultData));
    setResult(resultData);
    setFinished(true);
  }, [answers, questions]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const answeredCount = Object.keys(answers).length;
  const isRed = timeLeft <= 600;

  /* ══════════════════════════════════ LOADING ═════════════════════════════════ */
  if (loading) return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Sınav yükleniyor...</p>
      </div>
    </div>
  );

  /* ══════════════════════════════════ SONUÇ ═══════════════════════════════════ */
  if (finished && result) return (
    <div className="min-h-screen bg-[#0f1729] overflow-y-auto">
      <div className="bg-gradient-to-r from-[#1a2540] to-[#1e2d4a] px-8 py-6 border-b border-white/10">
        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">{exam?.title}</p>
        <h1 className="text-2xl font-bold text-white">Sınav Tamamlandı {result.timeUp ? '⏰' : '✅'}</h1>
        {result.timeUp && <p className="text-orange-400 text-sm mt-1">Süre doldu — otomatik teslim edildi.</p>}
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-5">
        {/* Özet kartlar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Doğru',  value: result.correct,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Yanlış', value: result.wrong,    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Boş',    value: result.blank,    color: 'text-slate-400',   bg: 'bg-white/5 border-white/10' },
            { label: 'Net',    value: result.netScore, color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} border rounded-2xl p-5 text-center`}>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
        {/* Başarı oranı */}
        <div className="bg-[#1a2540] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-1">Başarı Oranı</p>
            <p className={`text-4xl font-extrabold ${result.score >= 70 ? 'text-emerald-400' : result.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              %{result.score}
            </p>
            <p className="text-slate-500 text-xs mt-1">{Math.floor(result.duration/60)}dk {result.duration%60}sn</p>
          </div>
          <div className="w-28 h-28">
            <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2d4a" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none"
                stroke={result.score >= 70 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*50}`}
                strokeDashoffset={`${2*Math.PI*50*(1-result.score/100)}`} />
            </svg>
          </div>
        </div>
        {/* AI */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 flex gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <p className="text-indigo-300 text-xs font-bold uppercase mb-1">AI Analiz</p>
            <p className="text-slate-300 text-sm leading-relaxed">{result.aiMsg}</p>
          </div>
        </div>
        {/* Ders bazında */}
        <div className="bg-[#1a2540] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-400" /> Ders Bazında Analiz
          </h3>
          <div className="space-y-3">
            {result.subjectStats.map(s => {
              const sc = SUBJECT_COLORS[s.subject] || DEFAULT_COLOR;
              return (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <span className={`w-2 h-2 rounded-full ${sc.dot}`} /> {s.subject}
                    </span>
                    <span className="text-slate-500">
                      {s.correct}/{s.total} doğru · net: <span className="text-slate-300 font-semibold">{(s.correct - s.wrong/4).toFixed(1)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.pct >= 70 ? 'bg-emerald-500' : s.pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Butonlar */}
        <div className="grid gap-3">
          <button onClick={() => navigate('/practice-exam-review')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition text-sm shadow-lg shadow-orange-500/20">
            ✨ Soruları ve AI Çözümlerini İncele
          </button>
          <div className="flex gap-3">
            <button onClick={() => navigate('/practice-exams')}
              className="flex-1 py-3 bg-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/15 border border-white/10 transition text-sm">
              Diğer Sınavlar
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/15 border border-white/10 transition text-sm">
              Dashboard'a Dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════ SINAV ═══════════════════════════════════ */
  const q  = questions[current];
  const sc = SUBJECT_COLORS[q?.subject] || DEFAULT_COLOR;

  return (
    <div className={`h-screen ${T.root} flex flex-col overflow-hidden transition-colors duration-300`}>

      {/* ── Top Bar ── */}
      <div className={`${T.topbar} px-6 py-3 flex items-center justify-between shrink-0`}>
        {/* Sol: sınav adı + genel soru sayacı */}
        <div>
          <p className={`${T.textSub} text-xs`}>{exam?.title}</p>
          <p className={`${T.textTitle} text-sm font-bold`}>
            {current+1}. Soru &nbsp;/&nbsp; {questions.length}
          </p>
        </div>

        {/* Orta: geri sayım */}
        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-bold text-xl transition-all
          ${isRed ? 'bg-red-500/20 text-red-400 animate-pulse' : T.timeNormal}`}>
          <Clock size={18} className={isRed ? 'text-red-400' : T.timerText} />
          {fmt(timeLeft)}
        </div>

        {/* Sağ: tema toggle + bitir */}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
            className={`p-2.5 rounded-xl transition ${T.themeBtn}`}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button onClick={() => {
            if (window.confirm(`${questions.length - answeredCount} soru boş kalacak. Sınavı bitirmek istiyor musunuz?`))
              handleFinish();
          }}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
            <Flag size={15} /> Sınavı Bitir
          </button>
        </div>
      </div>

      {/* ── Ders Sekmeleri ── */}
      <div className={`${T.tabbar} px-4 py-2 flex gap-1.5 overflow-x-auto shrink-0`}>
        {subjectGroups.map((g, gi) => {
          const gsc       = SUBJECT_COLORS[g.subject] || DEFAULT_COLOR;
          const isActive  = gi === resolvedActiveIdx;
          const nextStart = subjectGroups[gi+1]?.startIdx ?? questions.length;
          const groupTotal    = nextStart - g.startIdx;
          const groupAnswered = Array.from({length: groupTotal}, (_, k) => answers[g.startIdx+k]).filter(Boolean).length;
          return (
            <button key={g.subject} onClick={() => setCurrent(g.startIdx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0
                ${isActive ? T.tabActive(gsc) : T.tabInactive(gsc)}`}>
              <span className={`w-2 h-2 rounded-full ${gsc.dot}`} />
              {g.subject}
              <span className={`ml-1 text-[10px] ${groupAnswered === groupTotal ? T.tabCountDone : T.tabCount}`}>
                {groupAnswered}/{groupTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Ana İçerik ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sol: ders gruplu soru grid'i */}
        <aside className={`w-48 ${T.sidebar} flex flex-col overflow-y-auto shrink-0`}>
          {subjectGroups.map((g, gi) => {
            const gsc       = SUBJECT_COLORS[g.subject] || DEFAULT_COLOR;
            const nextStart = subjectGroups[gi+1]?.startIdx ?? questions.length;
            const groupQs   = questions.slice(g.startIdx, nextStart);
            return (
              <div key={g.subject} className={`p-3 ${T.sectionBorder}`}>
                <p className={`text-[10px] font-bold uppercase mb-2 flex items-center gap-1 ${T.subjectDot(gsc)}`}>
                  <BookOpen size={9} /> {g.subject}
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {groupQs.map((_, k) => {
                    const absIdx   = g.startIdx + k;
                    const ans      = answers[absIdx];
                    const isCur    = absIdx === current;
                    const isMarked = marked.has(absIdx);
                    return (
                      <button key={absIdx} onClick={() => setCurrent(absIdx)}
                        className={`w-7 h-7 rounded-md text-[10px] font-bold transition flex items-center justify-center relative
                          ${isCur    ? T.gridActive
                          : isMarked ? T.gridMarked
                          : ans      ? T.gridDone
                          :            T.gridEmpty}`}>
                        {absIdx+1}
                        {isMarked && !isCur && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* İstatistik */}
          <div className={`p-3 mt-auto ${T.statBorder} space-y-1.5`}>
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Cevaplanan</span>
              <span className="text-emerald-400 font-bold">{answeredCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={`${T.textSub} flex items-center gap-1`}><AlertCircle size={10} /> Boş</span>
              <span className={`${T.textSub} font-bold`}>{questions.length - answeredCount}</span>
            </div>
            {marked.size > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-yellow-400 flex items-center gap-1"><Pin size={10} /> İşaretli</span>
                <span className="text-yellow-400 font-bold">{marked.size}</span>
              </div>
            )}
          </div>
        </aside>

        {/* Orta: soru */}
        <main className="flex-1 overflow-y-auto p-8">
          {q && (
            <div className="max-w-2xl mx-auto">

              {/* Soru kartı */}
              <div className={`${T.card} rounded-2xl p-6 mb-6`}>
                <div className="flex items-center gap-2 mb-4">
                  {/* ÖSYM tarzı ders-bazlı numara */}
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Soru {localQuestionNum}
                  </span>
                  {q.subject && (
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sc.badge}`}>
                      {q.subject}
                    </span>
                  )}
                  {/* Genel sıra — küçük ipucu */}
                  <span className={`ml-auto text-[10px] ${T.textMuted}`}>
                    #{current+1}/{questions.length}
                  </span>
                </div>
                <p className={`${T.textQ} text-base leading-relaxed`}>{q.question_text}</p>
              </div>

              {/* Şıklar */}
              <div className="space-y-3 mb-8">
                {['A','B','C','D','E'].map(letter => {
                  const text     = q[`option_${letter.toLowerCase()}`];
                  const selected = answers[current] === letter;
                  if (!text) return null;
                  return (
                    <button key={letter} onClick={() => handleAnswer(letter)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-150
                        ${selected ? T.optionSel : T.optionBase}`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                        ${selected ? T.letterSel : T.letterBase}`}>
                        {letter}
                      </span>
                      <span className={`text-sm leading-relaxed pt-0.5 ${selected ? T.textOptSel : T.textOpt}`}>
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Alt kontrol çubuğu */}
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl ${T.btnPrev} transition disabled:opacity-30 text-sm font-semibold`}>
                  <ChevronLeft size={16} /> Önceki
                </button>

                <div className="flex items-center gap-2">
                  <button onClick={toggleMark}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl transition text-xs font-semibold
                      ${marked.has(current) ? T.btnMarkOn : T.btnMark}`}>
                    <Pin size={13} className={marked.has(current) ? 'fill-current' : ''} />
                    {marked.has(current) ? 'İşaretli' : 'İşaretle'}
                  </button>
                  <button onClick={() => setAnswers(prev => { const n={...prev}; delete n[current]; return n; })}
                    className={`px-3 py-2.5 rounded-xl ${T.btnDel} transition text-xs`}>
                    <X size={13} className="inline mr-1" /> Cevabı Sil
                  </button>
                </div>

                {current < questions.length-1 ? (
                  <button onClick={() => setCurrent(c => c+1)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl ${T.btnNext} font-semibold transition text-sm`}>
                    Sonraki <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={() => handleFinish()}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl ${T.btnFinish} font-semibold transition text-sm`}>
                    <Flag size={15} /> Teslim Et
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
