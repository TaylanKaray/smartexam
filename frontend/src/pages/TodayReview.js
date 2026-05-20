import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  ArrowLeft, RotateCcw, Play, PenLine,
  CheckCircle, BookOpen, Calendar, Sparkles
} from 'lucide-react';

const PKG_SUBJECTS = {
  YKS:  ['Matematik','Fizik','Kimya','Biyoloji','Tarih','Coğrafya',
          'Türk Dili ve Edebiyatı','Felsefe','Din Kültürü','Yabancı Dil'],
  KPSS: ['Matematik','Türkçe','Tarih','Coğrafya','Vatandaşlık'],
};

export default function TodayReview() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const activePkg = (() => {
    try { return localStorage.getItem('activePackage') || JSON.parse(localStorage.getItem('ownedPackages') || '["YKS"]')[0]; }
    catch { return 'YKS'; }
  })();

  useEffect(() => {
    const userId = user?.userId || parseInt(localStorage.getItem('userId'));
    if (!userId) return;
    api.get(`/api/spaced-repetition/today/${userId}`)
      .then(res => {
        const allowedSubjects = PKG_SUBJECTS[activePkg] || PKG_SUBJECTS.YKS;
        const filtered = (res.data || []).filter(r =>
          !r.topic?.course?.name || allowedSubjects.includes(r.topic.course.name)
        );
        setReviews(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

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
            <RotateCcw size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Bugün Tekrar Et</p>
            <p className="text-orange-400 text-xs">Aralıklı Tekrar Sistemi</p>
          </div>
        </div>
        {reviews.length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {reviews.length} konu bekliyor
          </span>
        )}
      </nav>

      <div className="max-w-5xl mx-auto p-6">

        {reviews.length === 0 ? (
          /* Boş durum */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle size={36} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Bugün tekrar gereken konu yok!</h2>
            <p className="text-slate-400 text-sm mb-8 text-center max-w-xs">
              Harika! Tüm tekrarlarını tamamladın. Yeni sınavlar çözdükçe program oluşacak.
            </p>
            <button onClick={() => navigate('/courses')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition shadow-md text-sm flex items-center gap-2">
              <Sparkles size={16} /> Yeni Sınav Çöz
            </button>
          </div>
        ) : (
          <>
            {/* Açıklama */}
            <div className="bg-gradient-to-r from-[#1a2540] to-[#243056] rounded-2xl p-5 mb-6 flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Calendar size={20} className="text-orange-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Ebbinghaus Tekrar Programı</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Unutma eğrisine göre bugün tekrarlanması gereken {reviews.length} konu var.
                  Tekrar edilen konular daha uzun süre akılda kalır.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reviews.map(r => (
                <div key={r.id}
                  className="bg-white rounded-2xl border border-red-100 shadow-sm p-5
                    hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{r.topic?.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.topic?.course?.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs text-slate-500 mb-4 bg-slate-50 rounded-xl p-3">
                    <span className="flex items-center gap-1">
                      <RotateCcw size={11} className="text-indigo-400" />
                      {r.repetitionCount}. tekrar
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-orange-400" />
                      {r.intervalDays} günde bir
                    </span>
                    <span className="ml-auto text-red-500 font-semibold">Bugün!</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/lesson/${r.topic?.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100
                        text-emerald-700 text-xs font-semibold py-2.5 rounded-xl transition">
                      <Play size={12} /> Ders İzle
                    </button>
                    <button onClick={() => navigate(`/smart-exam/${r.topic?.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700
                        text-white text-xs font-semibold py-2.5 rounded-xl transition">
                      <PenLine size={12} /> Sınava Gir
                    </button>
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
