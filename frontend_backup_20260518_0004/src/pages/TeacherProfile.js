import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [curriculum, setCurriculum] = useState({});
  const [openGrade, setOpenGrade] = useState(null);

  useEffect(() => {
    api.get(`/api/teachers/${id}`).then(r => setTeacher(r.data)).catch(() => {});
    api.get(`/api/teachers/${id}/curriculum`).then(r => {
      setCurriculum(r.data);
      const first = Object.keys(r.data)[0];
      if (first) setOpenGrade(first);
    }).catch(() => {});
  }, [id]);

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  const gradeOrder = ['9. Sinif', '10. Sinif', '11. Sinif', '12. Sinif'];
  const sortedGrades = Object.keys(curriculum).sort(
    (a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">SmartExam</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/teachers')}
            className="bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold px-3 py-1.5 rounded-lg transition">
            Öğretmenler
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="bg-white text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        {/* Profil kartı */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex items-center gap-5">
          {teacher.avatarUrl ? (
            <img src={teacher.avatarUrl} alt={teacher.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
              {teacher.fullName?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{teacher.fullName}</h2>
            <p className="text-indigo-500 font-semibold">{teacher.branch}</p>
            {teacher.bio && <p className="text-sm text-gray-500 mt-1 max-w-lg">{teacher.bio}</p>}
          </div>
        </div>

        {/* Müfredat ağacı */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">Müfredat</h3>

        {sortedGrades.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            Bu öğretmen için müfredat henüz tanımlanmamış.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGrades.map(grade => {
              const topics = curriculum[grade] || [];
              const isOpen = openGrade === grade;
              return (
                <div key={grade} className="bg-white rounded-2xl shadow overflow-hidden">
                  <button
                    onClick={() => setOpenGrade(isOpen ? null : grade)}
                    className="w-full flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-100 text-indigo-600 text-sm font-bold px-3 py-1 rounded-full">
                        {grade}
                      </span>
                      <span className="text-sm text-gray-500">{topics.length} konu</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-3">
                      {topics.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">Bu sınıf için konu tanımlanmamış.</p>
                      ) : (
                        <ul className="space-y-2">
                          {topics.map((topic, idx) => (
                            <li key={topic.id}
                              className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                              <span className="text-xs font-bold text-indigo-400 w-6">{idx + 1}.</span>
                              <span className="text-sm text-gray-700 flex-1">{topic.name}</span>
                              <button
                                onClick={() => navigate(`/lesson/${topic.id}`)}
                                className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-lg font-medium transition"
                              >
                                Çalış
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
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
