import React, { useState, useEffect } from 'react';
import { DoctorProfile, DoctorStatus } from '../../types/doctor';
import {
  DoctorWebsiteConfig,
  WebsiteSection,
  SectionType,
  AnimationStyle,
} from '../../types/builder';
import { createDefaultWebsiteConfig, createNewSection } from '../../data/defaultWebsiteConfig';
import { DoctorWebsite } from '../public/DoctorWebsite';
import {
  Layout,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RotateCcw,
  RotateCw,
  Save,
  Send,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Palette,
  Type,
  Settings,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
  AlertCircle,
  ExternalLink,
  Layers,
  Wand2,
  X,
  Sliders,
  Play,
  FileCheck,
  Upload,
  Image,
  MessageCircle,
  User,
  Stethoscope,
} from 'lucide-react';

interface WebsiteBuilderProps {
  doctor: DoctorProfile;
  onSaveDraft: (updatedDoctor: DoctorProfile) => Promise<void>;
  onPublish: (updatedDoctor: DoctorProfile) => Promise<void>;
  onBackToDashboard: () => void;
  onOpenPublicUrl?: () => void;
}

type DeviceViewport = 'desktop' | 'tablet' | 'mobile';
type RightSidebarTab = 'section' | 'profile' | 'header' | 'floating' | 'theme' | 'animations' | 'seo';

export const WebsiteBuilder: React.FC<WebsiteBuilderProps> = ({
  doctor,
  onSaveDraft,
  onPublish,
  onBackToDashboard,
  onOpenPublicUrl,
}) => {
  // Initialize website configuration from draft, published, or default
  const [config, setConfig] = useState<DoctorWebsiteConfig>(() => {
    return (
      doctor.draftWebsiteConfig ||
      doctor.publishedWebsiteConfig ||
      createDefaultWebsiteConfig(doctor)
    );
  });

  // Doctor profile state for live builder customization (photo, bio, etc.)
  const [currentDoctor, setCurrentDoctor] = useState<DoctorProfile>(() =>
    JSON.parse(JSON.stringify(doctor))
  );

  const updateDoctor = (updater: (prev: DoctorProfile) => DoctorProfile) => {
    setCurrentDoctor((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Undo / Redo history stacks
  const [pastHistory, setPastHistory] = useState<DoctorWebsiteConfig[]>([]);
  const [futureHistory, setFutureHistory] = useState<DoctorWebsiteConfig[]>([]);

  // Selected active section
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(() => {
    return config.sections.length > 0 ? config.sections[0].id : null;
  });

  // UI state
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [activeTab, setActiveTab] = useState<RightSidebarTab>('section');
  const [previewLanguage, setPreviewLanguage] = useState<'ar' | 'en'>('ar');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSectionLibraryModal, setShowSectionLibraryModal] = useState(false);

  // File to base64 Data URL reader helper for instant image & logo upload
  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFeedbackMessage({ text: 'حجم الصورة كبير جداً، يُفضل أن يكون أقل من 3 ميجابايت', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        onUploaded(result);
        setFeedbackMessage({ text: 'تم رفع الصورة وتطبيقها بنجاح!', type: 'success' });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Synchronize config changes with history
  const updateConfig = (newConfig: DoctorWebsiteConfig, trackHistory = true) => {
    if (trackHistory) {
      setPastHistory((prev) => [...prev.slice(-20), JSON.parse(JSON.stringify(config))]);
      setFutureHistory([]);
    }
    setConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleUndo = () => {
    if (pastHistory.length === 0) return;
    const previous = pastHistory[pastHistory.length - 1];
    const newPast = pastHistory.slice(0, pastHistory.length - 1);
    setFutureHistory((prev) => [JSON.parse(JSON.stringify(config)), ...prev]);
    setPastHistory(newPast);
    setConfig(previous);
    setHasUnsavedChanges(true);
  };

  const handleRedo = () => {
    if (futureHistory.length === 0) return;
    const next = futureHistory[0];
    const newFuture = futureHistory.slice(1);
    setPastHistory((prev) => [...prev, JSON.parse(JSON.stringify(config))]);
    setFutureHistory(newFuture);
    setConfig(next);
    setHasUnsavedChanges(true);
  };

  // Section helpers
  const selectedSection = config.sections.find((s) => s.id === selectedSectionId);

  const updateSelectedSection = (updater: (prev: WebsiteSection) => WebsiteSection) => {
    if (!selectedSectionId) return;
    const nextSections = config.sections.map((sec) => {
      if (sec.id === selectedSectionId) {
        return updater(sec);
      }
      return sec;
    });
    updateConfig({ ...config, sections: nextSections });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.sections.length) return;
    const newSections = [...config.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    updateConfig({ ...config, sections: newSections });
  };

  const handleToggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSections = config.sections.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s));
    updateConfig({ ...config, sections: newSections });
  };

  const handleDuplicateSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sourceIndex = config.sections.findIndex((s) => s.id === id);
    if (sourceIndex === -1) return;
    const source = config.sections[sourceIndex];
    const duplicate: WebsiteSection = {
      ...JSON.parse(JSON.stringify(source)),
      id: `sec-${source.type}-${Date.now()}`,
      name: `${source.name} (نسخة مكررة)`,
    };
    const newSections = [...config.sections];
    newSections.splice(sourceIndex + 1, 0, duplicate);
    updateConfig({ ...config, sections: newSections });
    setSelectedSectionId(duplicate.id);
  };

  const handleDeleteSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.sections.length <= 1) {
      alert('يجب أن يحتوي الموقع على قسم واحد على الأقل.');
      return;
    }
    const newSections = config.sections.filter((s) => s.id !== id);
    updateConfig({ ...config, sections: newSections });
    if (selectedSectionId === id) {
      setSelectedSectionId(newSections[0]?.id || null);
    }
  };

  const handleAddSectionFromLibrary = (type: SectionType) => {
    const newSec = createNewSection(type, doctor);
    const newSections = [...config.sections, newSec];
    updateConfig({ ...config, sections: newSections });
    setSelectedSectionId(newSec.id);
    setShowSectionLibraryModal(false);
  };

  // Save Draft (does NOT overwrite published version)
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      const updatedDoctor: DoctorProfile = {
        ...currentDoctor,
        draftWebsiteConfig: config,
        status: currentDoctor.status === 'published' ? 'published' : 'draft',
        updatedAt: new Date().toISOString(),
      };
      await onSaveDraft(updatedDoctor);
      setHasUnsavedChanges(false);
      setFeedbackMessage({ text: 'تم حفظ المسودة بنجاح! لم يتأثر الموقع المنشور.', type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (e) {
      setFeedbackMessage({ text: 'حدث خطأ أثناء حفظ المسودة', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish to Live Website
  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const updatedDoctor: DoctorProfile = {
        ...currentDoctor,
        draftWebsiteConfig: config,
        publishedWebsiteConfig: config,
        status: 'published',
        updatedAt: new Date().toISOString(),
      };
      await onPublish(updatedDoctor);
      setHasUnsavedChanges(false);
      setFeedbackMessage({
        text: `تم نشر الموقع بنجاح على الرابط: /doctors/${currentDoctor.slug}`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (e) {
      setFeedbackMessage({ text: 'حدث خطأ أثناء نشر الموقع', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Prompt if leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div dir="rtl" className="h-screen flex flex-col bg-slate-900 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. TOP BUILDER TOOLBAR */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left Toolbar: Back, Doctor info, Draft/Publish state */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (hasUnsavedChanges && !window.confirm('لديك تعديلات غير محفوظة، هل أنت متأكد من الخروج؟')) {
                return;
              }
              onBackToDashboard();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="العودة إلى لوحة التحكم"
          >
            <ArrowRight className="w-4 h-4" />
            <span>لوحة التحكم</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

            <span className="font-bold text-sm text-white truncate max-w-[200px]">
              {currentDoctor.fullName || 'طبيب بدون اسم'}
            </span>
            <a
              href={`/doctors/${currentDoctor.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition inline-flex items-center gap-1"
              title="فتح الرابط المباشر في تبويب جديد"
            >
              <span>/doctors/{currentDoctor.slug}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
            {hasUnsavedChanges && (
              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>تعديلات غير محفوظة</span>
              </span>
            )}
        </div>

        {/* Center Toolbar: Viewport switcher & Language & Undo / Redo */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={handleUndo}
              disabled={pastHistory.length === 0}
              className="p-1.5 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition"
              title="تراجع (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={futureHistory.length === 0}
              className="p-1.5 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition"
              title="إعادة (Redo)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Viewport switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded transition ${
                viewport === 'desktop' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="شاشة كمبيوتر مكتبية (Desktop)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded transition ${
                viewport === 'tablet' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="جهاز لوحي (Tablet)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded transition ${
                viewport === 'mobile' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="هاتف محمول (Mobile)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preview Language Toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setPreviewLanguage('ar')}
              className={`px-2 py-1 rounded transition ${
                previewLanguage === 'ar' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => setPreviewLanguage('en')}
              className={`px-2 py-1 rounded transition ${
                previewLanguage === 'en' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Right Toolbar: Feedback, Save Draft, Publish, Public link */}
        <div className="flex items-center gap-2">
          {feedbackMessage && (
            <div
              className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-800 text-rose-300'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Direct link to visit the website in new tab */}
          <a
            href={`/doctors/${currentDoctor.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            title="فتح موقع الطبيب في علامة تبويب جديدة كزائر"
          >
            <span>زيارة الموقع</span>
            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
          </a>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'جارِ الحفظ...' : 'حفظ كمسودة'}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'جارِ النشر...' : 'نشر الموقع للجمهور'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: SECTIONS LIST & STRUCTURE (280px) */}
        <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-20">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                هيكل وأقسام الموقع ({config.sections.length})
              </span>
            </div>
            <button
              onClick={() => setShowSectionLibraryModal(true)}
              className="p-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1 px-2 transition"
              title="إضافة قسم جديد من المكتبة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة قسم</span>
            </button>
          </div>

          {/* Section Items (Reorderable) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {config.sections.map((section, idx) => {
              const isSelected = selectedSectionId === section.id;
              return (
                <div
                  key={section.id}
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setActiveTab('section');
                  }}
                  className={`group p-2.5 rounded-lg text-xs transition border flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-teal-500 text-white font-semibold shadow-xs'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {/* Left: Reorder up/down + name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex flex-col gap-0.5 text-slate-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-0.5 hover:text-white disabled:opacity-20 transition"
                        title="تحريك لأعلى"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(idx, 'down');
                        }}
                        disabled={idx === config.sections.length - 1}
                        className="p-0.5 hover:text-white disabled:opacity-20 transition"
                        title="تحريك لأسفل"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <span className="block truncate">{section.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {section.type} {!section.isVisible && '· مخفي'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Visibility, Duplicate, Delete */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => handleToggleVisibility(section.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title={section.isVisible ? 'إخفاء القسم' : 'إظهار القسم'}
                    >
                      {section.isVisible ? <Eye className="w-3.5 h-3.5 text-teal-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    <button
                      onClick={(e) => handleDuplicateSection(section.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="تكرار القسم"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSection(section.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick theme trigger button at bottom of sidebar */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'theme' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>الثيم والألوان</span>
            </button>
            <button
              onClick={() => setActiveTab('animations')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'animations' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>الحركات</span>
            </button>
          </div>
        </aside>

        {/* CENTER: LIVE WEBSITE CANVAS */}
        <main className="flex-1 bg-slate-950 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto">
          {/* Viewport Frame */}
          <div
            className={`transition-all duration-300 bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-800 ${
              viewport === 'desktop'
                ? 'w-full max-w-6xl min-h-[800px]'
                : viewport === 'tablet'
                ? 'w-[768px] min-h-[700px]'
                : 'w-[390px] min-h-[650px]'
            }`}
          >
            {/* Embedded Live Interactive Doctor Website */}
            <DoctorWebsite
              doctor={currentDoctor}
              customConfig={config}
              activeLanguage={previewLanguage}
              onLanguageChange={setPreviewLanguage}
              selectedSectionId={selectedSectionId}
              onSelectSection={(id) => {
                setSelectedSectionId(id);
                setActiveTab('section');
              }}
              isAdminPreview={false}
            />
          </div>
        </main>

        {/* RIGHT SIDEBAR: SETTINGS & CUSTOMIZATION (340px) */}
        <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20">
          {/* Tabs header */}
          <div className="h-11 border-b border-slate-800 flex items-center px-1.5 gap-0.5 bg-slate-900 overflow-x-auto">
            <button
              onClick={() => setActiveTab('section')}
              className={`py-1 px-2 rounded text-[11px] font-semibold whitespace-nowrap transition flex items-center justify-center gap-1 ${
                activeTab === 'section' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>القسم</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-1 px-2 rounded text-[11px] font-semibold whitespace-nowrap transition flex items-center justify-center gap-1 ${
                activeTab === 'profile' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span>صورة الطبيب</span>
            </button>
            <button
              onClick={() => setActiveTab('header')}
              className={`py-1 px-2 rounded text-[11px] font-semibold whitespace-nowrap transition flex items-center justify-center gap-1 ${
                activeTab === 'header' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="w-3 h-3" />
              <span>الهيدر واللوجو</span>
            </button>
            <button
              onClick={() => setActiveTab('floating')}
              className={`py-1 px-2 rounded text-[11px] font-semibold whitespace-nowrap transition flex items-center justify-center gap-1 ${
                activeTab === 'floating' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>زر الواتساب</span>
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`py-1 px-2 rounded text-[11px] font-semibold whitespace-nowrap transition flex items-center justify-center gap-1 ${
                activeTab === 'theme' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>الثيم</span>
            </button>
            <button
              onClick={() => setActiveTab('animations')}
              className={`py-1 px-2 rounded text-[11px] font-semibold whitespace-nowrap transition flex items-center justify-center gap-1 ${
                activeTab === 'animations' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>الحركات</span>
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`py-1 px-2 rounded text-[11px] font-semibold whitespace-nowrap transition flex items-center justify-center gap-1 ${
                activeTab === 'seo' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>SEO</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* TAB 1: SECTION SETTINGS */}
            {activeTab === 'section' && selectedSection && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono text-teal-400">{selectedSection.type}</span>
                  <h3 className="font-bold text-sm text-white">{selectedSection.name}</h3>
                </div>

                {/* Section title (Arabic & English) */}
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">عنوان القسم (عربي)</label>
                  <input
                    type="text"
                    value={selectedSection.content.title || ''}
                    onChange={(e) =>
                      updateSelectedSection((prev) => ({
                        ...prev,
                        content: { ...prev.content, title: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                  <label className="block text-slate-300 font-semibold">Section Title (English)</label>
                  <input
                    type="text"
                    value={selectedSection.content.titleEn || ''}
                    onChange={(e) =>
                      updateSelectedSection((prev) => ({
                        ...prev,
                        content: { ...prev.content, titleEn: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs dir-ltr text-left"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">العنوان الفرعي (عربي)</label>
                  <input
                    type="text"
                    value={selectedSection.content.subtitle || ''}
                    onChange={(e) =>
                      updateSelectedSection((prev) => ({
                        ...prev,
                        content: { ...prev.content, subtitle: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                  <label className="block text-slate-300 font-semibold">Subtitle (English)</label>
                  <input
                    type="text"
                    value={selectedSection.content.subtitleEn || ''}
                    onChange={(e) =>
                      updateSelectedSection((prev) => ({
                        ...prev,
                        content: { ...prev.content, subtitleEn: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs dir-ltr text-left"
                  />
                </div>

                {/* Body paragraph */}
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">النص والفقرة التعريفية (عربي)</label>
                  <textarea
                    rows={3}
                    value={selectedSection.content.body || ''}
                    onChange={(e) =>
                      updateSelectedSection((prev) => ({
                        ...prev,
                        content: { ...prev.content, body: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs leading-relaxed"
                  />
                  <label className="block text-slate-300 font-semibold">Body Content (English)</label>
                  <textarea
                    rows={3}
                    value={selectedSection.content.bodyEn || ''}
                    onChange={(e) =>
                      updateSelectedSection((prev) => ({
                        ...prev,
                        content: { ...prev.content, bodyEn: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs leading-relaxed dir-ltr text-left"
                  />
                </div>

                {/* Primary Button */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">زر الإجراء الرئيسي</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="نص الزر بالعربية"
                      value={selectedSection.content.primaryButtonText || ''}
                      onChange={(e) =>
                        updateSelectedSection((prev) => ({
                          ...prev,
                          content: { ...prev.content, primaryButtonText: e.target.value },
                        }))
                      }
                      className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Button Text (EN)"
                      value={selectedSection.content.primaryButtonTextEn || ''}
                      onChange={(e) =>
                        updateSelectedSection((prev) => ({
                          ...prev,
                          content: { ...prev.content, primaryButtonTextEn: e.target.value },
                        }))
                      }
                      className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedSection.content.primaryButtonAction || 'whatsapp'}
                      onChange={(e) =>
                        updateSelectedSection((prev) => ({
                          ...prev,
                          content: { ...prev.content, primaryButtonAction: e.target.value as any },
                        }))
                      }
                      className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                    >
                      <option value="whatsapp">محادثة واتساب</option>
                      <option value="call">اتصال هاتفي</option>
                      <option value="scroll">تمرير لقسم معين</option>
                      <option value="custom_url">رابط خارجي</option>
                    </select>
                    <input
                      type="text"
                      placeholder="#sec-services أو رابط"
                      value={selectedSection.content.primaryButtonUrl || ''}
                      onChange={(e) =>
                        updateSelectedSection((prev) => ({
                          ...prev,
                          content: { ...prev.content, primaryButtonUrl: e.target.value },
                        }))
                      }
                      className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left font-mono"
                    />
                  </div>
                </div>

                {/* Section Image / Photo Upload & URL */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-teal-400" />
                    <span>صورة القسم (رفع ملف أو رابط مباشر)</span>
                  </span>

                  {selectedSection.content.imageUrl && (
                    <div className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 mb-2">
                      <img
                        src={selectedSection.content.imageUrl}
                        alt="معاينة صورة القسم"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          updateSelectedSection((prev) => ({
                            ...prev,
                            content: { ...prev.content, imageUrl: '' },
                          }))
                        }
                        className="absolute top-1.5 left-1.5 p-1 rounded-md bg-rose-600/90 text-white text-[10px] hover:bg-rose-500"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer py-1.5 px-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-center font-medium text-[11px] flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3 h-3" />
                      <span>رفع صورة من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageFileUpload(e, (dataUrl) => {
                            updateSelectedSection((prev) => ({
                              ...prev,
                              content: { ...prev.content, imageUrl: dataUrl },
                            }));
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">أو أدخل رابط الصورة (Image URL):</span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={selectedSection.content.imageUrl || ''}
                      onChange={(e) =>
                        updateSelectedSection((prev) => ({
                          ...prev,
                          content: { ...prev.content, imageUrl: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left font-mono"
                    />
                  </div>
                </div>

                {/* Doctor Official Profile Photo Quick-Upload (for Hero and About) */}
                {(selectedSection.type === 'hero' || selectedSection.type === 'about') && (
                  <div className="p-3 bg-cyan-950/40 rounded-lg border border-cyan-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-200 block flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>الصورة الشخصية الرسمية للطبيب</span>
                      </span>
                      {currentDoctor.photoUrl && (
                        <button
                          type="button"
                          onClick={() => updateDoctor((prev) => ({ ...prev, photoUrl: '' }))}
                          className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                          title="حذف الصورة الشخصية"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>إزالة</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-cyan-700/60 bg-slate-900 shrink-0 flex items-center justify-center">
                        {currentDoctor.photoUrl ? (
                          <img
                            src={currentDoctor.photoUrl}
                            alt={currentDoctor.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Stethoscope className="w-6 h-6 text-cyan-500/50" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="cursor-pointer py-1.5 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-center font-medium text-[11px] flex items-center justify-center gap-1.5 transition">
                          <Upload className="w-3 h-3" />
                          <span>رفع صورة الطبيب من جهازك</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageFileUpload(e, (dataUrl) => {
                                updateDoctor((prev) => ({ ...prev, photoUrl: dataUrl }));
                              })
                            }
                          />
                        </label>
                        <p className="text-[10px] text-slate-400">
                          صورة البروفايل الرسمية المعتمدة للطبيب
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Appearance: Background & Padding */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">مظهر ومساحات القسم</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">لون الخلفية:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedSection.style.backgroundColor || '#FFFFFF'}
                        onChange={(e) =>
                          updateSelectedSection((prev) => ({
                            ...prev,
                            style: { ...prev.style, backgroundColor: e.target.value },
                          }))
                        }
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <button
                        onClick={() =>
                          updateSelectedSection((prev) => ({
                            ...prev,
                            style: { ...prev.style, backgroundColor: '#FFFFFF' },
                          }))
                        }
                        className="px-2 py-0.5 rounded bg-slate-700 text-[10px]"
                      >
                        أبيض
                      </button>
                      <button
                        onClick={() =>
                          updateSelectedSection((prev) => ({
                            ...prev,
                            style: { ...prev.style, backgroundColor: '#F8FAFC' },
                          }))
                        }
                        className="px-2 py-0.5 rounded bg-slate-700 text-[10px]"
                      >
                        رمادي فاتح
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">المساحة الرأسية:</span>
                    <select
                      value={selectedSection.style.paddingTop || 'medium'}
                      onChange={(e) =>
                        updateSelectedSection((prev) => ({
                          ...prev,
                          style: {
                            ...prev.style,
                            paddingTop: e.target.value as any,
                            paddingBottom: e.target.value as any,
                          },
                        }))
                      }
                      className="bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"
                    >
                      <option value="none">بدون مسافة (0px)</option>
                      <option value="small">صغيرة (24px)</option>
                      <option value="medium">متوسطة (48px)</option>
                      <option value="large">واسعة (80px)</option>
                    </select>
                  </div>
                </div>

                {/* Section Specific Animation */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">حركة دخول هذا القسم</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSection.animation.enabled}
                        onChange={(e) =>
                          updateSelectedSection((prev) => ({
                            ...prev,
                            animation: { ...prev.animation, enabled: e.target.checked },
                          }))
                        }
                        className="rounded text-teal-500"
                      />
                      <span className="text-slate-300">تفعيل</span>
                    </label>
                  </div>

                  {selectedSection.animation.enabled && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">تأثير الحركة:</span>
                        <select
                          value={selectedSection.animation.style}
                          onChange={(e) =>
                            updateSelectedSection((prev) => ({
                              ...prev,
                              animation: { ...prev.animation, style: e.target.value as AnimationStyle },
                            }))
                          }
                          className="bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"
                        >
                          <option value="fade-up">صعود ناعم (Fade Up)</option>
                          <option value="fade-in">ظهور تدريجي (Fade In)</option>
                          <option value="slide-left">انزلاق من اليمين</option>
                          <option value="slide-right">انزلاق من اليسار</option>
                          <option value="zoom-in">تكبير ناعم (Zoom In)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">المدة الزمنية:</span>
                        <span className="font-mono text-slate-300">{selectedSection.animation.durationMs}ms</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="1200"
                        step="50"
                        value={selectedSection.animation.durationMs}
                        onChange={(e) =>
                          updateSelectedSection((prev) => ({
                            ...prev,
                            animation: { ...prev.animation, durationMs: parseInt(e.target.value) },
                          }))
                        }
                        className="w-full accent-teal-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DOCTOR PROFILE & PHOTO SETTINGS */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>الصورة الشخصية وبيانات الطبيب</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    رفع وتغيير الصورة الشخصية للطبيب والبيانات التعريفية الأساسية
                  </p>
                </div>

                {/* Doctor Profile Photo Card */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 block flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>الصورة الشخصية للطبيب (Profile Photo)</span>
                    </span>
                    {currentDoctor.photoUrl && (
                      <button
                        type="button"
                        onClick={() => updateDoctor((prev) => ({ ...prev, photoUrl: '' }))}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                        title="إزالة الصورة الشخصية"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>إزالة الصورة</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 flex items-center justify-center">
                      {currentDoctor.photoUrl ? (
                        <img
                          src={currentDoctor.photoUrl}
                          alt={currentDoctor.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center p-1">
                          <Stethoscope className="w-6 h-6 text-slate-500 mx-auto" />
                          <span className="text-[9px] text-slate-500 block">افتراضي</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-center font-medium text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageFileUpload(e, (dataUrl) => {
                              updateDoctor((prev) => ({ ...prev, photoUrl: dataUrl }));
                            })
                          }
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">
                        يدعم صيغ JPG، PNG، WebP حتى 3 ميجابايت.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-700/60">
                    <span className="text-[10px] text-slate-400">أو أدخل رابط مباشر للصورة (Image URL):</span>
                    <input
                      type="text"
                      placeholder="https://example.com/doctor.jpg"
                      value={currentDoctor.photoUrl || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, photoUrl: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left font-mono"
                    />
                  </div>
                </div>

                {/* Name & Specialty */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2.5">
                  <span className="font-bold text-slate-200 block">الاسم والتخصص</span>
                  
                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">اسم الطبيب (عربي):</label>
                    <input
                      type="text"
                      value={currentDoctor.fullName}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">Doctor Name (English):</label>
                    <input
                      type="text"
                      value={currentDoctor.fullNameEn || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, fullNameEn: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">التخصص الطبي (عربي):</label>
                    <input
                      type="text"
                      value={currentDoctor.specialty}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, specialty: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">Medical Specialty (English):</label>
                    <input
                      type="text"
                      value={currentDoctor.specialtyEn || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, specialtyEn: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left"
                    />
                  </div>
                </div>

                {/* Academic Title & Experience */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2.5">
                  <span className="font-bold text-slate-200 block">اللقب والخبرة السريرية</span>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">اللقب المهني (عربي):</label>
                    <input
                      type="text"
                      value={currentDoctor.title || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="استشاري جراحة..."
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">Title (English):</label>
                    <input
                      type="text"
                      value={currentDoctor.titleEn || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, titleEn: e.target.value }))
                      }
                      placeholder="Consultant Surgeon..."
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">سنوات الخبرة:</label>
                    <input
                      type="number"
                      value={currentDoctor.yearsOfExperience || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({
                          ...prev,
                          yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      placeholder="15"
                      className="w-24 bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Biography */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">النبذة التعريفية (Bio)</span>
                  
                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">النبذة بالعربية:</label>
                    <textarea
                      rows={3}
                      value={currentDoctor.bio || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, bio: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">Biography (English):</label>
                    <textarea
                      rows={3}
                      value={currentDoctor.bioEn || ''}
                      onChange={(e) =>
                        updateDoctor((prev) => ({ ...prev, bioEn: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white leading-relaxed dir-ltr text-left"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HEADER & LOGO SETTINGS */}
            {activeTab === 'header' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-white">تخصيص الهيدر وشعار الموقع</h3>
                  <p className="text-[11px] text-slate-400">تعديل شريط التنقل العلوي واللوجو الخاص بكل دكتور</p>
                </div>

                {/* Show/Hide Logo */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">عرض شعار / لوجو الطبيب:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.header.showLogo}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            header: { ...config.header, showLogo: e.target.checked },
                          })
                        }
                        className="rounded text-teal-500 w-4 h-4"
                      />
                      <span className="text-slate-300">مُفعل</span>
                    </label>
                  </div>

                  {config.header.showLogo && (
                    <div className="space-y-2 pt-2 border-t border-slate-700/60">
                      <span className="block text-slate-300 font-semibold">شعار العيادة / اللوجو (رفع أو رابط)</span>

                      {config.header.logoUrl ? (
                        <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-700">
                          <img
                            src={config.header.logoUrl}
                            alt="لوجو العيادة"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-700 bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-white block truncate">اللوجو الحالي مفعّل</span>
                            <button
                              onClick={() =>
                                updateConfig({
                                  ...config,
                                  header: { ...config.header, logoUrl: '' },
                                })
                              }
                              className="text-[10px] text-rose-400 hover:text-rose-300 transition"
                            >
                              إزالة اللوجو والعودة للأيقونة الافتراضية
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 p-2 bg-slate-900/60 rounded border border-slate-800">
                          حالياً يتم عرض أيقونة السماعة الطبية الطبية الأنيقة الافتراضية.
                        </div>
                      )}

                      <div className="pt-1">
                        <label className="cursor-pointer py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-center font-medium text-[11px] flex items-center justify-center gap-1.5 transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع لوجو من جهازك (PNG / JPG)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageFileUpload(e, (dataUrl) => {
                                updateConfig({
                                  ...config,
                                  header: { ...config.header, logoUrl: dataUrl },
                                });
                              })
                            }
                          />
                        </label>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">أو رابط اللوجو المباشر:</span>
                        <input
                          type="text"
                          placeholder="https://example.com/logo.png"
                          value={config.header.logoUrl || ''}
                          onChange={(e) =>
                            updateConfig({
                              ...config,
                              header: { ...config.header, logoUrl: e.target.value },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Header Title & Subtitle */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">نصوص شريط الهيدر</span>
                  
                  <div className="space-y-1">
                    <label className="block text-slate-300 text-[11px]">عنوان الهيدر (عربي) - افتراضياً اسم الطبيب:</label>
                    <input
                      type="text"
                      placeholder={doctor.fullName}
                      value={config.header.customTitle || ''}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          header: { ...config.header, customTitle: e.target.value },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-300 text-[11px]">Header Title (English):</label>
                    <input
                      type="text"
                      placeholder={doctor.fullNameEn || doctor.fullName}
                      value={config.header.customTitleEn || ''}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          header: { ...config.header, customTitleEn: e.target.value },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="block text-slate-300 text-[11px]">الوصف الفرعي بالهيدر (عربي) - افتراضياً التخصص:</label>
                    <input
                      type="text"
                      placeholder={doctor.specialty}
                      value={config.header.customSubtitle || ''}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          header: { ...config.header, customSubtitle: e.target.value },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">أزرار الإجراء السريع في الهيدر</span>
                  
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-slate-300">زر واتساب بالهيدر:</span>
                    <input
                      type="checkbox"
                      checked={config.header.showWhatsAppButton}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          header: { ...config.header, showWhatsAppButton: e.target.checked },
                        })
                      }
                      className="rounded text-teal-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-slate-300">زر الاتصال الهاتفي بالهيدر:</span>
                    <input
                      type="checkbox"
                      checked={config.header.showPhoneButton}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          header: { ...config.header, showPhoneButton: e.target.checked },
                        })
                      }
                      className="rounded text-teal-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-slate-300">تثبيت الهيدر أعلى الصفحة (Sticky):</span>
                    <input
                      type="checkbox"
                      checked={config.theme.headerSticky}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          theme: { ...config.theme, headerSticky: e.target.checked },
                        })
                      }
                      className="rounded text-teal-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB: FLOATING WHATSAPP BUTTON SETTINGS */}
            {activeTab === 'floating' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <MessageCircle className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-white">زر واتساب العائم (Floating WhatsApp)</h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    زر عائم دائم الظهور في شاشة الزائر يربطه فوراً بواتساب الطبيب
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">تفعيل زر واتساب العائم:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.floatingWhatsApp?.enabled !== false}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            floatingWhatsApp: {
                              ...config.floatingWhatsApp,
                              enabled: e.target.checked,
                              position: config.floatingWhatsApp?.position || 'bottom-left',
                            },
                          })
                        }
                        className="rounded text-emerald-500 w-4 h-4"
                      />
                      <span className="text-slate-300">مُفعل</span>
                    </label>
                  </div>

                  <div className="p-2 bg-slate-900 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400">رقم واتساب المربوط حالياً للطبيب:</span>
                    <div className="font-mono text-emerald-400 text-xs dir-ltr text-left">
                      {doctor.clinic?.whatsapp || 'لم يتم إدخال رقم واتساب بعد في بيانات العيادة'}
                    </div>
                  </div>
                </div>

                {config.floatingWhatsApp?.enabled !== false && (
                  <div className="space-y-3">
                    {/* Position Picker */}
                    <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-200 block">موضع الزر على الشاشة:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            updateConfig({
                              ...config,
                              floatingWhatsApp: {
                                ...config.floatingWhatsApp,
                                enabled: true,
                                position: 'bottom-left',
                              },
                            })
                          }
                          className={`p-2 rounded-lg text-xs font-semibold border transition text-center ${
                            config.floatingWhatsApp?.position !== 'bottom-right'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                          }`}
                        >
                          أسفل يسار الشاشة (موصى به)
                        </button>

                        <button
                          onClick={() =>
                            updateConfig({
                              ...config,
                              floatingWhatsApp: {
                                ...config.floatingWhatsApp,
                                enabled: true,
                                position: 'bottom-right',
                              },
                            })
                          }
                          className={`p-2 rounded-lg text-xs font-semibold border transition text-center ${
                            config.floatingWhatsApp?.position === 'bottom-right'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                          }`}
                        >
                          أسفل يمين الشاشة
                        </button>
                      </div>
                    </div>

                    {/* Button Text & Label */}
                    <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-200 block">نص الزر العائم</span>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">النص بالعربية:</label>
                          <input
                            type="text"
                            placeholder="تواصل عبر واتساب"
                            value={config.floatingWhatsApp?.customLabel || ''}
                            onChange={(e) =>
                              updateConfig({
                                ...config,
                                floatingWhatsApp: {
                                  ...config.floatingWhatsApp,
                                  enabled: true,
                                  position: config.floatingWhatsApp?.position || 'bottom-left',
                                  customLabel: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Label in English:</label>
                          <input
                            type="text"
                            placeholder="Chat with Doctor"
                            value={config.floatingWhatsApp?.customLabelEn || ''}
                            onChange={(e) =>
                              updateConfig({
                                ...config,
                                floatingWhatsApp: {
                                  ...config.floatingWhatsApp,
                                  enabled: true,
                                  position: config.floatingWhatsApp?.position || 'bottom-left',
                                  customLabelEn: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white dir-ltr text-left"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pulse Animation */}
                    <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="font-semibold text-slate-200 block text-xs">تأثير نبض الحركة (Pulse Ripple)</span>
                          <span className="text-[10px] text-slate-400">حلقة موجية خفيفة تلفت انتباه الزائر للضغط</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.floatingWhatsApp?.showPulseAnimation !== false}
                          onChange={(e) =>
                            updateConfig({
                              ...config,
                              floatingWhatsApp: {
                                ...config.floatingWhatsApp,
                                enabled: true,
                                position: config.floatingWhatsApp?.position || 'bottom-left',
                                showPulseAnimation: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-emerald-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: GLOBAL THEME SETTINGS */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-white">الثيم والهوية البصرية</h3>
                  <p className="text-[11px] text-slate-400">تخصيص الألوان والخطوط لكامل الموقع</p>
                </div>

                {/* Preset Themes Selector */}
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">القوالب اللونية الجاهزة</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() =>
                        updateConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            presetId: 'elegant-medical',
                            primaryColor: '#0F2A4A',
                            accentColor: '#0D9488',
                            lightBg: '#F8FAFC',
                          },
                        })
                      }
                      className="p-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-right flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold block text-white">طبي أنيق (Elegant Medical)</span>
                        <span className="text-[10px] text-slate-400">كحلي ملكي + تيل طبي</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#0F2A4A] border border-white/20" />
                        <span className="w-4 h-4 rounded-full bg-[#0D9488] border border-white/20" />
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        updateConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            presetId: 'modern-minimal',
                            primaryColor: '#09090B',
                            accentColor: '#0284C7',
                            lightBg: '#FAFAFA',
                          },
                        })
                      }
                      className="p-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-right flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold block text-white">عصري مبسط (Modern Minimal)</span>
                        <span className="text-[10px] text-slate-400">أسود داكن + أزرق سماوي</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#09090B] border border-white/20" />
                        <span className="w-4 h-4 rounded-full bg-[#0284C7] border border-white/20" />
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        updateConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            presetId: 'premium-editorial',
                            primaryColor: '#1E293B',
                            accentColor: '#059669',
                            lightBg: '#F0FDF4',
                          },
                        })
                      }
                      className="p-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-right flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold block text-white">زمردي فاخر (Premium Editorial)</span>
                        <span className="text-[10px] text-slate-400">رمادي داكن + زمردي صحي</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#1E293B] border border-white/20" />
                        <span className="w-4 h-4 rounded-full bg-[#059669] border border-white/20" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-3">
                  <span className="font-bold text-slate-200 block">تعديل الألوان المباشرة</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">اللون الأساسي (Primary):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            theme: { ...config.theme, primaryColor: e.target.value },
                          })
                        }
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px] text-slate-300">{config.theme.primaryColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">لون الأزرار والتمييز (Accent):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.theme.accentColor}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            theme: { ...config.theme, accentColor: e.target.value },
                          })
                        }
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px] text-slate-300">{config.theme.accentColor}</span>
                    </div>
                  </div>
                </div>

                {/* Header & Navigation */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">شريط الترويسة والتنقل (Header)</span>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-400">تثبيت الشريط عند التمرير (Sticky):</span>
                    <input
                      type="checkbox"
                      checked={config.theme.headerSticky}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          theme: { ...config.theme, headerSticky: e.target.checked },
                        })
                      }
                      className="rounded text-teal-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-400">عرض مفتاح تغيير اللغة (عربي / EN):</span>
                    <input
                      type="checkbox"
                      checked={config.theme.showLanguageSwitcher}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          theme: { ...config.theme, showLanguageSwitcher: e.target.checked },
                        })
                      }
                      className="rounded text-teal-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: ANIMATIONS SETTINGS */}
            {activeTab === 'animations' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-white">الحركات التفاعلية والمؤثرات</h3>
                  <p className="text-[11px] text-slate-400">تحكم كامل في سلاسة الحركات مع دعم إمكانية الوصول</p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">تفعيل الحركات عالمياً:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.theme.enableGlobalAnimations}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            theme: { ...config.theme, enableGlobalAnimations: e.target.checked },
                          })
                        }
                        className="rounded text-teal-500 w-4 h-4"
                      />
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يتم تلقائياً احترام إعدادات خفض الحركة (reduced-motion) للمستخدمين لمنع الدوار وضمان سرعة التحميل.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">تطبيق حركة موحدة على كل الأقسام</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const updated = config.sections.map((s) => ({
                          ...s,
                          animation: { ...s.animation, enabled: true, style: 'fade-up' as AnimationStyle },
                        }));
                        updateConfig({ ...config, sections: updated });
                      }}
                      className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium text-center"
                    >
                      صعود ناعم للكل
                    </button>
                    <button
                      onClick={() => {
                        const updated = config.sections.map((s) => ({
                          ...s,
                          animation: { ...s.animation, enabled: true, style: 'fade-in' as AnimationStyle },
                        }));
                        updateConfig({ ...config, sections: updated });
                      }}
                      className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium text-center"
                    >
                      ظهور تدريجي للكل
                    </button>
                    <button
                      onClick={() => {
                        const updated = config.sections.map((s) => ({
                          ...s,
                          animation: { ...s.animation, enabled: false },
                        }));
                        updateConfig({ ...config, sections: updated });
                      }}
                      className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-center col-span-2"
                    >
                      إيقاف الحركات في كافة الأقسام
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SEO SETTINGS */}
            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-white">إعدادات محركات البحث (SEO)</h3>
                  <p className="text-[11px] text-slate-400">تخصيص عنوان ووصف الموقع في نتائج Google</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">عنوان الصفحة (Meta Title)</label>
                  <input
                    type="text"
                    value={config.seo.metaTitle || ''}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        seo: { ...config.seo, metaTitle: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                  <label className="block text-slate-300 font-semibold">Page Title (English)</label>
                  <input
                    type="text"
                    value={config.seo.metaTitleEn || ''}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        seo: { ...config.seo, metaTitleEn: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs dir-ltr text-left"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">وصف الموقع (Meta Description)</label>
                  <textarea
                    rows={3}
                    value={config.seo.metaDescription || ''}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        seo: { ...config.seo, metaDescription: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 3. SECTION LIBRARY MODAL */}
      {showSectionLibraryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">مكتبة الأقسام والكتل الجاهزة</h3>
                <p className="text-xs text-slate-400 mt-0.5">اختر القسم الذي تريد إضافته إلى موقع الدكتور</p>
              </div>
              <button
                onClick={() => setShowSectionLibraryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                { type: 'hero' as SectionType, title: 'مقدمة البطل والتعريف', desc: 'صورة الطبيب الكبيرة، التخصص، والزر المباشر لواتساب' },
                { type: 'about' as SectionType, title: 'عن الطبيب والفلسفة الطبية', desc: 'نبذة شخصية، الرؤية السريرية، وسنوات الممارسة' },
                { type: 'qualifications' as SectionType, title: 'المؤهلات العلمية والزمالات', desc: 'بطاقات الشهادات الأكاديمية والاعتمادات الرسمية' },
                { type: 'services' as SectionType, title: 'الخدمات والعلاجات الطبية', desc: 'شبكة بطاقات الخدمات مع أسعار استرشادية واستفسار' },
                { type: 'why_choose_us' as SectionType, title: 'لماذا يختار المرضى عيادتنا؟', desc: '4 مميزات سريرية تبرز التفوق والأمان الطبي' },
                { type: 'clinic_gallery' as SectionType, title: 'معرض صور العيادة والتجهيزات', desc: 'صور عالية الدقة لغرف الكشف وقاعات الانتظار' },
                { type: 'articles' as SectionType, title: 'المقالات والتوعية الطبية', desc: 'مقالات صحية وقارئ منبثق للمعلومات التثقيفية' },
                { type: 'faqs' as SectionType, title: 'الأسئلة الشائعة وإجاباتها', desc: 'أكورديون تفاعلي لأهم الأسئلة قبل الحجز' },
                { type: 'testimonials' as SectionType, title: 'تجارب المرضى (المصرح بها كتابياً)', desc: 'آراء موثقة بموافقة صريحة وقانونية فقط' },
                { type: 'location_hours' as SectionType, title: 'مقر العيادة ومواعيد العمل', desc: 'العنوان، مواعيد العمل اليومية، ورابط Google Maps' },
                { type: 'contact' as SectionType, title: 'قسم التواصل السريع والحجز', desc: 'نداء واضح ومباشر للحجز الفوري عبر واتساب' },
                { type: 'custom_block' as SectionType, title: 'كتلة نص وصورة مخصصة', desc: 'قسم حر لكتابة أي محتوى ترغب به مع صورة وزر' },
              ].map((item) => (
                <div
                  key={item.type}
                  onClick={() => handleAddSectionFromLibrary(item.type)}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-teal-500 cursor-pointer transition space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-teal-400 transition">
                      {item.title}
                    </span>
                    <Plus className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSectionLibraryModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
