import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setPwForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ text: '', ok: false });

    if (pwForm.newPassword.length < 6) {
      setPwMsg({ text: 'Yeni şifre en az 6 karakter olmalı.', ok: false });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: 'Yeni şifreler eşleşmiyor.', ok: false });
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ text: 'Şifre başarıyla değiştirildi.', ok: true });
      toast.success('Şifre değiştirildi.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ text: err.response?.data?.message || 'Mevcut şifre hatalı.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (role) => {
    if (role === 'ROLE_TEACHER') return 'Öğretmen';
    if (role === 'ROLE_ADMIN') return 'Admin';
    if (role === 'ROLE_PARENT') return 'Veli';
    return 'Öğrenci';
  };

  const ownedPackages = (() => {
    try { return JSON.parse(localStorage.getItem('ownedPackages') || '["YKS"]'); }
    catch { return ['YKS']; }
  })();

  const PKG_LABELS = { YKS: '🎯 YKS — TYT & AYT', KPSS: '🏛️ KPSS — Lisans', LGS: '📚 LGS — 6-7-8. Sınıf' };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-indigo-600 text-sm mb-4">← Dashboard</button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil</h1>

        {/* Kullanıcı Bilgileri */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{user?.fullName || '—'}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <div className="flex gap-2 mt-1">
                {user?.roles?.map(r => (
                  <span key={r} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                    {roleLabel(r)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Aktif Paketler */}
          {!user?.roles?.includes('ROLE_TEACHER') && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Aktif Paketler</p>
              <div className="flex flex-wrap gap-2">
                {ownedPackages.map(pkg => (
                  <span key={pkg} className="text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full">
                    {PKG_LABELS[pkg] || pkg}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Kullanıcı ID</span>
              <span className="font-medium text-gray-700">#{user?.userId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">E-posta</span>
              <span className="font-medium text-gray-700">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Şifre Değiştirme */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Şifre Değiştir</h2>

          {pwMsg.text && (
            <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${pwMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {pwMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mevcut Şifre</label>
              <input type="password" name="currentPassword" value={pwForm.currentPassword} onChange={handleChange}
                required className="mt-1 w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Yeni Şifre</label>
              <input type="password" name="newPassword" value={pwForm.newPassword} onChange={handleChange}
                required minLength={6} className="mt-1 w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="En az 6 karakter" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Yeni Şifre Tekrar</label>
              <input type="password" name="confirmPassword" value={pwForm.confirmPassword} onChange={handleChange}
                required className="mt-1 w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
              {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        </div>

        {/* Çıkış */}
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition border border-red-200">
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
