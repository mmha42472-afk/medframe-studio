import React, { useState, useEffect } from 'react';
import {
  DoctorProfile,
  DoctorStatus,
  Qualification,
  MedicalService,
  EducationalArticle,
  FAQItem,
} from '../../types/doctor';
import { DoctorWebsite } from '../public/DoctorWebsite';
import {
  Save,
  Globe,
  ArrowRight,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Palette,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Check,
  Stethoscope,
  Award,
  BookOpen,
  HelpCircle,
  Settings,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { DOCTOR_THEMES, getThemeById } from '../../data/themes';

export type EditorTab =
  | 'basic'
  | 'clinic'
  | 'qualifications'
  | 'services'
  | 'content'
  | 'branding'
  | 'seo';

type ViewportDevice = 'desktop' | 'tablet' | 'mobile';

interface DoctorEditorProps {
  initialDoctor: DoctorProfile;
  initialTab?: EditorTab;
  onSave: (doctor: DoctorProfile) => Promise<void>;
  onCancel: () => void;
  onPreviewPublic: (doctor: DoctorProfile) => void;
  allDoctors: DoctorProfile[];
}

const PRESET_PRIMARY_COLORS = [
  { label: 'كحلي استشاري (Navy)', value: '#0F2A4A' },
  { label: 'أزرق كلاسيكي', value: '#1E3A8A' },
  { label: 'أخضر جراحي (Emerald)', value: '#064E3B' },
  { label: 'عنابي وقائي (Burgundy)', value: '#881337' },
  { label: 'رمادي فحمي عصري', value: '#1E293B' },
];

const PRESET_ACCENT_COLORS = [
  { label: 'تيل طبي (Teal)', value: '#0D9488' },
  { label: 'أزرق سماوي (Sky Blue)', value: '#0284C7' },
  { label: 'زمردي مشرق', value: '#059669' },
  { label: 'ياقوتي (Rose)', value: '#E11D48' },
  { label: 'كهرماني دافئ (Amber)', value: '#D97706' },
];

export const DoctorEditor: React.FC<DoctorEditorProps> = ({
  initialDoctor,
  initialTab = 'basic',
  onSave,
  onCancel,
  onPreviewPublic,
  allDoctors,
}) => {
  const [doctor, setDoctor] = useState<DoctorProfile>(() =>
    JSON.parse(JSON.stringify(initialDoctor))
  );
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [previewDevice, setPreviewDevice] = useState<ViewportDevice>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [showLivePreviewSplit, setShowLivePreviewSplit] = useState(true);

  // Validate slug uniqueness against other doctors
  useEffect(() => {
    const slug = (doctor.slug || '').trim().toLowerCase();
    if (!slug) {
      setSlugError('الرابط المخصص مطلوب');
      return;
    }
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setSlugError('يجب أن يحتوي الرابط على حروف إنجليزية صغيرة، أرقام، وشرطات (-) فقط');
      return;
    }
    const duplicate = allDoctors.find(
      (d) => d.id !== doctor.id && d.slug.toLowerCase() === slug
    );
    if (duplicate) {
      setSlugError(`الرابط "${slug}" مستخدم بالفعل لطبيب آخر (${duplicate.fullName})`);
      return;
    }
    setSlugError(null);
  }, [doctor.slug, doctor.id, allDoctors]);

  const handleSave = async (targetStatus?: DoctorStatus) => {
    if (slugError) {
      alert(`يرجى تصحيح الرابط المخصص: ${slugError}`);
      return;
    }
    if (!doctor.fullName.trim()) {
      alert('يرجى إدخال اسم الطبيب كاملاً.');
      return;
    }

    try {
      setIsSaving(true);
      const toSave = {
        ...doctor,
        status: targetStatus || doctor.status,
        updatedAt: new Date().toISOString(),
      };
      await onSave(toSave);
      setDoctor(toSave);
      setSaveSuccessMsg('تم حفظ التعديلات بنجاح!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Upload doctor photo from device
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDoctor((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Qualifications Handlers
  const addQualification = () => {
    const newQ: Qualification = {
      id: 'q-' + Date.now(),
      degree: '',
      institution: '',
      year: new Date().getFullYear().toString(),
      verified: true,
    };
    setDoctor((prev) => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), newQ],
    }));
  };

  const removeQualification = (id: string) => {
    setDoctor((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((q) => q.id !== id),
    }));
  };

  const updateQualification = (id: string, patch: Partial<Qualification>) => {
    setDoctor((prev) => ({
      ...prev,
      qualifications: prev.qualifications.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  };

  // Services Handlers
  const addService = () => {
    const newService: MedicalService = {
      id: 's-' + Date.now(),
      name: '',
      description: '',
      tag: 'استشارة',
      fee: '',
    };
    setDoctor((prev) => ({
      ...prev,
      services: [...(prev.services || []), newService],
    }));
  };

  const removeService = (id: string) => {
    setDoctor((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

  const updateService = (id: string, patch: Partial<MedicalService>) => {
    setDoctor((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  // Articles Handlers
  const addArticle = () => {
    const newArt: EducationalArticle = {
      id: 'art-' + Date.now(),
      title: '',
      summary: '',
      content: '',
      readingTime: '3 دقائق قراءة',
      date: new Date().toISOString().slice(0, 10),
      tag: 'نصائح طبية',
    };
    setDoctor((prev) => ({
      ...prev,
      articles: [...(prev.articles || []), newArt],
    }));
  };

  const removeArticle = (id: string) => {
    setDoctor((prev) => ({
      ...prev,
      articles: prev.articles.filter((a) => a.id !== id),
    }));
  };

  const updateArticle = (id: string, patch: Partial<EducationalArticle>) => {
    setDoctor((prev) => ({
      ...prev,
      articles: prev.articles.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  };

  // FAQs Handlers
  const addFaq = () => {
    const newFaq: FAQItem = {
      id: 'faq-' + Date.now(),
      question: '',
      answer: '',
      category: 'عام',
    };
    setDoctor((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), newFaq],
    }));
  };

  const removeFaq = (id: string) => {
    setDoctor((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
  };

  const updateFaq = (id: string, patch: Partial<FAQItem>) => {
    setDoctor((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* ----------------- TOP STICKY TOOLBAR ----------------- */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Right side (RTL): Back & Doctor Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="العودة للوحة التحكم"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 truncate max-w-[200px] sm:max-w-xs">
              {doctor.fullName || 'طبيب جديد'}
            </span>
            <span className="text-slate-300">/</span>
            {/* Status Select */}
            <select
              value={doctor.status}
              onChange={(e) =>
                setDoctor((prev) => ({ ...prev, status: e.target.value as DoctorStatus }))
              }
              className="text-xs bg-slate-100 hover:bg-slate-200/80 font-medium text-slate-700 py-1 px-2.5 rounded-md border-0 cursor-pointer focus:ring-1 focus:ring-teal-500"
            >
              <option value="draft">مسودة قيد التجهيز</option>
              <option value="pending">قيد المراجعة والاعتماد</option>
              <option value="published">منشور للجمهور (Live)</option>
            </select>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              previewDevice === 'desktop'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>سطح المكتب</span>
          </button>
          <button
            onClick={() => setPreviewDevice('tablet')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              previewDevice === 'tablet'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>تابلت</span>
          </button>
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              previewDevice === 'mobile'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>موبايل</span>
          </button>
        </div>

        {/* Left side: Save & Preview Buttons */}
        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs text-emerald-700 font-medium hidden sm:inline">
              {saveSuccessMsg}
            </span>
          )}

          <a
            href={`/doctors/${doctor.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition"
            title="فتح موقع الطبيب في علامة تبويب جديدة"
          >
            <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
            <span>زيارة الموقع</span>
          </a>

          <button
            onClick={() => onPreviewPublic(doctor)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>معاينة كزائر</span>
          </button>

          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition disabled:opacity-50"
          >
            حفظ مسودة
          </button>

          <button
            onClick={() => handleSave(doctor.status === 'published' ? 'published' : 'published')}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition disabled:opacity-50 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ ونشر'}</span>
          </button>
        </div>
      </header>

      {/* ----------------- DUAL PANE EDITOR WORKSPACE ----------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right Pane (Form Controls) */}
        <div className="w-full lg:w-[540px] xl:w-[600px] border-l border-slate-200 bg-white flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden shrink-0">
          {/* Tabs Navigation Bar */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition font-medium ${
                activeTab === 'basic'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              البيانات الأساسية
            </button>
            <button
              onClick={() => setActiveTab('clinic')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition font-medium ${
                activeTab === 'clinic'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              العيادة والتواصل
            </button>
            <button
              onClick={() => setActiveTab('qualifications')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition font-medium ${
                activeTab === 'qualifications'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المؤهلات ({doctor.qualifications?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition font-medium ${
                activeTab === 'services'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الخدمات ({doctor.services?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition font-medium ${
                activeTab === 'content'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المقالات والأسئلة
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition font-medium ${
                activeTab === 'branding'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الثيم والألوان
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition font-medium ${
                activeTab === 'seo'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              إعدادات SEO
            </button>
          </div>

          {/* Form Tab Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* TAB 1: BASIC INFORMATION */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3.5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        الاسم الكامل للطبيب (بالعربية) *
                      </label>
                      <input
                        type="text"
                        value={doctor.fullName}
                        onChange={(e) => setDoctor({ ...doctor, fullName: e.target.value })}
                        placeholder="د. أحمد محمود الشناوي"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Full Name (English)
                      </label>
                      <input
                        type="text"
                        value={doctor.fullNameEn || ''}
                        onChange={(e) => setDoctor({ ...doctor, fullNameEn: e.target.value })}
                        placeholder="Dr. Ahmed Mahmoud El-Shinawy"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-medium dir-ltr text-left"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      الرابط المخصص للموقع (Slug) *
                    </label>
                    <div className="flex items-center gap-1 dir-ltr text-left">
                      <span className="text-slate-400 font-mono text-xs">/doctors/</span>
                      <input
                        type="text"
                        value={doctor.slug}
                        onChange={(e) =>
                          setDoctor({ ...doctor, slug: e.target.value.toLowerCase().trim() })
                        }
                        placeholder="dr-ahmed"
                        className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border font-mono ${
                          slugError ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {slugError ? (
                      <p className="text-[11px] text-rose-600 mt-1">{slugError}</p>
                    ) : doctor.slug ? (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-mono dir-ltr truncate text-slate-700">
                          {window.location.origin}/doctors/{doctor.slug}
                        </span>
                        <a
                          href={`/doctors/${doctor.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 shrink-0 mr-2"
                        >
                          <span>فتح الموقع</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        التخصص الطبي الدقيق (بالعربية) *
                      </label>
                      <input
                        type="text"
                        value={doctor.specialty}
                        onChange={(e) => setDoctor({ ...doctor, specialty: e.target.value })}
                        placeholder="استشاري جراحة القلب والأوعية الدموية"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Specialty (English)
                      </label>
                      <input
                        type="text"
                        value={doctor.specialtyEn || ''}
                        onChange={(e) => setDoctor({ ...doctor, specialtyEn: e.target.value })}
                        placeholder="Consultant Cardiovascular Surgeon"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dir-ltr text-left"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        اللقب المهني والأكاديمي (بالعربية)
                      </label>
                      <input
                        type="text"
                        value={doctor.title}
                        onChange={(e) => setDoctor({ ...doctor, title: e.target.value })}
                        placeholder="أستاذ بكلية الطب - زميل الكلية الملكية للجراحين"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Academic Title (English)
                      </label>
                      <input
                        type="text"
                        value={doctor.titleEn || ''}
                        onChange={(e) => setDoctor({ ...doctor, titleEn: e.target.value })}
                        placeholder="Professor of Surgery - Fellow of RCS"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dir-ltr text-left"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      سنوات الخبرة السريرية
                    </label>
                    <input
                      type="number"
                      value={doctor.yearsOfExperience || ''}
                      onChange={(e) =>
                        setDoctor({
                          ...doctor,
                          yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="15"
                      className="w-32 text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono tabular-nums"
                    />
                  </div>

                  {/* Doctor Profile Photo with Device Upload */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-teal-600" />
                        <span>الصورة الشخصية للطبيب (Profile Photo)</span>
                      </label>
                      {doctor.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setDoctor({ ...doctor, photoUrl: '' })}
                          className="text-[10px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium transition"
                          title="حذف الصورة الشخصية"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>إزالة الصورة</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                      {/* Avatar Preview */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center">
                        {doctor.photoUrl ? (
                          <img
                            src={doctor.photoUrl}
                            alt={doctor.fullName || 'صورة الطبيب'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <Stethoscope className="w-6 h-6 text-slate-400 mb-0.5" />
                            <span className="text-[9px]">بدون صورة</span>
                          </div>
                        )}
                      </div>

                      {/* Upload from Device button */}
                      <div className="flex-1 space-y-1.5">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع صورة شخصية من جهازك</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-slate-500">
                          يدعم ملفات JPG و PNG و WebP. سيتم تحديث وتطبيق الصورة في الموقع فوراً.
                        </p>
                      </div>
                    </div>

                    {/* Direct URL input fallback */}
                    <div className="pt-2 border-t border-slate-200/70">
                      <span className="block text-[10px] text-slate-500 mb-1">أو أدخل رابط الصورة المباشر (Image URL):</span>
                      <input
                        type="text"
                        value={doctor.photoUrl || ''}
                        onChange={(e) => setDoctor({ ...doctor, photoUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-mono dir-ltr text-left bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        النبذة المهنية وسيرة الطبيب (بالعربية)
                      </label>
                      <textarea
                        rows={4}
                        value={doctor.bio}
                        onChange={(e) => setDoctor({ ...doctor, bio: e.target.value })}
                        placeholder="طبيب وجراح متخصص في..."
                        className="w-full text-xs p-3 rounded-lg border border-slate-300 leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Professional Biography (English)
                      </label>
                      <textarea
                        rows={4}
                        value={doctor.bioEn || ''}
                        onChange={(e) => setDoctor({ ...doctor, bioEn: e.target.value })}
                        placeholder="Consultant and specialist dedicated to providing advanced medical care..."
                        className="w-full text-xs p-3 rounded-lg border border-slate-300 leading-relaxed dir-ltr text-left"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CLINIC & CONTACT */}
            {activeTab === 'clinic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      اسم العيادة أو المركز الطبي
                    </label>
                    <input
                      type="text"
                      value={doctor.clinic.name}
                      onChange={(e) =>
                        setDoctor({
                          ...doctor,
                          clinic: { ...doctor.clinic, name: e.target.value },
                        })
                      }
                      placeholder="عيادة النخبة للقلب"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      العنوان التفصيلي
                    </label>
                    <input
                      type="text"
                      value={doctor.clinic.address}
                      onChange={(e) =>
                        setDoctor({
                          ...doctor,
                          clinic: { ...doctor.clinic, address: e.target.value },
                        })
                      }
                      placeholder="15 شارع جامعة الدول العربية، المهندسين"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        المدينة / المحافظة
                      </label>
                      <input
                        type="text"
                        value={doctor.clinic.city}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            clinic: { ...doctor.clinic, city: e.target.value },
                          })
                        }
                        placeholder="الجيزة / القاهرة"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        رقم هاتف الاتصال
                      </label>
                      <input
                        type="text"
                        value={doctor.clinic.phone}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            clinic: { ...doctor.clinic, phone: e.target.value },
                          })
                        }
                        placeholder="0237612345"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono dir-ltr text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      رقم واتساب لحجز المواعيد *
                    </label>
                    <input
                      type="text"
                      value={doctor.clinic.whatsapp}
                      onChange={(e) =>
                        setDoctor({
                          ...doctor,
                          clinic: { ...doctor.clinic, whatsapp: e.target.value },
                        })
                      }
                      placeholder="+201009876543"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      مواعيد العمل وأيام الكشف
                    </label>
                    <input
                      type="text"
                      value={doctor.clinic.workingHours}
                      onChange={(e) =>
                        setDoctor({
                          ...doctor,
                          clinic: { ...doctor.clinic, workingHours: e.target.value },
                        })
                      }
                      placeholder="السبت والإثنين والأربعاء: 6:00 م - 10:00 م"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      رابط خرائط جوجل (Google Maps URL)
                    </label>
                    <input
                      type="text"
                      value={doctor.clinic.googleMapsUrl}
                      onChange={(e) =>
                        setDoctor({
                          ...doctor,
                          clinic: { ...doctor.clinic, googleMapsUrl: e.target.value },
                        })
                      }
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono dir-ltr text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ملاحظة إرشادية للمريض عند الحجز
                    </label>
                    <input
                      type="text"
                      value={doctor.clinic.bookingNote || ''}
                      onChange={(e) =>
                        setDoctor({
                          ...doctor,
                          clinic: { ...doctor.clinic, bookingNote: e.target.value },
                        })
                      }
                      placeholder="يُرجى إحضار التحاليل والفحوصات السابقة عند الزيارة الأولى"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: QUALIFICATIONS */}
            {activeTab === 'qualifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-semibold text-slate-800">
                    المؤهلات العلمية والشهادات
                  </span>
                  <button
                    type="button"
                    onClick={addQualification}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مؤهل</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {doctor.qualifications?.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500">
                          مؤهل #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQualification(q.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={q.degree}
                          onChange={(e) => updateQualification(q.id, { degree: e.target.value })}
                          placeholder="الشهادة: دكتوراه جراحة القلب (MD)"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          value={q.institution}
                          onChange={(e) => updateQualification(q.id, { institution: e.target.value })}
                          placeholder="الجهة المانحة: جامعة القاهرة (قصر العيني)"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                        />
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={q.year || ''}
                            onChange={(e) => updateQualification(q.id, { year: e.target.value })}
                            placeholder="سنة التخرج: 2012"
                            className="w-28 text-xs px-2 py-1 rounded border border-slate-300 bg-white font-mono"
                          />
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.verified}
                              onChange={(e) => updateQualification(q.id, { verified: e.target.checked })}
                              className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                            />
                            <span className="text-[11px] text-slate-700">شارة موثق ومعتمد</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SERVICES */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-semibold text-slate-800">
                    الخدمات والعمليات الطبية
                  </span>
                  <button
                    type="button"
                    onClick={addService}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة خدمة</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {doctor.services?.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500">
                          خدمة #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeService(s.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => updateService(s.id, { name: e.target.value })}
                          placeholder="اسم الخدمة (بالعربية): كشف وفحص سريري دقيق"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium"
                        />
                        <input
                          type="text"
                          value={s.nameEn || ''}
                          onChange={(e) => updateService(s.id, { nameEn: e.target.value })}
                          placeholder="Service Name (English): Clinical Consultation"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium dir-ltr text-left"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <textarea
                          rows={2}
                          value={s.description}
                          onChange={(e) => updateService(s.id, { description: e.target.value })}
                          placeholder="وصف تفصيلي للخدمة (بالعربية)..."
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                        />
                        <textarea
                          rows={2}
                          value={s.descriptionEn || ''}
                          onChange={(e) => updateService(s.id, { descriptionEn: e.target.value })}
                          placeholder="Detailed description (English)..."
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white dir-ltr text-left"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={s.tag || ''}
                          onChange={(e) => updateService(s.id, { tag: e.target.value })}
                          placeholder="التصنيف: استشارة"
                          className="w-full text-xs px-2 py-1 rounded border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          value={s.tagEn || ''}
                          onChange={(e) => updateService(s.id, { tagEn: e.target.value })}
                          placeholder="Tag (EN): Consultation"
                          className="w-full text-xs px-2 py-1 rounded border border-slate-300 bg-white dir-ltr text-left"
                        />
                        <input
                          type="text"
                          value={s.fee || ''}
                          onChange={(e) => updateService(s.id, { fee: e.target.value })}
                          placeholder="الرسوم: حسب التقييم"
                          className="w-full text-xs px-2 py-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ARTICLES & FAQS */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Articles Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-800">
                      المقالات التثقيفية الطبية
                    </span>
                    <button
                      type="button"
                      onClick={addArticle}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مقال</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {doctor.articles?.map((art, idx) => (
                      <div
                        key={art.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">
                            مقال #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeArticle(art.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={art.title}
                          onChange={(e) => updateArticle(art.id, { title: e.target.value })}
                          placeholder="عنوان المقال: إرشادات للوقاية من..."
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium"
                        />
                        <textarea
                          rows={2}
                          value={art.summary}
                          onChange={(e) => updateArticle(art.id, { summary: e.target.value })}
                          placeholder="الملخص المختصر..."
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQs Section */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-800">
                      الأسئلة الشائعة للمرضى
                    </span>
                    <button
                      type="button"
                      onClick={addFaq}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة سؤال</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {doctor.faqs?.map((faq, idx) => (
                      <div
                        key={faq.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">
                            سؤال #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFaq(faq.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFaq(faq.id, { question: e.target.value })}
                          placeholder="السؤال: ما هي الفحوصات المطلوبة قبل الكشف؟"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium"
                        />
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => updateFaq(faq.id, { answer: e.target.value })}
                          placeholder="الإجابة الطبية المباشرة..."
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: BRANDING & 5 CURATED THEMES */}
            {activeTab === 'branding' && (
              <div className="space-y-5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-2">
                    اختر ثيم الهوية الطبية (5 تصاميم منتقاة):
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {DOCTOR_THEMES.map((th) => {
                      const isSelected = doctor.branding?.themeId === th.id;
                      return (
                        <div
                          key={th.id}
                          onClick={() =>
                            setDoctor((prev) => ({
                              ...prev,
                              branding: {
                                ...prev.branding,
                                themeId: th.id,
                                primaryColor: th.primaryColor,
                                accentColor: th.accentColor,
                              },
                            }))
                          }
                          className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/30 ring-1 ring-teal-600/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{th.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({th.englishName})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{th.tagline}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-2xs"
                              style={{ backgroundColor: th.primaryColor }}
                            ></span>
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-2xs"
                              style={{ backgroundColor: th.accentColor }}
                            ></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Tuning */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="font-semibold text-slate-800 block text-xs">
                    تخصيص يدوي دقيق للألوان (Custom Palette):
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">
                        اللون الأساسي (Primary)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={doctor.branding?.primaryColor || '#0F2A4A'}
                          onChange={(e) =>
                            setDoctor((prev) => ({
                              ...prev,
                              branding: { ...prev.branding, primaryColor: e.target.value },
                            }))
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={doctor.branding?.primaryColor || '#0F2A4A'}
                          onChange={(e) =>
                            setDoctor((prev) => ({
                              ...prev,
                              branding: { ...prev.branding, primaryColor: e.target.value },
                            }))
                          }
                          className="w-24 text-xs px-2 py-1.5 rounded border border-slate-300 font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">
                        لون التمييز (Accent)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={doctor.branding?.accentColor || '#0D9488'}
                          onChange={(e) =>
                            setDoctor((prev) => ({
                              ...prev,
                              branding: { ...prev.branding, accentColor: e.target.value },
                            }))
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={doctor.branding?.accentColor || '#0D9488'}
                          onChange={(e) =>
                            setDoctor((prev) => ({
                              ...prev,
                              branding: { ...prev.branding, accentColor: e.target.value },
                            }))
                          }
                          className="w-24 text-xs px-2 py-1.5 rounded border border-slate-300 font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    عنوان الصفحة في محركات البحث (Meta Title)
                  </label>
                  <input
                    type="text"
                    value={doctor.seo?.metaTitle || ''}
                    onChange={(e) =>
                      setDoctor({
                        ...doctor,
                        seo: { ...doctor.seo, metaTitle: e.target.value },
                      })
                    }
                    placeholder="د. أحمد الشناوي | استشاري جراحة القلب بالمهندسين"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    الطول المثالي: 30-60 حرفاً
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    الوصف التعريفي للبحث وروابط واتساب (Meta Description)
                  </label>
                  <textarea
                    rows={3}
                    value={doctor.seo?.metaDescription || ''}
                    onChange={(e) =>
                      setDoctor({
                        ...doctor,
                        seo: { ...doctor.seo, metaDescription: e.target.value },
                      })
                    }
                    placeholder="الموقع الرسمي للدكتور أحمد الشناوي... حجز الكشف، الاستشارات، ومواعيد العيادة..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    الطول المثالي: 70-160 حرفاً
                  </p>
                </div>

                {/* Google Search Snippet Simulation */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 mb-2 block">
                    معاينة مظهر الرابط في نتائج بحث جوجل:
                  </span>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <p className="text-[11px] font-mono text-emerald-800 dir-ltr text-right truncate">
                      {window.location.origin}/doctors/{doctor.slug}
                    </p>
                    <h4 className="text-xs font-semibold text-blue-800 truncate">
                      {doctor.seo?.metaTitle || doctor.fullName + ' | ' + doctor.specialty}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {doctor.seo?.metaDescription || doctor.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Left Pane (Live Responsive Website Preview) */}
        <div className="hidden lg:flex flex-1 bg-slate-900 flex-col overflow-hidden">
          {/* Preview Canvas Bar */}
          <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span className="font-medium text-slate-200">معاينة فورية متزامنة (Live Preview)</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              {previewDevice === 'desktop'
                ? 'عرض سطح المكتب (100%)'
                : previewDevice === 'tablet'
                ? 'عرض التابلت (768px)'
                : 'عرض الهاتف الذكي (375px)'}
            </span>
          </div>

          {/* Viewport Render Area */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/80">
            <div
              className={`transition-all duration-200 bg-white shadow-2xl overflow-y-auto max-h-[88vh] ${
                previewDevice === 'desktop'
                  ? 'w-full h-full rounded-lg'
                  : previewDevice === 'tablet'
                  ? 'w-[768px] h-[850px] border-8 border-slate-800 rounded-2xl'
                  : 'w-[375px] h-[720px] border-8 border-slate-800 rounded-3xl'
              }`}
            >
              <DoctorWebsite
                doctor={doctor}
                isAdminPreview={true}
                onBackToDashboard={onCancel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
