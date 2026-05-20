import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };

export default function StudentDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [spaced, setSpaced] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/api/exam-results/user/${userId}`),
      api.get(`/api/spaced-repetition/all/${userId}`),
    ]).then(([rRes, sRes]) => {
      setResults(rRes.data.reverse());
      setSpaced(sRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  const studentEmail = results[0]?.user?.email || `Öğrenci #${userId}`;

  const subjectData = Object.values(
    results.reduce((acc, r) => {
      if (!acc[r.subject]) acc[r.subject] = { subject: r.subject, total: 0, count: 0 };
      acc[r.subject].total += r.scorePercentage;
      acc[r.subject].count += 1;
      return acc;
    }, {})
  ).map(s => ({ subject: s.subject, Ortalama: Math.round(s.total / s.count) }));

  const barColor = (val) => val >= 80 ? '#10b981' : val >= 50 ? '#f59e0b' : '#ef4444';

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/teacher')} className="text-indigo-600 text-sm mb-4">← Öğretmen Paneli</button>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Öğrenci Detayı</h1>
        <p className="text-gray-500 mb-6">{studentEmail}</p>

        {results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">Bu öğrenciye ait sınav yok.</div>
        ) : (
          <>
            {/* Özet istatistikler */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label="Toplam Sınav" value={results.length} color="bg-indigo-600" />
              <StatCard label="Ort. Başarı" value={`%${Math.round(results.reduce((s,r) => s + r.scorePercentage, 0) / results.length)}`} color="bg-emerald-600" />
              <StatCard label="Konu Sayısı" value={subjectData.length} color="bg-purple-600" />
            </div>

            {/* Konu bazlı bar grafik */}
            {subjectData.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">Konu Bazlı Ortalama Başarı</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `%${v}`} />
                    <Bar dataKey="Ortalama" radius={[6, 6, 0, 0]}>
                      {subjectData.map((entry, i) => (
                        <Cell key={i} fill={barColor(entry.Ortalama)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tekrar Takvimi */}
            {spaced.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">📅 Aralıklı Tekrar Takvimi</h3>
                <div className="space-y-2">
                  {spaced.map(s => {
                    const isOverdue = new Date(s.nextReviewDate) <= new Date();
                    return (
                      <div key={s.id} className={`flex justify-between items-center px-4 py-2.5 rounded-xl text-sm ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                        <span className="font-medium text-gray-800">{s.topic?.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xs">{s.repetitionCount}. tekrar</span>
                          <span className={`font-semibold text-xs ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                            {isOverdue ? '⚠️ Gecikti' : `📆 ${new Date(s.nextReviewDate).toLocaleDateString('tr-TR')}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sınav listesi */}
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{r.subject}</p>
                    <p className="text-xs text-gray-400">{new Date(r.examDate).toLocaleString('tr-TR')} — {DIFFICULTY_LABELS[r.difficultyLevel]}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${r.scorePercentage >= 80 ? 'text-emerald-600' : r.scorePercentage >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      %{Math.round(r.scorePercentage)}
                    </p>
                    <p className="text-xs text-gray-400">{r.correctAnswers}D / {r.wrongAnswers}Y</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`${color} text-white rounded-2xl p-4 shadow text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80 mt-1">{label}</p>
    </div>
  );
}
