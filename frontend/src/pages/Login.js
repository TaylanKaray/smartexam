import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Brain, Trophy, TrendingUp, Mail, Lock, ArrowRight, Eye, EyeOff, X } from 'lucide-react';

const FEATURES = [
  { icon: Brain,      text: 'AI destekli kişisel öğrenme analizi' },
  { icon: Trophy,     text: 'Rozet ve başarı takip sistemi' },
  { icon: TrendingUp, text: 'YKS, KPSS paket desteği' },
];

function ForgotModal({ onClose }) {
  const [email, setEmail]         = useState('');
  const [newPass, setNewPass]     = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) { toast.error('Şifreler eşleşmiyor.'); return; }
    if (newPass.length < 6)  { toast.error('Şifre en az 6 karakter olmalı.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email, newPassword: newPass });
      toast.success('Şifre başarıyla güncellendi! Giriş yapabilirsin.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
          <X size={20} />
        </button>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Şifremi Sıfırla</h2>
          <p className="text-slate-500 text-sm mt-1">E-posta adresinizi ve yeni şifrenizi girin.</p>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="kayitli@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Yeni Şifre</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Şifre Tekrar</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Şifreyi tekrar girin"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-60 mt-2">
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]           = useState({ email: '', password: '' });
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      const { token, userId, email, fullName, roles } = res.data;
      login(token, { userId, email, fullName, roles });
      toast.success('Hoş geldin!');
      if (roles?.includes('ROLE_PARENT'))  navigate('/parent-dashboard');
      else if (roles?.includes('ROLE_MENTOR')) navigate('/mentor-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}

      {/* Sol panel — gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a2540] via-[#1e3a6e] to-[#1a2540] flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">SmartExam</p>
            <p className="text-orange-400 text-xs font-semibold">AI Platform</p>
          </div>
        </div>

        {/* Orta içerik */}
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Sınav hazırlığında<br />
            <span className="text-orange-400">yapay zekâ</span> gücü
          </h2>
          <p className="text-slate-300 text-base mb-10 leading-relaxed">
            AI destekli analizler, kişiselleştirilmiş öneriler ve akıllı soru havuzuyla hedefine ulaş.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-orange-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alt istatistikler */}
        <div className="flex gap-8">
          {[['130+', 'Konu'], ['3500+', 'Soru'], ['3', 'Sınav Paketi']].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-2xl font-bold text-white">{val}</p>
              <p className="text-slate-400 text-xs">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">

          {/* Mobil logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">SmartExam AI</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-1">Tekrar hoş geldin!</h1>
          <p className="text-slate-500 text-sm mb-8">Hesabına giriş yap ve çalışmaya devam et.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium transition">
                  Şifremi Unuttum
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading ? 'Giriş yapılıyor...' : (<>Giriş Yap <ArrowRight size={16} /></>)}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Hesabın yok mu?{' '}
            <Link to="/register" className="text-orange-500 font-semibold hover:underline">
              Ücretsiz kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
