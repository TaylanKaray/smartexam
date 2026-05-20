import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowLeft, CheckCircle, XCircle, Minus, ChevronDown,
  ChevronUp, Brain, Loader2, RotateCcw
} from 'lucide-react';

const FLASK_URL = process.env.REACT_APP_AI_URL || 'http://localhost:5000';

export default function PracticeExamReview() {
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [openIdx, setOpenIdx]   = useState(null);
  const [explanations, setExp]  = useState({});
  const [loading, setLoading]   = useState({});
  const [filterWrong, setFilter] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('practiceExamReview');
    if (!raw) { navigate('/practice-exams'); return; }
    try { setData(JSON.parse(raw)); } catch { navigate('/practice-exams'); }
  }, [navigate]);

  if (!data) return null;

  const { questions = [] } = data;
  const displayed = filterWrong
    ? questions.filter(q => q.userAnswer && q.userAnswer !== q.correct_answer)
    : questions;

  const fetchExplanation = async (q, idx) => {
    if (explanations[idx]) return;
    setLoading(prev => ({ ...prev, [idx]: true }));
    try {
      const res = await fetch(`${FLASK_URL}/explain-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: q.question_text,
          option_a: q.option_a, option_b: q.option_b,
          option_c: q.option_c, option_d: q.option_d,
          correct_answer: q.correct_answer,
          subject: q.subject,
        }),
      });
      const json = await res.json();
      if (json.error === 'rate_limited') {
        setExp(prev => ({ ...prev, [idx]: { type: 'rate_limited' } }));
      } else {
        setExp(prev => ({ ...prev, [idx]: { type: 'ok', text: json.explanation } }));
      }
    } catch {
      setExp(prev => ({ ...prev, [idx]: { type: 'error' } }));
    } finally {
      setLoading(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleToggle = (idx, q) => {
    if (openIdx === idx) { setOpenIdx(null); return; }
    setOpenIdx(idx);
    fetchExplanation(q, idx);
  };

  const wrongCount = questions.filter(q => q.userAnswer && q.userAnswer !== q.correct_answer).length;
  const blankCount = questions.filter(q => !q.userAnswer).length;

  return (
    <div className="min-h-screen bg-[#0f1729]">
      {/* Navbar */}
      <nav className="bg-[#1a2540] border-b border-white/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-white font-bold text-sm">Soru İnceleme</p>
          <p className="text-orange-400 text-xs">{questions.length} soru · {wrongCount} yanlış · {blankCount} boş</p>
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={() => setFilter(false)}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition
              ${!filterWrong ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/15'}`}>
            Tümü ({questions.length})
          </button>
          <button onClick={() => setFilter(true)}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition
              ${filterWrong ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/15'}`}>
            Yanlışlar ({wrongCount})
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-3">
        {displayed.map((q, displayIdx) => {
          const globalIdx = questions.indexOf(q);
          const isOpen    = openIdx === globalIdx;
          const isCorrect = q.userAnswer === q.correct_answer;
          const isBlank   = !q.userAnswer;
          const exp       = explanations[globalIdx];
          const isLoading = loading[globalIdx];

          return (
            <div key={globalIdx}
              className={`rounded-2xl border overflow-hidden transition-all
                ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5'
                  : isBlank ? 'border-white/10 bg-white/5'
                  : 'border-red-500/30 bg-red-500/5'}`}>

              {/* Soru başlık satırı */}
              <div className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                  ${isCorrect ? 'bg-emerald-500/20' : isBlank ? 'bg-white/10' : 'bg-red-500/20'}`}>
                  {isCorrect
                    ? <CheckCircle size={16} className="text-emerald-400" />
                    : isBlank
                      ? <Minus size={16} className="text-slate-500" />
                      : <XCircle size={16} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-slate-500 font-bold">Soru {globalIdx+1}</span>
                    {q.subject && (
                      <span className="text-[10px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{q.subject}</span>
                    )}
                    {!isBlank && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isCorrect ? 'Doğru' : 'Yanlış'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed">{q.question_text}</p>
                </div>
                <button onClick={() => handleToggle(globalIdx, q)}
                  className="shrink-0 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Açık detay */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Şıklar */}
                  {['A','B','C','D','E'].map(letter => {
                    const text     = q[`option_${letter.toLowerCase()}`];
                    if (!text) return null;
                    const isRight  = letter === q.correct_answer;
                    const isUser   = letter === q.userAnswer;
                    return (
                      <div key={letter}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                          ${isRight
                            ? 'bg-emerald-500/15 border border-emerald-500/30'
                            : isUser && !isRight
                              ? 'bg-red-500/15 border border-red-500/30'
                              : 'bg-white/5 border border-white/5'}`}>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                          ${isRight ? 'bg-emerald-500 text-white'
                            : isUser && !isRight ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-slate-400'}`}>
                          {letter}
                        </span>
                        <span className={isRight ? 'text-emerald-300' : isUser && !isRight ? 'text-red-300' : 'text-slate-400'}>
                          {text}
                        </span>
                        {isRight && <CheckCircle size={14} className="text-emerald-400 ml-auto shrink-0" />}
                        {isUser && !isRight && <XCircle size={14} className="text-red-400 ml-auto shrink-0" />}
                      </div>
                    );
                  })}

                  {/* AI Açıklama */}
                  <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-indigo-400" />
                      <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">AI Açıklama</span>
                    </div>
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Loader2 size={13} className="animate-spin" /> Gemini açıklama hazırlıyor...
                      </div>
                    ) : exp?.type === 'ok' ? (
                      <p className="text-slate-300 text-sm leading-relaxed">{exp.text}</p>
                    ) : exp?.type === 'rate_limited' ? (
                      <div className="flex items-center gap-2">
                        <p className="text-amber-400 text-xs">AI servisi meşgul, biraz bekleyip tekrar deneyin.</p>
                        <button onClick={() => { setExp(p => { const n={...p}; delete n[globalIdx]; return n; }); fetchExplanation(q, globalIdx); }}
                          className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 transition">
                          <RotateCcw size={11} /> Tekrar Dene
                        </button>
                      </div>
                    ) : exp?.type === 'error' ? (
                      <p className="text-red-400 text-xs">Bağlantı hatası.</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-bold">Hiç yanlış yok!</p>
            <p className="text-slate-400 text-sm">Tüm soruları doğru cevapladın.</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button onClick={() => navigate('/practice-exams')}
            className="flex-1 py-3 bg-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/15 border border-white/10 transition text-sm">
            Diğer Sınavlar
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition text-sm">
            Dashboard'a Dön
          </button>
        </div>
      </div>
    </div>
  );
}
