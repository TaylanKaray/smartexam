import { useLocation, useNavigate } from 'react-router-dom';

const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };

export default function ExamResult() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    navigate('/dashboard');
    return null;
  }

  const { questions, answers, elapsed, subject, difficulty, score, correct, wrong } = state;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m} dk ${s % 60} sn` : `${s} sn`;
  };

  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  const scoreBg = score >= 80 ? 'bg-emerald-50' : score >= 50 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Özet Kartı */}
        <div className={`${scoreBg} rounded-2xl shadow p-6 mb-6 text-center`}>
          <p className="text-gray-600 font-medium mb-1">{subject} — {DIFFICULTY_LABELS[difficulty]}</p>
          <p className={`text-6xl font-bold ${scoreColor} my-3`}>%{score}</p>
          <p className="text-gray-500 text-sm">Süre: {formatTime(elapsed)}</p>
          <div className="flex justify-center gap-8 mt-4">
            <div>
              <p className="text-3xl font-bold text-emerald-600">{correct}</p>
              <p className="text-xs text-gray-500">Doğru</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-500">{wrong}</p>
              <p className="text-xs text-gray-500">Yanlış</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-500">{questions.length - correct - wrong}</p>
              <p className="text-xs text-gray-500">Boş</p>
            </div>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button onClick={() => navigate('/recommendations')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
            AI Önerimi Gör
          </button>
          <button onClick={() => navigate('/exam')}
            className="flex-1 bg-white border border-indigo-300 text-indigo-600 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition">
            Tekrar Çöz
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
            Dashboard
          </button>
        </div>

        {/* Soru Detayları */}
        <h2 className="font-bold text-gray-700 mb-3">Soru Analizi</h2>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isBlank = !userAnswer;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl shadow p-5 border-l-4 ${
                  isBlank ? 'border-gray-300' : isCorrect ? 'border-emerald-500' : 'border-red-400'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="font-medium text-gray-800 flex-1 pr-4">
                    <span className="text-gray-400 mr-2">{i + 1}.</span>
                    {q.questionText}
                  </p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                    isBlank ? 'bg-gray-100 text-gray-500' :
                    isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {isBlank ? 'Boş' : isCorrect ? 'Doğru' : 'Yanlış'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const val = q[`option${opt}`];
                    const isUserChoice = userAnswer === opt;
                    const isRightAnswer = q.correctAnswer === opt;
                    return (
                      <div
                        key={opt}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                          isRightAnswer ? 'bg-emerald-100 text-emerald-800 font-semibold' :
                          isUserChoice && !isRightAnswer ? 'bg-red-100 text-red-700' :
                          'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="font-bold">{opt})</span>
                        <span>{val}</span>
                        {isRightAnswer && <span className="ml-auto">✓</span>}
                        {isUserChoice && !isRightAnswer && <span className="ml-auto">✗</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
