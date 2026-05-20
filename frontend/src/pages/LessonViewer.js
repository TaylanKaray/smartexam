import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DIFF_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };

export default function LessonViewer() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const fromFailedExam = navState?.fromFailedExam || false;
  const failedDifficulty = navState?.difficulty || null;
  const [topic, setTopic] = useState(null);
  const [contents, setContents] = useState([]);
  const [active, setActive] = useState(0);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.allSettled([
      api.get(`/api/courses/topics/${topicId}`),
      api.get(`/api/courses/topics/${topicId}/contents`),
    ]).then(([topicRes, contentRes]) => {
      if (topicRes.status === 'fulfilled') setTopic(topicRes.value.data);
      if (contentRes.status === 'fulfilled') setContents(contentRes.value.data);
    }).finally(() => setLoading(false));
  }, [topicId]);

  const submitRating = async (stars) => {
    setRating(stars);
    let userId = user?.userId || parseInt(localStorage.getItem('userId'));

    // userId hâlâ yoksa /api/auth/me ile al
    if (!userId || isNaN(userId)) {
      try {
        const meRes = await api.get('/api/auth/me');
        userId = meRes.data.userId;
      } catch {
        toast.error('Oturum bilgisi alınamadı, tekrar giriş yap.');
        return;
      }
    }

    try {
      await api.post('/api/self-report', { userId, topicId: parseInt(topicId), rating: stars });
      setRated(true);
      toast.success('Değerlendirmen kaydedildi!');
    } catch {
      toast.error('Değerlendirme kaydedilemedi.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;

  const current = contents[active];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
        <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-white text-sm">← Dersler</button>
        <span className="text-gray-400">|</span>
        <span className="font-semibold text-sm">{topic?.name}</span>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video / PDF */}
        <div className="lg:col-span-2">
          {current ? (
            <div>
              {current.type === 'VIDEO' ? (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                  <iframe
                    src={current.url}
                    title={current.title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-800 rounded-2xl flex flex-col items-center justify-center gap-4">
                  <p className="text-4xl">📄</p>
                  <p className="font-semibold">{current.title}</p>
                  <a href={current.url} target="_blank" rel="noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition">
                    PDF'i Aç
                  </a>
                </div>
              )}
              <div className="mt-3">
                <h2 className="font-bold text-lg">{current.title}</h2>
                {current.durationMinutes && (
                  <p className="text-gray-400 text-sm mt-1">⏱ {current.durationMinutes} dakika</p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500">
              Bu konu için içerik henüz eklenmemiş.
            </div>
          )}

          {/* Anlama Anketi */}
          <div className="mt-6 bg-gray-800 rounded-2xl p-5">
            <p className="font-semibold mb-3">Bu konuyu ne kadar anladın?</p>
            {rated ? (
              <p className="text-emerald-400 font-medium">✓ Değerlendirmen kaydedildi! Teşekkürler.</p>
            ) : (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => submitRating(s)}
                    className={`text-3xl transition hover:scale-125 ${rating >= s ? 'opacity-100' : 'opacity-40'}`}>
                    ⭐
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Başarısız sınavdan gelindiyse: aynı zorlukta tekrar al */}
          {fromFailedExam && failedDifficulty && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
              <p className="text-sm text-orange-700 font-medium mb-3">
                Konuyu tekrar ettin! Şimdi <span className="font-bold">{DIFF_LABELS[failedDifficulty]}</span> sınavını tekrar al.
              </p>
              <button
                onClick={() => navigate(`/smart-exam/${topicId}`, { state: { preselectedDifficulty: failedDifficulty } })}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition">
                🔄 {DIFF_LABELS[failedDifficulty]} Sınavını Tekrar Al
              </button>
            </div>
          )}

          {/* Normal Sınava Git */}
          <button
            onClick={() => navigate(`/smart-exam/${topicId}`)}
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition">
            ✏️ Bu Konudan Sınava Gir
          </button>
        </div>

        {/* İçerik Listesi */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-300 mb-3 text-sm uppercase tracking-wide">İçerikler</h3>
          {contents.length === 0 && (
            <p className="text-gray-500 text-sm">İçerik bulunamadı.</p>
          )}
          {contents.map((c, i) => (
            <button key={c.id} onClick={() => setActive(i)}
              className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 ${active === i ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              <span className="text-xl shrink-0">{c.type === 'VIDEO' ? '▶️' : '📄'}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                {c.durationMinutes && (
                  <p className="text-xs text-gray-400">{c.durationMinutes} dk</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
