import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };
const WEIGHT_MAP = { 1: 1.0, 2: 1.5, 3: 2.0 };
const EMPTY_FORM = {
  questionType: 'MCQ',
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctAnswer: 'A', topicId: '', difficultyLevel: 1,
  answerTemplate: '', blankAnswer: '',
};

export default function QuestionManager() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [questions, setQuestions] = useState([]);
  const [filterTopicId, setFilterTopicId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [allTopics, setAllTopics] = useState([]);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try {
      const [cRes, qRes] = await Promise.all([api.get('/api/courses'), api.get('/api/questions')]);
      setCourses(cRes.data);
      setQuestions(qRes.data);
      // Tüm konuları bağımsız yükle — sorusu olmayan yeni konular da görünsün
      const nested = await Promise.all(
        cRes.data.map(c => api.get(`/api/courses/${c.id}/topics`).then(r => r.data.map(t => ({ ...t, courseName: c.name }))))
      );
      setAllTopics(nested.flat());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setTopics([]);
    setForm(f => ({ ...f, topicId: '' }));
    if (!courseId) return;
    api.get(`/api/courses/${courseId}/topics`).then(res => setTopics(res.data));
  };

  const handleChange = (e) => {
    const val = e.target.name === 'difficultyLevel' ? parseInt(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topicId) { toast.error('Konu seçmelisin.'); return; }
    if (!form.questionText.trim()) { toast.error('Soru metnini doldur.'); return; }

    if (form.questionType === 'MCQ') {
      if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
        toast.error('MCQ sorular için tüm şıkları doldur.'); return;
      }
    } else {
      if (!form.blankAnswer.trim()) { toast.error('Doğru cevabı (boşluk cevabı) doldur.'); return; }
    }

    setSaving(true);
    try {
      const topicObj = topics.find(t => t.id === parseInt(form.topicId));
      const isFill = form.questionType === 'FILL_BLANK';
      const payload = {
        questionText: form.questionText,
        questionType: form.questionType,
        subject: topicObj?.course?.name || 'Genel',
        difficultyLevel: form.difficultyLevel,
        weightCoefficient: WEIGHT_MAP[form.difficultyLevel],
        topic: { id: parseInt(form.topicId) },
        ...(isFill
          ? { answerTemplate: form.answerTemplate || form.questionText, blankAnswer: form.blankAnswer }
          : { optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, correctAnswer: form.correctAnswer }
        ),
      };
      await api.post('/api/questions', payload);
      setForm(EMPTY_FORM);
      toast.success('Soru eklendi!');
      load();
    } catch { toast.error('Soru kaydedilemedi.'); }
    finally { setSaving(false); }
  };

  const handleJsonImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const list = Array.isArray(data) ? data : data.questions || [];
      if (!list.length) { toast.error('JSON boş veya geçersiz format.'); return; }
      const res = await api.post('/api/questions/bulk-import', list);
      toast.success(`${res.data.saved} soru eklendi, ${res.data.skipped} atlandı.`);
      load();
    } catch {
      toast.error('JSON okunamadı veya format hatalı.');
    } finally {
      setImporting(false);
      fileRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        questionText: 'Örnek soru metni?',
        optionA: 'Şık A',
        optionB: 'Şık B',
        optionC: 'Şık C',
        optionD: 'Şık D',
        correctAnswer: 'B',
        subject: 'Matematik',
        difficultyLevel: 1,
        topicId: 1,
      },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sorular-sablonu.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success('Soru silindi.');
    } catch { toast.error('Soru silinemedi.'); }
  };

  const filtered = filterTopicId
    ? questions.filter(q => q.topic?.id === parseInt(filterTopicId))
    : questions;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/teacher')} className="text-indigo-600 text-sm mb-4">← Öğretmen Paneli</button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Soru Yönetimi</h1>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h2 className="font-semibold text-gray-700 mb-4">Yeni Soru Ekle</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Ders + Konu seçimi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Ders</label>
                <select value={selectedCourse} onChange={e => handleCourseChange(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">-- Ders Seç --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Konu</label>
                <select name="topicId" value={form.topicId} onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">-- Konu Seç --</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Zorluk</label>
              <div className="flex gap-3 mt-1">
                {[1, 2, 3].map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficultyLevel: d }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${form.difficultyLevel === d ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'}`}>
                    {DIFFICULTY_LABELS[d]} ×{WEIGHT_MAP[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Soru Tipi Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700">Soru Tipi</label>
              <div className="flex gap-3 mt-1">
                {[['MCQ', 'Çoktan Seçmeli'], ['FILL_BLANK', 'Boşluk Doldurma']].map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => setForm(f => ({ ...f, questionType: val }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${form.questionType === val ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Soru</label>
              <textarea name="questionText" value={form.questionText} onChange={handleChange} rows={2}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder={form.questionType === 'FILL_BLANK' ? 'Örnek: Hücrenin enerji merkezi ___ dir.' : 'Soru metni...'} />
            </div>

            {form.questionType === 'MCQ' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt}>
                      <label className="text-sm font-medium text-gray-700">Şık {opt}</label>
                      <input type="text" name={`option${opt}`} value={form[`option${opt}`]} onChange={handleChange}
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder={`Şık ${opt}`} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Doğru Cevap</label>
                  <div className="flex gap-3 mt-1">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button key={opt} type="button" onClick={() => setForm(f => ({ ...f, correctAnswer: opt }))}
                        className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${form.correctAnswer === opt ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700">Doğru Cevap (boşluğa girilecek kelime)</label>
                <input type="text" name="blankAnswer" value={form.blankAnswer} onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Örnek: mitokondri" />
                <p className="text-xs text-gray-400 mt-1">Büyük/küçük harf fark etmez, otomatik karşılaştırılır.</p>
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
              {saving ? 'Kaydediliyor...' : 'Soruyu Kaydet'}
            </button>
          </form>
        </div>

        {/* JSON Toplu Yükleme */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">Toplu Soru Yükle (JSON)</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <label className={`cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
              {importing ? 'Yükleniyor...' : '📂 JSON Dosyası Seç'}
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
            </label>
            <button onClick={downloadTemplate}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition">
              ⬇️ Şablon İndir
            </button>
            <p className="text-xs text-gray-400 flex-1">
              JSON formatı: <code>[{'{'}questionText, optionA-D, correctAnswer, subject, difficultyLevel, topicId{'}'}]</code>
            </p>
          </div>
        </div>

        {/* Soru Listesi */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="font-semibold text-gray-700">Tüm Sorular ({questions.length})</h2>
            <div className="flex gap-2 flex-wrap items-center">
              <select value={filterTopicId} onChange={e => setFilterTopicId(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">Tüm Konular</option>
                {courses.map(c => (
                  <optgroup key={c.id} label={c.name}>
                    {allTopics
                      .filter(t => t.courseName === c.name)
                      .map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                    }
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {loading ? <p className="text-gray-400 text-center py-4">Yükleniyor...</p> : (
            <div className="space-y-2">
              {filtered.map(q => (
                <div key={q.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{q.questionText}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {q.topic && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{q.topic.name}</span>}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{DIFFICULTY_LABELS[q.difficultyLevel]}</span>
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">×{q.weightCoefficient}</span>
                      {q.questionType === 'FILL_BLANK'
                        ? <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Boşluk: {q.blankAnswer}</span>
                        : <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Cevap: {q.correctAnswer}</span>
                      }
                    </div>
                  </div>
                  <button onClick={() => handleDelete(q.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-medium shrink-0 transition">Sil</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
