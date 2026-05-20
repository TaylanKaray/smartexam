import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  GraduationCap, Clock, FileText, Brain, Award,
  BookOpen, ChevronRight, ArrowLeft, Filter
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL',  label: 'Tümü',           icon: FileText },
  { id: 'OSYM', label: 'ÖSYM Çıkmış',    icon: Award },
  { id: 'MEB',  label: 'MEB Denemeleri', icon: BookOpen },
  { id: 'AI',   label: 'AI Denemeleri',  icon: Brain },
];

const CAT_STYLES = {
  OSYM: { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-500',    icon: 'text-red-500',    label: 'ÖSYM Çıkmış' },
  MEB:  { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-500',   icon: 'text-blue-500',   label: 'MEB Denemesi' },
  AI:   { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-500', icon: 'text-purple-500', label: 'AI Üretimi' },
};

export default function ExamList() {
  const navigate = useNavigate();
  const [exams, setExams]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [activePkg, setActivePkg] = useState(() => {
    try {
      return localStorage.getItem('activePackage') || JSON.parse(localStorage.getItem('ownedPackages') || '["YKS"]')[0] || 'YKS';
    } catch { return 'YKS'; }
  });

  useEffect(() => {
    api.get('/api/practice-exams')
      .then(r => setExams(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e => {
    const catOk = activeTab === 'ALL' || e.category === activeTab;
    const pkgOk = e.package_type === activePkg;
    return catOk && pkgOk;
  });

  const grouped = {
    OSYM: filtered.filter(e => e.category === 'OSYM'),
    MEB:  filtered.filter(e => e.category === 'MEB'),
    AI:   filtered.filter(e => e.category === 'AI'),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-[#1a2540] px-6 py-4 flex items-center gap-4 shadow-lg sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')}
          className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-white/10">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Deneme Sınavları</p>
            <p className="text-orange-400 text-xs">Gerçek Sınav Simülatörü</p>
          </div>
        </div>

        {/* Paket seçici */}
        <div className="ml-auto flex gap-2">
          {['YKS','KPSS'].map(p => (
            <button key={p} onClick={() => setActivePkg(p)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${activePkg === p ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
              {p}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">

        {/* Hero */}
        <div className="bg-gradient-to-r from-[#1a2540] to-[#243056] rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Gerçek Sınav Deneyimi</span>
            <h1 className="text-3xl font-bold text-white mt-2 mb-2">{activePkg} Deneme Sınavları</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              ÖSYM çıkmış soruları, MEB denemeleri ve AI üretimi denemelerle gerçek sınav koşullarında pratik yap.
              Geri sayım sayacı, soru navigasyonu ve anlık AI analizi ile eksiksiz sınav deneyimi.
            </p>
            <div className="flex gap-6 mt-5">
              {[['10+','Deneme Sınavı'],['40-120','Soru/Sınav'],['AI','Anlık Analiz']].map(([v,l]) => (
                <div key={l}>
                  <p className="text-2xl font-bold text-orange-400">{v}</p>
                  <p className="text-slate-400 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <FileText size={120} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/5" />
        </div>

        {/* Kategori filtresi */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition
                ${activeTab === id ? 'bg-[#1a2540] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Filter size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Bu kategoride sınav bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, items]) => {
              if (items.length === 0) return null;
              const cs = CAT_STYLES[cat];
              const CatIcon = CATEGORIES.find(c => c.id === cat)?.icon || FileText;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 ${cs.bg} rounded-lg flex items-center justify-center border ${cs.border}`}>
                      <CatIcon size={15} className={cs.icon} />
                    </div>
                    <h2 className="font-bold text-slate-800">{cs.label}</h2>
                    <span className="text-xs text-slate-400">{items.length} sınav</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(exam => (
                      <ExamCard key={exam.id} exam={exam} cs={cs} onStart={() => navigate(`/practice-exam/${exam.id}`)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamCard({ exam, cs, onStart }) {
  const hrs  = Math.floor(exam.duration_minutes / 60);
  const mins = exam.duration_minutes % 60;
  const timeStr = hrs > 0 ? `${hrs}s ${mins}dk` : `${mins} dakika`;

  return (
    <div className={`group bg-white rounded-2xl border ${cs.border} shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-200 overflow-hidden`}>
      {/* Üst renkli bar */}
      <div className={`h-1.5 ${cs.badge}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <span className={`text-[10px] font-bold ${cs.badge} text-white px-2 py-0.5 rounded-full`}>
              {exam.year ? `${exam.year}` : cs.label}
            </span>
            <h3 className="font-bold text-slate-800 text-sm mt-2 leading-tight">{exam.title}</h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{exam.description}</p>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1.5">
            <FileText size={12} className={cs.icon} />
            <strong className="text-slate-700">{exam.total_questions}</strong> soru
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} className={cs.icon} />
            <strong className="text-slate-700">{timeStr}</strong>
          </span>
        </div>

        <button onClick={onStart}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white ${cs.badge} hover:opacity-90 transition group-hover:shadow-md`}>
          Sınava Başla <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
