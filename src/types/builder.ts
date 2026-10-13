import { Qualification, MedicalService, EducationalArticle, FAQItem } from './doctor';

export type SectionType =
  | 'hero'
  | 'about'
  | 'qualifications'
  | 'services'
  | 'why_choose_us'
  | 'articles'
  | 'faqs'
  | 'clinic_gallery'
  | 'location_hours'
  | 'contact'
  | 'testimonials'
  | 'custom_block';

export type AnimationStyle = 'none' | 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in';

export interface SectionAnimationSettings {
  enabled: boolean;
  style: AnimationStyle;
  durationMs: number; // e.g. 500
  delayMs: number; // e.g. 0, 100, 200
}

export interface SectionStyleSettings {
  backgroundColor?: string;
  textColor?: string;
  paddingTop?: 'none' | 'small' | 'medium' | 'large';
  paddingBottom?: 'none' | 'small' | 'medium' | 'large';
  alignment?: 'right' | 'center' | 'left';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  showDivider?: boolean;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  captionEn?: string;
}

export interface AuthenticTestimonial {
  id: string;
  patientName: string;
  patientNameEn?: string;
  feedback: string;
  feedbackEn?: string;
  treatmentTag?: string;
  date?: string;
  verifiedConsent: boolean; // Authentic authorized patient consent verification
}

export interface FeatureItem {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon?: string; // lucide icon identifier
}

export interface SectionContent {
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  body?: string;
  bodyEn?: string;
  badge?: string;
  badgeEn?: string;
  primaryButtonText?: string;
  primaryButtonTextEn?: string;
  primaryButtonAction?: 'whatsapp' | 'call' | 'scroll' | 'custom_url';
  primaryButtonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonTextEn?: string;
  secondaryButtonAction?: 'whatsapp' | 'call' | 'scroll' | 'custom_url';
  secondaryButtonUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageShape?: 'rounded' | 'circle' | 'square' | 'shadowed';
  
  // Specific block data extensions
  features?: FeatureItem[];
  gallery?: GalleryImage[];
  testimonials?: AuthenticTestimonial[];
  customHtml?: string;
  contactNote?: string;
  contactNoteEn?: string;
}

export interface WebsiteSection {
  id: string;
  type: SectionType;
  name: string; // User-facing label in builder
  nameEn?: string;
  isVisible: boolean;
  content: SectionContent;
  style: SectionStyleSettings;
  animation: SectionAnimationSettings;
}

export interface GlobalThemeSettings {
  presetId?: 'elegant-medical' | 'modern-minimal' | 'premium-editorial' | 'custom';
  primaryColor: string;
  accentColor: string;
  lightBg: string;
  cardBg: string;
  textColor: string;
  fontFamily: 'cairo' | 'alexandria' | 'tajawal' | 'ibm-plex' | 'system';
  buttonRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  headerSticky: boolean;
  showLanguageSwitcher: boolean;
  enableGlobalAnimations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface DoctorWebsiteConfig {
  version: number;
  theme: GlobalThemeSettings;
  sections: WebsiteSection[];
  header: {
    showLogo: boolean;
    logoUrl?: string;
    showPhoneButton: boolean;
    showWhatsAppButton: boolean;
    customTitle?: string;
    customTitleEn?: string;
    customSubtitle?: string;
    customSubtitleEn?: string;
  };
  floatingWhatsApp?: {
    enabled: boolean;
    position: 'bottom-left' | 'bottom-right';
    customMessage?: string;
    customLabel?: string;
    customLabelEn?: string;
    showPulseAnimation?: boolean;
  };
  footer: {
    showMedicalDisclaimer: boolean;
    customDisclaimerText?: string;
    customDisclaimerTextEn?: string;
    copyrightText?: string;
    copyrightTextEn?: string;
  };
  seo: {
    metaTitle?: string;
    metaTitleEn?: string;
    metaDescription?: string;
    metaDescriptionEn?: string;
    keywords?: string;
  };
}

export interface BuilderState {
  past: DoctorWebsiteConfig[];
  present: DoctorWebsiteConfig;
  future: DoctorWebsiteConfig[];
}
