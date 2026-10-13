import React, { useState } from 'react';
import { DoctorProfile } from '../../types/doctor';
import {
  BarChart3,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageCircle,
  MousePointerClick,
  ArrowUpRight,
  Sparkles,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
  X,
  Check,
} from 'lucide-react';

interface AnalyticsAndSeoSectionProps {
  doctors: DoctorProfile[];
  onEditDoctor: (
    doctor: DoctorProfile,
    tab?: 'basic' | 'clinic' | 'qualifications' | 'services' | 'content' | 'branding'
  ) => void;
  onPreviewDoctor: (doctor: DoctorProfile) => void;
}

export interface DoctorSEOAudit {
  score: number;
  statusLabel: 'ممتاز' | 'جيد جداً' | 'متوسط' | 'يحتاج تحسين';
  statusColor: 'emerald' | 'teal' | 'amber' | 'rose';
  checks: {
    label: string;
    passed: boolean;
    points: number;
    tip: string;
  }[];
}

export interface DoctorTrafficMock {
  monthlyViews: number;
  uniqueVisitors: number;
  whatsappClicks: number;
  conversionRate: number;
  trendPercentage: number;
}

// Deterministic hash to keep mock data consistent per doctor
function getHashFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function calculateDoctorTraffic(doc: DoctorProfile): DoctorTrafficMock {
  const hash = getHashFromId(doc.id + doc.slug);
  const isPublished = doc.status === 'published';

  if (!isPublished) {
    // Draft / Pending profiles have minimal staging visits
    const monthlyViews = 45 + (hash % 65);
    const uniqueVisitors = Math.round(monthlyViews * 0.72);
    const whatsappClicks = Math.max(1, Math.round(monthlyViews * 0.04));
    const conversionRate = Number(((whatsappClicks / monthlyViews) * 100).toFixed(1));
    const trendPercentage = 5 + (hash % 10);
    return {
      monthlyViews,
      uniqueVisitors,
      whatsappClicks,
      conversionRate,
      trendPercentage,
    };
  }

  // Published profiles have active organic traffic
  const baseViews = 950 + (hash % 1450);
  const uniqueVisitors = Math.round(baseViews * (0.68 + (hash % 15) / 100));
  const whatsappClicks = Math.round(baseViews * (0.065 + (hash % 4) / 100));
  const conversionRate = Number(((whatsappClicks / baseViews) * 100).toFixed(1));
  const trendPercentage = Number((8 + (hash % 18) + (hash % 10) / 10).toFixed(1));

  return {
    monthlyViews: baseViews,
    uniqueVisitors,
    whatsappClicks,
    conversionRate,
    trendPercentage,
  };
}

export function auditDoctorSEO(doc: DoctorProfile): DoctorSEOAudit {
  const checks = [
    {
      label: 'عنوان محركات البحث (Meta Title)',
      passed: Boolean(doc.seo?.metaTitle && doc.seo.metaTitle.trim().length >= 25),
      points: 15,
      tip:
        doc.seo?.metaTitle && doc.seo.metaTitle.trim().length >= 25
          ? 'عنوان مناسب ومطابق لمعايير البحث في جوجل'
          : 'أضف عنوان Meta Title دقيق يحتوي على اسم الطبيب وتخصصه (25-60 حرف)',
    },
    {
      label: 'الوصف التعريفي (Meta Description)',
      passed: Boolean(doc.seo?.metaDescription && doc.seo.metaDescription.trim().length >= 60),
      points: 15,
      tip:
        doc.seo?.metaDescription && doc.seo.metaDescription.trim().length >= 60
          ? 'وصف متكامل يظهر في نتائج البحث وروابط واتساب'
          : 'أضف وصفاً شاملاً للخدمات والعيادة (60-160 حرف)',
    },
    {
      label: 'الرابط المخصص (Slug)',
      passed: Boolean(doc.slug && /^[a-z0-9-]+$/.test(doc.slug) && doc.slug.length >= 5),
      points: 10,
      tip: 'رابط إنجليزي نظيف ومختصر لسهولة الفهرسة',
    },
    {
      label: 'النبذة المهنية والسيرة الذاتية',
      passed: Boolean(doc.bio && doc.bio.trim().length >= 100),
      points: 15,
      tip:
        doc.bio && doc.bio.trim().length >= 100
          ? 'محتوى تعريفي موثوق يدعم الظهور في البحث الطبي'
          : 'اكتب نبذة لا تقل عن 100 حرف لتعزيز ثقة المرضى ومحركات البحث',
    },
    {
      label: 'المؤهلات العلمية والشهادات',
      passed: Boolean(doc.qualifications && doc.qualifications.length >= 2),
      points: 10,
      tip: 'إبراز الدرجات والزمالات يدعم معايير E-E-A-T الطبية',
    },
    {
      label: 'الخدمات الطبية الموضحة',
      passed: Boolean(doc.services && doc.services.length >= 2),
      points: 10,
      tip: 'تعدد الخدمات يوسع نطاق الكلمات المفتاحية التخصصية',
    },
    {
      label: 'المقالات التثقيفية الطبية',
      passed: Boolean(doc.articles && doc.articles.length >= 1),
      points: 10,
      tip: 'المقالات التثقيفية ترفع الترافيك العضوي المجاني من جوجل',
    },
    {
      label: 'الأسئلة الشائعة (FAQ)',
      passed: Boolean(doc.faqs && doc.faqs.length >= 2),
      points: 10,
      tip: 'الأسئلة والأجوبة تدعم الظهور في المقتطفات المميزة',
    },
    {
      label: 'عنوان العيادة والخرائط',
      passed: Boolean(doc.clinic?.address && doc.clinic?.googleMapsUrl),
      points: 5,
      tip: 'العنوان التفصيلي والخرائط يعززان السيو المحلي في مصر (Local SEO)',
    },
  ];

  const totalPoints = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  const score = Math.min(100, totalPoints);

  let statusLabel: 'ممتاز' | 'جيد جداً' | 'متوسط' | 'يحتاج تحسين' = 'متوسط';
  let statusColor: 'emerald' | 'teal' | 'amber' | 'rose' = 'amber';

  if (score >= 85) {
    statusLabel = 'ممتاز';
    statusColor = 'emerald';
  } else if (score >= 70) {
    statusLabel = 'جيد جداً';
    statusColor = 'teal';
  } else if (score >= 50) {
    statusLabel = 'متوسط';
    statusColor = 'amber';
  } else {
    statusLabel = 'يحتاج تحسين';
    statusColor = 'rose';
  }

  return {
    score,
    statusLabel,
    statusColor,
    checks,
  };
}

export const AnalyticsAndSeoSection: React.FC<AnalyticsAndSeoSectionProps> = ({
  doctors,
  onEditDoctor,
  onPreviewDoctor,
}) => {
  const [selectedAuditDoctorId, setSelectedAuditDoctorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pre-calculate audits and stats for each doctor
  const doctorAnalytics = doctors.map((doc) => {
    const traffic = calculateDoctorTraffic(doc);
    const seo = auditDoctorSEO(doc);
    return {
      doc,
      traffic,
      seo,
    };
  });

  // Aggregated Network KPIs
  const totalViews = doctorAnalytics.reduce((sum, item) => sum + item.traffic.monthlyViews, 0);
  const totalLeads = doctorAnalytics.reduce((sum, item) => sum + item.traffic.whatsappClicks, 0);
  const avgSeoScore =
    doctors.length > 0
      ? Math.round(doctorAnalytics.reduce((sum, item) => sum + item.seo.score, 0) / doctors.length)
      : 0;
  const excellentSeoCount = doctorAnalytics.filter((item) => item.seo.score >= 80).length;

  const filteredItems = doctorAnalytics.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.doc.fullName.toLowerCase().includes(q) ||
      item.doc.specialty.toLowerCase().includes(q) ||
      item.doc.slug.toLowerCase().includes(q)
    );
  });

  const selectedAudit = doctorAnalytics.find((item) => item.doc.id === selectedAuditDoctorId);

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">إجمالي الزيارات الشهرية</span>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              {totalViews.toLocaleString('en-US')}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium font-mono tabular-nums">
              +14.2%
            </span>
          </div>
        </div>

        {/* WhatsApp Bookings */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">نقرات حجز واتساب</span>
            <MessageCircle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-teal-700 font-mono tabular-nums tracking-tight">
              {totalLeads.toLocaleString('en-US')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              مريض محتمل
            </span>
          </div>
        </div>

        {/* Average SEO Score */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">متوسط جودة SEO</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              {avgSeoScore}%
            </span>
            <span className="text-[11px] text-slate-400">من 100 نقطة</span>
          </div>
        </div>

        {/* High SEO Sites */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">مواقع مهيأة بامتياز</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums tracking-tight">
              {excellentSeoCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              من {doctors.length} موقع
            </span>
          </div>
        </div>
      </div>

      {/* Analytics & SEO Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="تصفية حسب اسم الطبيب أو التخصص..."
              className="w-full text-xs pr-8 pl-3 py-2 rounded-lg border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            تحديث المؤشرات تلقائياً بناءً على محتوى كل صفحة
          </div>
        </div>

        {/* High Density Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-4">الطبيب والموقع</th>
                <th className="py-2.5 px-4">الزيارات الشهرية</th>
                <th className="py-2.5 px-4">زوار فريدون</th>
                <th className="py-2.5 px-4">نقرات واتساب</th>
                <th className="py-2.5 px-4">معدل التحويل</th>
                <th className="py-2.5 px-4 text-center">تقييم SEO</th>
                <th className="py-2.5 px-4 text-left">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(({ doc, traffic, seo }) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Doctor & Slug */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                        {doc.fullName.charAt(0) || 'ط'}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">
                          {doc.fullName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 block truncate dir-ltr text-right">
                          /doctors/{doc.slug}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Monthly Views */}
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    {traffic.monthlyViews.toLocaleString('en-US')}
                  </td>

                  {/* Unique Visitors */}
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                    {traffic.uniqueVisitors.toLocaleString('en-US')}
                  </td>

                  {/* WhatsApp Clicks */}
                  <td className="py-3 px-4 font-mono tabular-nums text-teal-700 font-semibold">
                    {traffic.whatsappClicks.toLocaleString('en-US')}
                  </td>

                  {/* Conversion Rate */}
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    {traffic.conversionRate}%
                  </td>

                  {/* SEO Score & State */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedAuditDoctorId(doc.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-100 transition"
                      title="عرض فحص السيو التفصيلي"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          seo.score >= 80
                            ? 'bg-emerald-500'
                            : seo.score >= 60
                            ? 'bg-teal-500'
                            : 'bg-amber-500'
                        }`}
                      ></span>
                      <span className="font-mono font-semibold tabular-nums text-slate-800">
                        {seo.score}%
                      </span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedAuditDoctorId(doc.id)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition text-[11px]"
                      >
                        فحص SEO
                      </button>
                      <button
                        onClick={() => onEditDoctor(doc, 'basic')}
                        className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium transition text-[11px]"
                      >
                        تحسين
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- SEO AUDIT BREAKDOWN MODAL ----------------- */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  فحص تحسين محركات البحث: {selectedAudit.doc.fullName}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  /doctors/{selectedAudit.doc.slug}
                </p>
              </div>

              <button
                onClick={() => setSelectedAuditDoctorId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score header */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <div>
                <span className="text-xs text-slate-500 font-medium">النتيجة الإجمالية</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {selectedAudit.seo.score}%
                  </span>
                  <span className="text-xs font-semibold text-teal-700">
                    {selectedAudit.seo.statusLabel}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  const doc = selectedAudit.doc;
                  setSelectedAuditDoctorId(null);
                  onEditDoctor(doc, 'basic');
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
              >
                تعديل وتحسين في المحرر
              </button>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-800">قائمة معايير السيو (SEO Checklist):</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {selectedAudit.seo.checks.map((check, idx) => (
                  <div key={idx} className="py-2.5 flex items-start gap-2.5">
                    {check.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{check.label}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {check.passed ? `+${check.points} نقطة` : '0 نقطة'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{check.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAuditDoctorId(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
