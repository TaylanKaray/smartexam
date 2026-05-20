import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Target, TrendingUp, Trophy, BookOpen, RotateCcw,
  Shuffle, Users, Bell, Star, CheckCircle, ChevronRight,
  GraduationCap, Zap, BarChart3, Lock, Sparkles,
  Share2, Video, MessageCircle, ArrowRight, Menu, X
} from 'lucide-react';

/* ── Veri ── */
const PACKAGES = {
  YKS: {
    label: 'YKS 2026',
    badge: 'En Popüler',
    plans: [
      {
        name: 'TYT Paketi', tag: 'Başlangıç',
        price: 'Ücretsiz',
        features: ['Matematik & Türkçe', 'Tarih & Coğrafya', 'AI Soru Analizi', '15 Soruluk Testler', 'Rozet Sistemi'],
      },
      {
        name: 'AYT Sayısal', tag: 'Popüler', highlight: true,
        price: 'Ücretsiz',
        features: ['Fizik, Kimya, Biyoloji', 'Matematik İleri', 'Level Kilit Sistemi', 'AI Öğrenme Analizi', 'Kişisel Koç AI'],
      },
      {
        name: 'AYT Sözel', tag: 'Kapsamlı',
        price: 'Ücretsiz',
        features: ['Tarih & Coğrafya İleri', 'Edebiyat', 'Günlük Tekrar Planı', 'Zayıf Konu Tespiti', 'Video Dersler'],
      },
    ],
  },
  KPSS: {
    label: 'KPSS Lisans',
    badge: 'Yeni',
    plans: [
      {
        name: 'Genel Yetenek', tag: 'Temel',
        price: 'Ücretsiz',
        features: ['Matematik', 'Türkçe', 'AI Soru Analizi', 'Görülmemiş Soru Sistemi', 'Performans Takibi'],
      },
      {
        name: 'Genel Kültür', tag: 'Popüler', highlight: true,
        price: 'Ücretsiz',
        features: ['Tarih & Coğrafya', 'Vatandaşlık', 'Anayasa Hukuku', 'Level Kilit Sistemi', 'AI Analiz'],
      },
      {
        name: 'Tam Paket', tag: 'Kapsamlı',
        price: 'Ücretsiz',
        features: ['Tüm KPSS Konuları', '8 Ders / 80 Konu', 'Günlük Tekrar Planı', 'Zayıf Konu AI Tespiti', 'KPSS Öğretmenleri'],
      },
    ],
  },
  LGS: {
    label: 'LGS 2026',
    badge: 'Yakında',
    plans: [
      { name: '6. Sınıf', tag: 'Hazırlık', price: 'Yakında', features: ['Matematik', 'Fen Bilimleri', 'Türkçe', 'İnkılap Tarihi', 'Din Kültürü'], comingSoon: true },
      { name: '7. Sınıf', tag: 'Orta', highlight: true, price: 'Yakında', features: ['Matematik', 'Fen Bilimleri', 'Türkçe', 'İnkılap Tarihi', 'İngilizce'], comingSoon: true },
      { name: '8. Sınıf', tag: 'LGS Hazırlık', price: 'Yakında', features: ['Tüm LGS Konuları', 'AI Analiz', 'Deneme Sınavları', 'Video Dersler', 'Öğretmen Koçluğu'], comingSoon: true },
    ],
  },
};

const FEATURES = [
  { icon: Brain,      title: 'AI Destekli Analiz',      desc: 'Yapay zekâ her sınavdan sonra zayıf konularını tespit eder, kişisel öneriler sunar.' },
  { icon: Target,     title: 'Eksiğine Özel Sorular',   desc: 'Görülmemiş soru sistemi ile her sınav birbirinden farklı, tekrar eden soru yok.' },
  { icon: Lock,       title: 'Level Kilit Sistemi',     desc: 'Kolay → Orta → Zor sıralamasıyla temelden ileri seviyeye kontrollü ilerleme.' },
  { icon: RotateCcw,  title: 'Aralıklı Tekrar',         desc: 'Spaced repetition algoritması unutmaya karşı seni zamanında uyarır.' },
  { icon: Trophy,     title: 'Rozet & Motivasyon',      desc: '15+ farklı rozet ile başarılarını takip et, sıralamada yerini al.' },
  { icon: Users,      title: 'Uzman Öğretmenler',       desc: 'MEB müfredatı uzmanı öğretmenlerin video dersleri her konuda mevcut.' },
  { icon: BarChart3,  title: 'Performans Takibi',       desc: 'Ders bazında ortalamalar, en iyi/zayıf konu analizi gerçek zamanlı.' },
  { icon: Bell,       title: 'Akıllı Bildirimler',      desc: 'Çalışmayı unuttuğunda sistem seni hatırlatır, hedefinden sapmazsın.' },
];

const STATS = [
  { val: '66+',  lbl: 'Konu' },
  { val: '300+', lbl: 'Soru/Konu' },
  { val: '3',    lbl: 'Sınav Paketi' },
  { val: 'AI',   lbl: 'Destekli' },
];

const SUCCESS_STORIES = [
  { name: 'Ayşe K.', exam: 'YKS 2025', score: '487 puan', rank: 'TYT 1.si', avatar: 'AK' },
  { name: 'Mehmet Y.', exam: 'KPSS 2025', score: '98 puan', rank: 'Lisans 1.si', avatar: 'MY' },
  { name: 'Selin A.', exam: 'YKS 2025', score: '495 puan', rank: 'AYT Eşit 12.si', avatar: 'SA' },
  { name: 'Kemal D.', exam: 'LGS 2025', score: '500 puan', rank: 'Türkiye 1.si', avatar: 'KD' },
];

/* ── Ana Bileşen ── */
export default function LandingPage() {
  const navigate       = useNavigate();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activePkg, setActivePkg]   = useState('YKS');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pkg = PACKAGES[activePkg];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#1a2540] shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base leading-none">SmartExam</span>
              <span className="text-orange-400 font-bold text-base"> AI</span>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Paketlerimiz', 'Özellikler', 'Başarılar'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="text-slate-300 hover:text-white text-sm font-medium transition">{l}</a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-slate-300 hover:text-white text-sm font-medium transition px-3 py-2">
              Giriş Yap
            </button>
            <button onClick={() => navigate('/register')}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-orange-500/30">
              Ücretsiz Başla
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-white" onClick={() => setMobileMenu(m => !m)}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-[#1a2540] border-t border-white/10 px-6 py-4 space-y-3">
            {['Paketlerimiz', 'Özellikler', 'Başarılar'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                className="block text-slate-300 hover:text-white text-sm font-medium py-2">{l}</a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <button onClick={() => navigate('/login')} className="text-slate-300 text-sm py-2">Giriş Yap</button>
              <button onClick={() => navigate('/register')}
                className="bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-xl">Ücretsiz Başla</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen bg-gradient-to-br from-[#0f1729] via-[#1a2f6e] to-[#2d1b4e] flex items-center overflow-hidden">
        {/* Dekoratif arka plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Sol — metin */}
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-400/30 text-orange-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles size={12} /> Türkiye'nin AI Destekli Sınav Platformu
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Yapay Zekâ ile<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                Sınavlara Akıllıca
              </span><br />
              Hazırlan
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-lg">
              AI destekli kişisel analiz, görülmemiş soru sistemi ve level kilit mekanizmasıyla
              YKS, KPSS ve LGS'ye en etkili şekilde hazırlan.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button onClick={() => navigate('/register')}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-xl shadow-orange-500/30 text-base">
                Hemen Ücretsiz Dene <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-white border border-white/20 hover:border-white/40 hover:bg-white/5 font-semibold px-8 py-4 rounded-xl transition text-base">
                Giriş Yap
              </button>
            </div>

            {/* İstatistikler */}
            <div className="flex gap-8">
              {STATS.map(({ val, lbl }) => (
                <div key={lbl}>
                  <p className="text-2xl font-extrabold text-white">{val}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ — mock dashboard */}
          <div className="hidden lg:block">
            <div className="bg-[#1a2540]/80 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Mock header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white font-bold">Hoş geldin, Taylan! 👋</p>
                  <p className="text-slate-400 text-xs">YKS Paketi Aktif</p>
                </div>
                <div className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-400/20">
                  AI Analiz Hazır
                </div>
              </div>
              {/* Mock stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['24', 'Sınav', 'text-white'], ['%72', 'Ortalama', 'text-yellow-400'], ['5', 'Rozet', 'text-orange-400']].map(([val, lbl, cl]) => (
                  <div key={lbl} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${cl}`}>{val}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{lbl}</p>
                  </div>
                ))}
              </div>
              {/* Mock AI mesaj */}
              <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-xl p-4 mb-4">
                <p className="text-indigo-300 text-xs font-bold mb-1 flex items-center gap-1"><Brain size={10} /> AI Analiz</p>
                <p className="text-slate-300 text-xs leading-relaxed">Kimya en güçlü dersin. %80 ortalamanı %90'a çıkarmak için <strong className="text-white">zor sorulara</strong> odaklan.</p>
              </div>
              {/* Mock konu kartları */}
              <div className="space-y-2">
                {[['Biyoloji — Hücre', '%45', 'bg-yellow-400'], ['Matematik — Türev', '%82', 'bg-emerald-400'], ['Kimya — Organik', '%91', 'bg-emerald-500']].map(([topic, pct, bar]) => (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs flex-1">{topic}</span>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full`} style={{ width: pct }} />
                    </div>
                    <span className="text-slate-300 text-xs w-8 text-right">{pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAKETLERİMİZ ── */}
      <section id="paketlerimiz" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-orange-500 text-sm font-bold uppercase tracking-widest">Paketlerimiz</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-800 mt-2 mb-4">
              Hedefine Uygun Paketi Seç
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              YKS, KPSS ve LGS için hazırlanmış kapsamlı içerikler. Tamamı ücretsiz, hemen başla.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-10">
            {Object.entries(PACKAGES).map(([key, val]) => (
              <button key={key} onClick={() => setActivePkg(key)}
                className={`relative px-6 py-3 rounded-xl text-sm font-bold transition-all
                  ${activePkg === key
                    ? 'bg-[#1a2540] text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
                {val.label}
                {val.badge && (
                  <span className={`absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full
                    ${key === 'YKS' ? 'bg-orange-500 text-white' : key === 'KPSS' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {val.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Paket Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pkg.plans.map((plan) => (
              <div key={plan.name}
                className={`relative bg-white rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden
                  ${plan.highlight ? 'border-orange-300 ring-2 ring-orange-400/30' : 'border-slate-100'}`}>
                {plan.highlight && (
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold text-center py-2">
                    ⭐ En Çok Tercih Edilen
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">{plan.tag}</p>
                      <h3 className="text-lg font-extrabold text-slate-800 mt-1">{plan.name}</h3>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full
                      ${plan.comingSoon ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700'}`}>
                      {plan.price}
                    </span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle size={15} className={plan.comingSoon ? 'text-slate-300' : 'text-emerald-500'} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => navigate(plan.comingSoon ? '/' : '/register')}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition
                      ${plan.comingSoon
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : plan.highlight
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200'
                          : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                    {plan.comingSoon ? 'Yakında' : 'Ücretsiz Başla →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÖZELLİKLER ── */}
      <section id="özellikler" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-orange-500 text-sm font-bold uppercase tracking-widest">Farkımız Ne?</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-800 mt-2 mb-4">
              Neden SmartExam AI?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Sıradan soru bankalarından farkımız: her öğrenciye özel AI analizi ve akıllı öğrenme sistemi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:border-orange-100 hover:shadow-lg transition-all duration-300">
                <div className="w-11 h-11 bg-gradient-to-br from-[#1a2540] to-indigo-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={20} className="text-orange-400" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-2">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BAŞARILAR ── */}
      <section id="başarılar" className="py-20 bg-[#1a2540]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-orange-400 text-sm font-bold uppercase tracking-widest">Başarı Hikayeleri</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mt-2 mb-4">
              Öğrencilerimiz Ne Diyor?
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              AI destekli sistemimizle hazırlanan öğrencilerimizin başarıları.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUCCESS_STORIES.map(({ name, exam, score, rank, avatar }) => (
              <div key={name}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{name}</p>
                    <p className="text-slate-400 text-xs">{exam}</p>
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-400/20 rounded-xl p-3 text-center">
                  <p className="text-orange-400 text-2xl font-extrabold">{score}</p>
                  <p className="text-slate-300 text-xs mt-1">{rank}</p>
                </div>
                <div className="flex mt-3">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
                </div>
              </div>
            ))}
          </div>

          {/* CTA banner */}
          <div className="mt-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-extrabold text-white mb-1">Sen de bu başarıya ortak ol!</h3>
              <p className="text-orange-100 text-sm">Ücretsiz hesap oluştur, hemen çalışmaya başla.</p>
            </div>
            <button onClick={() => navigate('/register')}
              className="bg-white text-orange-600 font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition shadow-lg whitespace-nowrap flex items-center gap-2">
              Hemen Başla <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0f1729] text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Logo + açıklama */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <GraduationCap size={15} className="text-white" />
                </div>
                <span className="text-white font-bold">SmartExam <span className="text-orange-400">AI</span></span>
              </div>
              <p className="text-xs leading-relaxed mb-4">
                Yapay zekâ destekli, kişiselleştirilmiş sınav hazırlık platformu.
              </p>
              <div className="flex gap-3">
                {[Share2, Video, MessageCircle].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 bg-white/5 hover:bg-orange-500/20 rounded-lg flex items-center justify-center cursor-pointer transition">
                    <Icon size={14} className="text-slate-400 hover:text-orange-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Paketler */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Paketlerimiz</p>
              <ul className="space-y-2 text-xs">
                {['YKS 2026', 'KPSS Lisans', 'LGS 2026 (Yakında)', 'TYT Paketi', 'AYT Sayısal'].map(l => (
                  <li key={l}><a href="#paketlerimiz" className="hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Platform</p>
              <ul className="space-y-2 text-xs">
                {['Özellikler', 'Başarı Hikayeleri', 'Öğretmenler', 'AI Analiz'].map(l => (
                  <li key={l}><a href="#özellikler" className="hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Hesap */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Hesap</p>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition">Giriş Yap</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition">Kayıt Ol</button></li>
                <li><span className="hover:text-white transition cursor-pointer">Gizlilik Politikası</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Kullanım Koşulları</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2026 SmartExam AI. Tüm hakları saklıdır.</p>
            <p className="text-slate-500">Yapay zekâ destekli eğitim platformu · Türkiye</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
