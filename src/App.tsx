/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { DoctorProfile, FirebaseConnectionConfig } from './types/doctor';
import {
  getAllDoctors,
  getDoctorBySlug,
  fetchDoctorBySlugWithDiagnosis,
  DoctorFetchErrorType,
  saveDoctor,
  deleteDoctor,
  duplicateDoctor,
  exportDoctorsToJson,
  importDoctorsFromJson,
  getDatabaseStatus,
  testAndSaveFirebaseConfig,
  disconnectFirebase,
  DatabaseStatus,
  getAdminUser,
  subscribeToAuthChanges,
  adminSignOut,
  AdminUser,
} from './services/storage';
import type { EditorTab } from './components/editor/DoctorEditor';

const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })));
const DoctorEditor = lazy(() => import('./components/editor/DoctorEditor').then((module) => ({ default: module.DoctorEditor })));
const WebsiteBuilder = lazy(() => import('./components/builder/WebsiteBuilder').then((module) => ({ default: module.WebsiteBuilder })));
const DoctorWebsite = lazy(() => import('./components/public/DoctorWebsite').then((module) => ({ default: module.DoctorWebsite })));
const AdminLogin = lazy(() => import('./components/auth/AdminLogin').then((module) => ({ default: module.AdminLogin })));
import {
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  ArrowLeft,
  RefreshCw,
  FileText,
  WifiOff,
  Lock,
} from 'lucide-react';

type AppView = 'dashboard' | 'editor' | 'builder' | 'public_website' | 'admin_preview';

function RouteLoading() {
  return (
    <div role="status" className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-600">
      <span className="h-5 w-5 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
      <span className="sr-only">جارٍ تحميل MedFrame Studio...</span>
    </div>
  );
}

/**
 * Synchronously extract the public doctor slug from current URL (pathname, hash, or query)
 * Ensures zero-delay public route detection before first render.
 */
function extractPublicSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;

  // 1. Query parameters: ?doctor=dr-sgyb5, ?slug=dr-sgyb5, ?d=dr-sgyb5
  try {
    const searchParams = new URLSearchParams(search);
    const querySlug = searchParams.get('doctor') || searchParams.get('slug') || searchParams.get('d');
    if (querySlug && querySlug.trim()) {
      return decodeURIComponent(querySlug.trim());
    }
  } catch {}

  // 2. Pathname prefixes: /doctors/:slug, /doctor/:slug, /dr/:slug
  const prefixMatch = path.match(/^\/(?:doctors|doctor|dr)\/([^/?#]+)/i);
  if (prefixMatch && prefixMatch[1]) {
    try {
      return decodeURIComponent(prefixMatch[1].trim());
    } catch {
      return prefixMatch[1].trim();
    }
  }

  // 3. Root slug /:slug (excluding reserved keywords)
  const singleMatch = path.match(/^\/([^/?#]+)/);
  if (singleMatch && singleMatch[1]) {
    const candidate = singleMatch[1].toLowerCase().trim();
    const reserved = [
      'dashboard',
      'admin',
      'builder',
      'editor',
      'api',
      'assets',
      'favicon.ico',
      'index.html',
      'robots.txt',
      'sitemap.xml',
    ];
    if (!reserved.includes(candidate)) {
      try {
        return decodeURIComponent(singleMatch[1].trim());
      } catch {
        return singleMatch[1].trim();
      }
    }
  }

  // 4. Hash route: #/doctors/:slug, #doctor/:slug, #/:slug
  if (hash) {
    const hashPrefixMatch = hash.match(/^#\/?(?:doctors|doctor|dr)\/([^/?#]+)/i);
    if (hashPrefixMatch && hashPrefixMatch[1]) {
      try {
        return decodeURIComponent(hashPrefixMatch[1].trim());
      } catch {
        return hashPrefixMatch[1].trim();
      }
    } else {
      const hashSingleMatch = hash.match(/^#\/?([^/?#]+)/);
      if (hashSingleMatch && hashSingleMatch[1]) {
        const candidate = hashSingleMatch[1].toLowerCase().trim();
        const reserved = ['dashboard', 'admin', 'builder', 'editor'];
        if (!reserved.includes(candidate)) {
          try {
            return decodeURIComponent(hashSingleMatch[1].trim());
          } catch {
            return hashSingleMatch[1].trim();
          }
        }
      }
    }
  }

  return null;
}

export default function App() {
  const initialSlug = extractPublicSlugFromUrl();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(initialSlug ? 'public_website' : 'dashboard');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [editorInitialTab, setEditorInitialTab] = useState<EditorTab>('basic');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>(getDatabaseStatus());
  const [loading, setLoading] = useState(!initialSlug);
  const [publicLoading, setPublicLoading] = useState(Boolean(initialSlug));
  const [publicError, setPublicError] = useState<{
    type: DoctorFetchErrorType;
    slug: string;
    message?: string;
  } | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getAdminUser());

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load doctors from storage for CMS Dashboard
  const loadDoctors = useCallback(async () => {
    try {
      const list = await getAllDoctors();
      setDoctors(list);
      setDbStatus(getDatabaseStatus());
    } catch (e) {
      console.error('Failed to load doctors', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // The first load can happen before Firebase restores the persisted session.
  // Reload once the verified administrator claim becomes available so the
  // dashboard receives private drafts as well as published profiles.
  useEffect(() => {
    if (adminUser?.isFirebaseUser) void loadDoctors();
  }, [adminUser?.uid, adminUser?.isFirebaseUser, loadDoctors]);

  // Handle URL route resolution directly from Firebase without depending on preloaded CMS state
  const resolveRouteFromUrl = useCallback(async () => {
    const targetSlug = extractPublicSlugFromUrl();

    if (targetSlug) {
      setPublicLoading(true);
      setPublicError(null);
      try {
        const result = await fetchDoctorBySlugWithDiagnosis(targetSlug);
        if (result.doctor) {
          setSelectedDoctor(result.doctor);
          setCurrentView('public_website');
          setPublicError(null);
        } else {
          setSelectedDoctor(null);
          setCurrentView('public_website');
          setPublicError({
            type: result.error || 'not_found',
            slug: targetSlug,
            message: result.errorMessage,
          });
        }
      } catch (err) {
        setSelectedDoctor(null);
        setCurrentView('public_website');
        setPublicError({
          type: 'connection_error',
          slug: targetSlug,
          message: err instanceof Error ? err.message : 'تعذر الاتصال بقاعدة البيانات',
        });
      } finally {
        setPublicLoading(false);
      }
    } else {
      setCurrentView('dashboard');
      setSelectedDoctor(null);
      setPublicError(null);
      loadDoctors();
    }
  }, [loadDoctors]);

  // Initial routing listener
  useEffect(() => {
    resolveRouteFromUrl();

    const handlePopState = () => {
      resolveRouteFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [resolveRouteFromUrl]);

  // Navigate to public doctor URL
  const navigateToDoctorPublic = (slug: string) => {
    const newUrl = `/doctors/${slug}`;
    window.history.pushState({}, '', newUrl);
    resolveRouteFromUrl();
  };

  // Navigate to Dashboard
  const navigateToDashboard = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('dashboard');
    setSelectedDoctor(null);
    setPublicError(null);
  };

  // New doctor profiles stay private until an administrator explicitly publishes them.
  const handleAddNewDoctor = () => {
    const newId = 'doc-' + Date.now();
    const blankDoctor: DoctorProfile = {
      id: newId,
      slug: 'dr-' + Math.random().toString(36).substring(2, 7),
      fullName: '',
      specialty: 'استشاري ',
      title: 'أستاذ بكلية الطب - استشاري ',
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800',
      bio: '',
      yearsOfExperience: 10,
      qualifications: [
        {
          id: 'q-new-1',
          degree: 'بكالوريوس الطب والجراحة',
          institution: 'كلية الطب - قصر العيني',
          year: '2010',
          verified: true,
        },
      ],
      clinic: {
        name: 'عيادة ',
        address: 'القاهرة، مصر',
        city: 'القاهرة',
        googleMapsUrl: '',
        phone: '',
        whatsapp: '+20',
        workingHours: 'يومياً بالموعد المسبق',
        bookingNote: '',
      },
      services: [
        {
          id: 's-new-1',
          name: 'كشف واستشارة طبية متخصصة',
          description: 'فحص سريري دقيق وتقييم شامل للحالة الصحية مع كتابة البروتوكول العلاجي.',
          tag: 'استشارة',
        },
      ],
      articles: [],
      faqs: [],
      socialMedia: {},
      branding: {
        primaryColor: '#0F2A4A',
        accentColor: '#0D9488',
        fontStyle: 'classic',
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };

    setSelectedDoctor(blankDoctor);
    setEditorInitialTab('basic');
    setCurrentView('editor');
  };

  // Edit existing doctor
  const handleEditDoctor = (doctor: DoctorProfile, tab: EditorTab = 'basic') => {
    setSelectedDoctor(doctor);
    setEditorInitialTab(tab);
    setCurrentView('editor');
  };

  // Open Visual Website Builder for doctor
  const handleOpenBuilder = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setCurrentView('builder');
  };

  // Preview doctor website from CMS (retains back to dashboard and edit buttons)
  const handlePreviewDoctor = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setCurrentView('admin_preview');
  };

  // Save doctor
  const handleSaveDoctor = async (doctor: DoctorProfile) => {
    const saved = await saveDoctor(doctor);
    setSelectedDoctor(saved);
    await loadDoctors();
  };

  // Delete doctor
  const handleDeleteDoctor = async (id: string) => {
    await deleteDoctor(id);
    await loadDoctors();
  };

  // Duplicate doctor
  const handleDuplicateDoctor = async (id: string) => {
    await duplicateDoctor(id);
    await loadDoctors();
  };

  // Toggle publish / unpublish
  const handleTogglePublish = async (doctor: DoctorProfile) => {
    const newStatus = doctor.status === 'published' ? 'draft' : 'published';
    await saveDoctor({ ...doctor, status: newStatus });
    await loadDoctors();
  };

  // Connect Firebase
  const handleConnectFirebase = async (config: FirebaseConnectionConfig) => {
    const res = await testAndSaveFirebaseConfig(config);
    if (res.success) {
      await loadDoctors();
    }
    return res;
  };

  // Disconnect Firebase
  const handleDisconnectFirebase = () => {
    disconnectFirebase();
    setDbStatus(getDatabaseStatus());
    loadDoctors();
  };

  // Admin Logout
  const handleAdminLogout = async () => {
    await adminSignOut();
    setAdminUser(null);
  };

  // Export & Import
  const handleExportJson = async () => {
    const json = await exportDoctorsToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medframe-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (json: string) => {
    const count = await importDoctorsFromJson(json);
    await loadDoctors();
    return count;
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-sans">
        <div className="text-center space-y-3 p-8 bg-white rounded-xl border border-slate-200/90 shadow-2xs max-w-sm w-full mx-4">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-teal-400 mx-auto flex items-center justify-center">
            <Stethoscope className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-slate-900">MedFrame Studio</h2>
          <p className="text-xs text-slate-500">جارٍ تجهيز مساحة عمل MedFrame Studio...</p>
        </div>
      </div>
    );
  }

  // View: Live Editor
  if (currentView === 'editor' && selectedDoctor) {
    return (
      <Suspense fallback={<RouteLoading />}><DoctorEditor
        initialDoctor={selectedDoctor}
        initialTab={editorInitialTab}
        allDoctors={doctors}
        onSave={handleSaveDoctor}
        onCancel={navigateToDashboard}
        onPreviewPublic={handlePreviewDoctor}
      /></Suspense>
    );
  }

  // View: Visual Website Builder
  if (currentView === 'builder' && selectedDoctor) {
    return (
      <Suspense fallback={<RouteLoading />}><WebsiteBuilder
        doctor={selectedDoctor}
        onSaveDraft={async (updated) => {
          await handleSaveDoctor(updated);
        }}
        onPublish={async (updated) => {
          await handleSaveDoctor(updated);
        }}
        onBackToDashboard={navigateToDashboard}
        onOpenPublicUrl={() => navigateToDoctorPublic(selectedDoctor.slug)}
      /></Suspense>
    );
  }

  // View: Public Website (Strict visitor mode - 100% public patient view, NO admin controls)
  if (currentView === 'public_website') {
    // 0. Public loading state
    if (publicLoading) {
      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="text-center space-y-3 p-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs max-w-sm w-full mx-4">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white mx-auto flex items-center justify-center shadow-md">
              <Stethoscope className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-base font-bold text-slate-800">جارٍ تحميل موقع الطبيب...</h2>
            <p className="text-xs text-slate-500 font-mono">يرجى الانتظار لحظات لجلب البيانات من الخادم</p>
          </div>
        </div>
      );
    }

    // 1. Diagnostic Public Error States (Visitor-facing, differentiated, and graceful)
    if (!selectedDoctor && publicError) {
      const isNotFound = publicError.type === 'not_found';
      const isNotPublished = publicError.type === 'not_published';
      const isPermissionDenied = publicError.type === 'permission_denied';
      const isConnectionError = publicError.type === 'connection_error';

      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-center space-y-5">
            {/* Error Icon */}
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ring-8 ${
                isNotPublished
                  ? 'bg-amber-50 text-amber-600 ring-amber-50/50'
                  : isConnectionError
                  ? 'bg-rose-50 text-rose-600 ring-rose-50/50'
                  : isPermissionDenied
                  ? 'bg-indigo-50 text-indigo-600 ring-indigo-50/50'
                  : 'bg-rose-50 text-rose-600 ring-rose-50/50'
              }`}
            >
              {isNotPublished ? (
                <FileText className="w-7 h-7" />
              ) : isConnectionError ? (
                <WifiOff className="w-7 h-7" />
              ) : isPermissionDenied ? (
                <Lock className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>

            {/* Error Header */}
            <div className="space-y-1.5">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                  isNotPublished
                    ? 'bg-amber-100 text-amber-800'
                    : isConnectionError
                    ? 'bg-rose-100 text-rose-800'
                    : isPermissionDenied
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isNotPublished
                  ? 'صفحة قيد النشر (Draft)'
                  : isConnectionError
                  ? 'خطأ في الاتصال (Connection Error)'
                  : isPermissionDenied
                  ? 'صلاحيات الوصول مقيدة'
                  : 'خطأ 404 - غير موجود'}
              </span>

              <h2 className="text-xl font-bold text-slate-900">
                {isNotPublished
                  ? 'الموقع الطبي قيد التجهيز والنشر'
                  : isConnectionError
                  ? 'تعذر الاتصال بقاعدة البيانات السحابية'
                  : isPermissionDenied
                  ? 'تعذر الوصول إلى الملف الطبي'
                  : 'موقع الطبيب غير متاح'}
              </h2>

              <p className="text-xs text-slate-400 font-mono dir-ltr truncate max-w-full px-4">
                {window.location.origin}/doctors/{publicError.slug}
              </p>
            </div>

            {/* Error Explanation */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {isNotPublished
                ? 'تم تسجيل هذا الملف الطبي بنجاح في النظام، ولكنه حالياً في وضع المسودة (Draft) ولم يتم نشره للجمهور بعد من قِبل إدارة العيادة.'
                : isConnectionError
                ? 'حدث خطأ أثناء محاولة جلب بيانات الطبيب من خادم Firebase. يرجى التحقق من اتصال الإنترنت أو التأكد من إعدادات Vercel.'
                : isPermissionDenied
                ? 'قواعد حماية Firebase تمنع قراءة هذا السجل الطبي للعامة إلا إذا كانت حالته "منشور" (Published). تأكد من نشر الطبيب من لوحة تحكم CMS.'
                : 'عذراً، لم نتمكن من العثور على أي طبيب مرتبط بهذا الرابط. قد يكون الرابط غير صحيح، أو تم تغيير اسم النطاق، أو أن الصفحة حُذفت.'}
            </p>

            {publicError.message && isConnectionError && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 font-mono text-[11px] text-right truncate">
                {publicError.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-center gap-2">
              {isConnectionError || isPermissionDenied ? (
                <button
                  onClick={() => resolveRouteFromUrl()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
              ) : null}

              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للصفحة السابقة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Doctor found -> Render 100% public patient website (NO admin bar, NO dashboard button)
    if (selectedDoctor) {
      return (
        <Suspense fallback={<RouteLoading />}><DoctorWebsite
          doctor={selectedDoctor}
          isAdminPreview={false}
        /></Suspense>
      );
    }
  }

  // View: Admin Preview (Triggered explicitly from CMS Dashboard/Editor -> contains admin bar and back button)
  if (currentView === 'admin_preview' && selectedDoctor) {
    return (
      <Suspense fallback={<RouteLoading />}><DoctorWebsite
        doctor={selectedDoctor}
        isAdminPreview={true}
        onBackToDashboard={navigateToDashboard}
        onEditDoctor={handleEditDoctor}
      /></Suspense>
    );
  }

  // ---------------- Protected CMS Area (Admin Login Required) ----------------
  if (!adminUser) {
    return (
      <Suspense fallback={<RouteLoading />}><AdminLogin
        onSuccess={(user) => setAdminUser(user)}
      /></Suspense>
    );
  }

  // Default View: Admin Dashboard (Authenticated Admin)
  return (
    <Suspense fallback={<RouteLoading />}><Dashboard
      doctors={doctors}
      dbStatus={dbStatus}
      onAddDoctor={handleAddNewDoctor}
      onEditDoctor={handleEditDoctor}
      onOpenBuilder={handleOpenBuilder}
      onPreviewDoctor={handlePreviewDoctor}
      onDuplicateDoctor={handleDuplicateDoctor}
      onDeleteDoctor={handleDeleteDoctor}
      onTogglePublish={handleTogglePublish}
      onOpenPublicUrl={navigateToDoctorPublic}
      onConnectFirebase={handleConnectFirebase}
      onDisconnectFirebase={handleDisconnectFirebase}
      onExportJson={handleExportJson}
      onImportJson={handleImportJson}
      currentAdmin={adminUser}
      onLogout={handleAdminLogout}
    /></Suspense>
  );
}
