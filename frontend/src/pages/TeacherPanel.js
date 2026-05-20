import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../api/axios';

const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };

export default function TeacherPanel() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('');

  useEffect(() => {
    api.get('/api/exam-results/all')
      .then(res => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subjects = [...new Set(results.map(r => r.subject))];
  const filtered = filterSubject ? results.filter(r => r.subject === filterSubject) : results;
  const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, r) => s + r[key], 0) / arr.length) : 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('SmartExam - Ogrenci Performans Raporu', 14, 18);
    doc.setFontSize(10);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 26);

    autoTable(doc, {
      startY: 32,
      head: [['Ogrenci', 'Konu', 'Zorluk', 'Dogru', 'Yanlis', 'Basari', 'Tarih']],
      body: filtered.map(r => [
        r.user?.email?.split('@')[0] || '—',
        r.subject,
        DIFFICULTY_LABELS[r.difficultyLevel],
        r.correctAnswers,
        r.wrongAnswers,
        `%${Math.round(r.scorePercentage)}`,
        new Date(r.examDate).toLocaleDateString('tr-TR'),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('smartexam-rapor.pdf');
    toast.success('PDF indirildi.');
  };

  const exportExcel = () => {
    const data = filtered.map(r => ({
      'Ogrenci': r.user?.email?.split('@')[0] || '—',
      'Konu': r.subject,
      'Zorluk': DIFFICULTY_LABELS[r.difficultyLevel],
      'Dogru': r.correctAnswers,
      'Yanlis': r.wrongAnswers,
      'Basari (%)': Math.round(r.scorePercentage),
      'Tarih': new Date(r.examDate).toLocaleDateString('tr-TR'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sonuclar');
    XLSX.writeFile(wb, 'smartexam-rapor.xlsx');
    toast.success('Excel indirildi.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <button onClick={() => navigate('/dashboard')} className="text-indigo-600 text-sm">← Dashboard</button>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportExcel}
              className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
              Excel İndir
            </button>
            <button onClick={exportPDF}
              className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition">
              PDF İndir
            </button>
            <button onClick={() => navigate('/questions')}
              className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              Soru Yönetimi
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Öğretmen Paneli</h1>
        <p className="text-gray-500 mb-6">Tüm öğrencilerin sınav performansı</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Toplam Sınav" value={results.length} color="bg-indigo-600" />
          <StatCard label="Ortalama Başarı" value={`%${avg(results, 'scorePercentage')}`} color="bg-emerald-600" />
          <StatCard label="Konu Sayısı" value={subjects.length} color="bg-purple-600" />
        </div>

        {subjects.length > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            <button onClick={() => setFilterSubject('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${!filterSubject ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:border-indigo-400'}`}>
              Tümü
            </button>
            {subjects.map(s => (
              <button key={s} onClick={() => setFilterSubject(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filterSubject === s ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:border-indigo-400'}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">Henüz sınav sonucu yok.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Öğrenci', 'Konu', 'Zorluk', 'Doğru', 'Yanlış', 'Başarı', 'Tarih'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id}
                    className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 cursor-pointer transition`}
                    onClick={() => navigate(`/student/${r.user?.id}`)}>
                    <td className="px-4 py-3 text-indigo-700 font-medium">{r.user?.email?.split('@')[0] || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{DIFFICULTY_LABELS[r.difficultyLevel]}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{r.correctAnswers}</td>
                    <td className="px-4 py-3 text-red-500 font-semibold">{r.wrongAnswers}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${r.scorePercentage >= 80 ? 'text-emerald-600' : r.scorePercentage >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        %{Math.round(r.scorePercentage)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.examDate).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`${color} text-white rounded-2xl p-4 sm:p-5 shadow`}>
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      <p className="text-xs sm:text-sm opacity-80 mt-1">{label}</p>
    </div>
  );
}
