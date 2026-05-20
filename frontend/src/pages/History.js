import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  ArrowLeft, BarChart3, CheckCircle, XCircle, Clock,
  TrendingUp, Minus
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid
} from 'recharts';

const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };
const DIFFICULTY_COLORS = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-red-100 text-red-600',
};

const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2540] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-white font-bold">{payload[0]?.payload?.subject}</p>
      <p className="text-orange-400">%{payload[0]?.value}</p>
    </div>
  );
};

const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2540] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400">{label} — {payload[0]?.payload?.konu}</p>
      <p className="text-indigo-400 font-bold">%{payload[0]?.value}</p>
    </div>
  );
};

const PKG_SUBJECTS = {
  YKS:  ['Matematik','Fizik','Kimya','Biyoloji','Tarih','Coğrafya',
          'Türk Dili ve Edebiyatı','Felsefe','Din Kültürü','Yabancı Dil','Karışık'],
  KPSS: ['Matematik','Türkçe','Tarih','Coğrafya','Vatandaşlık','Karışık'],
};

export default function History() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading]       = useState(true);

  const activePkg = (() => {
    try { return localStorage.getItem('activePackage') || JSON.parse(localStorage.getItem('ownedPackages') || '["YKS"]')[0]; }
    catch { return 'YKS'; }
  })();

  useEffect(() => {
    const userId = user?.userId || parseInt(localStorage.getItem('userId'));
    if (!userId) return;
    api.get(`/api/exam-results/user/${userId}`)
      .then(res => setAllResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Aktif pakete göre filtrele
  const allowedSubjects = PKG_SUBJECTS[activePkg] || PKG_SUBJECTS.YKS;
  const results = allResults.filter(r =>
    r.packageType === activePkg ||
    (!r.packageType && allowedSubjects.includes(r.subject))
  );

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}d ${s % 60}s` : `${s}s`;
  };

  const scoreColor = (v) =>
    v >= 80 ? 'text-emerald-600' : v >= 50 ? 'text-yellow-600' : 'text-red-500';
  const scoreBarColor = (v) =>
    v >= 80 ? 'bg-emerald-500' : v >= 50 ? 'bg-yellow-400' : 'bg-red-400';

  const subjectAvg = Object.values(
    results.reduce((acc, r) => {
      if (!acc[r.subject]) acc[r.subject] = { subject: r.subject, total: 0, count: 0 };
      acc[r.subject].total += r.scorePercentage;
      acc[r.subject].count += 1;
      return acc;
    }, {})
  ).map(s => ({ subject: s.subject, Başarı: Math.round(s.total / s.count) }));

  const timeSeries = [...results].reverse().slice(-10).map((r, i) => ({
    name: `#${i + 1}`,
    Başarı: Math.round(r.scorePercentage),
    konu: r.subject,
  }));

  const totalExams   = results.length;
  const overallAvg   = totalExams ? Math.round(results.reduce((s, r) => s + r.scorePercentage, 0) / totalExams) : 0;
  const trend        = timeSeries.length >= 2
    ? timeSeries[timeSeries.length - 1].Başarı - timeSeries[0].Başarı
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-[#1a2540] px-6 py-4 flex items-center gap-4 shadow-lg sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Geçmiş Sınavlar — {activePkg}</p>
            <p className="text-orange-400 text-xs">{totalExams} sınav · %{overallAvg} ortalama</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">

        {results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <BarChart3 size={36} className="text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-600 mb-1">Henüz sınav çözülmedi</p>
            <p className="text-slate-400 text-sm">Sınavlara girdikçe geçmiş ve grafikler burada görünecek.</p>
          </div>
        ) : (
          <>
            {/* Özet banner */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Toplam Sınav', value: totalExams, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Ortalama', value: `%${overallAvg}`, color: scoreColor(overallAvg), bg: 'bg-white' },
                { label: 'Trend', value: trend >= 0 ? `+${trend}` : `${trend}`, color: trend >= 0 ? 'text-emerald-600' : 'text-red-500', bg: 'bg-white' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl border border-slate-100 shadow-sm p-4 text-center`}>
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {subjectAvg.length >= 3 && (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-700 text-sm mb-4">Konu Bazlı Başarı</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={subjectAvg}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} tickCount={4} />
                      <Radar dataKey="Başarı" stroke="#f97316" fill="#f97316" fillOpacity={0.2}
                        strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
                      <Tooltip content={<RadarTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {timeSeries.length >= 2 && (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                    Başarı Trendi
                    {trend >= 0
                      ? <TrendingUp size={14} className="text-emerald-500" />
                      : <Minus size={14} className="text-red-400" />}
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<LineTooltip />} />
                      <Line type="monotone" dataKey="Başarı" stroke="#6366f1" strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Sınav Kartları */}
            <div className="space-y-3">
              {[...results].reverse().map((r) => {
                const score  = Math.round(r.scorePercentage);
                const blank  = (r.totalQuestions || 0) - (r.correctAnswers || 0) - (r.wrongAnswers || 0);
                return (
                  <div key={r.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5
                      hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">

                    {/* Başlık satırı */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-sm">{r.subject}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                            ${DIFFICULTY_COLORS[r.difficultyLevel] || 'bg-slate-100 text-slate-500'}`}>
                            {DIFFICULTY_LABELS[r.difficultyLevel]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(r.examDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-2xl font-extrabold ${scoreColor(score)}`}>
                        %{score}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full ${scoreBarColor(score)}`}
                        style={{ width: `${score}%` }} />
                    </div>

                    {/* Rozetler */}
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-full">
                        <CheckCircle size={11} /> {r.correctAnswers} Doğru
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-full">
                        <XCircle size={11} /> {r.wrongAnswers} Yanlış
                      </span>
                      {blank > 0 && (
                        <span className="flex items-center gap-1 text-xs font-semibold bg-slate-50 text-slate-500 px-2.5 py-1.5 rounded-full">
                          <Minus size={11} /> {blank} Boş
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-semibold bg-slate-50 text-slate-500 px-2.5 py-1.5 rounded-full ml-auto">
                        <Clock size={11} /> {fmt(r.durationSeconds || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
