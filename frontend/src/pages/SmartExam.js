import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };
const WEIGHT_LABELS = { 1.0: '×1.0', 1.5: '×1.5', 2.0: '×2.0' };

export default function SmartExam() {
  const { topicId } = useParams(); // 'mixed' veya sayı
  const isMixed = topicId === 'mixed';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const preselectedDifficulty = navState?.preselectedDifficulty || null;

  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState(null);
  const [answers, setAnswers] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [unlockStatus, setUnlockStatus] = useState({ kolay: true, orta: false, zor: false });
  // loading | select-difficulty | exam | submitting
  const [step, setStep] = useState(isMixed ? 'loading' : 'select-difficulty');
  const timerRef = useRef(null);

  // Karma sınav → direkt yükle. Konu sınavı → zorluk seçiminden sonra yükle
  useEffect(() => {
    if (!isMixed) {
      const userId = parseInt(localStorage.getItem('userId'));
      Promise.all([
        api.get(`/api/courses/topics/${topicId}`),
        userId ? api.get(`/api/smart-exam/topic/${topicId}/unlock/${userId}`) : Promise.resolve({ data: { kolay: true, orta: false, zor: false } }),
      ]).then(([topicRes, unlockRes]) => {
        setTopic(topicRes.data);
        setUnlockStatus(unlockRes.data);
      }).catch(() => navigate('/courses'));
      return;
    }
    // Karma sınav — aktif pakete göre filtrele
    const pkg = navState?.pkg || (JSON.parse(localStorage.getItem('ownedPackages') || '["YKS"]')[0]) || 'YKS';
    api.get(`/api/smart-exam/mixed/questions?limit=15&pkg=${pkg}`)
      .then(r => { setQuestions(r.data); setStep('exam'); setQuestionStart(Date.now()); toast.success(`${pkg} Karışık sınav başladı!`); })
      .catch(() => { toast.error('Sorular yüklenemedi.'); navigate('/courses'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const startWithDifficulty = async (diff) => {
    setSelectedDifficulty(diff);
    setStep('loading');
    try {
      const uid = parseInt(localStorage.getItem('userId'));
      const url = `/api/smart-exam/topic/${topicId}/questions?limit=20&difficulty=${diff}${uid ? `&userId=${uid}` : ''}`;
      const res = await api.get(url);
      if (res.data.length === 0) {
        toast.error('Bu zorlukta soru bulunamadı. Başka bir zorluk deneyin.');
        setStep('select-difficulty');
        return;
      }
      setQuestions(res.data);
      setStep('exam');
      setQuestionStart(Date.now());
      toast.success(`${topic?.name} — ${['','Kolay','Orta','Zor'][diff]} sınav başladı!`);
    } catch {
      toast.error('Sorular yüklenemedi.');
      setStep('select-difficulty');
    }
  };

  // Toplam süre sayacı
  useEffect(() => {
    if (step !== 'exam') return;
    timerRef.current = setInterval(() => setTotalElapsed(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [step]);

  const recordAnswer = (questionId, answer) => {
    const timeSec = Math.round((Date.now() - questionStart) / 1000);
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setQuestionTimes(prev => ({ ...prev, [questionId]: timeSec }));
  };

  const goNext = () => {
    // Süreyi kaydet (cevaplansın ya da geçilsin)
    if (!questionTimes[questions[currentIdx].id]) {
      const timeSec = Math.round((Date.now() - questionStart) / 1000);
      setQuestionTimes(prev => ({ ...prev, [questions[currentIdx].id]: timeSec }));
    }
    setCurrentIdx(i => i + 1);
    setQuestionStart(Date.now());
  };

  const goPrev = () => {
    setCurrentIdx(i => i - 1);
    setQuestionStart(Date.now());
  };

  const submitExam = useCallback(async () => {
    clearInterval(timerRef.current);
    setStep('submitting');
    const userId = user?.userId || parseInt(localStorage.getItem('userId'));

    const attempts = questions.map(q => ({
      questionId: q.id,
      userAnswer: answers[q.id] || null,
      solveTimeSec: questionTimes[q.id] || 0,
    }));

    try {
      const activePkg = (() => { try { return JSON.parse(localStorage.getItem('ownedPackages') || '["YKS"]')[0]; } catch { return 'YKS'; } })();
      const res = await api.post('/api/smart-exam/submit', {
        userId,
        topicId: isMixed ? null : parseInt(topicId),
        subject: isMixed ? 'Karışık' : (topic?.name || 'Genel'),
        packageType: activePkg,
        difficultyLevel: selectedDifficulty || 1,
        totalDurationSec: totalElapsed,
        attempts,
      });
      navigate('/smart-exam-result', {
        state: {
          result: res.data,
          questions,
          answers,
          questionTimes,
          topicId: isMixed ? null : parseInt(topicId),
          topicName: isMixed ? null : topic?.name,
          selectedDifficulty,
        }
      });
    } catch {
      toast.error('Sonuç gönderilemedi.');
      setStep('exam');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questionTimes, questions, totalElapsed, user, topicId, isMixed, topic, navigate, selectedDifficulty]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (step === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-500">Sorular yükleniyor...</div>;
  if (step === 'submitting') return <div className="min-h-screen flex items-center justify-center text-gray-500">Analiz yapılıyor...</div>;

  // Zorluk seçim ekranı (sadece konu sınavlarında)
  if (step === 'select-difficulty') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <p className="text-4xl mb-3">📝</p>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{topic?.name || 'Sınav'}</h2>
        <p className="text-gray-500 text-sm mb-6">Zorluk seviyesi seç</p>

        {/* Başarısız sınavdan gelen → hızlı tekrar al */}
        {preselectedDifficulty && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-sm text-orange-700 font-medium mb-2">Önceki başarısız sınavı tekrar al:</p>
            <button onClick={() => startWithDifficulty(preselectedDifficulty)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition">
              🔄 {['','Kolay','Orta','Zor'][preselectedDifficulty]} Sınavını Tekrar Al
            </button>
          </div>
        )}

        <div className="space-y-3">
          {/* KOLAY — her zaman açık */}
          <button onClick={() => startWithDifficulty(1)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition flex items-center justify-between px-6 shadow-md">
            <span className="text-xl">🟢</span>
            <div className="text-left">
              <p className="font-bold">Kolay</p>
              <p className="text-xs opacity-80">Temel kavramlar · ×1.0 puan</p>
            </div>
            <span className="text-sm opacity-70">→</span>
          </button>

          {/* ORTA — kolay geçildiyse açık */}
          {unlockStatus.orta ? (
            <button onClick={() => startWithDifficulty(2)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-2xl transition flex items-center justify-between px-6 shadow-md">
              <span className="text-xl">🟡</span>
              <div className="text-left">
                <p className="font-bold">Orta</p>
                <p className="text-xs opacity-80">Analiz soruları · ×1.5 puan</p>
              </div>
              <span className="text-sm opacity-70">→</span>
            </button>
          ) : (
            <div className="w-full bg-gray-100 border-2 border-dashed border-gray-300 py-4 rounded-2xl px-6 flex items-center justify-between opacity-70">
              <span className="text-xl">🔒</span>
              <div className="text-left flex-1 ml-3">
                <p className="font-bold text-gray-500">Orta — Kilitli</p>
                <p className="text-xs text-gray-400">Kolay sınavını %90+ geçersen açılır</p>
              </div>
              <span className="text-lg">🔒</span>
            </div>
          )}

          {/* ZOR — orta geçildiyse açık */}
          {unlockStatus.zor ? (
            <button onClick={() => startWithDifficulty(3)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition flex items-center justify-between px-6 shadow-md">
              <span className="text-xl">🔴</span>
              <div className="text-left">
                <p className="font-bold">Zor</p>
                <p className="text-xs opacity-80">İleri düzey · ×2.0 puan</p>
              </div>
              <span className="text-sm opacity-70">→</span>
            </button>
          ) : (
            <div className="w-full bg-gray-100 border-2 border-dashed border-gray-300 py-4 rounded-2xl px-6 flex items-center justify-between opacity-70">
              <span className="text-xl">🔒</span>
              <div className="text-left flex-1 ml-3">
                <p className="font-bold text-gray-500">Zor — Kilitli</p>
                <p className="text-xs text-gray-400">Orta sınavını %85+ geçersen açılır</p>
              </div>
              <span className="text-lg">🔒</span>
            </div>
          )}
        </div>
        <button onClick={() => navigate(-1)} className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition">
          ← Geri Dön
        </button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-500 font-medium">Bu konuda soru bulunamadı.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-500 text-sm hover:underline">← Geri Dön</button>
      </div>
    </div>
  );

  const q        = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const DIFF_BADGE = {
    1: 'bg-emerald-100 text-emerald-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Navbar ── */}
      <nav className="bg-[#1a2540] px-5 py-3 flex items-center gap-4 shadow-lg sticky top-0 z-10">
        {/* Konu adı */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-none truncate">
            {isMixed ? 'Karışık Sınav' : topic?.name}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            {currentIdx + 1} / {questions.length} soru
          </p>
        </div>

        {/* Süre */}
        <div className="flex flex-col items-center shrink-0">
          <p className={`font-mono font-bold text-xl tabular-nums leading-none ${totalElapsed > 1800 ? 'text-red-400' : 'text-orange-400'}`}>
            {formatTime(totalElapsed)}
          </p>
          <p className="text-slate-500 text-[10px] mt-0.5">geçen süre</p>
        </div>

        {/* Cevaplanan */}
        <div className="flex flex-col items-end shrink-0">
          <p className="text-white font-bold text-sm leading-none">{answered}<span className="text-slate-400 font-normal">/{questions.length}</span></p>
          <p className="text-slate-500 text-[10px] mt-0.5">cevaplandı</p>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div className="h-full bg-orange-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* ── İçerik ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-4">

        {/* Soru Kartı */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

          {/* Meta rozetler */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${DIFF_BADGE[q.difficultyLevel] || 'bg-slate-100 text-slate-500'}`}>
              {DIFFICULTY_LABELS[q.difficultyLevel]}
            </span>
            <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
              Ağırlık {WEIGHT_LABELS[q.weightCoefficient] || '×1.0'}
            </span>
            {q.topic && (
              <span className="text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full ml-auto">
                {q.topic.name}
              </span>
            )}
          </div>

          {/* Soru numarası + metin */}
          <div className="flex gap-3 mb-6">
            <span className="w-7 h-7 rounded-lg bg-[#1a2540] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {currentIdx + 1}
            </span>
            <p className="text-slate-800 font-semibold text-[15px] leading-relaxed">{q.questionText}</p>
          </div>

          {/* Şıklar */}
          {q.questionType === 'FILL_BLANK' ? (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Cevabınızı yazın:</label>
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={e => recordAnswer(q.id, e.target.value)}
                className="w-full border-2 border-slate-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition"
                placeholder="Cevabınızı buraya yazın..."
                autoComplete="off"
              />
              <p className="text-xs text-slate-400 mt-2">Büyük/küçük harf fark etmez.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {['A', 'B', 'C', 'D'].map(opt => {
                const val = q[`option${opt}`];
                if (!val) return null;
                const selected = answers[q.id] === opt;
                return (
                  <button key={opt} onClick={() => recordAnswer(q.id, opt)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                      selected
                        ? 'bg-[#1a2540] border-[#1a2540] text-white shadow-md'
                        : 'border-slate-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50'
                    }`}>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      selected ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{opt}</span>
                    {val}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigasyon */}
        <div className="flex gap-3">
          <button onClick={goPrev} disabled={currentIdx === 0}
            className="flex-1 bg-white border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition disabled:opacity-30 text-sm">
            ← Önceki
          </button>
          {currentIdx < questions.length - 1 ? (
            <button onClick={goNext}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition text-sm shadow-sm">
              Sonraki →
            </button>
          ) : (
            <button onClick={submitExam}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition text-sm shadow-sm">
              Sınavı Bitir ✓
            </button>
          )}
        </div>

        {/* Soru haritası */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-2.5">Soru Haritası</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((qq, i) => (
              <button key={qq.id} onClick={() => { setCurrentIdx(i); setQuestionStart(Date.now()); }}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  i === currentIdx
                    ? 'bg-[#1a2540] text-white shadow-sm scale-110'
                    : answers[qq.id]
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
