import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

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

  // Konu sınavında başarısız mı? (%50 altı + karma sınav değil)
  const isFailed = !failDismissed && topicId && result.weightedScore < 50;

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
            <p className="text-center text-4xl font-bold text-red-500 mb-1">%{result.weightedScore}</p>
            <p className="text-center text-xs text-gray-400 mb-6">Geçme notu: %50</p>

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
          ) : result.aiRecommendationType === 'ADVANCE' ? (
            <button onClick={() => navigate('/courses')}
              className="bg-white text-gray-800 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition shrink-0">
              Devam
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
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const isFill = q.questionType === 'FILL_BLANK';
            const isBlank = !userAns || userAns.trim() === '';
            const isCorrect = isFill
              ? !isBlank && userAns.trim().toLowerCase() === (q.blankAnswer || '').trim().toLowerCase()
              : userAns === q.correctAnswer;
            const time = questionTimes?.[q.id] || 0;
            const borderColor = isBlank ? 'border-gray-300' : isCorrect ? 'border-emerald-500' : 'border-red-400';

            return (
              <div key={q.id} className={`bg-white rounded-xl shadow p-4 border-l-4 ${borderColor}`}>
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium text-gray-800 flex-1">
                    <span className="text-gray-400 mr-1">{i + 1}.</span>{q.questionText}
                  </p>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isBlank ? 'bg-gray-100 text-gray-500' :
                      isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {isBlank ? 'Boş' : isCorrect ? 'Doğru' : 'Yanlış'}
                    </span>
                    <span className="text-xs text-gray-400">{time}sn</span>
                  </div>
                </div>
                {isFill && !isBlank && (
                  <p className="text-xs text-gray-500 mt-1">Cevabın: <span className="font-semibold">{userAns}</span></p>
                )}
                {!isCorrect && !isBlank && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ✓ Doğru cevap: {isFill ? q.blankAnswer : `${q.correctAnswer}) ${q[`option${q.correctAnswer}`]}`}
                  </p>
                )}
              </div>
            );
          })}
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
