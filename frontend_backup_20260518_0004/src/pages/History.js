import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts';

const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = user?.userId || parseInt(localStorage.getItem('userId'));
    if (!userId) return;
    api.get(`/api/exam-results/user/${userId}`)
      .then(res => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}d ${s % 60}s` : `${s}s`;
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Konu bazlı ortalama başarı (radar için)
  const subjectAvg = Object.values(
    results.reduce((acc, r) => {
      if (!acc[r.subject]) acc[r.subject] = { subject: r.subject, total: 0, count: 0 };
      acc[r.subject].total += r.scorePercentage;
      acc[r.subject].count += 1;
      return acc;
    }, {})
  ).map(s => ({ subject: s.subject, Başarı: Math.round(s.total / s.count) }));

  // Zaman serisi (line chart için — sondan 8 sınav)
  const timeSeries = [...results]
    .reverse()
    .slice(-8)
    .map((r, i) => ({
      name: `#${i + 1}`,
      Başarı: Math.round(r.scorePercentage),
      konu: r.subject,
    }));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-indigo-600 text-sm mb-4">← Dashboard</button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Geçmiş Sınavlar</h1>

        {results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Henüz sınav çözmediniz.
          </div>
        ) : (
          <>
            {/* Grafikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Konu bazlı radar */}
              {subjectAvg.length >= 3 && (
                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">Konu Bazlı Başarı</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={subjectAvg}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <Radar name="Başarı" dataKey="Başarı" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      <Tooltip formatter={(v) => `%${v}`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Zaman serisi çizgi */}
              {timeSeries.length >= 2 && (
                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">Başarı Trendi</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `%${v}`} />
                      <Legend />
                      <Line type="monotone" dataKey="Başarı" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Sınav Kartları */}
            <div className="space-y-4">
              {[...results].reverse().map((r) => (
                <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{r.subject}</h3>
                      <span className="text-xs text-gray-400">
                        {new Date(r.examDate).toLocaleString('tr-TR')} — {DIFFICULTY_LABELS[r.difficultyLevel]}
                      </span>
                    </div>
                    <span className={`text-3xl font-bold ${scoreColor(r.scorePercentage)}`}>
                      %{Math.round(r.scorePercentage)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-emerald-50 rounded-xl py-3">
                      <p className="text-2xl font-bold text-emerald-600">{r.correctAnswers}</p>
                      <p className="text-xs text-gray-500 mt-1">Doğru</p>
                    </div>
                    <div className="bg-red-50 rounded-xl py-3">
                      <p className="text-2xl font-bold text-red-500">{r.wrongAnswers}</p>
                      <p className="text-xs text-gray-500 mt-1">Yanlış</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-3">
                      <p className="text-2xl font-bold text-gray-600">{formatDuration(r.durationSeconds)}</p>
                      <p className="text-xs text-gray-500 mt-1">Süre</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${r.scorePercentage >= 80 ? 'bg-emerald-500' : r.scorePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${r.scorePercentage}%` }}
                      />
                    </div>
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
