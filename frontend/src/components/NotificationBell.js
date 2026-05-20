import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

export default function NotificationBell({ userId }) {
  const [unread, setUnread] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchUnread = () => {
    if (!userId) return;
    api.get(`/api/notifications/unread/${userId}`)
      .then(r => setUnread(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const timer = setInterval(fetchUnread, 60000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = (id) => {
    api.put(`/api/notifications/${id}/read`)
      .then(() => setUnread(prev => prev.filter(n => n.id !== id)))
      .catch(() => {});
  };

  const markAll = () => {
    unread.forEach(n => markRead(n.id));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative bg-indigo-500 hover:bg-indigo-400 text-white p-2 rounded-lg transition"
        title="Bildirimler"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-800 text-sm">Bildirimler</span>
            {unread.length > 0 && (
              <button onClick={markAll} className="text-xs text-indigo-600 hover:underline">Tümünü okundu işaretle</button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {unread.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Okunmamış bildirim yok</p>
            ) : (
              unread.map(n => (
                <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.type === 'TOPIC_WEAKNESS' ? 'Konu Zayıflığı' : 'Hatırlatıcı'}
                    </p>
                  </div>
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-gray-300 hover:text-indigo-500 transition shrink-0 mt-0.5"
                    title="Okundu işaretle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
