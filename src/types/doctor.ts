export type DoctorStatus = 'draft' | 'pending' | 'published';

export interface Qualification {
  id: string;
  degree: string;
  institution: string;
  degreeEn?: string;
  institutionEn?: string;
  year?: string;
  verified: boolean;
}

export interface MedicalService {
  id: string;
  name: string;
  description: string;
  nameEn?: string;
  descriptionEn?: string;
  tag?: string;
  tagEn?: string;
  fee?: string;
}

export interface EducationalArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  titleEn?: string;
  summaryEn?: string;
  contentEn?: string;
  readingTime?: string;
  date?: string;
  tag?: string;
  tagEn?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  questionEn?: string;
  answerEn?: string;
  category?: string;
  categoryEn?: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  city: string;
  nameEn?: string;
  addressEn?: string;
  cityEn?: string;
  googleMapsUrl: string;
  phone: string;
  phoneSecondary?: string;
  whatsapp: string;
  workingHours: string;
  workingHoursEn?: string;
  bookingNote?: string;
  bookingNoteEn?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface WebsiteBranding {
  primaryColor: string;
  accentColor: string;
  themeId?: string;
  fontStyle?: 'classic' | 'modern';
}

export interface SEOData {
  metaTitle: string;
  metaDescription: string;
  keywords?: string;
  metaTitleEn?: string;
  metaDescriptionEn?: string;
}

import { DoctorWebsiteConfig } from './builder';

export interface DoctorProfile {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  title: string;
  fullNameEn?: string;
  specialtyEn?: string;
  titleEn?: string;
  photoUrl: string;
  bio: string;
  bioEn?: string;
  qualifications: Qualification[];
  yearsOfExperience?: number;
  clinic: ClinicInfo;
  services: MedicalService[];
  articles: EducationalArticle[];
  faqs: FAQItem[];
  socialMedia: SocialLinks;
  branding: WebsiteBranding;
  seo: SEOData;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  
  // Independent visual website builder configurations
  draftWebsiteConfig?: DoctorWebsiteConfig;
  publishedWebsiteConfig?: DoctorWebsiteConfig;
}

export interface FirebaseConnectionConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}
