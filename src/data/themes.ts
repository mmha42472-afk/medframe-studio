export interface DoctorTheme {
  id: string;
  name: string;
  englishName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  lightBg: string;
  cardBorder: string;
  recommendedFor: string;
  colorSamples: string[];
}

export const DOCTOR_THEMES: DoctorTheme[] = [
  {
    id: 'royal-navy',
    name: 'الكحلي الملكي الاستشاري',
    englishName: 'Royal Navy',
    tagline: 'الهيبة والأصالة الأكاديمية والموثوقية العالية',
    primaryColor: '#0F2A4A',
    accentColor: '#0D9488',
    lightBg: '#F8FAFC',
    cardBorder: '#CBD5E1',
    recommendedFor: 'جراحة القلب والصدر، الباطنة، المخ والأعصاب، الأورام',
    colorSamples: ['#0F2A4A', '#0D9488', '#F1F5F9'],
  },
  {
    id: 'surgical-emerald',
    name: 'الزمرد الجراحي النقي',
    englishName: 'Surgical Emerald',
    tagline: 'رمز السلامة والتعافي والبيئة الطبية المعقمة',
    primaryColor: '#064E3B',
    accentColor: '#059669',
    lightBg: '#F0FDF4',
    cardBorder: '#A7F3D0',
    recommendedFor: 'الجراحة العامة والمناظير، جراحة العظام، الرمد، العلاج الطبيعي',
    colorSamples: ['#064E3B', '#059669', '#ECFDF5'],
  },
  {
    id: 'nile-blue',
    name: 'أزرق النيل الطبي التخصصي',
    englishName: 'Nile Clinical Blue',
    tagline: 'الحيوية والسكينة والرعاية النفسية المريحة للمريض',
    primaryColor: '#1E3A8A',
    accentColor: '#0284C7',
    lightBg: '#F0F9FF',
    cardBorder: '#BAE6FD',
    recommendedFor: 'طب الأطفال وحديثي الولادة، الجلدية والليزر، الأنف والأذن، التغذية العلاجية',
    colorSamples: ['#1E3A8A', '#0284C7', '#E0F2FE'],
  },
  {
    id: 'cardio-burgundy',
    name: 'العنابي الوقائي الدافئ',
    englishName: 'Clinical Burgundy',
    tagline: 'الرعاية العائلية الشاملة والدفء الإنساني التخصصي',
    primaryColor: '#881337',
    accentColor: '#E11D48',
    lightBg: '#FFF1F2',
    cardBorder: '#FECDD3',
    recommendedFor: 'النساء والتوليد، طب الأسرة، الغدد الصماء والسكري، جراحة الأوعية',
    colorSamples: ['#881337', '#E11D48', '#FFE4E6'],
  },
  {
    id: 'modern-charcoal',
    name: 'الفحم النخبوي العصري',
    englishName: 'Modern Charcoal & Teal',
    tagline: 'الفخامة المعاصرة والابتكار والتقنيات الرقمية المتقدمة',
    primaryColor: '#1E293B',
    accentColor: '#14B8A6',
    lightBg: '#F8FAFC',
    cardBorder: '#CBD5E1',
    recommendedFor: 'طب وتجميل الأسنان، جراحات التجميل، الذكورة والعقم، مراكز الأشعة',
    colorSamples: ['#1E293B', '#14B8A6', '#F1F5F9'],
  },
];

export function getThemeById(themeId?: string): DoctorTheme {
  const found = DOCTOR_THEMES.find((t) => t.id === themeId);
  return found || DOCTOR_THEMES[0];
}
