import React, { useEffect, useState } from 'react';
import { adminSignIn, completeAdminEmailLink, AdminUser } from '../../services/storage';
import { Mail, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (user: AdminUser) => void;
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState(() => window.localStorage.getItem('medframe_admin_email_link_email') || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const completeLink = async () => {
      try {
        const user = await completeAdminEmailLink();
        if (active && user) onSuccess(user);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'تعذر إكمال تسجيل الدخول.');
      }
    };
    void completeLink();
    return () => { active = false; };
  }, [onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    if (!email.trim()) {
      setError('أدخل بريدك الإلكتروني لاستلام رابط الدخول.');
      return;
    }

    try {
      setLoading(true);
      await adminSignIn(email);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('unauthorized-continue-uri') || msg.includes('domain')) {
        setError('عنوان الموقع غير مضاف إلى Authorized domains في إعدادات Firebase Authentication.');
      } else {
        setError(msg || 'تعذر إرسال رابط الدخول. تحقق من إعدادات Firebase Authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-sky-300 mx-auto flex items-center justify-center mb-4 ring-1 ring-white/15 font-black tracking-tight text-lg">
            <span className="border-l-2 border-t-2 border-sky-400 px-2 py-1">MF</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">MedFrame Studio</p>
          <h2 className="text-xl font-bold tracking-tight mt-2">دخول آمن للمسؤول</h2>
          <p className="text-xs text-slate-300 mt-2">اكتب بريد المسؤول وسنرسل لك رابط دخول صالحًا لمرة واحدة.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {sent && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">أرسلنا رابط الدخول إلى <b dir="ltr">{email}</b>. افتحه على نفس الجهاز والمتصفح لإكمال الدخول.</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">البريد الإلكتروني للمسؤول</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-3 pr-9 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800"
                autoComplete="email"
                autoFocus
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:opacity-60 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جارٍ إرسال الرابط...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>أرسل رابط الدخول</span>
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>مصادقة آمنة عبر Firebase</span>
            </span>
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-slate-600 hover:text-slate-900 font-medium">
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
