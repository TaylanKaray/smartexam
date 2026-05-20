import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import NotificationBell from '../components/NotificationBell';
import PomodoroTimer from '../components/PomodoroTimer';
import {
  LayoutDashboard, BookOpen, Shuffle, RotateCcw, BarChart3,
  Users, Brain, LogOut, ChevronRight, Trophy, Sparkles,
  TrendingUp, Target, Zap, Lock, Bell, User, BookMarked,
  Settings, GraduationCap, Star, FileText
} from 'lucide-react';

/* ── Sabitler ────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Derslerim',      icon: BookOpen,        path: '/courses' },
  { label: 'Karışık Sınav',  icon: Shuffle,         path: '/smart-exam/mixed' },
  { label: 'Deneme Sınavları', icon: FileText,      path: '/practice-exams' },
  { label: 'Bugün Tekrar',   icon: RotateCcw,       path: '/today-review', badge: 'review' },
  { label: 'İstatistikler',  icon: BarChart3,       path: '/history' },
  { label: 'AI Öneriler',    icon: Brain,           path: '/recommendations', badge: 'ai' },
  { label: 'Öğretmenler',    icon: Users,           path: '/teachers' },
];

const TEACHER_NAV = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Öğrenci Analizi',   icon: BarChart3,       path: '/teacher' },
  { label: 'Soru Yönetimi',     icon: Settings,        path: '/questions' },
  { label: 'Ders Yönetimi',     icon: BookMarked,      path: '/course-manager' },
];

const PACKAGES = [
  { id: 'YKS',  label: 'YKS',  sub: 'TYT & AYT',    emoji: '🎯', available: true },
  { id: 'KPSS', label: 'KPSS', sub: 'Lisans',         emoji: '🏛️', available: true },
  { id: 'LGS',  label: 'LGS',  sub: '6-7-8. Sınıf',  emoji: '📚', available: false },
];

const PKG_SUBJECTS = {
  YKS:  ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya'],
  KPSS: ['Matematik', 'Tarih', 'Coğrafya', 'Türkçe', 'Vatandaşlık'],
  LGS:  [],
};

const PKG_INFO = {
  YKS:  'YKS paketi aktif! Matematik, Fizik, Kimya, Biyoloji, Tarih, Coğrafya dersleri mevcut.',
  KPSS: 'KPSS paketi aktif! Matematik, Tarih, Coğrafya, Türkçe ve Vatandaşlık dersleri mevcut.',
  LGS:  'LGS paketi yakında geliyor!',
};

/* ── AI Analiz Mesajı ────────────────────────────────────── */
function aiAnalyze(best, globalAvg) {
  if (!best) return null;
  const gap = best.avg - globalAvg;
  if (best.avg >= 85)
    return `${best.subject} alanında mükemmelsin! %${best.avg} ortalama ile üst seviyedesin. Bu başarını diğer derslere de taşı.`;
  if (best.avg >= 70)
    return `${best.subject} en güçlü dersin. %${best.avg} ortalamayı %85'e çıkarmak için zor sorulara odaklan.`;
  if (gap >= 10)
    return `${best.subject} genel ortalamanın %${gap} üzerinde — bu dersteki tekniğini diğer derslere uygula.`;
  return `${best.subject} en iyi performans gösterdiğin alan. Düzenli tekrarla bu başarıyı koru.`;
}

/* ── Ana Bileşen ─────────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── Ham veri: tüm sınav sonuçları ── */
  const [allResults, setAllResults]     = useState([]);
  const [leaderboard, setLeaderboard]   = useState([]);
  const [allResultsForLeaderboard, setAllResultsForLeaderboard] = useState([]);
  const [badges, setBadges]             = useState([]);
  const [reviewCount, setReviewCount]   = useState(0);
  const [weakTopics, setWeakTopics]     = useState([]);
  const [activePkg, setActivePkg]       = useState('YKS');

  /* ── Paket sahipliği (localStorage) ── */
  const [ownedPackages, setOwnedPackages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ownedPackages')) || ['YKS']; }
    catch { return ['YKS']; }
  });

  const purchasePkg = (pkgId) => {
    const updated = [...new Set([...ownedPackages, pkgId])];
    setOwnedPackages(updated);
    localStorage.setItem('ownedPackages', JSON.stringify(updated));
  };

  const isTeacher  = user?.roles?.includes('ROLE_TEACHER');
  const userId     = user?.userId || parseInt(localStorage.getItem('userId'));
  const firstName  = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Öğrenci';

  /* ── Veri çekme: allResults + leaderboard + badges + review ── */
  useEffect(() => {
    if (!userId) return;
    if (!isTeacher) {
      api.get(`/api/exam-results/user/${userId}`)
        .then(res => setAllResults(res.data || []))
        .catch(() => {});

      api.get(`/api/badges/user/${userId}`)
        .then(res => setBadges(res.data)).catch(() => {});

      api.get(`/api/spaced-repetition/today/${userId}`)
        .then(res => setReviewCount(res.data.length)).catch(() => {});

      // Zayıf konuları TopicMastery'den çek
      api.get(`/api/topic-mastery/user/${userId}`)
        .then(res => {
          const weak = (res.data || [])
            .filter(m => m.masteryScore != null && m.masteryScore < 50)
            .sort((a, b) => a.masteryScore - b.masteryScore)
            .slice(0, 5);
          setWeakTopics(weak);
        }).catch(() => {});
    }
    api.get('/api/exam-results/all')
      .then(res => setAllResultsForLeaderboard(res.data))
      .catch(() => {});
  }, [userId, isTeacher]);

  /* ── Paket filtreli leaderboard (reaktif) ── */
  useEffect(() => {
    if (!allResultsForLeaderboard.length) return;
    const pkgSubjects = PKG_SUBJECTS[activePkg] || [];
    const filtered = pkgSubjects.length
      ? allResultsForLeaderboard.filter(r => pkgSubjects.includes(r.subject))
      : allResultsForLeaderboard;
    const byUser = {};
    filtered.forEach(r => {
      const email = r.user?.email || '?';
      if (!byUser[email]) byUser[email] = { email, sum: 0, total: 0 };
      byUser[email].sum   += r.scorePercentage;
      byUser[email].total += 1;
    });
    setLeaderboard(
      Object.values(byUser)
        .map(u => ({ ...u, avg: Math.round(u.sum / u.total) }))
        .sort((a, b) => b.avg - a.avg).slice(0, 5)
    );
  }, [allResultsForLeaderboard, activePkg]);

  /* ── Paket filtreli istatistik (reaktif) ── */
  const stats = useMemo(() => {
    const subjects = PKG_SUBJECTS[activePkg] || [];
    // packageType eşleşeni önce al, yoksa subject filtresi uygula
    const r = allResults.filter(x =>
      x.packageType === activePkg ||
      (!x.packageType && subjects.includes(x.subject))
    );

    if (!r.length) return null;

    const avg = Math.round(r.reduce((s, x) => s + x.scorePercentage, 0) / r.length);

    const subjectMap = {};
    r.forEach(exam => {
      const s = exam.subject || 'Genel';
      if (!subjectMap[s]) subjectMap[s] = { sum: 0, count: 0 };
      subjectMap[s].sum   += exam.scorePercentage;
      subjectMap[s].count += 1;
    });
    const subjectStats = Object.entries(subjectMap)
      .map(([subject, d]) => ({ subject, avg: Math.round(d.sum / d.count), count: d.count }))
      .sort((a, b) => b.avg - a.avg);

    const best  = subjectStats[0];
    const worst = subjectStats[subjectStats.length - 1];
    const aiMsg = best ? aiAnalyze(best, avg) : null;

    return {
      total: r.length,
      avg,
      bestSubject: best?.subject,
      bestScore: best?.avg,
      worstSubject: worst?.subject,
      worstScore: worst?.avg,
      subjectStats,
      aiMsg,
    };
  }, [allResults, activePkg]);

  const navItems    = isTeacher ? TEACHER_NAV : NAV_ITEMS;
  const { pathname } = useLocation();

  const isOwned     = ownedPackages.includes(activePkg);
  const pkgObj      = PACKAGES.find(p => p.id === activePkg);

  /* Paket banner rengi */
  const infoBanner = PKG_INFO[activePkg];
  const isLgsActive = activePkg === 'LGS';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-[#1a2540] flex flex-col shadow-2xl z-20">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">SmartExam</p>
              <p className="text-orange-400 text-xs font-semibold">AI Platform</p>
            </div>
          </div>
          {/* Aktif paket rozeti */}
          {!isTeacher && (
            <div className="mt-3 bg-orange-500/10 border border-orange-400/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Zap size={11} className="text-orange-400" />
              <span className="text-orange-300 text-xs font-medium">Aktif: {activePkg} Paketi</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.path;
            const badgeVal = item.badge === 'review' ? reviewCount : null;
            return (
              <button key={item.path}
                onClick={() => navigate(item.path, item.path === '/smart-exam/mixed' ? { state: { pkg: activePkg } } : undefined)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                  ${isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}>
                <item.icon size={17} className={isActive ? 'text-orange-400' : 'group-hover:text-orange-400 transition-colors'} />
                <span className="flex-1 text-left">{item.label}</span>
                {badgeVal > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {badgeVal}
                  </span>
                )}
                {item.badge === 'ai' && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">AI</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Alt kullanıcı alanı */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-1">
          <button onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 text-sm transition">
            <User size={16} /> Profilim
          </button>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 text-sm transition">
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ── ANA İÇERİK ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <h1 className="text-base font-bold text-slate-800">
              {isTeacher ? 'Öğretmen Paneli' : 'Merhaba, ' + firstName + ' 👋'}
            </h1>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isTeacher && <NotificationBell userId={userId} />}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">{firstName[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-slate-700">{firstName}</span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* ── Hero Banner ── */}
          <div className="relative bg-gradient-to-r from-[#1a2540] via-[#1e3a5f] to-[#1a2540] rounded-2xl overflow-hidden shadow-xl">
            <div className="relative z-10 p-8">
              <div className="flex items-start justify-between">
                <div>
                  {!isTeacher && (
                    <span className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-400/20">
                      <Star size={10} fill="currentColor" /> {activePkg} Paketi {isOwned ? 'Aktif' : 'Seçili'}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {isTeacher ? 'Öğretmen Paneline Hoş Geldin!' : `Hoş geldin, ${firstName}!`}
                  </h2>
                  <p className="text-slate-300 text-sm max-w-md">
                    {isTeacher
                      ? 'Öğrenci performanslarını analiz et, soru havuzunu yönet.'
                      : `AI motoru analizlerini tamamladı. Bugün ${activePkg} çalışmaları için harika bir gün!`}
                  </p>

                  {/* İstatistik rozetleri — aktif pakete göre filtrelenmiş */}
                  {!isTeacher && stats && (
                    <div className="flex gap-6 mt-5">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                        <p className="text-slate-400 text-xs mt-0.5">Sınav</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${stats.avg >= 70 ? 'text-emerald-400' : stats.avg >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          %{stats.avg}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">Ortalama</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-400">{badges.length}</p>
                        <p className="text-slate-400 text-xs mt-0.5">Rozet</p>
                      </div>
                      {reviewCount > 0 && (
                        <>
                          <div className="w-px bg-white/10" />
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-400">{reviewCount}</p>
                            <p className="text-slate-400 text-xs mt-0.5">Bekliyor</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Dekoratif */}
                <div className="hidden lg:block">
                  <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-400/20">
                    <Sparkles size={40} className="text-orange-400 opacity-60" />
                  </div>
                </div>
              </div>
            </div>
            {/* Arka plan dekorasyon */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-orange-500/5 rounded-full translate-y-1/2 pointer-events-none" />
          </div>

          {/* ── Paket Seçici ── */}
          {!isTeacher && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sınav Paketi Seç</p>
              </div>
              <div className="flex gap-3">
                {PACKAGES.map(p => {
                  const owned     = ownedPackages.includes(p.id);
                  const isActive  = activePkg === p.id;

                  if (!p.available) {
                    /* Yakında — grayed out, not clickable */
                    return (
                      <div key={p.id}
                        className="relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 flex-1 max-w-[180px] opacity-50 cursor-not-allowed select-none">
                        <Lock size={11} className="absolute top-2 right-2 text-slate-400" />
                        <span className="text-xl">{p.emoji}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold leading-none text-slate-500">{p.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{p.sub}</p>
                        </div>
                        <span className="ml-auto bg-slate-300 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          Yakında
                        </span>
                      </div>
                    );
                  }

                  if (owned) {
                    /* Owned and available — fully clickable, show "Aktif" badge when selected */
                    return (
                      <button key={p.id}
                        onClick={() => setActivePkg(p.id)}
                        className={`relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 flex-1 max-w-[180px]
                          ${isActive
                            ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                            : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <span className="text-xl">{p.emoji}</span>
                        <div className="text-left">
                          <p className={`text-sm font-bold leading-none ${isActive ? 'text-orange-600' : 'text-slate-700'}`}>
                            {p.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{p.sub}</p>
                        </div>
                        {isActive && (
                          <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Aktif</span>
                        )}
                      </button>
                    );
                  }

                  /* Available but NOT owned — show lock icon + "Paketi Al" button */
                  return (
                    <div key={p.id}
                      className={`relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 flex-1 max-w-[180px]
                        ${isActive
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-slate-200 bg-white'}`}>
                      <Lock size={11} className="absolute top-2 right-2 text-slate-400" />
                      <span className="text-xl">{p.emoji}</span>
                      <div className="text-left">
                        <p className="text-sm font-bold leading-none text-slate-700">{p.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.sub}</p>
                        <button
                          onClick={() => { purchasePkg(p.id); setActivePkg(p.id); }}
                          className="mt-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full transition">
                          Paketi Al
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paket bilgi banner */}
              {(() => {
                if (activePkg === 'LGS') {
                  return (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
                      <Zap size={16} className="text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-700">
                        <span className="font-bold">LGS paketi</span> yakında geliyor! Şu an YKS ve KPSS içerikleri aktif.
                      </p>
                    </div>
                  );
                }
                if (isOwned) {
                  return (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                      <Zap size={16} className="text-emerald-500 shrink-0" />
                      <p className="text-sm text-emerald-700">{PKG_INFO[activePkg]}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* ── Rozetler ── */}
          {!isTeacher && badges.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Trophy size={15} className="text-orange-500" /> Kazanılan Rozetler
              </h3>
              <div className="flex flex-wrap gap-2">
                {badges.map(ub => (
                  <div key={ub.id}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl px-3 py-2 hover:shadow-sm transition">
                    <span className="text-xl">{ub.badge?.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{ub.badge?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Kartlar + Sağ Panel ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Menü Kartları */}
            <div className="lg:col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                {isTeacher ? 'Yönetim Araçları' : 'Hızlı Erişim'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {!isTeacher && (<>
                  {/* Derslerim — package-aware */}
                  <MenuCard icon={BookOpen}    iconColor="text-indigo-500"  iconBg="bg-indigo-50"
                    title="Derslerim"       desc={`${activePkg} konularını çalış, video izle, sınava gir`}
                    locked={isLgsActive || !isOwned}
                    onClick={() => {
                      if (!isLgsActive && isOwned) navigate('/courses', { state: { pkg: activePkg } });
                    }} />

                  {/* Karışık Sınav — only if owned */}
                  <MenuCard icon={Shuffle}     iconColor="text-purple-500"  iconBg="bg-purple-50"
                    title="Karışık Sınav"  desc="Tüm konulardan AI destekli karma test"
                    locked={!isOwned}
                    onClick={() => { if (isOwned) navigate('/smart-exam/mixed', { state: { pkg: activePkg } }); }} />

                  <MenuCard icon={RotateCcw}   iconColor="text-red-500"     iconBg="bg-red-50"
                    title="Bugün Tekrar"   desc={reviewCount > 0 ? `${reviewCount} konu bekliyor!` : 'Bekleyen konu yok'}
                    badge={reviewCount > 0 ? reviewCount : null}
                    onClick={() => navigate('/today-review')} />

                  <MenuCard icon={BarChart3}   iconColor="text-emerald-500" iconBg="bg-emerald-50"
                    title="İstatistikler"  desc="Geçmiş sınavlar ve gelişim grafiği"
                    onClick={() => navigate('/history')} />

                  <MenuCard icon={Brain}       iconColor="text-orange-500"  iconBg="bg-orange-50"
                    title="AI Öneriler"    desc="Zayıf konular için yapay zekâ analizi"
                    badge="Yeni" badgeColor="bg-orange-500"
                    onClick={() => navigate('/recommendations')} />

                  <MenuCard icon={Users}       iconColor="text-teal-500"    iconBg="bg-teal-50"
                    title="Öğretmenler"    desc="Müfredat uzmanları ve video dersler"
                    onClick={() => navigate('/teachers')} />

                  <MenuCard icon={FileText}    iconColor="text-rose-500"    iconBg="bg-rose-50"
                    title="Deneme Sınavları" desc="ÖSYM çıkmış, MEB ve AI denemeleri"
                    badge="Yeni" badgeColor="bg-rose-500"
                    onClick={() => navigate('/practice-exams')} />
                </>)}

                {isTeacher && (<>
                  <MenuCard icon={BarChart3}   iconColor="text-orange-500"  iconBg="bg-orange-50"
                    title="Öğrenci Analizi"   desc="Detaylı performans raporları"
                    onClick={() => navigate('/teacher')} />
                  <MenuCard icon={Settings}    iconColor="text-indigo-500"  iconBg="bg-indigo-50"
                    title="Soru Yönetimi"     desc="Konu bazlı soru ekle ve düzenle"
                    onClick={() => navigate('/questions')} />
                  <MenuCard icon={BookOpen}    iconColor="text-purple-500"  iconBg="bg-purple-50"
                    title="Ders Yönetimi"     desc="Kurs ve konu ekle, düzenle"
                    onClick={() => navigate('/course-manager')} />
                </>)}
              </div>
            </div>

            {/* Sağ Panel */}
            <div className="space-y-4">

              {/* İstatistik — pakete göre filtrelenmiş */}
              {!isTeacher && stats && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <TrendingUp size={15} className="text-indigo-500" /> Performansım
                  </h3>
                  <div className="space-y-3">
                    <StatBar label="Ortalama Başarı" value={stats.avg}
                      color={stats.avg >= 70 ? 'bg-emerald-500' : stats.avg >= 50 ? 'bg-yellow-400' : 'bg-red-400'} />
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-500">Toplam Sınav</span>
                      <span className="font-bold text-slate-700">{stats.total}</span>
                    </div>

                    {/* En iyi ders — AI analizi */}
                    {stats.bestSubject && (
                      <div className="pt-1 border-t border-slate-50">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 flex items-center gap-1">
                            <span className="text-emerald-500">↑</span> En İyi Ders
                          </span>
                          <span className="font-bold text-emerald-600">{stats.bestSubject}</span>
                        </div>
                        <StatBar label="" value={stats.bestScore}
                          color="bg-emerald-400" />
                        <p className="text-[10px] text-emerald-700 mt-1 text-right font-medium">
                          %{stats.bestScore} ortalama ({stats.total} sınavdan)
                        </p>
                      </div>
                    )}

                    {/* En zayıf ders */}
                    {stats.worstSubject && stats.worstSubject !== stats.bestSubject && (
                      <div className="pt-1 border-t border-slate-50">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 flex items-center gap-1">
                            <span className="text-red-400">↓</span> Gelişim Alanı
                          </span>
                          <span className="font-bold text-red-500">{stats.worstSubject}</span>
                        </div>
                        <StatBar label="" value={stats.worstScore}
                          color="bg-red-400" />
                      </div>
                    )}

                    {/* AI mesajı + zayıf konular */}
                    {(stats.aiMsg || weakTopics.length > 0) && (
                      <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                          <Brain size={10} /> AI Analiz
                        </p>
                        {stats.aiMsg && (
                          <p className="text-[11px] text-indigo-700 leading-relaxed">{stats.aiMsg}</p>
                        )}
                        {weakTopics.length > 0 && (
                          <div className="border-t border-indigo-100 pt-2">
                            <p className="text-[10px] font-bold text-red-500 mb-1.5">Çalışman Gereken Konular:</p>
                            <div className="space-y-1">
                              {weakTopics.map(t => (
                                <div key={t.topicId} className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-600 truncate max-w-[120px]">
                                    {t.courseName} → {t.topicName}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                    ${t.masteryScore < 30 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                    %{t.masteryScore}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <Trophy size={15} className="text-yellow-500" /> Sıralama Tablosu
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.map((u, i) => (
                      <div key={u.email} className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 last:border-0">
                        <span className="w-6 text-center text-sm">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-slate-400">{i+1}</span>}
                        </span>
                        <span className="flex-1 text-xs text-slate-700 font-medium truncate">{u.email.split('@')[0]}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          u.avg >= 80 ? 'bg-emerald-100 text-emerald-700'
                          : u.avg >= 50 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-600'}`}>
                          %{u.avg}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Motivasyon kutusu */}
              {!isTeacher && (
                <div className="bg-gradient-to-br from-[#1a2540] to-[#243056] rounded-2xl p-5 text-center">
                  <Target size={28} className="text-orange-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-bold mb-1">Hedefine Odaklan!</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Her gün düzenli çalışmak başarının anahtarıdır.
                  </p>
                  <button onClick={() => navigate('/courses')}
                    className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-xl transition">
                    Çalışmaya Başla →
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>{/* /scroll */}
      </main>

      {/* Pomodoro — sadece öğrencilere */}
      {!isTeacher && (
        <PomodoroTimer userId={userId} topicId={null} />
      )}
    </div>
  );
}

/* ── Alt Bileşenler ──────────────────────────────────────── */
function MenuCard({ icon: Icon, iconColor, iconBg, title, desc, onClick, badge, badgeColor = 'bg-orange-500', locked }) {
  return (
    <button onClick={onClick}
      className={`group relative bg-white rounded-2xl p-5 text-left border border-slate-100 shadow-sm
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-200
        ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      {badge && (
        <span className={`absolute top-3 right-3 ${badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
          {badge}
        </span>
      )}
      {locked && <Lock size={12} className="absolute top-3 right-3 text-slate-400" />}
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} className={iconColor} />
      </div>
      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{title}</p>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
      <ChevronRight size={13} className="absolute bottom-4 right-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
    </button>
  );
}

function StatBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-slate-700">%{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
