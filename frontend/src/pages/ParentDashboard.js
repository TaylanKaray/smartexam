import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  GraduationCap, TrendingUp, BarChart3, RotateCcw,
  AlertTriangle, LogOut, Brain, CheckCircle, UserPlus,
  Search, AlertCircle, Zap, BookOpen, Target, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell
} from 'recharts';

/* ── Özel Radar Tooltip ── */
const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2540] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-white text-xs font-bold">{payload[0]?.payload?.subject}</p>
      <p className="text-orange-400 text-sm font-bold">%{payload[0]?.value}</p>
    </div>
  );
};

/* ── Özel Bar Tooltip ── */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  const color = val >= 70 ? '#10b981' : val >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-[#1a2540] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-slate-300 text-xs">{label}</p>
      <p style={{ color }} className="text-sm font-bold">%{val} Ortalama</p>
    </div>
  );
};

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [linking, setLinking]       = useState(false);
  const [linkMsg, setLinkMsg]       = useState('');

  const parentId = user?.userId || parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    if (!parentId) return;
    api.get(`/api/parent/${parentId}/child-summary`)
      .then(r => setData(r.data))
      .catch(() => setError('no-child'))
      .finally(() => setLoading(false));
  }, [parentId]);

  const linkChild = async () => {
    if (!childEmail.trim()) return;
    setLinking(true); setLinkMsg('');
    try {
      const res = await api.post(
        `/api/parent/assign-by-email?parentId=${parentId}&studentEmail=${encodeURIComponent(childEmail)}`
      );
      if (res.data?.error) {
        setLinkMsg(res.data.error);
      } else {
        setLinkMsg(`✓ ${res.data.studentName} ile bağlantı kuruldu! Yükleniyor...`);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      const msg = e.response?.data?.error || 'Bağlantı kurulamadı. E-postayı kontrol edin.';
      setLinkMsg(msg);
    }
    finally { setLinking(false); }
  };

  /* ── Yükleniyor ── */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Çocuğunuzun verileri yükleniyor...</p>
      </div>
    </div>
  );

  /* ── Çocuk Bağlama Ekranı ── */
  if (error === 'no-child') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={26} className="text-orange-500" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg mb-1">Çocuğunuzu Bağlayın</h2>
          <p className="text-slate-500 text-sm">Takip etmek istediğiniz öğrencinin sistemdeki e-posta adresini girin.</p>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={childEmail} onChange={e => setChildEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && linkChild()}
              placeholder="ogrenci@mail.com"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <button onClick={linkChild} disabled={linking}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60">
            {linking ? 'Aranıyor...' : 'Çocuğumu Bağla'}
          </button>
        </div>
        {linkMsg && (
          <p className={`mt-3 text-sm text-center font-medium ${linkMsg.includes('kuruldu') ? 'text-emerald-600' : 'text-red-500'}`}>{linkMsg}</p>
        )}
        <div className="mt-5 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-600">
          <p className="font-bold mb-1">Demo için:</p>
          <p>Öğrenci e-postası: <span className="font-mono font-bold">ahmet_kaleci767@hotmail.com</span></p>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="mt-4 w-full text-slate-400 hover:text-red-500 text-xs text-center transition">Çıkış Yap</button>
      </div>
    </div>
  );

  /* ── Veri ── */
  const avg          = data?.overallAvg || 0;
  const avgColor     = avg >= 70 ? 'text-emerald-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-500';
  const radarData    = (data?.subjectAvgs || []).map(s => ({ subject: s.subject, puan: s.avg }));
  const barData      = (data?.subjectAvgs || []).map(s => ({ name: s.subject?.slice(0, 7), full: s.subject, avg: s.avg }));
  const weakSubjects = data?.weakSubjects || [];
  const errorProfile = data?.errorProfile || '';
  const errorColors  = {
    DİKKAT_EKSİKLİĞİ: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', text: 'text-amber-700', label: '⚡ Dikkat Eksikliği' },
    KONU_EKSİKLİĞİ:   { bg: 'bg-red-50',   border: 'border-red-200',   icon: 'text-red-500',   text: 'text-red-700',   label: '📚 Konu Eksikliği' },
    KARMA:             { bg: 'bg-purple-50', border: 'border-purple-200',icon: 'text-purple-500',text: 'text-purple-700',label: '🔀 Karma' },
    YETERLİ_VERİ_YOK: { bg: 'bg-slate-50',  border: 'border-slate-200', icon: 'text-slate-400', text: 'text-slate-600', label: '📊 Analiz Bekleniyor' },
  };
  const ec = errorColors[errorProfile] || errorColors['YETERLİ_VERİ_YOK'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-[#1a2540] px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={17} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">SmartExam AI</p>
            <p className="text-orange-400 text-xs">Veli Paneli — {data?.childName}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition">
          <LogOut size={15} /> Çıkış
        </button>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-5">

        {/* Hero banner */}
        <div className="bg-gradient-to-r from-[#1a2540] to-[#1e3a6e] rounded-2xl p-6 shadow-lg">
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">Takip Edilen Öğrenci</p>
          <h1 className="text-2xl font-bold text-white mb-1">{data?.childName}</h1>
          <div className="flex gap-8 mt-4">
            <div><p className="text-2xl font-bold text-white">{data?.totalExams}</p><p className="text-indigo-300 text-xs">Sınav</p></div>
            <div className="w-px bg-white/10" />
            <div><p className={`text-2xl font-bold ${avgColor.replace('text-', 'text-')}`} style={{ color: avg >= 70 ? '#34d399' : avg >= 50 ? '#fbbf24' : '#f87171' }}>%{avg}</p><p className="text-indigo-300 text-xs">Ortalama</p></div>
            <div className="w-px bg-white/10" />
            <div><p className="text-2xl font-bold text-orange-400">{weakSubjects.length}</p><p className="text-indigo-300 text-xs">Zayıf Ders</p></div>
            {data?.pendingReview > 0 && <>
              <div className="w-px bg-white/10" />
              <div><p className="text-2xl font-bold text-red-400">{data.pendingReview}</p><p className="text-indigo-300 text-xs">Tekrar Bekliyor</p></div>
            </>}
          </div>
        </div>

        {/* Hata Analizi — en üstte, en kritik bilgi */}
        <div className={`${ec.bg} border ${ec.border} rounded-2xl p-5`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
              <Brain size={18} className={ec.icon} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-xs font-bold uppercase tracking-wider ${ec.text}`}>AI Hata Analizi</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 ${ec.text}`}>{ec.label}</span>
              </div>
              <p className={`text-sm leading-relaxed ${ec.text}`}>{data?.errorTip}</p>
              {(data?.attentionErrors > 0 || data?.knowledgeGaps > 0) && (
                <div className="mt-3 space-y-3">
                  {/* Dikkat Hataları */}
                  {data.attentionErrors > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Zap size={13} className="text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">{data.attentionErrors} dikkat hatası — ders dağılımı:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(data.attentionBySubject || []).map(s => (
                          <span key={s.subject} className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                            {s.subject} ({s.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Konu Eksiklikleri */}
                  {data.knowledgeGaps > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BookOpen size={13} className="text-red-500" />
                        <span className="text-xs font-bold text-red-700">{data.knowledgeGaps} konu eksikliği — ders dağılımı:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(data.knowledgeBySubject || []).map(s => (
                          <span key={s.subject} className="text-[11px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                            {s.subject} ({s.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Destek Gerektiren Konular */}
        {(data?.knowledgeByTopic?.length > 0 || weakSubjects.length > 0) && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500" /> Destek Gerektiren Konular
            </h3>

            {/* Konu bazlı eksiklikler */}
            {(data?.knowledgeByTopic?.length > 0) ? (
              <div className="space-y-2 mb-4">
                {data.knowledgeByTopic.map((t, i) => (
                  <div key={t.topic} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {i === 0 && <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shrink-0">ÖNCELİKLİ</span>}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{t.topic}</p>
                        <p className="text-xs text-slate-400">{t.subject}</p>
                      </div>
                    </div>
                    <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full shrink-0 ml-2">
                      {t.count} hata
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback — konu verisi yoksa ders bazlı göster */
              <div className="space-y-2 mb-4">
                {weakSubjects.map((s, i) => (
                  <div key={s.subject} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">ÖNCELİKLİ</span>}
                      <span className="text-sm font-medium text-slate-700">{s.subject}</span>
                      <span className="text-xs text-slate-400">({s.count} sınav)</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">%{s.avg}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Target size={11} />
              En öncelikli konu: <strong className="text-red-600">
                {data?.knowledgeByTopic?.[0]?.topic || data?.prioritySubject}
              </strong> — Video dersini birlikte izleyin.
            </p>
          </div>
        )}

        {/* Ders performans tablosu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-500" /> Ders Bazında Performans
          </h3>
          <div className="space-y-2 mb-4">
            {[...(data?.subjectAvgs || [])].reverse().map(s => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-28 truncate">{s.subject}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500
                    ${s.avg >= 70 ? 'bg-emerald-500' : s.avg >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${s.avg}%` }} />
                </div>
                <span className={`text-xs font-bold w-8 text-right
                  ${s.avg >= 70 ? 'text-emerald-600' : s.avg >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  %{s.avg}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-16 text-center
                  ${s.avg >= 70 ? 'bg-emerald-100 text-emerald-700' : s.avg >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                  {s.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Ders Ortalamaları</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {barData.map((entry) => (
                      <Cell key={entry.name}
                        fill={entry.avg >= 70 ? '#10b981' : entry.avg >= 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Henüz sınav verisi yok</div>
            )}
          </div>

          {/* Radar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-orange-500" /> Konu Haritası
              <span className="text-[10px] text-slate-400 font-normal">— üzerine gelerek detay görebilirsiniz</span>
            </h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickCount={4} />
                  <Radar dataKey="puan" stroke="#f97316" fill="#f97316" fillOpacity={0.25} strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
                  <Tooltip content={<RadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Henüz sınav verisi yok</div>
            )}
          </div>
        </div>

        {/* Son sınavlar */}
        {data?.recentExams?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Son Sınavlar</h3>
            <div className="space-y-2">
              {data.recentExams.map((e, i) => {
                const dateLabel = (() => {
                  if (!e.examDate) return null;
                  const d = new Date(e.examDate);
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(today.getDate() - 1);
                  const isSameDay = (a, b) =>
                    a.getFullYear() === b.getFullYear() &&
                    a.getMonth() === b.getMonth() &&
                    a.getDate() === b.getDate();
                  if (isSameDay(d, today)) return 'Bugün';
                  if (isSameDay(d, yesterday)) return 'Dün';
                  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
                })();

                return (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle size={14} className={`shrink-0 ${e.scorePercentage >= 50 ? 'text-emerald-500' : 'text-red-400'}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 font-medium truncate">{e.subject}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-400">{e.totalQuestions} soru</span>
                          {dateLabel && (
                            <>
                              <span className="text-slate-200 text-xs">·</span>
                              <span className="text-xs text-slate-400">{dateLabel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {e.scorePercentage >= 50
                        ? <ArrowUp size={12} className="text-emerald-500" />
                        : <ArrowDown size={12} className="text-red-400" />}
                      <span className={`text-sm font-bold px-3 py-1 rounded-full
                        ${e.scorePercentage >= 70 ? 'bg-emerald-100 text-emerald-700'
                          : e.scorePercentage >= 50 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-600'}`}>
                        %{Math.round(e.scorePercentage)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pb-4">
          🔒 Yalnızca görüntüleme — Sadece çocuğunuzun verileri gösterilmektedir.
        </p>
      </div>
    </div>
  );
}
