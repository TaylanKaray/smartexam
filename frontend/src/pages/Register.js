import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import {
  GraduationCap, User, Mail, Lock, ArrowRight,
  CheckCircle, Eye, EyeOff, Search, Users
} from 'lucide-react';

const BENEFITS = [
  'AI destekli zayıf konu analizi',
  'Kişiselleştirilmiş çalışma planı',
  'YKS, KPSS paket desteği',
  'Günlük tekrar hatırlatmaları',
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1); // 1: kayıt formu, 2: veli için çocuk bağlama
  const [form, setForm]         = useState({ fullName: '', email: '', password: '', role: 'ROLE_STUDENT' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  // Veli adım 2
  const [parentId, setParentId]       = useState(null);
  const [childEmail, setChildEmail]   = useState('');
  const [linking, setLinking]         = useState(false);
  const [linkMsg, setLinkMsg]         = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /* Adım 1 — Kayıt */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', form);
      if (form.role === 'ROLE_PARENT') {
        // Yeni velinin ID'sini al
        const meRes = await api.post('/api/auth/login', {
          email: form.email, password: form.password
        });
        setParentId(meRes.data.userId);
        // Token'ı geçici sakla (adım 2 için API çağrısı yapabilelim)
        localStorage.setItem('token', meRes.data.token);
        setStep(2); // Çocuk bağlama adımına geç
      } else {
        toast.success('Kayıt başarılı! Giriş yapabilirsin.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  /* Adım 2 — Çocuk bağla */
  const handleLink = async () => {
    if (!childEmail.trim()) return;
    setLinking(true); setLinkMsg('');
    try {
      const res = await api.get(`/api/auth/find-by-email?email=${encodeURIComponent(childEmail)}`);
      const studentId = res.data?.id;
      if (!studentId) { setLinkMsg('Bu e-posta ile kayıtlı öğrenci bulunamadı.'); return; }
      await api.post(`/api/parent/assign?parentId=${parentId}&studentId=${studentId}`);
      toast.success('Bağlantı kuruldu! Giriş yapabilirsiniz.');
      // Token temizle, login'e yönlendir
      localStorage.removeItem('token');
      navigate('/login');
    } catch { setLinkMsg('Hata oluştu. Tekrar deneyin.'); }
    finally { setLinking(false); }
  };

  /* Sol Panel */
  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a2540] via-[#1e3a6e] to-[#1a2540] flex-col justify-between p-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none">SmartExam</p>
          <p className="text-orange-400 text-xs font-semibold">AI Platform</p>
        </div>
      </div>
      <div>
        <h2 className="text-4xl font-bold text-white leading-tight mb-4">
          Hedefine giden<br />
          <span className="text-orange-400">en akıllı</span> yol
        </h2>
        <p className="text-slate-300 text-base mb-10 leading-relaxed">
          Ücretsiz hesap oluştur, yapay zekânın kişisel koçluğuyla sınav hazırlığına başla.
        </p>
        <div className="space-y-3">
          {BENEFITS.map(b => (
            <div key={b} className="flex items-center gap-3">
              <CheckCircle size={16} className="text-orange-400 shrink-0" />
              <span className="text-slate-300 text-sm">{b}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-slate-300 text-sm italic leading-relaxed">
          "SmartExam AI sayesinde zayıf konularımı çok daha hızlı fark ettim."
        </p>
        <p className="text-orange-400 text-xs font-semibold mt-3">— KPSS 2025 mezunu</p>
      </div>
    </div>
  );

  /* ── Adım 2: Çocuk Bağlama ── */
  if (step === 2) return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">

          {/* Adım göstergesi */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle size={14} className="text-white" />
              </div>
              <span className="text-sm text-slate-400 line-through">Hesap Oluştur</span>
            </div>
            <div className="flex-1 h-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
              <span className="text-sm font-semibold text-slate-700">Çocuğunu Bağla</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Çocuğunuzu Bağlayın</h1>
              <p className="text-slate-500 text-xs">Hesabınız oluşturuldu ✓</p>
            </div>
          </div>

          <p className="text-slate-500 text-sm mb-6 mt-3">
            Takip etmek istediğiniz öğrencinin sistemdeki <strong>e-posta adresini</strong> girin.
            Öğrencinin sisteme kayıtlı olması gerekiyor.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Öğrencinin E-postası</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={childEmail}
                  onChange={e => setChildEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLink()}
                  placeholder="ogrenci@mail.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm transition" />
              </div>
            </div>

            <button onClick={handleLink} disabled={linking || !childEmail.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-60">
              {linking ? 'Aranıyor...' : (<>Çocuğumu Bağla ve Tamamla <ArrowRight size={16} /></>)}
            </button>

            <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
              className="w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition">
              Şimdi atla, sonra bağlarım →
            </button>
          </div>

          {linkMsg && (
            <div className={`mt-3 text-sm text-center font-medium p-3 rounded-xl ${
              linkMsg.includes('Bağlantı') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>{linkMsg}</div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
            <p className="font-bold mb-1">Öğrenci henüz kayıtlı değilse:</p>
            <p>Önce öğrencinin <strong>Öğrenci</strong> rolüyle sisteme kaydolmasını sağlayın, sonra e-postasını buraya girin.</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Adım 1: Kayıt Formu ── */
  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">SmartExam AI</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-1">Hesap oluştur</h1>
          <p className="text-slate-500 text-sm mb-6">Ücretsiz kaydol, hemen çalışmaya başla.</p>

          {/* Veli seçiliyse özel bilgi */}
          {form.role === 'ROLE_PARENT' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <Users size={15} className="text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-700">
                Veli hesabı oluşturuyorsunuz. Kayıt sonrası <strong>çocuğunuzun e-postasını</strong> girmeniz istenecek.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Ad Soyad</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition"
                  placeholder="Adın Soyadın" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" name="email" value={form.email} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition"
                  placeholder="ornek@mail.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} required minLength={6}
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition"
                  placeholder="En az 6 karakter" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition">
                <option value="ROLE_STUDENT">Öğrenci</option>
                <option value="ROLE_TEACHER">Öğretmen</option>
                <option value="ROLE_PARENT">Veli</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading ? 'Kayıt yapılıyor...' : (
                form.role === 'ROLE_PARENT'
                  ? (<>Devam Et <ArrowRight size={16} /></>)
                  : (<>Ücretsiz Kayıt Ol <ArrowRight size={16} /></>)
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline">Giriş yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
