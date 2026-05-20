import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, XCircle, Minus, Sparkles, ChevronDown } from 'lucide-react';

const ERROR_PROFILE_CONFIG = {
  GOOD:          { label: 'Mükemmel!',          color: 'bg-emerald-500', emoji: '🏆', desc: 'Harika iş! Konuyu çok iyi öğrenmişsin.' },
  ATTENTION:     { label: 'Dikkat Hataları',    color: 'bg-yellow-500',  emoji: '⚡', desc: 'Hataların dikkat kaynaklı. Soruları daha dikkatli oku.' },
  KNOWLEDGE_GAP: { label: 'Bilgi Eksikliği',    color: 'bg-red-500',     emoji: '📖', desc: 'Bu konuyu ders materyalleriyle tekrar çalışmanı öneririz.' },
  MIXED:         { label: 'Karma Hata Profili', color: 'bg-orange-500',  emoji: '📊', desc: 'Hem dikkat hem bilgi eksiklikleri var.' },
};

const REC_CONFIG = {
  ADVANCE:      { label: 'Bir Üst Seviyeye Geç',    color: 'bg-emerald-600', emoji: '🚀' },
  RETRY_TEST:   { label: 'Testi Tekrar Dene',        color: 'bg-indigo-600',  emoji: '🔄' },
  STUDY_LESSON: { label: 'Önce Dersi Çalış',         color: 'bg-red-600',     emoji: '📺' },
};

const DIFF_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };

export default function SmartExamResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [weakPopupIndex, setWeakPopupIndex] = useState(0);
  const [weakDismissed, setWeakDismissed] = useState([]);
  const [failDismissed, setFailDismissed] = useState(false);

  if (!state?.result) { navigate('/courses'); return null; }

  const { result, questions, answers, questionTimes, topicId, topicName, selectedDifficulty } = state;
  const errorCfg = ERROR_PROFILE_CONFIG[result.errorProfile] || ERROR_PROFILE_CONFIG.MIXED;
  const recCfg = REC_CONFIG[result.aiRecommendationType] || REC_CONFIG.RETRY_TEST;

  // Seviyeye göre geçme eşiği: kolay→%90, orta→%85, zor→%80
  const PASS_THRESHOLD = selectedDifficulty === 1 ? 90 : selectedDifficulty === 2 ? 85 : 80;
  const score = Math.round(result.scorePercentage ?? result.weightedScore ?? 0);
  const passed = score >= PASS_THRESHOLD;

  // Konu sınavında başarısız mı?
  const isFailed = !failDismissed && topicId && !passed;

  const pendingWeakTopics = (result.weakTopics || []).filter((_, i) => !weakDismissed.includes(i));
  const currentWeak = (!isFailed && pendingWeakTopics[0]) || null;

  const handleRemind = (tId, daysLater) => {
    const userId = parseInt(localStorage.getItem('userId'));
    if (userId && tId) {
      api.post(`/api/notifications/reminder/${userId}`, { topicId: tId, daysLater }).catch(() => {});
    }
    setWeakDismissed(prev => [...prev, weakPopupIndex]);
    setWeakPopupIndex(prev => prev + 1);
  };

  const dismissWeak = () => {
    setWeakDismissed(prev => [...prev, weakPopupIndex]);
    setWeakPopupIndex(prev => prev + 1);
  };

  const handleFailRemind = () => {
    const userId = parseInt(localStorage.getItem('userId'));
    if (userId && topicId) {
      api.post(`/api/notifications/reminder/${userId}`, { topicId, daysLater: 3 }).catch(() => {});
    }
    setFailDismissed(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      {/* Başarısız — konu tekrar ekranı */}
      {isFailed && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7">
            <p className="text-5xl text-center mb-3">😔</p>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-1">
              Bu Konuda Başarısız Oldun
            </h3>
            <p className="text-center text-gray-500 text-sm mb-1">
              <span className="font-semibold text-red-500">{topicName}</span> — {DIFF_LABELS[selectedDifficulty] || 'Kolay'}
            </p>
            <p className="text-center text-4xl font-bold text-red-500 mb-1">%{score}</p>
            <p className="text-center text-xs text-gray-400 mb-6">Geçme notu: %{PASS_THRESHOLD}</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate(`/lesson/${topicId}`, {
                  state: { fromFailedExam: true, difficulty: selectedDifficulty, topicName }
                })}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2"
              >
                📺 Konuyu Şimdi Tekrar Et
              </button>
              <button
                onClick={() => navigate(`/smart-exam/${topicId}`)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2"
              >
                🔄 Sınavı Tekrar Al
              </button>
              <button
                onClick={handleFailRemind}
                className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-semibold py-3 rounded-2xl border border-yellow-200 transition"
              >
                🔔 3 Gün Sonra Hatırlat
              </button>
              <button
                onClick={() => setFailDismissed(true)}
                className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition"
              >
                Şimdilik Geç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zayıf konu popup */}
      {currentWeak && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <p className="text-2xl text-center mb-1">📚</p>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Konu Zayıflığı Tespit Edildi</h3>
            <p className="text-center text-gray-600 mb-1">
              <span className="font-semibold text-red-500">{currentWeak.topicName}</span> konusunda zorlanıyorsun.
            </p>
            <p className="text-center text-sm text-gray-400 mb-5">
              Bu konudaki başarı oranın: %{currentWeak.score} ({currentWeak.questionCount} soru)
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/courses')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition"
              >
                Şimdi Çalış
              </button>
              <button
                onClick={() => handleRemind(currentWeak.topicId, 3)}
                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-semibold py-2.5 rounded-xl border border-yellow-200 transition"
              >
                3 Gün Sonra Hatırlat
              </button>
              <button
                onClick={dismissWeak}
                className="text-gray-400 hover:text-gray-600 text-sm py-1.5 transition"
              >
                Şimdilik Geç
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">

        {/* Ana Skor Kartı */}
        <div className={`${errorCfg.color} text-white rounded-3xl p-6 text-center mb-6 shadow-lg`}>
          <p className="text-5xl mb-2">{errorCfg.emoji}</p>
          <p className="text-5xl font-bold">%{result.weightedScore}</p>
          <p className="text-sm opacity-80 mt-1">Ağırlıklı Başarı Skoru</p>
          <p className="font-semibold mt-2">{errorCfg.label}</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox label="Doğru" value={result.correctCount} color="text-emerald-600" bg="bg-emerald-50" />
          <StatBox label="Yanlış" value={result.wrongCount} color="text-red-500" bg="bg-red-50" />
          <StatBox label="Boş" value={result.blankCount} color="text-gray-500" bg="bg-gray-100" />
        </div>

        {/* Hata Analizi */}
        <div className="bg-white rounded-2xl shadow p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">🧠 Hata Analizi</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{result.attentionErrors}</p>
              <p className="text-xs text-gray-500 mt-1">Dikkat Hatası</p>
              <p className="text-xs text-gray-400">(hızlı yanlış)</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{result.knowledgeGaps}</p>
              <p className="text-xs text-gray-500 mt-1">Bilgi Eksikliği</p>
              <p className="text-xs text-gray-400">(uzun süre, yanlış)</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 bg-gray-50 rounded-xl p-3">{errorCfg.desc}</p>
        </div>

        {/* Rozet Kutlaması */}
        {result.aiBadge && Array.isArray(result.aiBadge) && result.aiBadge.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-5 mb-6 shadow-lg">
            <p className="font-bold text-white text-lg mb-3">🎉 Yeni Rozet Kazandın!</p>
            <div className="flex flex-wrap gap-3">
              {result.aiBadge.map((b, i) => (
                <div key={i} className="bg-white rounded-xl px-4 py-3 text-center shadow">
                  <p className="text-2xl">{b.icon}</p>
                  <p className="font-bold text-gray-800 text-sm mt-1">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flask ML Analizi */}
        {result.aiMessage && (
          <div className="bg-white rounded-2xl shadow p-5 mb-6 border border-indigo-100">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-800">🤖 Yapay Zekâ Analizi</h3>
              <span className="text-xs text-gray-400">{result.aiTrainingSamples} örnekle eğitildi</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{result.aiMessage}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full transition-all"
                  style={{ width: `${result.aiConfidence}%` }} />
              </div>
              <span className="text-sm font-bold text-indigo-600 shrink-0">%{result.aiConfidence} güven</span>
            </div>
          </div>
        )}

        {/* AI Yönlendirme */}
        <div className={`${recCfg.color} text-white rounded-2xl p-5 mb-6 flex justify-between items-center shadow`}>
          <div>
            <p className="font-bold text-lg">{recCfg.emoji} {recCfg.label}</p>
            {result.lessonContentTitle && (
              <p className="text-sm opacity-80 mt-1">📺 {result.lessonContentTitle}</p>
            )}
          </div>
          {result.aiRecommendationType === 'STUDY_LESSON' && result.lessonContentUrl ? (
            <a href={result.lessonContentUrl} target="_blank" rel="noreferrer"
              className="bg-white text-gray-800 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition shrink-0">
              İzle
            </a>
          ) : result.aiRecommendationType === 'ADVANCE' && topicId ? (
            <button
              onClick={() => navigate(`/smart-exam/${topicId}`, { replace: true })}
              className="bg-white text-gray-800 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition shrink-0">
              Sonraki Seviye →
            </button>
          ) : (
            <button onClick={() => navigate(-1)}
              className="bg-white text-gray-800 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition shrink-0">
              Tekrar
            </button>
          )}
        </div>

        {/* Soru Soru Analiz */}
        <h3 className="font-bold text-gray-800 mb-3">Soru Analizi</h3>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              userAns={answers[q.id]}
              time={questionTimes?.[q.id] || 0}
            />
          ))}
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/courses')}
            className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
            Derslere Dön
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function QuestionCard({ q, index, userAns, time }) {
  const [open, setOpen]               = useState(false);
  const [explanation, setExplanation] = useState(q.explanation || null);
  const [expError, setExpError]       = useState(null);
  const [loadingExp, setLoadingExp]   = useState(false);

  const isFill    = q.questionType === 'FILL_BLANK';
  const isBlank   = !userAns || userAns.trim() === '';
  const isCorrect = isFill
    ? !isBlank && userAns.trim().toLowerCase() === (q.blankAnswer || '').trim().toLowerCase()
    : userAns === q.correctAnswer;

  const correctLetter = isFill ? null : q.correctAnswer;
  const correctText   = isFill ? q.blankAnswer : q[`option${correctLetter}`];
  const userText      = isFill ? userAns : (userAns ? `${userAns}) ${q[`option${userAns}`]}` : null);
  const correctFull   = correctLetter ? `${correctLetter}) ${correctText}` : correctText;

  const fetchExplanation = async () => {
    setLoadingExp(true);
    setExpError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_AI_URL || 'http://localhost:5000'}/explain-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText:  q.questionText,
          optionA:       q.optionA || q.option_a || '',
          optionB:       q.optionB || q.option_b || '',
          optionC:       q.optionC || q.option_c || '',
          optionD:       q.optionD || q.option_d || '',
          correctAnswer: q.correctAnswer,
          subject:       q.subject || q.topic?.course?.name || 'Genel',
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setExplanation(data.explanation);
      } else {
        setExpError(data.error || 'unknown');
      }
    } catch {
      setExpError('network');
    } finally {
      setLoadingExp(false);
    }
  };

  const handleAccordion = () => {
    const opening = !open;
    setOpen(opening);
    if (opening && !explanation && !loadingExp) fetchExplanation();
  };

  const borderColor = isBlank ? 'border-gray-200' : isCorrect ? 'border-emerald-400' : 'border-red-400';
  const badgeCls    = isBlank
    ? 'bg-gray-100 text-gray-500'
    : isCorrect
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-red-100 text-red-600';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
      {/* Soru başlığı */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-3">
          <p className="text-sm font-medium text-gray-800 flex-1 leading-relaxed">
            <span className="text-gray-400 mr-1.5 font-bold">{index + 1}.</span>
            {q.questionText}
          </p>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeCls}`}>
              {isBlank ? 'Boş' : isCorrect ? 'Doğru' : 'Yanlış'}
            </span>
            <span className="text-xs text-gray-400">{time}sn</span>
          </div>
        </div>

        {/* Cevap gösterimi */}
        {isBlank ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            <Minus size={13} className="shrink-0" />
            <span>Bu soru boş bırakıldı</span>
          </div>
        ) : isCorrect ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
            <CheckCircle size={13} className="shrink-0" />
            <span>Cevabın: {userText}</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">
              <XCircle size={13} className="shrink-0" />
              <span>Senin Cevabın: {userText || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
              <CheckCircle size={13} className="shrink-0" />
              <span>Doğru Cevap: {correctFull}</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Çözüm Accordion */}
      <div className="border-t border-gray-100">
        <button
          onClick={handleAccordion}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/60 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-500" />
            Yapay Zekâ Çözümünü Gör
          </span>
          <ChevronDown
            size={14}
            className={`text-indigo-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="px-4 pb-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-slate-700 leading-relaxed">
              {loadingExp ? (
                <span className="flex items-center gap-2 text-indigo-400">
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Gemini açıklama üretiyor...
                </span>
              ) : explanation ? (
                explanation
              ) : expError === 'rate_limited' ? (
                <span className="flex flex-col gap-2">
                  <span className="text-amber-600">⏳ API günlük limit doldu. Biraz bekleyip tekrar deneyin.</span>
                  <button onClick={fetchExplanation}
                    className="self-start text-[11px] font-semibold text-indigo-600 bg-white border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition">
                    Tekrar Dene
                  </button>
                </span>
              ) : expError === 'network' ? (
                <span className="flex flex-col gap-2">
                  <span className="text-slate-500">⚠️ AI servisine bağlanılamadı.</span>
                  <button onClick={fetchExplanation}
                    className="self-start text-[11px] font-semibold text-indigo-600 bg-white border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition">
                    Tekrar Dene
                  </button>
                </span>
              ) : (
                <span className="text-slate-400">Açıklama alınamadı.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
