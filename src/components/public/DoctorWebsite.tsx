import React, { useState } from 'react';
import { DoctorProfile, EducationalArticle } from '../../types/doctor';
import { DoctorWebsiteConfig, WebsiteSection } from '../../types/builder';
import { createDefaultWebsiteConfig } from '../../data/defaultWebsiteConfig';
import { getThemeById } from '../../data/themes';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Share2,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  X,
  Check,
  Globe,
  Sparkles,
} from 'lucide-react';

interface DoctorWebsiteProps {
  doctor: DoctorProfile;
  customConfig?: DoctorWebsiteConfig;
  activeLanguage?: 'ar' | 'en';
  onLanguageChange?: (lang: 'ar' | 'en') => void;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  isAdminPreview?: boolean;
  onBackToDashboard?: () => void;
  onEditDoctor?: (doctor: DoctorProfile) => void;
}

export const DoctorWebsite: React.FC<DoctorWebsiteProps> = ({
  doctor,
  customConfig,
  activeLanguage,
  onLanguageChange,
  selectedSectionId,
  onSelectSection,
  isAdminPreview = false,
  onBackToDashboard,
  onEditDoctor,
}) => {
  // Use passed activeLanguage if provided (controlled by builder), otherwise internal state
  const [internalLang, setInternalLang] = useState<'ar' | 'en'>('ar');
  const lang = activeLanguage !== undefined ? activeLanguage : internalLang;
  const setLang = onLanguageChange || setInternalLang;
  const isEn = lang === 'en';

  // Resolve config: prefer customConfig (from builder live preview), then published/draft, then default
  const config = customConfig || doctor.publishedWebsiteConfig || doctor.draftWebsiteConfig || createDefaultWebsiteConfig(doctor);

  const [openFaqId, setOpenFaqId] = useState<string | null>(
    doctor.faqs?.length > 0 ? doctor.faqs[0].id : null
  );
  const [selectedArticle, setSelectedArticle] = useState<EducationalArticle | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Dynamic branding colors & active theme from config
  const theme = config.theme;
  const primaryColor = theme.primaryColor || doctor.branding?.primaryColor || '#0F2A4A';
  const accentColor = theme.accentColor || doctor.branding?.accentColor || '#0D9488';
  const lightBg = theme.lightBg || '#F8FAFC';
  const cardBg = theme.cardBg || '#FFFFFF';
  const globalAnimations = theme.enableGlobalAnimations !== false;

  // Localized text resolution helper
  const localized = (arText?: string, enText?: string) => {
    if (isEn) {
      return enText && enText.trim() ? enText : arText || '';
    }
    return arText || enText || '';
  };

  // Resolved doctor basic profile attributes
  const doctorName = localized(doctor.fullName, doctor.fullNameEn);
  const doctorSpecialty = localized(doctor.specialty, doctor.specialtyEn);
  const doctorTitle = localized(doctor.title, doctor.titleEn);
  const doctorBio = localized(doctor.bio, doctor.bioEn);
  const clinicName = localized(doctor.clinic?.name, doctor.clinic?.nameEn);
  const clinicAddress = localized(doctor.clinic?.address, doctor.clinic?.addressEn);
  const clinicCity = localized(doctor.clinic?.city, doctor.clinic?.cityEn);
  const clinicHours = localized(doctor.clinic?.workingHours, doctor.clinic?.workingHoursEn);
  const clinicNote = localized(doctor.clinic?.bookingNote, doctor.clinic?.bookingNoteEn);

  // WhatsApp & Phone URLs
  const cleanPhone = doctor.clinic?.whatsapp?.replace(/[^0-9]/g, '') || '';
  const prefilledText = isEn
    ? encodeURIComponent(`Hello, I would like to inquire about booking an appointment with ${doctorName}.`)
    : encodeURIComponent(`السلام عليكم ورحمة الله، أود الاستفسار عن حجز موعد كشف في عيادة ${doctor.fullName}.`);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${prefilledText}`;
  const phoneCallUrl = `tel:${doctor.clinic?.phone?.replace(/[^0-9]/g, '') || ''}`;

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  // Render an animation class for a section
  const getAnimationClass = (section: WebsiteSection) => {
    if (!globalAnimations || !section.animation?.enabled) return '';
    switch (section.animation.style) {
      case 'fade-up':
        return 'anim-fade-up';
      case 'fade-in':
        return 'anim-fade-in';
      case 'slide-left':
        return 'anim-slide-left';
      case 'slide-right':
        return 'anim-slide-right';
      case 'zoom-in':
        return 'anim-zoom-in';
      default:
        return '';
    }
  };

  const getAnimationStyle = (section: WebsiteSection): React.CSSProperties => {
    if (!globalAnimations || !section.animation?.enabled) return {};
    return {
      '--anim-duration': `${section.animation.durationMs || 500}ms`,
      '--anim-delay': `${section.animation.delayMs || 0}ms`,
    } as React.CSSProperties;
  };

  // Helper for button action clicks
  const handleButtonAction = (action?: string, url?: string) => {
    if (action === 'whatsapp') {
      window.open(whatsappUrl, '_blank');
    } else if (action === 'call') {
      window.location.href = phoneCallUrl;
    } else if (action === 'scroll' && url) {
      const el = document.querySelector(url);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  // Render Individual Section Blocks
  const renderSection = (section: WebsiteSection) => {
    if (!section.isVisible) return null;

    const isSelected = selectedSectionId === section.id;
    const animClass = getAnimationClass(section);
    const animStyle = getAnimationStyle(section);

    const sTitle = localized(section.content.title, section.content.titleEn);
    const sSubtitle = localized(section.content.subtitle, section.content.subtitleEn);
    const sBody = localized(section.content.body, section.content.bodyEn);
    const sBadge = localized(section.content.badge, section.content.badgeEn);
    const sPrimaryBtn = localized(section.content.primaryButtonText, section.content.primaryButtonTextEn);
    const sSecondaryBtn = localized(section.content.secondaryButtonText, section.content.secondaryButtonTextEn);

    const sectionWrapperClass = `relative transition-all ${
      onSelectSection ? 'cursor-pointer hover:ring-2 hover:ring-teal-400/50' : ''
    } ${isSelected ? 'ring-2 ring-teal-500 shadow-md z-10' : ''}`;

    const sectionPadding =
      section.style.paddingTop === 'none'
        ? 'pt-0'
        : section.style.paddingTop === 'small'
        ? 'pt-6'
        : section.style.paddingTop === 'large'
        ? 'pt-20'
        : 'pt-12';

    const sectionPaddingBottom =
      section.style.paddingBottom === 'none'
        ? 'pb-0'
        : section.style.paddingBottom === 'small'
        ? 'pb-6'
        : section.style.paddingBottom === 'large'
        ? 'pb-20'
        : 'pb-12';

    const sectionBg = section.style.backgroundColor || (section.type === 'hero' ? '#FFFFFF' : 'transparent');

    return (
      <div
        key={section.id}
        id={section.id}
        onClick={() => onSelectSection && onSelectSection(section.id)}
        className={sectionWrapperClass}
        style={{ backgroundColor: sectionBg }}
      >
        {/* Visual indicator in builder mode when selected */}
        {isSelected && (
          <div className="absolute top-2 left-2 z-20 bg-teal-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 pointer-events-none">
            <Sparkles className="w-3 h-3" />
            <span>قيد التعديل: {section.name}</span>
          </div>
        )}

        <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${sectionPadding} ${sectionPaddingBottom} ${animClass}`} style={animStyle}>
          {/* 1. HERO BLOCK */}
          {section.type === 'hero' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
                  <span className="font-semibold text-slate-900">{sBadge || doctorSpecialty}</span>
                  {doctor.yearsOfExperience !== undefined && doctor.yearsOfExperience > 0 && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono tabular-nums">
                        {isEn ? `${doctor.yearsOfExperience} Years of Clinical Practice` : `خبرة ${doctor.yearsOfExperience} عاماً`}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 inline" />
                    <span>{isEn ? 'Accredited Medical Practitioner' : 'طبيب معتمد ومسجل رسمياً'}</span>
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                    {sTitle || doctorName}
                  </h1>
                  <p className="mt-2 text-base text-slate-700 font-medium leading-relaxed">
                    {sSubtitle || doctorTitle}
                  </p>
                </div>

                <div className="text-slate-600 text-sm leading-relaxed p-4 rounded-xl bg-slate-50 border border-slate-100">
                  {sBody || doctorBio || (isEn ? 'Specialized medical care prioritizing patient safety and advanced clinical treatment.' : 'رعاية طبية متكاملة تتمحور حول سلامة المريض بأعلى المعايير العالمية.')}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {sPrimaryBtn && (
                    <button
                      onClick={() => handleButtonAction(section.content.primaryButtonAction, section.content.primaryButtonUrl)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xs hover:opacity-95 transition"
                      style={{ backgroundColor: accentColor }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{sPrimaryBtn}</span>
                    </button>
                  )}

                  {sSecondaryBtn && (
                    <button
                      onClick={() => handleButtonAction(section.content.secondaryButtonAction, section.content.secondaryButtonUrl)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                    >
                      <Phone className="w-4 h-4 text-slate-600" />
                      <span>{sSecondaryBtn}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hero Image */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-64 sm:w-72 aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100">
                  {!imgError && (section.content.imageUrl || doctor.photoUrl) ? (
                    <img
                      src={section.content.imageUrl || doctor.photoUrl}
                      alt={doctorName}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                        <Stethoscope className="w-8 h-8 text-white" />
                      </div>
                      <span className="font-bold text-lg">{doctorName}</span>
                      <span className="text-xs text-white/80 mt-1">{doctorSpecialty}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. ABOUT BLOCK */}
          {section.type === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                {sBadge && <span className="text-xs font-bold text-teal-700 tracking-wide uppercase">{sBadge}</span>}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-sm font-medium text-slate-700">{sSubtitle}</p>}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{sBody}</p>
                {sPrimaryBtn && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleButtonAction(section.content.primaryButtonAction, section.content.primaryButtonUrl)}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                    >
                      <span>{sPrimaryBtn}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isEn ? '' : 'rotate-180'}`} />
                    </button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-52 h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
                  <img
                    src={section.content.imageUrl || doctor.photoUrl}
                    alt={doctorName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. QUALIFICATIONS BLOCK */}
          {section.type === 'qualifications' && (
            <div className="space-y-6">
              <div>
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500 mt-1">{sSubtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctor.qualifications?.map((q) => {
                  const qDegree = localized(q.degree, q.degreeEn);
                  const qInstitution = localized(q.institution, q.institutionEn);
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-start gap-3.5"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-slate-900">{qDegree}</h3>
                          {q.year && (
                            <span className="font-mono text-xs text-slate-400 tabular-nums">
                              {q.year}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{qInstitution}</p>
                        {q.verified && (
                          <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1 pt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Verified Credential' : 'معتمد وموثق'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. WHY CHOOSE THIS DOCTOR BLOCK */}
          {section.type === 'why_choose_us' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500">{sSubtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(section.content.features || []).map((feat) => {
                  const fTitle = localized(feat.title, feat.titleEn);
                  const fDesc = localized(feat.description, feat.descriptionEn);
                  return (
                    <div
                      key={feat.id}
                      className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs"
                        style={{ backgroundColor: accentColor }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{fTitle}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{fDesc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. SERVICES BLOCK */}
          {section.type === 'services' && (
            <div className="space-y-6">
              <div>
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500 mt-1">{sSubtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctor.services?.map((s) => {
                  const sName = localized(s.name, s.nameEn);
                  const sDesc = localized(s.description, s.descriptionEn);
                  const sTag = localized(s.tag, s.tagEn) || (isEn ? 'Medical Care' : 'خدمة طبية');
                  return (
                    <div
                      key={s.id}
                      className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">{sTag}</span>
                          {s.fee && (
                            <span className="font-mono text-xs text-slate-700 font-semibold">{s.fee}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">{sName}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{sDesc}</p>
                      </div>

                      {doctor.clinic?.whatsapp && (
                        <div className="pt-2 border-t border-slate-100">
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              isEn
                                ? `Hello, I would like to inquire about: ${sName} at Dr. ${doctorName}'s clinic.`
                                : `السلام عليكم، أود الاستفسار عن خدمة: ${s.name} في عيادة ${doctor.fullName}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                          >
                            <span>{isEn ? 'Inquire about service' : 'استفسار عن هذه الخدمة'}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${isEn ? '' : 'rotate-180'}`} />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. CLINIC GALLERY BLOCK */}
          {section.type === 'clinic_gallery' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500">{sSubtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(section.content.gallery || []).map((img) => (
                  <div key={img.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs group">
                    <div className="aspect-4/3 overflow-hidden bg-slate-100">
                      <img
                        src={img.url}
                        alt={localized(img.caption, img.captionEn) || 'Clinic Image'}
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    {img.caption && (
                      <div className="p-3 text-xs text-slate-700 font-medium text-center">
                        {localized(img.caption, img.captionEn)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. EDUCATIONAL ARTICLES BLOCK */}
          {section.type === 'articles' && (
            <div className="space-y-6">
              <div>
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500 mt-1">{sSubtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctor.articles?.map((art) => {
                  const artTitle = localized(art.title, art.titleEn);
                  const artSummary = localized(art.summary, art.summaryEn);
                  const artTag = localized(art.tag, art.tagEn) || (isEn ? 'Health' : 'صحة');
                  return (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className="p-5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/50 cursor-pointer transition space-y-2 flex flex-col justify-between shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="font-semibold text-teal-700">{artTag}</span>
                          {art.readingTime && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span>{art.readingTime}</span>
                            </>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 hover:text-teal-700 transition leading-snug">
                          {artTitle}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {artSummary}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center text-xs font-semibold text-teal-700 gap-1">
                        <span>{isEn ? 'Read article' : 'قراءة المقال بالكامل'}</span>
                        <ArrowRight className={`w-3.5 h-3.5 ${isEn ? '' : 'rotate-180'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. FAQS BLOCK */}
          {section.type === 'faqs' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500">{sSubtitle}</p>}
              </div>

              <div className="space-y-2.5">
                {doctor.faqs?.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  const faqQ = localized(faq.question, faq.questionEn);
                  const faqA = localized(faq.answer, faq.answerEn);
                  return (
                    <div
                      key={faq.id}
                      className="border border-slate-200/90 rounded-xl bg-white overflow-hidden transition"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFaq(faq.id);
                        }}
                        className="w-full p-4 text-start font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-50/70 flex items-center justify-between gap-3 transition"
                      >
                        <span>{faqQ}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                          {faqA}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. TESTIMONIALS BLOCK (Authentic & Verified Consent Only) */}
          {section.type === 'testimonials' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500">{sSubtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(section.content.testimonials || []).map((t) => (
                  <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{localized(t.feedback, t.feedbackEn)}"
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{localized(t.patientName, t.patientNameEn)}</span>
                      {t.verifiedConsent && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          {isEn ? 'Verified Consent' : 'موافقة كتابية موثقة'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. LOCATION & HOURS BLOCK */}
          {section.type === 'location_hours' && (
            <div className="space-y-6">
              <div>
                {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
                {sSubtitle && <p className="text-xs text-slate-500 mt-1">{sSubtitle}</p>}
              </div>

              <div className="p-6 rounded-xl border border-slate-200/90 bg-slate-50/60 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-sm mb-0.5">
                        {clinicName || (isEn ? 'Consultation Clinic' : 'العيادة التخصصية')}
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {clinicAddress || (isEn ? 'Address provided upon appointment' : 'العنوان يحدد عند تأكيد الحجز')}
                      </p>
                      {clinicCity && (
                        <span className="text-slate-500 font-medium block mt-1">{clinicCity}</span>
                      )}
                      {doctor.clinic?.googleMapsUrl && (
                        <a
                          href={doctor.clinic.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-semibold mt-2"
                        >
                          <span>{isEn ? 'View on Google Maps' : 'فتح الموقع على خرائط Google'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {clinicNote && (
                    <div className="p-3 rounded-lg bg-teal-50 border border-teal-200/60 text-teal-900 text-xs leading-relaxed">
                      <strong>{isEn ? 'Important Note:' : 'ملاحظة هامة:'} </strong>
                      {clinicNote}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 block mb-0.5">
                        {isEn ? 'Operating Hours:' : 'مواعيد العمل:'}
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {clinicHours || (isEn ? 'Daily by appointment' : 'يومياً بموعد مسبق')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    {doctor.clinic?.whatsapp && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white font-semibold shadow-xs"
                        style={{ backgroundColor: accentColor }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Book Appointment' : 'حجز موعد فوري'}</span>
                      </a>
                    )}
                    {doctor.clinic?.phone && (
                      <a href={phoneCallUrl} className="font-mono text-xs text-slate-700 font-semibold hover:underline">
                        {doctor.clinic.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 11. CONTACT BLOCK */}
          {section.type === 'contact' && (
            <div className="text-center max-w-2xl mx-auto space-y-4">
              {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{sTitle}</h2>
              {sSubtitle && <p className="text-sm text-slate-600 leading-relaxed">{sSubtitle}</p>}

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {sPrimaryBtn && (
                  <button
                    onClick={() => handleButtonAction(section.content.primaryButtonAction, section.content.primaryButtonUrl)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-xs hover:opacity-95 transition"
                    style={{ backgroundColor: accentColor }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{sPrimaryBtn}</span>
                  </button>
                )}

                {sSecondaryBtn && (
                  <button
                    onClick={() => handleButtonAction(section.content.secondaryButtonAction, section.content.secondaryButtonUrl)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <Phone className="w-4 h-4 text-slate-600" />
                    <span>{sSecondaryBtn}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 12. CUSTOM BLOCK */}
          {section.type === 'custom_block' && (
            <div className="space-y-4">
              {sBadge && <span className="text-xs font-bold text-teal-700 uppercase">{sBadge}</span>}
              <h2 className="text-xl font-bold text-slate-900">{sTitle}</h2>
              {sSubtitle && <p className="text-xs text-slate-500">{sSubtitle}</p>}
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{sBody}</p>
              {sPrimaryBtn && (
                <div className="pt-2">
                  <button
                    onClick={() => handleButtonAction(section.content.primaryButtonAction, section.content.primaryButtonUrl)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span>{sPrimaryBtn}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      className={`min-h-screen text-slate-900 font-sans selection:bg-teal-600 selection:text-white pb-20 sm:pb-0`}
      style={
        {
          backgroundColor: lightBg,
          '--primary-color': primaryColor,
          '--accent-color': accentColor,
        } as React.CSSProperties
      }
    >
      {/* Admin Quick Bar when viewing from CMS (if not embedded inside visual builder) */}
      {isAdminPreview && !onSelectSection && (
        <aside aria-label="شريط معاينة المسؤول" className="sticky top-0 z-50 bg-slate-900 text-white text-xs py-2 px-4 shadow-sm flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">
              معاينة حية: <strong className="text-white">{doctorName}</strong>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              ({doctor.status === 'published' ? 'منشور للجمهور' : doctor.status === 'pending' ? 'قيد المراجعة' : 'مسودة'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onEditDoctor && (
              <button
                onClick={() => onEditDoctor(doctor)}
                className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-white font-medium border border-slate-700 transition"
              >
                تعديل البيانات
              </button>
            )}
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded font-medium transition flex items-center gap-1"
              >
                <span>لوحة التحكم</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isEn ? '' : 'rotate-180'}`} />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Main Website Header */}
      <header className={`${config.theme.headerSticky ? 'sticky top-0 z-40' : ''} bg-white/95 backdrop-blur-md border-b border-slate-200/80`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.header.showLogo && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs overflow-hidden shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {config.header.logoUrl ? (
                  <img
                    src={config.header.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Stethoscope className="w-5 h-5" />
                )}
              </div>
            )}
            <div>
              <span className="font-bold text-base text-slate-900 leading-tight block">
                {localized(config.header.customTitle, config.header.customTitleEn) || doctorName}
              </span>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px] sm:max-w-none">
                {localized(config.header.customSubtitle, config.header.customSubtitleEn) || doctorSpecialty}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {config.theme.showLanguageSwitcher && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setLang('ar')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    lang === 'ar'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                  title="العربية"
                >
                  عربي
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                    lang === 'en'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                  title="English"
                >
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>EN</span>
                </button>
              </div>
            )}

            <button
              onClick={handleShare}
              className="p-2 sm:px-3 sm:py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              title={isEn ? 'Share link' : 'مشاركة'}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? (isEn ? 'Copied' : 'تم النسخ') : isEn ? 'Share' : 'مشاركة'}</span>
            </button>

            {config.header.showPhoneButton && doctor.clinic?.phone && (
              <a
                href={phoneCallUrl}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono tabular-nums ltr">{doctor.clinic.phone}</span>
              </a>
            )}

            {config.header.showWhatsAppButton && doctor.clinic?.whatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
                style={{ backgroundColor: accentColor }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{isEn ? 'Book WhatsApp' : 'حجز موعد واتساب'}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Render Dynamic Config Sections in Order */}
      <main>
        {config.sections.map((section) => renderSection(section))}
      </main>

      {/* Medical Syndicate Disclaimer & Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4 text-center">
          {config.footer.showMedicalDisclaimer && (
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {localized(config.footer.customDisclaimerText, config.footer.customDisclaimerTextEn) || (
                isEn
                  ? 'Medical Disclaimer: The clinical information presented on this personal profile is intended solely for educational and informational purposes and does not constitute a formal diagnosis or substitute for hands-on medical consultation. In emergencies, please contact your local emergency response service immediately.'
                  : 'إخلاء مسؤولية طبي: المعلومات الواردة في هذا الموقع الإلكتروني مخصصة للأغراض التعريفية والتثقيفية فقط ولا تُعد بديلاً عن الاستشارة الطبية والفحص السريري المباشر. للحالات الطارئة يُرجى التوجه فوراً لأقرب مستشفى أو الاتصال بالإسعاف (123).'
              )}
            </p>
          )}
          <div className="text-[11px] text-slate-400">
            {localized(config.footer.copyrightText, config.footer.copyrightTextEn) || (
              isEn
                ? `All Rights Reserved © ${new Date().getFullYear()} ${doctorName} · Verified Medical Profile`
                : `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${doctor.fullName} · موقع شخصي موثق`
            )}
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Action Button (Desktop & Mobile) */}
      {config.floatingWhatsApp?.enabled !== false && doctor.clinic?.whatsapp && (
        <aside
          aria-label="تواصل سريع عبر واتساب"
          className={`fixed z-40 transition-all duration-300 ${
            config.floatingWhatsApp?.position === 'bottom-right'
              ? 'bottom-20 sm:bottom-8 right-5 sm:right-8'
              : 'bottom-20 sm:bottom-8 left-5 sm:left-8'
          }`}
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={isEn ? 'Direct WhatsApp Chat with Clinic' : 'محادثة مباشرة عبر واتساب مع عيادة الطبيب'}
            className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-4 sm:py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            {/* Pulse ripple effect */}
            {config.floatingWhatsApp?.showPulseAnimation !== false && (
              <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
            )}

            <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white" />
            </div>

            <div className="flex flex-col text-right">
              <span className="text-xs sm:text-sm font-bold leading-tight tracking-tight">
                {localized(config.floatingWhatsApp?.customLabel, config.floatingWhatsApp?.customLabelEn) || (isEn ? 'WhatsApp' : 'تواصل عبر واتساب')}
              </span>
              <span className="text-[10px] text-emerald-100 hidden sm:inline leading-none font-medium">
                {isEn ? 'Direct inquiry' : 'استفسار وحجز فوري'}
              </span>
            </div>
          </a>
        </aside>
      )}

      {/* Mobile Sticky Booking Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center gap-2 shadow-lg">
        {doctor.clinic?.whatsapp && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isEn ? 'WhatsApp Booking' : 'حجز واتساب'}</span>
          </a>
        )}

        {doctor.clinic?.phone && (
          <a
            href={phoneCallUrl}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
            title={isEn ? 'Call' : 'اتصال هاتفي'}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}

        <button
          onClick={handleShare}
          className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
          title={isEn ? 'Share' : 'مشاركة'}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Article Detail Modal Reader */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-teal-700">
                  {localized(selectedArticle.tag, selectedArticle.tagEn) || (isEn ? 'Health' : 'توعية طبية')}
                </span>
                <h3 className="font-bold text-lg text-slate-900">
                  {localized(selectedArticle.title, selectedArticle.titleEn)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-3">
              <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {localized(selectedArticle.summary, selectedArticle.summaryEn)}
              </p>
              <div className="pt-2 text-slate-700 space-y-2 whitespace-pre-line leading-relaxed">
                {localized(selectedArticle.content, selectedArticle.contentEn) ||
                  localized(selectedArticle.summary, selectedArticle.summaryEn)}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                {isEn ? 'Close' : 'إغلاق'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
