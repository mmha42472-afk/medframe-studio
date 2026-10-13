import React, { useState } from 'react';
import { DoctorProfile, FirebaseConnectionConfig } from '../../types/doctor';
import { DatabaseStatus } from '../../services/storage';
import { AnalyticsAndSeoSection, auditDoctorSEO } from './AnalyticsAndSeoSection';
import { doctorPublicPath, doctorPublicUrl } from '../../services/urls';
import {
  Users,
  Globe,
  FileEdit,
  Clock,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Check,
  Layout,
  Stethoscope,
  Shield,
  Layers,
  BarChart3,
  Cloud,
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Settings,
  ArrowUpRight,
  Filter,
  Sparkles,
  ChevronDown,
  Info,
  LogOut,
} from 'lucide-react';

interface DashboardProps {
  doctors: DoctorProfile[];
  dbStatus: DatabaseStatus;
  onAddDoctor: () => void;
  onEditDoctor: (
    doctor: DoctorProfile,
    tab?: 'basic' | 'clinic' | 'qualifications' | 'services' | 'content' | 'branding'
  ) => void;
  onOpenBuilder?: (doctor: DoctorProfile) => void;
  onPreviewDoctor: (doctor: DoctorProfile) => void;
  onDuplicateDoctor: (id: string) => Promise<void>;
  onDeleteDoctor: (id: string) => Promise<void>;
  onTogglePublish: (doctor: DoctorProfile) => Promise<void>;
  onOpenPublicUrl: (slug: string) => void;
  onConnectFirebase: (
    config: FirebaseConnectionConfig
  ) => Promise<{ success: boolean; message: string; step?: string; fixGuide?: string }>;
  onDisconnectFirebase: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => Promise<number>;
  currentAdmin?: { email: string; uid: string; isFirebaseUser: boolean } | null;
  onLogout?: () => void;
}

type NavigationTab = 'overview' | 'doctors' | 'analytics' | 'database';

export const Dashboard: React.FC<DashboardProps> = ({
  doctors,
  dbStatus,
  onAddDoctor,
  onEditDoctor,
  onOpenBuilder,
  onPreviewDoctor,
  onDuplicateDoctor,
  onDeleteDoctor,
  onTogglePublish,
  onOpenPublicUrl,
  onConnectFirebase,
  onDisconnectFirebase,
  onExportJson,
  onImportJson,
  currentAdmin,
  onLogout,
}) => {
  const [activeNav, setActiveNav] = useState<NavigationTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firebase Config Form State
  const [fbConfig, setFbConfig] = useState<FirebaseConnectionConfig>({
    apiKey: dbStatus.config?.apiKey || '',
    authDomain: dbStatus.config?.authDomain || '',
    projectId: dbStatus.config?.projectId || '',
    storageBucket: dbStatus.config?.storageBucket || '',
    messagingSenderId: dbStatus.config?.messagingSenderId || '',
    appId: dbStatus.config?.appId || '',
  });
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbResultMsg, setFbResultMsg] = useState<{
    success: boolean;
    message: string;
    step?: string;
    fixGuide?: string;
  } | null>(null);

  // Metrics
  const totalCount = doctors.length;
  const publishedCount = doctors.filter((d) => d.status === 'published').length;
  const draftCount = doctors.filter((d) => d.status === 'draft').length;
  const pendingCount = doctors.filter((d) => d.status === 'pending').length;

  // Filtered doctors
  const filteredDoctors = doctors.filter((doc) => {
    const matchesFilter = statusFilter === 'all' ? true : doc.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      doc.fullName.toLowerCase().includes(query) ||
      doc.specialty.toLowerCase().includes(query) ||
      doc.slug.toLowerCase().includes(query) ||
      doc.clinic?.name?.toLowerCase().includes(query) ||
      doc.clinic?.city?.toLowerCase().includes(query);

    return matchesFilter && matchesQuery;
  });

  const handleCopyLink = (slug: string) => {
    const path = doctorPublicUrl(slug);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(path);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2200);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setIsDeleting(true);
      await onDeleteDoctor(deleteConfirmId);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFirebaseConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbConfig.apiKey || !fbConfig.projectId) {
      alert('يرجى إدخال apiKey و projectId على الأقل.');
      return;
    }
    try {
      setFbConnecting(true);
      setFbResultMsg(null);
      const res = await onConnectFirebase(fbConfig);
      setFbResultMsg(res);
      if (res.success) {
        setTimeout(() => setShowFirebaseModal(false), 2000);
      }
    } finally {
      setFbConnecting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            const count = await onImportJson(content);
            alert(`تم استيراد ${count} ملف طبيب بنجاح!`);
          } catch (err) {
            alert(err instanceof Error ? err.message : 'فشل الاستيراد');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const doctorToDelete = doctors.find((d) => d.id === deleteConfirmId);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50/80 text-slate-900 flex font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* -------------------- RIGHT SIDEBAR (RTL Linear/Stripe style) -------------------- */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-white border-l border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-sky-300 flex items-center justify-center font-black text-xs tracking-tight ring-1 ring-slate-800">
                <span className="border-l-2 border-t-2 border-sky-400 px-1.5 py-1">MF</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-slate-900 leading-tight">
                  MedFrame Studio
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-tight">
                  Your Expertise. Your Identity.
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
              aria-label="إغلاق القائمة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="p-3">
            <button
              onClick={onAddDoctor}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-semibold transition shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>إضافة دكتور جديد</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-2 space-y-0.5 flex-1">
            <button
              onClick={() => {
                setActiveNav('overview');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeNav === 'overview'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={`w-4 h-4 ${activeNav === 'overview' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>لوحة التحكم الرئيسية</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveNav('doctors');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeNav === 'doctors'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeNav === 'doctors' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>دليل مواقع الأطباء</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveNav('analytics');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeNav === 'analytics'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className={`w-4 h-4 ${activeNav === 'analytics' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>الزيارات ومؤشرات SEO</span>
              </div>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">
                Live
              </span>
            </button>

            <button
              onClick={() => {
                setShowFirebaseModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <div className="flex items-center gap-2.5">
                {dbStatus.isCloudConnected ? (
                  <Cloud className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Database className="w-4 h-4 text-slate-400" />
                )}
                <span>قاعدة البيانات</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {dbStatus.isCloudConnected ? 'Firestore' : 'محلي'}
              </span>
            </button>
          </nav>

          {/* Sidebar Bottom: Storage Mode & Admin Profile */}
          <div className="p-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setShowFirebaseModal(true)}
              className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-200/70 transition text-right flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      dbStatus.isCloudConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                  <span className="truncate">
                    {dbStatus.isCloudConnected ? 'Firebase سحابي' : 'تخزين المتصفح المحلي'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {dbStatus.isCloudConnected ? 'المزامنة السحابية نشطة' : 'اضغط للربط بالسحابة'}
                </p>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Admin identity & Logout */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 shrink-0">
                  {currentAdmin?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs text-slate-900 truncate" title={currentAdmin?.email || 'مسؤول النظام'}>
                    {currentAdmin?.email || 'مسؤول النظام'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {currentAdmin?.isFirebaseUser ? 'Firebase Auth' : 'جلسة محلية'}
                  </p>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition shrink-0"
                  title="تسجيل الخروج من لوحة الإدارة"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* -------------------- MAIN WORKSPACE -------------------- */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>MedFrame Studio</span>
                <span>/</span>
                <span className="text-slate-700 font-medium">
                  {activeNav === 'overview'
                    ? 'لوحة التحكم الرئيسية'
                    : activeNav === 'doctors'
                    ? 'دليل الأطباء'
                    : 'الزيارات ومؤشرات SEO'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAddDoctor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>إضافة دكتور</span>
            </button>

            <button
              onClick={onExportJson}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium transition"
              title="تصدير نسخة احتياطية من البيانات (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium transition cursor-pointer"
              title="استيراد بيانات الأطباء (JSON)"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* 4 Refined KPI Cards (Linear / Stripe style, anti-slop tabular numbers) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Doctors */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium text-slate-500">إجمالي الأطباء</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                  {totalCount}
                </span>
                <span className="text-[11px] text-slate-400">ملف مسجل</span>
              </div>
            </div>

            {/* Published Websites */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium text-emerald-700">مواقع منشورة أونلاين</span>
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums tracking-tight">
                  {publishedCount}
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : 0}% من الشبكة
                </span>
              </div>
            </div>

            {/* Pending Review */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium text-amber-700">بانتظار المراجعة</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-amber-700 font-mono tabular-nums tracking-tight">
                  {pendingCount}
                </span>
                <span className="text-[11px] text-slate-400">تنتظر الاعتماد</span>
              </div>
            </div>

            {/* Drafts */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium text-slate-600">مسودات قيد التجهيز</span>
                <FileEdit className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-slate-700 font-mono tabular-nums tracking-tight">
                  {draftCount}
                </span>
                <span className="text-[11px] text-slate-400">غير منشورة</span>
              </div>
            </div>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveNav('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeNav === 'overview'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                دليل الأطباء والمواقع
              </button>
              <button
                onClick={() => setActiveNav('analytics')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                  activeNav === 'analytics'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>الزيارات ومؤشرات SEO</span>
                <span className="text-[10px] font-mono tabular-nums text-teal-700 bg-teal-50 px-1 py-0.2 rounded">
                  {doctors.length}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-500 hidden sm:block">
              {filteredDoctors.length} من أصل {totalCount} طبيب
            </div>
          </div>

          {/* ----------------- SECTION 1: DOCTORS DIRECTORY TABLE ----------------- */}
          {(activeNav === 'overview' || activeNav === 'doctors') && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {/* Table Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، التخصص، العيادة، أو الرابط..."
                    className="w-full text-xs pr-8 pl-3 py-2 rounded-lg border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-teal-500 transition font-medium"
                  />
                </div>

                {/* Filter Segmented Control */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      statusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    الكل ({totalCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      statusFilter === 'published'
                        ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    المنشور ({publishedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      statusFilter === 'pending'
                        ? 'bg-white text-amber-800 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    قيد المراجعة ({pendingCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('draft')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      statusFilter === 'draft'
                        ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    المسودات ({draftCount})
                  </button>
                </div>
              </div>

              {/* Data Table (SaaS High-Density Grid) */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">الطبيب</th>
                      <th className="py-2.5 px-4">التخصص والعيادة</th>
                      <th className="py-2.5 px-4">حالة الموقع</th>
                      <th className="py-2.5 px-4">الرابط المخصص</th>
                      <th className="py-2.5 px-4 text-center">تقييم SEO</th>
                      <th className="py-2.5 px-4">آخر تحديث</th>
                      <th className="py-2.5 px-4 text-left">إجراءات</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredDoctors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                            <p className="text-xs text-slate-600 font-medium">لم يتم العثور على أطباء مطابقين</p>
                            <p className="text-[11px] text-slate-400">
                              جرّب تغيير كلمات البحث أو إضافة طبيب جديد إلى النظام
                            </p>
                            <button
                              onClick={onAddDoctor}
                              className="mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700"
                            >
                              + إضافة دكتور جديد الآن
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredDoctors.map((doc) => {
                        const seoAudit = auditDoctorSEO(doc);
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors group">
                            {/* Doctor Name & Avatar */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 font-bold text-xs relative">
                                  {doc.photoUrl ? (
                                    <img
                                      src={doc.photoUrl}
                                      alt={doc.fullName}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to initials if image fails
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : null}
                                  <span className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-700 font-bold">
                                    {doc.fullName?.charAt(0) || 'ط'}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-900 truncate">
                                      {doc.fullName || 'طبيب بدون اسم'}
                                    </span>
                                    {doc.isDemo && (
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        (تجريبي)
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 block truncate">
                                    {doc.title || 'استشاري'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Specialty & Clinic */}
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800 block truncate max-w-[200px]">
                                {doc.specialty}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                                {doc.clinic?.name || doc.clinic?.city || 'القاهرة'}
                              </span>
                            </td>

                            {/* Website Status (Zero-pill: dot + text) */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    doc.status === 'published'
                                      ? 'bg-emerald-500'
                                      : doc.status === 'pending'
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                  }`}
                                ></span>
                                <span
                                  className={`text-xs font-medium ${
                                    doc.status === 'published'
                                      ? 'text-emerald-700'
                                      : doc.status === 'pending'
                                      ? 'text-amber-700'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {doc.status === 'published'
                                    ? 'منشور أونلاين'
                                    : doc.status === 'pending'
                                    ? 'قيد المراجعة'
                                    : 'مسودة'}
                                </span>
                              </div>
                            </td>

                            {/* Custom URL Slug - Clickable link to doctor's website */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                <a
                                  href={doctorPublicPath(doc.slug)}
                                  onClick={(e) => {
                                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && onOpenPublicUrl) {
                                      e.preventDefault();
                                      onOpenPublicUrl(doc.slug);
                                    }
                                  }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium hover:underline bg-teal-50/70 hover:bg-teal-100/70 px-2 py-0.5 rounded transition"
                                  title="اضغط لفتح موقع الطبيب (أو بالزر الأيمن لفتحه في تبويب جديد)"
                                >
                                  <span className="truncate max-w-[130px] dir-ltr text-left">
                                    /doctors/{doc.slug}
                                  </span>
                                  <ExternalLink className="w-3 h-3 shrink-0 text-teal-600" />
                                </a>
                                <button
                                  onClick={() => handleCopyLink(doc.slug)}
                                  title="نسخ الرابط المباشر لمشاركته"
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition shrink-0"
                                >
                                  {copiedSlug === doc.slug ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* SEO Score */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`font-mono tabular-nums text-xs font-semibold ${
                                  seoAudit.score >= 80
                                    ? 'text-emerald-700'
                                    : seoAudit.score >= 60
                                    ? 'text-teal-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {seoAudit.score}%
                              </span>
                            </td>

                            {/* Last Updated */}
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px] tabular-nums">
                              {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>

                            {/* Actions Menu */}
                            <td className="py-3 px-4 text-left">
                              <div className="flex items-center justify-end gap-1">
                                {/* Visual Website Builder Button */}
                                {onOpenBuilder && (
                                  <button
                                    onClick={() => onOpenBuilder(doc)}
                                    className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition flex items-center gap-1 font-medium text-[11px]"
                                    title="فتح مصمم المواقع المرئي التفاعلي (Website Builder)"
                                  >
                                    <Layout className="w-3.5 h-3.5" />
                                    <span className="hidden xl:inline">بناء وتخصيص الموقع</span>
                                  </button>
                                )}

                                {/* Edit */}
                                <button
                                  onClick={() => onEditDoctor(doc, 'basic')}
                                  className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition"
                                  title="تعديل ملف الطبيب ومحتوى الموقع"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Open in new tab */}
                                <a
                                  href={doctorPublicPath(doc.slug)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition"
                                  title="فتح موقع الطبيب في علامة تبويب جديدة"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                {/* Live Preview / Public View */}
                                <button
                                  onClick={() => onPreviewDoctor(doc)}
                                  className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition"
                                  title="معاينة الموقع كزائر"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Publish */}
                                <button
                                  onClick={() => onTogglePublish(doc)}
                                  className={`p-1.5 rounded-md transition ${
                                    doc.status === 'published'
                                      ? 'text-emerald-700 hover:bg-emerald-50'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                  }`}
                                  title={doc.status === 'published' ? 'تحويل لمسودة' : 'نشر الموقع للجمهور'}
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                </button>

                                {/* Duplicate */}
                                <button
                                  onClick={() => onDuplicateDoctor(doc.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                                  title="تكرار وإنشاء نسخة مطابقة"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => setDeleteConfirmId(doc.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                  title="حذف الملف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------- SECTION 2: ANALYTICS & SEO TAB ----------------- */}
          {activeNav === 'analytics' && (
            <AnalyticsAndSeoSection
              doctors={doctors}
              onEditDoctor={onEditDoctor}
              onPreviewDoctor={onPreviewDoctor}
            />
          )}
        </main>
      </div>

      {/* ----------------- DELETE CONFIRMATION MODAL ----------------- */}
      {deleteConfirmId && doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">حذف ملف الطبيب وموقعه</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف ملف الطبيب{' '}
              <strong className="text-slate-900">{doctorToDelete.fullName}</strong>؟
              سيتم إزالة الموقع الخاص به ولن يعد متاحاً للزوار.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50"
              >
                {isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- FIREBASE CONNECTION MODAL ----------------- */}
      {showFirebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    إعدادات قاعدة البيانات والمزامنة السحابية
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Firebase Cloud Firestore & Local Backup
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFirebaseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Status Banner */}
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                dbStatus.isCloudConnected
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {dbStatus.isCloudConnected
                    ? 'متصل حالياً بقاعدة بيانات Firebase Firestore السحابية'
                    : 'البيانات تُحفظ محلياً في ذاكرة المتصفح (Local Demo Mode)'}
                </p>
                <p className="text-[11px] text-slate-600">
                  {dbStatus.isCloudConnected
                    ? 'يتم حفظ أي تعديل ومزامنته مركزياً عبر السحابة.'
                    : 'يمكنك إدخال إعدادات مشروع Firebase الخاص بك للمزامنة السحابية الدائمة.'}
                </p>
              </div>
            </div>

            {/* Config Form */}
            <form onSubmit={handleFirebaseConnectSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    API Key *
                  </label>
                  <input
                    type="text"
                    value={fbConfig.apiKey}
                    onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    value={fbConfig.projectId}
                    onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                    placeholder="my-medical-app"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={fbConfig.authDomain}
                    onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                    placeholder="project.firebaseapp.com"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={fbConfig.appId}
                    onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                    placeholder="1:123456:web:abcd"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {fbResultMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-medium ${
                    fbResultMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {fbResultMsg.message}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {dbStatus.isCloudConnected ? (
                  <button
                    type="button"
                    onClick={onDisconnectFirebase}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    قطع الاتصال والعودة للتخزين المحلي
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">بيانات الأطباء محفوظة في Firebase</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFirebaseModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    إغلاق
                  </button>
                  <button
                    type="submit"
                    disabled={fbConnecting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition disabled:opacity-50"
                  >
                    {fbConnecting ? 'جارٍ الاتصال...' : 'حفظ واختبار الاتصال'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

