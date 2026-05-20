import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const KPSS_COURSE_IDS = [1, 5, 6, 9, 10]; // Matematik, Tarih, Coğrafya, Türkçe, Vatandaşlık

const ICONS = {
  calculator: '🧮', atom: '⚛️', flask: '🧪', dna: '🧬',
  book: '📚', globe: '🌍', chart: '📊',
};

const COURSE_COLORS = [
  'from-indigo-500 to-indigo-700',
  'from-purple-500 to-purple-700',
  'from-emerald-500 to-emerald-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
];

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
      const YKS_IDS  = [1, 2, 3, 4, 5, 6]; // Matematik, Fizik, Kimya, Biyoloji, Tarih, Coğrafya
      const filtered = activePkg === 'KPSS'
        ? all.filter(c => KPSS_COURSE_IDS.includes(c.id))
        : all.filter(c => YKS_IDS.includes(c.id));
      setCourses(filtered);
    }).finally(() => setLoading(false));
    if (userId && !isNaN(userId)) {
      api.get(`/api/courses/progress/user/${userId}`)
        .then(res => setProgress(res.data))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectCourse = (course) => {
    setSelected(course);
    setTopics([]);
    api.get(`/api/courses/${course.id}/topics`).then(res => {
      setTopics(res.data);
      // Her konu için unlock durumunu çek
      if (userId && !isNaN(userId)) {
        res.data.forEach(t => {
          api.get(`/api/smart-exam/topic/${t.id}/unlock/${userId}`)
            .then(r => setUnlockMap(prev => ({ ...prev, [t.id]: r.data })))
            .catch(() => {});
        });
      }
    });
  };

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 text-white px-6 py-4 flex items-center gap-4 shadow">
        <button onClick={() => navigate('/dashboard')} className="text-indigo-200 hover:text-white text-sm">← Dashboard</button>
        <h1 className="text-xl font-bold">Derslerim</h1>
        <span className={`ml-2 text-xs font-bold px-3 py-1 rounded-full ${activePkg === 'KPSS' ? 'bg-orange-500' : 'bg-indigo-500'}`}>
          {activePkg} Paketi
        </span>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Ders Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {courses.map((c, i) => {
            // Bu dersin konularındaki ortalama ilerleme
            const courseTopicIds = topics
              .filter(t => t.course?.id === c.id || selected?.id === c.id)
              .map(t => t.id);
            const progValues = courseTopicIds
              .map(id => progress[id]?.percent || 0)
              .filter(p => p > 0);
            const avgProg = progValues.length
              ? Math.round(progValues.reduce((a, b) => a + b, 0) / progValues.length)
              : null;

            return (
              <button key={c.id} onClick={() => selectCourse(c)}
                className={`bg-gradient-to-br ${COURSE_COLORS[i % COURSE_COLORS.length]} text-white rounded-2xl p-4 text-center shadow-md hover:scale-105 transition-transform ${selected?.id === c.id ? 'ring-4 ring-white ring-offset-2' : ''}`}>
                <div className="text-3xl mb-2">{ICONS[c.icon] || '📚'}</div>
                <p className="font-bold text-sm">{c.name}</p>
                {avgProg !== null && (
                  <p className="text-xs opacity-80 mt-1">%{avgProg}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Konu Listesi */}
        {selected && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{ICONS[selected.icon] || '📚'}</span>
              <h2 className="text-xl font-bold text-gray-800">{selected.name} Konuları</h2>
            </div>

            {topics.length === 0 ? (
              <div className="text-center text-gray-400 py-12">Yükleniyor...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topics.map((topic) => {
                  const pData = progress[topic.id];
                  const pct = pData?.percent ?? null;

                  const unlock = unlockMap[topic.id];

                  return (
                    <div key={topic.id} className="bg-white rounded-2xl shadow p-5 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">{topic.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{selected.name}</p>
                        </div>
                        {pct !== null && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${getProgressColor(pct)}`}>
                            %{pct}
                          </span>
                        )}
                      </div>

                      {/* Zorluk kilit durumu */}
                      {unlock && (
                        <div className="flex gap-1.5 mb-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">🟢 Kolay</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unlock.orta ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}>
                            {unlock.orta ? '🟡 Orta' : '🔒 Orta'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unlock.zor ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                            {unlock.zor ? '🔴 Zor' : '🔒 Zor'}
                          </span>
                        </div>
                      )}

                      {/* İlerleme çubuğu */}
                      {pData ? (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{pData.correct}/{pData.total} doğru</span>
                            <span>%{pct} başarı</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${getProgressColor(pct)}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mb-4">Henüz sınav çözülmedi</p>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/lesson/${topic.id}`)}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold py-2 rounded-xl transition">
                          📺 Ders İzle
                        </button>
                        <button onClick={() => navigate(`/smart-exam/${topic.id}`)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-xl transition">
                          ✏️ {pData ? 'Tekrar Gir' : 'Sınava Gir'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Karışık Sınav */}
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white flex justify-between items-center shadow-md">
              <div>
                <p className="font-bold text-lg">Karışık Sınav</p>
                <p className="text-sm opacity-80">Tüm konulardan rastgele sorular</p>
              </div>
              <button onClick={() => navigate('/smart-exam/mixed')}
                className="bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition">
                Başlat
              </button>
            </div>
          </div>
        )}

        {!selected && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-4">👆</p>
            <p className="text-lg font-medium">Bir ders seç</p>
            <p className="text-sm mt-1">Konu listesi ve ilerleme durumun burada görünecek</p>
          </div>
        )}
      </div>
    </div>
  );
}
