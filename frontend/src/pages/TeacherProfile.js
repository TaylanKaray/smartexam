import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Play, PenLine, BookOpen, GraduationCap, Video } from 'lucide-react';

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher]   = useState(null);
  const [topics, setTopics]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get(`/api/teachers/${id}`),
      api.get(`/api/teachers/${id}/curriculum`),
    ]).then(([tRes, cRes]) => {
      if (tRes.status === 'fulfilled') setTeacher(tRes.value.data);
      if (cRes.status === 'fulfilled') {
        const data = cRes.value.data;
        const allTopics = Object.values(data).flat();
        setTopics(allTopics);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!teacher) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
      Öğretmen bulunamadı.
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-[#1a2540] px-6 py-4 flex items-center gap-4 shadow-lg sticky top-0 z-10">
        <button onClick={() => navigate('/teachers')}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">{teacher.fullName}</p>
            <p className="text-orange-400 text-xs">{teacher.branch}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">

        {/* Profil kartı */}
        <div className="bg-gradient-to-r from-[#1a2540] to-[#243056] rounded-2xl p-6 mb-6 shadow-xl flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-2xl font-bold text-orange-300 shrink-0 border border-orange-400/20">
            {teacher.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{teacher.fullName}</h2>
            <span className="inline-block text-xs font-semibold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full mt-1">
              {teacher.branch}
            </span>
            {teacher.bio && (
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">{teacher.bio}</p>
            )}
          </div>
          <div className="hidden md:flex flex-col items-center gap-1 shrink-0">
            <p className="text-3xl font-extrabold text-white">{topics.length}</p>
            <p className="text-slate-400 text-xs">Konu</p>
          </div>
        </div>

        {/* Konu Listesi */}
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-slate-500" />
          <h3 className="font-bold text-slate-700 text-sm">Müfredat Konuları</h3>
          <span className="ml-auto text-xs text-slate-400">{topics.length} konu</span>
        </div>

        {topics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Henüz konu eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topics.map((topic, idx) => (
              <div key={topic.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4
                  hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{topic.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{teacher.branch}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/lesson/${topic.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100
                      text-emerald-700 text-xs font-semibold py-2 rounded-xl transition">
                    <Play size={11} /> Ders İzle
                  </button>
                  <button onClick={() => navigate(`/smart-exam/${topic.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700
                      text-white text-xs font-semibold py-2 rounded-xl transition">
                    <PenLine size={11} /> Sınava Gir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
