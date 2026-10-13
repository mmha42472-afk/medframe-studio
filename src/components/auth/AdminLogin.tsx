import React, { useState } from 'react';
import { adminSignIn, AdminUser } from '../../services/storage';
import { Lock, Mail, KeyRound, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (user: AdminUser) => void;
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    try {
      setLoading(true);
      const user = await adminSignIn(email, password);
      onSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('بيانات تسجيل الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.');
      } else if (msg.includes('too-many-requests')) {
        setError('تم حظر المحاولات مؤقتاً بسبب كثرة المحاولات الخاطئة. انتظر دقيقة ثم حاول ثانية.');
      } else {
        setError(msg || 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-sky-300 mx-auto flex items-center justify-center mb-4 ring-1 ring-white/15 font-black tracking-tight text-lg">
            <span className="border-l-2 border-t-2 border-sky-400 px-2 py-1">MF</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">MedFrame Studio</p>
          <h2 className="text-xl font-bold tracking-tight mt-2">تسجيل دخول المسؤول</h2>
          <p className="text-xs text-slate-300 mt-1">Your Expertise. Your Identity.</p>
          <p className="text-[11px] text-slate-400 mt-3">دخول آمن للمسؤولين المعتمدين فقط</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              البريد الإلكتروني للمسؤول:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@medframe.studio"
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800"
                autoComplete="email"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              كلمة المرور:
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800"
                autoComplete="current-password"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:opacity-60 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ التحقق...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>دخول لوحة الإدارة</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>مصادقة مشفرة عبر Firebase Auth</span>
            </span>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
