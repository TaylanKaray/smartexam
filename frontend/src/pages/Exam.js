import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih'];
const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };
const TIME_LIMITS = { 5: '5 Dakika', 10: '10 Dakika', 15: '15 Dakika', 0: 'Süresiz' };

export default function Exam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('select');
  const [subject, setSubject] = useState('Matematik');
  const [difficulty, setDifficulty] = useState(1);
  const [timeLimit, setTimeLimit] = useState(10); // dakika, 0 = süresiz
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sayaç
  useEffect(() => {
    if (step !== 'exam') return;
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Süre dolunca otomatik bitir
  useEffect(() => {
    if (step !== 'exam' || timeLimit === 0) return;
    if (elapsed >= timeLimit * 60) {
      toast.error('Süre doldu! Sınav otomatik teslim edildi.');
      submitExam();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, step, timeLimit]);

  const startExam = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/questions/subject/${subject}/difficulty/${difficulty}`);
      if (res.data.length === 0) {
        setError('Bu konu ve zorlukta soru bulunamadı. Önce soru ekleyin.');
        return;
      }
      setQuestions(res.data.slice(0, 10));
      setAnswers({});
      setElapsed(0);
      setStep('exam');
      toast.success(`${subject} sınavı başladı!`);
    } catch {
      setError('Sorular yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const submitExam = useCallback(async () => {
    const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    const wrong = questions.length - correct;
    const score = Math.round((correct / questions.length) * 100);
    const userId = user?.userId || parseInt(localStorage.getItem('userId'));

    try {
      await api.post('/api/exam-results', {
        userId, subject,
        totalQuestions: questions.length,
        correctAnswers: correct,
        wrongAnswers: wrong,
        scorePercentage: score,
        difficultyLevel: difficulty,
        durationSeconds: elapsed,
      });

      api.post('/api/recommendations/analyze', {
        userId, subject,
        dogru: correct, yanlis: wrong, sure: elapsed, konuId: difficulty,
      }).catch(() => {});

      navigate('/exam-result', {
        state: { questions, answers, elapsed, subject, difficulty, score, correct, wrong }
      });
    } catch {
      setError('Sonuç kaydedilemedi, lütfen tekrar dene.');
      toast.error('Sonuç kaydedilemedi!');
    }
  }, [answers, questions, elapsed, subject, difficulty, user, navigate]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const remaining = timeLimit > 0 ? timeLimit * 60 - elapsed : null;
  const timeColor = remaining !== null && remaining < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-600';

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
          <button onClick={() => navigate('/dashboard')} className="text-indigo-600 text-sm mb-4">← Geri</button>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sınav Ayarları</h2>

          {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSubject(s)}
                    className={`py-2 rounded-lg border text-sm font-medium transition ${subject === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:border-indigo-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zorluk</label>
              <div className="flex gap-3">
                {[1, 2, 3].map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${difficulty === d ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:border-indigo-400'}`}>
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Süre Limiti</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TIME_LIMITS).map(([val, label]) => (
                  <button key={val} onClick={() => setTimeLimit(Number(val))}
                    className={`py-2 rounded-lg border text-sm font-medium transition ${timeLimit === Number(val) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:border-indigo-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startExam} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60">
              {loading ? 'Yükleniyor...' : 'Sınavı Başlat'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-4 flex justify-between items-center">
          <span className="font-semibold text-gray-700">{subject} — {DIFFICULTY_LABELS[difficulty]}</span>
          <div className="text-center">
            <span className={`font-mono font-bold text-lg ${timeColor}`}>
              {remaining !== null ? formatTime(remaining) : formatTime(elapsed)}
            </span>
            {remaining !== null && <p className="text-xs text-gray-400">kalan süre</p>}
          </div>
          <span className="text-sm text-gray-500">{answered}/{questions.length} cevaplandı</span>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl shadow p-6">
              <p className="font-medium text-gray-800 mb-4">{i + 1}. {q.questionText}</p>
              <div className="grid grid-cols-1 gap-2">
                {['A', 'B', 'C', 'D'].map(opt => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={`text-left px-4 py-3 rounded-lg border text-sm transition ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                      <span className="font-semibold mr-2">{opt})</span>{q[`option${opt}`]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button onClick={submitExam}
          className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition">
          Sınavı Bitir ve Gönder ({answered}/{questions.length})
        </button>
      </div>
    </div>
  );
}
