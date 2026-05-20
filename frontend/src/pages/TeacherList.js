import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Users, ArrowRight, GraduationCap } from 'lucide-react';

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/teachers').then(r => setTeachers(r.data)).catch(() => {});
  }, []);

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
            <Users size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Öğretmenler</p>
            <p className="text-orange-400 text-xs">Müfredat Uzmanları</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Öğretmen Kadrosu</h2>
          <p className="text-slate-500 text-sm">MEB müfredatı uzmanlarımız · Video dersler ve konu anlatımları</p>
        </div>

        {teachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Henüz öğretmen eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers.map((t, i) => (
              <button key={t.id} onClick={() => navigate(`/teachers/${t.id}`)}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left
                  hover:-translate-y-1 hover:shadow-lg hover:border-indigo-100 transition-all duration-200">

                {/* Avatar + İsim */}
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={`https://i.pravatar.cc/150?u=${t.id || i}`}
                    alt={t.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 group-hover:border-indigo-200 transition-colors"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center text-xl font-bold text-indigo-600 hidden">
                    {t.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors leading-tight">
                      {t.fullName}
                    </p>
                    <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {t.branch}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {t.bio && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{t.bio}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-xs text-slate-400">Müfredatı görüntüle</span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
