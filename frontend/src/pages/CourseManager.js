import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function CourseManager() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState({});
  const [courseForm, setCourseForm] = useState({ name: '', description: '', icon: 'book' });
  const [topicForm, setTopicForm] = useState({ courseId: '', name: '' });
  const [contentForm, setContentForm] = useState({ topicId: '', type: 'VIDEO', title: '', url: '', durationMinutes: '' });
  const [saving, setSaving] = useState('');

  const ICONS = ['calculator', 'atom', 'flask', 'dna', 'book', 'globe', 'chart'];

  const load = async () => {
    const res = await api.get('/api/courses');
    setCourses(res.data);
    const topicMap = {};
    for (const c of res.data) {
      const t = await api.get(`/api/courses/${c.id}/topics`);
      topicMap[c.id] = t.data;
    }
    setTopics(topicMap);
  };

  useEffect(() => { load(); }, []);

  const addCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.name.trim()) { toast.error('Ders adı gerekli'); return; }
    setSaving('course');
    try {
      await api.post('/api/courses', courseForm);
      toast.success('Ders eklendi!');
      setCourseForm({ name: '', description: '', icon: 'book' });
      load();
    } catch { toast.error('Hata oluştu.'); }
    finally { setSaving(''); }
  };

  const addTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.courseId || !topicForm.name.trim()) { toast.error('Ders ve konu adı gerekli'); return; }
    setSaving('topic');
    try {
      await api.post('/api/courses/topics', { courseId: parseInt(topicForm.courseId), name: topicForm.name });
      toast.success('Konu eklendi!');
      setTopicForm({ courseId: topicForm.courseId, name: '' });
      load();
    } catch { toast.error('Hata oluştu.'); }
    finally { setSaving(''); }
  };

  const addContent = async (e) => {
    e.preventDefault();
    if (!contentForm.topicId || !contentForm.title.trim() || !contentForm.url.trim()) {
      toast.error('Konu, başlık ve URL gerekli'); return;
    }
    setSaving('content');
    try {
      await api.post('/api/courses/contents', {
        topicId: parseInt(contentForm.topicId),
        type: contentForm.type,
        title: contentForm.title,
        url: contentForm.url,
        durationMinutes: contentForm.durationMinutes ? parseInt(contentForm.durationMinutes) : null,
      });
      toast.success('İçerik eklendi!');
      setContentForm({ topicId: contentForm.topicId, type: 'VIDEO', title: '', url: '', durationMinutes: '' });
    } catch { toast.error('Hata oluştu.'); }
    finally { setSaving(''); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/teacher')} className="text-indigo-600 text-sm mb-4">← Öğretmen Paneli</button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Ders Yönetimi</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ders Ekle */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Yeni Ders Ekle</h2>
            <form onSubmit={addCourse} className="space-y-3">
              <input value={courseForm.name} onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ders adı (ör: Coğrafya)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Açıklama (isteğe bağlı)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">İkon</label>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setCourseForm(f => ({ ...f, icon: ic }))}
                      className={`px-2 py-1 text-xs rounded-lg border transition ${courseForm.icon === ic ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving === 'course'}
                className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
                {saving === 'course' ? 'Ekleniyor...' : 'Ders Ekle'}
              </button>
            </form>
          </div>

          {/* Konu Ekle */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Yeni Konu Ekle</h2>
            <form onSubmit={addTopic} className="space-y-3">
              <select value={topicForm.courseId} onChange={e => setTopicForm(f => ({ ...f, courseId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">-- Ders Seç --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Konu adı (ör: Fonksiyonlar)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="submit" disabled={saving === 'topic'}
                className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-60">
                {saving === 'topic' ? 'Ekleniyor...' : 'Konu Ekle'}
              </button>
            </form>
          </div>

          {/* İçerik Ekle */}
          <div className="bg-white rounded-2xl shadow p-6 md:col-span-2">
            <h2 className="font-semibold text-gray-700 mb-4">Ders İçeriği Ekle (YouTube / PDF)</h2>
            <form onSubmit={addContent} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={contentForm.topicId} onChange={e => setContentForm(f => ({ ...f, topicId: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">-- Konu Seç --</option>
                {courses.map(c => (
                  <optgroup key={c.id} label={c.name}>
                    {(topics[c.id] || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ))}
              </select>
              <select value={contentForm.type} onChange={e => setContentForm(f => ({ ...f, type: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="VIDEO">Video (YouTube Embed)</option>
                <option value="PDF">PDF Link</option>
              </select>
              <input value={contentForm.title} onChange={e => setContentForm(f => ({ ...f, title: e.target.value }))}
                placeholder="İçerik başlığı" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={contentForm.url} onChange={e => setContentForm(f => ({ ...f, url: e.target.value }))}
                placeholder={contentForm.type === 'VIDEO' ? 'https://www.youtube.com/embed/...' : 'https://...pdf'}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="number" value={contentForm.durationMinutes} onChange={e => setContentForm(f => ({ ...f, durationMinutes: e.target.value }))}
                placeholder="Süre (dakika, isteğe bağlı)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="submit" disabled={saving === 'content'}
                className="bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60">
                {saving === 'content' ? 'Ekleniyor...' : 'İçerik Ekle'}
              </button>
            </form>
          </div>

          {/* Mevcut Dersler */}
          <div className="bg-white rounded-2xl shadow p-6 md:col-span-2">
            <h2 className="font-semibold text-gray-700 mb-4">Mevcut Yapı</h2>
            <div className="space-y-3">
              {courses.map(c => (
                <div key={c.id}>
                  <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1 ml-4">
                    {(topics[c.id] || []).map(t => (
                      <span key={t.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{t.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
