import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/teachers').then(r => setTeachers(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">SmartExam</h1>
        <button onClick={() => navigate('/dashboard')}
          className="bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold px-3 py-1.5 rounded-lg transition">
          Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Öğretmenler</h2>
        <p className="text-gray-500 mb-6">Müfredat ve konu uzmanlarımız</p>

        {teachers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
            Henüz öğretmen eklenmemiş.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/teachers/${t.id}`)}
                className="bg-white rounded-2xl shadow hover:shadow-md p-5 text-left transition group"
              >
                <div className="flex items-center gap-4 mb-3">
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.fullName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                      {t.fullName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition">{t.fullName}</p>
                    <p className="text-sm text-indigo-500 font-medium">{t.branch}</p>
                  </div>
                </div>
                {t.bio && (
                  <p className="text-sm text-gray-500 line-clamp-2">{t.bio}</p>
                )}
                <p className="text-xs text-indigo-400 mt-3 font-medium">Müfredatı Gör →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
