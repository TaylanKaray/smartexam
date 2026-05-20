import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Sparkles, Brain, TrendingUp,
  TrendingDown, Minus, Bot, Clock,
  Play, Lock, PenLine, AlertCircle, BookOpenCheck
} from 'lucide-react';

/* ─── Ders → Konu eşlemesi ───────────────────────────────────────── */
const SUBJECT_TOPIC_MAP = {
  'Matematik':   { topicId: 2,  subtitle: 'Logaritma' },
  'Fizik':       { topicId: 5,  subtitle: 'Kuvvet ve Hareket' },
  'Kimya':       { topicId: 8,  subtitle: 'Asitler ve Bazlar' },
  'Biyoloji':    { topicId: 18, subtitle: 'Hücre Bölünmesi ve Üreme' },
  'Tarih':       { topicId: 26, subtitle: 'Kurtuluş Savaşı' },
  'Coğrafya':    { topicId: 30, subtitle: 'İklim ve Hava Olayları' },
  'Türkçe':      { topicId: 69, subtitle: 'Paragraf Bilgisi' },
  'Vatandaşlık': { topicId: 78, subtitle: 'Temel Haklar ve Ödevler' },
};

const getTopicInfo = (subject) =>
  SUBJECT_TOPIC_MAP[subject] || { topicId: 999, subtitle: 'Genel Konu' };

/* ─── Seviye renk/ikon konfigürasyonu ───────────────────────────── */
const LEVEL_CONFIG = {
  0: {
    label: 'Harika Gidiyorsun!',
    icon: TrendingUp,
    badge: 'bg-emerald-100 text-emerald-700',
    bar: 'bg-emerald-500',
    glow: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  1: {
    label: 'Gelişme Var',
    icon: Minus,
    badge: 'bg-yellow-100 text-yellow-700',
    bar: 'bg-yellow-400',
    glow: 'bg-yellow-50 border-yellow-200',
    iconBg: 'bg-yellow-100 text-yellow-600',
  },
  2: {
    label: 'Yoğun Çalış!',
    icon: TrendingDown,
    badge: 'bg-red-100 text-red-600',
    bar: 'bg-red-500',
    glow: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100 text-red-600',
  },
};

/* ─── Hata türü konfigürasyonu ───────────────────────────────────── */
const ERROR_CONFIG = {
  careless_mistake: {
    tag: 'Dikkat Hatası',
    tagStyle: 'bg-amber-100 text-amber-700',
    text: 'Kolay sorularda ortalama 12 saniyede, çok hızlı cevap vererek hata yapıyorsun. Sistemimiz burada odaklanma problemi tespit etti.',
    textBg: 'bg-amber-50',
  },
  knowledge_gap: {
    tag: 'Bilgi Eksikliği',
    tagStyle: 'bg-violet-100 text-violet-700',
    text: 'Zor sorularda ortalama 3 dakika harcayıp hata yapıyorsun. Bu konuda yapısal bilgi eksikliklerin var.',
    textBg: 'bg-violet-50/60',
  },
};

const getErrorType = (rec) =>
  rec.recommendedDifficulty === 2 ? 'knowledge_gap' : 'careless_mistake';

const PKG_SUBJECTS = {
  YKS:  ['Matematik','Fizik','Kimya','Biyoloji','Tarih','Coğrafya',
          'Türk Dili ve Edebiyatı','Felsefe','Din Kültürü','Yabancı Dil','Karışık'],
  KPSS: ['Matematik','Türkçe','Tarih','Coğrafya','Vatandaşlık','Karışık'],
};

/* ─── Ana bileşen ────────────────────────────────────────────────── */
export default function Recommendations() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const activePkg = (() => {
    try { return localStorage.getItem('activePackage') || JSON.parse(localStorage.getItem('ownedPackages') || '["YKS"]')[0]; }
    catch { return 'YKS'; }
  })();

  useEffect(() => {
    const userId = user?.userId || parseInt(localStorage.getItem('userId'));
    if (!userId) return;
    api.get(`/api/recommendations/user/${userId}`)
      .then(res => {
        const allowedSubjects = PKG_SUBJECTS[activePkg] || PKG_SUBJECTS.YKS;
        const filtered = res.data.filter(r => allowedSubjects.includes(r.subject));
        setRecs(filtered.reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const showLockedToast = () =>
    toast('Bu kilidi açmak için önce konu anlatım videosunu tamamlamalısın.', {
      icon: '🔒',
      style: { background: '#1a2540', color: '#fff', fontSize: '13px' },
      duration: 3500,
    });

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
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">AI Öneriler</p>
            <p className="text-orange-400 text-xs">Yapay Zekâ Analizi</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">

        {/* Hero */}
        <div className="bg-gradient-to-r from-[#1a2540] to-[#243056] rounded-2xl p-6 mb-8 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <Bot size={28} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">AI Performans Analizi</h1>
            <p className="text-slate-300 text-sm">
              Her sınavdan sonra yapay zekâ hata profilini analiz eder ve kişisel öneriler üretir.
            </p>
          </div>
          <Sparkles size={60} className="ml-auto text-white/5 hidden lg:block" />
        </div>

        {recs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain size={28} className="text-indigo-400" />
            </div>
            <p className="font-bold text-slate-700 text-lg mb-1">Henüz öneri yok</p>
            <p className="text-slate-400 text-sm">Bir sınav çözdükten sonra AI analizi burada görünecek.</p>
            <button onClick={() => navigate('/courses')}
              className="mt-6 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm">
              Sınava Başla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {recs.map((rec) => {
              const cfg              = LEVEL_CONFIG[rec.recommendedDifficulty] || LEVEL_CONFIG[1];
              const conf             = Math.round(rec.confidenceScore || 0);
              const Icon             = cfg.icon;
              const errorType        = getErrorType(rec);
              const errCfg           = ERROR_CONFIG[errorType];
              const { topicId, subtitle } = getTopicInfo(rec.subject);
              const displayTitle     = `${rec.subject} — ${subtitle}`;

              return (
                <div key={rec.id}
                  className={`bg-white rounded-2xl border shadow-sm p-6 hover:-translate-y-0.5 hover:shadow-md transition-all ${cfg.glow}`}>

                  {/* Başlık */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{displayTitle}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {new Date(rec.recommendedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${errCfg.tagStyle}`}>
                        {errorType === 'careless_mistake'
                          ? <AlertCircle size={9} />
                          : <BookOpenCheck size={9} />}
                        {errCfg.tag}
                      </span>
                    </div>
                  </div>

                  {/* AI Analiz Metni */}
                  <p className={`text-xs text-slate-600 leading-relaxed mb-4 rounded-xl p-3 ${errCfg.textBg}`}>
                    {errCfg.text}
                  </p>

                  {/* Güven Skoru */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Sparkles size={10} className="text-orange-400" /> AI Güven Skoru
                      </span>
                      <span className="font-bold text-slate-700">%{conf}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                        style={{ width: `${conf}%` }} />
                    </div>
                  </div>

                  {/* Aksiyon Rotası */}
                  {errorType === 'careless_mistake' ? (
                    /* Dikkat Hatası → tek buton, doğrudan sınava */
                    <button
                      onClick={() => navigate(`/smart-exam/${topicId}`)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                        text-white text-xs font-semibold py-2.5 rounded-xl transition">
                      <PenLine size={13} /> 5 Soruluk Pratik Yap
                    </button>
                  ) : (
                    /* Bilgi Eksikliği → iki aşamalı rota */
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/lesson/${topicId}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700
                          text-white text-xs font-semibold py-2.5 rounded-xl transition">
                        <Play size={12} /> Önce Konuyu İzle
                      </button>
                      <button
                        onClick={showLockedToast}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200
                          text-slate-400 text-xs font-semibold py-2.5 rounded-xl transition">
                        <Lock size={11} /> Sonra Test Çöz
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
