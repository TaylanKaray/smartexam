import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Calculator, Atom, FlaskConical, Dna, BookOpen,
  Globe, BarChart3, ArrowLeft, Play, PenLine,
  Lock, ChevronRight, Shuffle, GraduationCap, Trophy,
  PenTool, Lightbulb, Heart, Languages
} from 'lucide-react';

const KPSS_COURSE_IDS = [1, 5, 6, 9, 10];
const YKS_COURSE_IDS  = [1, 2, 3, 4, 5, 6, 11, 12, 13, 14];

const COURSE_CONFIG = {
  'Matematik':               { icon: Calculator,   color: 'text-indigo-600',  bg: 'bg-indigo-50',  ring: 'ring-indigo-200',  sub: 'Sayısal • Temel & İleri' },
  'Fizik':                   { icon: Atom,         color: 'text-sky-600',     bg: 'bg-sky-50',     ring: 'ring-sky-200',     sub: 'Sayısal • Mekanik & Optik' },
  'Kimya':                   { icon: FlaskConical, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200', sub: 'Sayısal • Organik & Analitik' },
  'Biyoloji':                { icon: Dna,          color: 'text-pink-600',    bg: 'bg-pink-50',    ring: 'ring-pink-200',    sub: 'Sayısal • Hücre & Genetik' },
  'Tarih':                   { icon: BookOpen,     color: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-200',   sub: 'Sözel • Osmanlı & Cumhuriyet' },
  'Coğrafya':                { icon: Globe,        color: 'text-teal-600',    bg: 'bg-teal-50',    ring: 'ring-teal-200',    sub: 'Sözel • Türkiye & Dünya' },
  'Türkçe':                  { icon: BookOpen,     color: 'text-violet-600',  bg: 'bg-violet-50',  ring: 'ring-violet-200',  sub: 'KPSS • Dil & Paragraf' },
  'Vatandaşlık':             { icon: BarChart3,    color: 'text-orange-600',  bg: 'bg-orange-50',  ring: 'ring-orange-200',  sub: 'KPSS • Anayasa & Hukuk' },
  'Türk Dili ve Edebiyatı': { icon: PenTool,      color: 'text-rose-600',    bg: 'bg-rose-50',    ring: 'ring-rose-200',    sub: 'TYT-AYT • Dil & Edebiyat' },
  'Felsefe':                 { icon: Lightbulb,    color: 'text-yellow-600',  bg: 'bg-yellow-50',  ring: 'ring-yellow-200',  sub: 'AYT Sözel • Düşünce Sistemleri' },
  'Din Kültürü':             { icon: Heart,        color: 'text-green-600',   bg: 'bg-green-50',   ring: 'ring-green-200',   sub: 'TYT • İslam ve Ahlak Bilgisi' },
  'Yabancı Dil':             { icon: Languages,    color: 'text-cyan-600',    bg: 'bg-cyan-50',    ring: 'ring-cyan-200',    sub: 'AYT • İngilizce Dil Becerileri' },
};

const DEFAULT_CFG = { icon: GraduationCap, color: 'text-slate-600', bg: 'bg-slate-50', ring: 'ring-slate-200', sub: 'Genel' };

export default function Courses() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const [courses, setCourses]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [topics, setTopics]       = useState([]);
  const [progress, setProgress]   = useState({});
  const [unlockMap, setUnlockMap] = useState({});
  const [loading, setLoading]     = useState(true);

  const activePkg = location.state?.pkg || 'YKS';
  const userId    = user?.userId || parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    api.get('/api/courses').then(res => {
      const all = res.data;
      const filtered = activePkg === 'KPSS'
        ? all.filter(c => KPSS_COURSE_IDS.includes(c.id))
        : all.filter(c => YKS_COURSE_IDS.includes(c.id));
      setCourses(filtered);
    }).finally(() => setLoading(false));

    if (userId && !isNaN(userId)) {
      api.get(`/api/courses/progress/user/${userId}`)
        .then(res => setProgress(res.data)).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectCourse = (course) => {
    setSelected(course);
    setTopics([]);
    api.get(`/api/courses/${course.id}/topics`).then(res => {
      setTopics(res.data);
      if (userId && !isNaN(userId)) {
        res.data.forEach(t => {
          api.get(`/api/smart-exam/topic/${t.id}/unlock/${userId}`)
            .then(r => setUnlockMap(prev => ({ ...prev, [t.id]: r.data })))
            .catch(() => {});
        });
      }
    });
  };

  const progressColor = (pct) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

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
            <GraduationCap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Derslerim</p>
            <p className="text-orange-400 text-xs">{activePkg} Paketi</p>
          </div>
        </div>
        {selected && (
          <button onClick={() => { setSelected(null); setTopics([]); }}
            className="ml-auto text-slate-400 hover:text-white text-xs flex items-center gap-1 transition">
            <ArrowLeft size={12} /> Derslere Dön
          </button>
        )}
      </nav>

      <div className="max-w-6xl mx-auto p-6">

        {/* ── Ders Seçimi ── */}
        {!selected && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Dersini Seç</h2>
              <p className="text-slate-500 text-sm">Çalışmak istediğin derse tıkla, konulara ve sınavlara eriş.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((c) => {
                const cfg = COURSE_CONFIG[c.name] || DEFAULT_CFG;
                const Icon = cfg.icon;

                // Tüm konuların ortalama ilerlemesi
                const courseProgress = Object.entries(progress)
                  .filter(([, v]) => v?.courseId === c.id)
                  .map(([, v]) => v?.percent || 0)
                  .filter(p => p > 0);
                const avgProg = courseProgress.length
                  ? Math.round(courseProgress.reduce((a, b) => a + b, 0) / courseProgress.length)
                  : 0;

                return (
                  <button key={c.id} onClick={() => selectCourse(c)}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-left
                      hover:-translate-y-1 hover:shadow-lg hover:border-slate-200 transition-all duration-200">

                    {/* İkon */}
                    <div className={`w-12 h-12 ${cfg.bg} rounded-xl flex items-center justify-center mb-4
                      group-hover:scale-110 transition-transform duration-200`}>
                      <Icon size={22} className={cfg.color} />
                    </div>

                    {/* Başlık */}
                    <h3 className="font-bold text-slate-800 text-base mb-0.5 group-hover:text-indigo-700 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{cfg.sub}</p>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">İlerleme</span>
                        <span className={`font-bold ${avgProg >= 70 ? 'text-emerald-600' : avgProg >= 40 ? 'text-yellow-600' : 'text-slate-400'}`}>
                          {avgProg > 0 ? `%${avgProg}` : 'Başlanmadı'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${progressColor(avgProg)}`}
                          style={{ width: `${avgProg}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-slate-400">Konuları görüntüle</span>
                      <ChevronRight size={15} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Konu Listesi ── */}
        {selected && (
          <>
            {/* Ders başlığı */}
            {(() => {
              const cfg = COURSE_CONFIG[selected.name] || DEFAULT_CFG;
              const Icon = cfg.icon;
              return (
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 ${cfg.bg} rounded-xl flex items-center justify-center`}>
                    <Icon size={22} className={cfg.color} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                    <p className="text-sm text-slate-400">{cfg.sub}</p>
                  </div>
                </div>
              );
            })()}

            {topics.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => {
                  const pData  = progress[topic.id];
                  const pct    = pData?.percent ?? null;
                  const unlock = unlockMap[topic.id];

                  return (
                    <div key={topic.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5
                        hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">

                      {/* Başlık + Skor */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-2">
                          <h3 className="font-bold text-slate-800 text-sm leading-tight">{topic.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{selected.name}</p>
                        </div>
                        {pct !== null && (
                          <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full
                            ${pct >= 70 ? 'bg-emerald-100 text-emerald-700'
                              : pct >= 50 ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-600'}`}>
                            %{pct}
                          </span>
                        )}
                      </div>

                      {/* Level kilitleri */}
                      {unlock && (
                        <div className="flex gap-1.5 mb-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                            ✓ Kolay
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                            ${unlock.orta ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-400'}`}>
                            {unlock.orta ? '✓ Orta' : <><Lock size={8} className="inline mr-0.5" />Orta</>}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                            ${unlock.zor ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                            {unlock.zor ? '✓ Zor' : <><Lock size={8} className="inline mr-0.5" />Zor</>}
                          </span>
                        </div>
                      )}

                      {/* Progress */}
                      {pData ? (
                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{pData.correct}/{pData.total} doğru</span>
                            <span>%{pct}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${progressColor(pct)}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 mb-4 italic">Henüz sınav girilmedi</p>
                      )}

                      {/* Butonlar */}
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/lesson/${topic.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100
                            text-emerald-700 text-xs font-semibold py-2.5 rounded-xl transition">
                          <Play size={12} /> Ders İzle
                        </button>
                        <button onClick={() => navigate(`/smart-exam/${topic.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700
                            text-white text-xs font-semibold py-2.5 rounded-xl transition">
                          <PenLine size={12} /> {pData ? 'Tekrar Gir' : 'Sınava Gir'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Karışık Sınav */}
            {topics.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-[#1a2540] to-[#243056] rounded-2xl p-5 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Shuffle size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Karışık Sınav</p>
                    <p className="text-slate-400 text-xs">Tüm konulardan rastgele sorular</p>
                  </div>
                </div>
                <button onClick={() => navigate('/smart-exam/mixed', { state: { pkg: activePkg } })}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-1.5">
                  Başlat <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Başlangıç mesajı */}
        {!selected && courses.length > 0 && (
          <div className="mt-10 text-center text-slate-400">
            <Trophy size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Çalışmak istediğin derse tıkla</p>
          </div>
        )}
      </div>
    </div>
  );
}
