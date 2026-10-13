import { DoctorProfile } from '../types/doctor';
import { DoctorWebsiteConfig, WebsiteSection, SectionType } from '../types/builder';

/**
 * Creates a default, fully-populated DoctorWebsiteConfig for any doctor profile.
 * Automatically synchronizes with the doctor's existing credentials and clinic data.
 */
export function createDefaultWebsiteConfig(doctor: DoctorProfile): DoctorWebsiteConfig {
  const primaryColor = doctor.branding?.primaryColor || '#0F2A4A';
  const accentColor = doctor.branding?.accentColor || '#0D9488';

  const sections: WebsiteSection[] = [
    // 1. HERO SECTION
    {
      id: 'sec-hero',
      type: 'hero',
      name: 'مقدمة البطل والتعريف الرئيسي',
      nameEn: 'Hero & Primary Introduction',
      isVisible: true,
      content: {
        title: doctor.fullName,
        titleEn: doctor.fullNameEn || doctor.fullName,
        subtitle: doctor.title,
        subtitleEn: doctor.titleEn || doctor.title,
        badge: doctor.specialty,
        badgeEn: doctor.specialtyEn || doctor.specialty,
        body: doctor.bio,
        bodyEn: doctor.bioEn || doctor.bio,
        imageUrl: doctor.photoUrl,
        primaryButtonText: 'حجز موعد عبر واتساب',
        primaryButtonTextEn: 'Book via WhatsApp',
        primaryButtonAction: 'whatsapp',
        secondaryButtonText: 'اتصال بالعيادة',
        secondaryButtonTextEn: 'Call Clinic',
        secondaryButtonAction: 'call',
        imageShape: 'rounded',
      },
      style: {
        backgroundColor: '#FFFFFF',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 600,
        delayMs: 100,
      },
    },

    // 2. ABOUT THE DOCTOR
    {
      id: 'sec-about',
      type: 'about',
      name: 'عن الطبيب والفلسفة العلاجية',
      nameEn: 'About Doctor & Medical Philosophy',
      isVisible: true,
      content: {
        title: 'الرؤية والنهج الطبي',
        titleEn: 'Medical Vision & Clinical Approach',
        subtitle: `رعاية متقدمة تتمحور حول صحة وسلامة المريض بأعلى المعايير`,
        subtitleEn: 'Comprehensive patient-centered care adhering to international standards',
        body: doctor.bio || 'طبيب استشاري متخصص يهدف إلى تقديم أرقى مستويات الرعاية والتشخيص الدقيق بأحدث التقنيات.',
        bodyEn: doctor.bioEn || doctor.bio,
        badge: 'عن الطبيب',
        badgeEn: 'About the Doctor',
        imageUrl: doctor.photoUrl,
        primaryButtonText: 'معرفة المزيد عن الخدمات',
        primaryButtonTextEn: 'Explore Medical Services',
        primaryButtonAction: 'scroll',
        primaryButtonUrl: '#sec-services',
        imageShape: 'shadowed',
      },
      style: {
        backgroundColor: '#F8FAFC',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 150,
      },
    },

    // 3. QUALIFICATIONS & EXPERIENCE
    {
      id: 'sec-qualifications',
      type: 'qualifications',
      name: 'المؤهلات العلمية والزمالات',
      nameEn: 'Qualifications & Fellowships',
      isVisible: true,
      content: {
        title: 'المؤهلات العلمية والزمالات المعتمدة',
        titleEn: 'Accredited Qualifications & Fellowships',
        subtitle: 'سجل أكاديمي ومهني موثق ومعتمد لدى نقابة الأطباء والمجالس الطبية العليا',
        subtitleEn: 'Officially verified academic credentials and specialty medical boards',
        badge: 'اعتماد رسمي',
        badgeEn: 'Official Accreditation',
      },
      style: {
        backgroundColor: '#FFFFFF',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 100,
      },
    },

    // 4. WHY CHOOSE THIS DOCTOR
    {
      id: 'sec-why-choose',
      type: 'why_choose_us',
      name: 'لماذا يختار المرضى عيادتنا؟',
      nameEn: 'Why Patients Choose Us',
      isVisible: true,
      content: {
        title: 'لماذا تثق في رعايتنا الطبية؟',
        titleEn: 'Why Trust Our Medical Care?',
        subtitle: 'معايير سريرية دقيقة تجمع بين الخبرة العميقة وأحدث البروتوكولات العلاجية',
        subtitleEn: 'Clinical excellence combining decades of experience with global therapeutic protocols',
        badge: 'التميز الطبي',
        badgeEn: 'Clinical Excellence',
        features: [
          {
            id: 'feat-1',
            title: 'خبرة سريرية موثقة ومعتمدة',
            titleEn: 'Certified Clinical Expertise',
            description: `أكثر من ${doctor.yearsOfExperience || 15} عاماً من الممارسة والعمل في كبرى المراكز الطبية والمستشفيات الجامعية.`,
            descriptionEn: `Over ${doctor.yearsOfExperience || 15} years of clinical practice in top academic university hospitals.`,
            icon: 'Award',
          },
          {
            id: 'feat-2',
            title: 'بروتوكولات علاجية شخصية',
            titleEn: 'Tailored Treatment Protocols',
            description: 'وضع خطة علاجية مخصصة لكل مريض تراعي تاريخه الصحي الدقيق لضمان أفضل نسب شفاء.',
            descriptionEn: 'Customized patient care plans accounting for precise clinical history for optimal recovery.',
            icon: 'CheckCircle2',
          },
          {
            id: 'feat-3',
            title: 'تجهيزات وتشخيص فائق الدقة',
            titleEn: 'Advanced Precision Diagnostics',
            description: 'الاعتماد على أحدث أجهزة الفحص والتقنيات التداخلية الدقيقة التي تضمن راحة المريض وسلامته.',
            descriptionEn: 'State-of-the-art diagnostic imaging and micro-interventional equipment.',
            icon: 'ShieldCheck',
          },
          {
            id: 'feat-4',
            title: 'متابعة مستمرة وتواصل مباشر',
            titleEn: 'Ongoing Patient Follow-up',
            description: 'قنوات متابعة مرنة وفريق تمريضي متعاون لمرافقة المريض خطوة بخطوة أثناء مراحل الشفاء.',
            descriptionEn: 'Dedicated communication channels to support patients throughout their rehabilitation.',
            icon: 'Clock',
          },
        ],
      },
      style: {
        backgroundColor: '#F8FAFC',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 150,
      },
    },

    // 5. SERVICES SECTION
    {
      id: 'sec-services',
      type: 'services',
      name: 'الخدمات والعلاجات الطبية',
      nameEn: 'Medical Services & Treatments',
      isVisible: true,
      content: {
        title: 'الخدمات والعلاجات الطبية المتخصصة',
        titleEn: 'Specialized Medical Services & Treatments',
        subtitle: 'تشخيص دقيق، استشارات متعمقة، ورعاية جراحية وتدخلية بأحدث التقنيات',
        subtitleEn: 'Precise diagnostics, clinical consultations, and state-of-the-art operative interventions',
        badge: 'خدمات العيادة',
        badgeEn: 'Clinic Services',
      },
      style: {
        backgroundColor: '#FFFFFF',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 100,
      },
    },

    // 6. CLINIC GALLERY
    {
      id: 'sec-gallery',
      type: 'clinic_gallery',
      name: 'معرض صور العيادة والتجهيزات',
      nameEn: 'Clinic & Facilities Gallery',
      isVisible: true,
      content: {
        title: 'جولة داخل العيادة',
        titleEn: 'Inside the Clinic',
        subtitle: 'بيئة طبية مريحة ومعقمة مجهزة بأحدث الوسائل التكنولوجية لاستقبال المرضى',
        subtitleEn: 'A comfortable, sterile clinical environment equipped with modern medical amenities',
        badge: 'بيئة الرعاية',
        badgeEn: 'Clinical Environment',
        gallery: [
          {
            id: 'gal-1',
            url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
            caption: 'غرفة الفحص والاستشارات السريرية المجهزة بالكامل',
            captionEn: 'Fully equipped clinical consultation room',
          },
          {
            id: 'gal-2',
            url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
            caption: 'صالة الاستقبال وغرفة انتظار المرضى المريحة',
            captionEn: 'Comfortable reception & patient lounge',
          },
          {
            id: 'gal-3',
            url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
            caption: 'أحدث أجهزة التشخيص ورسم القلب التداخلي',
            captionEn: 'Advanced non-invasive diagnostic equipment',
          },
        ],
      },
      style: {
        backgroundColor: '#F8FAFC',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 150,
      },
    },

    // 7. EDUCATIONAL ARTICLES
    {
      id: 'sec-articles',
      type: 'articles',
      name: 'المقالات والتوعية الطبية',
      nameEn: 'Medical Articles & Insights',
      isVisible: true,
      content: {
        title: 'المقالات والتوعية الصحية',
        titleEn: 'Medical Insights & Patient Education',
        subtitle: 'إرشادات ونصائح صحية مبسطة كتبها الدكتور لتعزيز وعي المرضى',
        subtitleEn: 'Evidence-based health guidance written directly to empower patient awareness',
        badge: 'توعية طبية',
        badgeEn: 'Health Awareness',
      },
      style: {
        backgroundColor: '#FFFFFF',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 100,
      },
    },

    // 8. FAQS
    {
      id: 'sec-faqs',
      type: 'faqs',
      name: 'الأسئلة الشائعة وإجاباتها',
      nameEn: 'Frequently Asked Questions',
      isVisible: true,
      content: {
        title: 'الأسئلة الطبية الشائعة',
        titleEn: 'Frequently Asked Questions',
        subtitle: 'إجابات واضحة ومباشرة عن أبرز التساؤلات قبل زيارة العيادة أو حجز الموعد',
        subtitleEn: 'Clear answers to frequent clinical inquiries before scheduling your visit',
        badge: 'إجابات مباشرة',
        badgeEn: 'Direct Answers',
      },
      style: {
        backgroundColor: '#F8FAFC',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 100,
      },
    },

    // 9. LOCATION & HOURS
    {
      id: 'sec-location',
      type: 'location_hours',
      name: 'مقر العيادة ومواعيد العمل',
      nameEn: 'Location & Operating Hours',
      isVisible: true,
      content: {
        title: 'مقر العيادة ومواعيد العمل',
        titleEn: 'Clinic Location & Operating Hours',
        subtitle: 'سهولة الوصول، مواعيد عمل منتظمة، وحجز مسبق لتجنب أوقات الانتظار',
        subtitleEn: 'Convenient access, structured hours, and prior scheduling to minimize wait times',
        badge: 'العنوان والمواعيد',
        badgeEn: 'Location & Schedule',
      },
      style: {
        backgroundColor: '#FFFFFF',
        paddingTop: 'medium',
        paddingBottom: 'medium',
        alignment: 'right',
        showDivider: true,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 500,
        delayMs: 100,
      },
    },

    // 10. CONTACT SECTION
    {
      id: 'sec-contact',
      type: 'contact',
      name: 'قسم التواصل السريع والحجز',
      nameEn: 'Quick Booking & Contact',
      isVisible: true,
      content: {
        title: 'احجز موعدك الآن بكل سهولة',
        titleEn: 'Schedule Your Appointment Today',
        subtitle: 'تواصل مباشرة عبر واتساب لتأكيد موعد الكشف أو للاستفسار عن التحضيرات المطلوبة',
        subtitleEn: 'Reach out via WhatsApp or direct phone to confirm your consultation schedule',
        badge: 'تواصل مباشر',
        badgeEn: 'Direct Contact',
        primaryButtonText: 'حجز موعد عبر واتساب',
        primaryButtonTextEn: 'Book via WhatsApp',
        primaryButtonAction: 'whatsapp',
        secondaryButtonText: 'اتصال هاتفي بالعيادة',
        secondaryButtonTextEn: 'Direct Phone Call',
        secondaryButtonAction: 'call',
      },
      style: {
        backgroundColor: '#F8FAFC',
        paddingTop: 'large',
        paddingBottom: 'large',
        alignment: 'center',
        showDivider: false,
      },
      animation: {
        enabled: true,
        style: 'fade-up',
        durationMs: 600,
        delayMs: 100,
      },
    },
  ];

  return {
    version: 1,
    theme: {
      presetId: 'elegant-medical',
      primaryColor: primaryColor,
      accentColor: accentColor,
      lightBg: '#F8FAFC',
      cardBg: '#FFFFFF',
      textColor: '#0F172A',
      fontFamily: 'cairo',
      buttonRadius: 'medium',
      headerSticky: true,
      showLanguageSwitcher: true,
      enableGlobalAnimations: true,
      animationSpeed: 'normal',
    },
    sections,
    header: {
      showLogo: true,
      showPhoneButton: true,
      showWhatsAppButton: true,
    },
    floatingWhatsApp: {
      enabled: true,
      position: 'bottom-left',
      showPulseAnimation: true,
      customLabel: 'تواصل مع الطبيب',
      customLabelEn: 'Chat with Doctor',
    },
    footer: {
      showMedicalDisclaimer: true,
    },
    seo: {
      metaTitle: doctor.seo?.metaTitle || `${doctor.fullName} | ${doctor.specialty}`,
      metaTitleEn: doctor.seo?.metaTitleEn || `${doctor.fullNameEn || doctor.fullName} | ${doctor.specialtyEn || doctor.specialty}`,
      metaDescription: doctor.seo?.metaDescription || doctor.bio?.slice(0, 160),
      metaDescriptionEn: doctor.seo?.metaDescriptionEn || doctor.bioEn?.slice(0, 160),
      keywords: doctor.seo?.keywords,
    },
  };
}

/**
 * Creates a new blank section of a specific SectionType from the section library.
 */
export function createNewSection(type: SectionType, doctor: DoctorProfile): WebsiteSection {
  const timestamp = Date.now();
  const id = `sec-${type}-${timestamp}`;

  switch (type) {
    case 'hero':
      return {
        id,
        type: 'hero',
        name: 'مقدمة البطل والتعريف الرئيسي',
        nameEn: 'Hero Section',
        isVisible: true,
        content: {
          title: doctor.fullName,
          titleEn: doctor.fullNameEn || doctor.fullName,
          subtitle: doctor.title,
          subtitleEn: doctor.titleEn || doctor.title,
          badge: doctor.specialty,
          badgeEn: doctor.specialtyEn || doctor.specialty,
          body: doctor.bio,
          bodyEn: doctor.bioEn || doctor.bio,
          imageUrl: doctor.photoUrl,
          primaryButtonText: 'حجز موعد عبر واتساب',
          primaryButtonTextEn: 'Book via WhatsApp',
          primaryButtonAction: 'whatsapp',
          secondaryButtonText: 'اتصال بالعيادة',
          secondaryButtonTextEn: 'Call Clinic',
          secondaryButtonAction: 'call',
        },
        style: {
          backgroundColor: '#FFFFFF',
          paddingTop: 'medium',
          paddingBottom: 'medium',
          alignment: 'right',
          showDivider: true,
        },
        animation: {
          enabled: true,
          style: 'fade-up',
          durationMs: 500,
          delayMs: 100,
        },
      };

    case 'why_choose_us':
      return {
        id,
        type: 'why_choose_us',
        name: 'لماذا يختار المرضى عيادتنا؟',
        nameEn: 'Why Choose Us',
        isVisible: true,
        content: {
          title: 'لماذا تثق في رعايتنا الطبية؟',
          titleEn: 'Why Trust Our Clinical Care?',
          subtitle: 'معايير سريرية دقيقة تجمع بين الخبرة العميقة وأحدث البروتوكولات العلاجية',
          subtitleEn: 'Clinical excellence combining proven expertise and patient-centric care',
          badge: 'التميز الطبي',
          badgeEn: 'Excellence',
          features: [
            {
              id: `f-${timestamp}-1`,
              title: 'خبرة سريرية معتمدة',
              titleEn: 'Certified Clinical Expertise',
              description: 'سجل حافل بالنجاحات الطبية والعمليات الجراحية الدقيقة بأعلى نسب الأمان.',
              descriptionEn: 'Proven track record of procedural safety and surgical precision.',
              icon: 'Award',
            },
            {
              id: `f-${timestamp}-2`,
              title: 'أحدث التجهيزات الدقيقة',
              titleEn: 'Modern Clinical Equipment',
              description: 'تجهيزات متكاملة تواكب أحدث المستجدات العالمية في التشخيص والرعاية.',
              descriptionEn: 'Modern facilities aligned with international healthcare standards.',
              icon: 'ShieldCheck',
            },
          ],
        },
        style: {
          backgroundColor: '#F8FAFC',
          paddingTop: 'medium',
          paddingBottom: 'medium',
          alignment: 'right',
          showDivider: true,
        },
        animation: {
          enabled: true,
          style: 'fade-up',
          durationMs: 500,
          delayMs: 100,
        },
      };

    case 'clinic_gallery':
      return {
        id,
        type: 'clinic_gallery',
        name: 'معرض صور العيادة والتجهيزات',
        nameEn: 'Clinic Gallery',
        isVisible: true,
        content: {
          title: 'معرض صور العيادة',
          titleEn: 'Clinic Photo Gallery',
          subtitle: 'صور واقعية للعيادة وقاعات الفحص والاستقبال المجهزة',
          subtitleEn: 'Photographs of consultation rooms and patient amenities',
          badge: 'معرض الصور',
          badgeEn: 'Photo Gallery',
          gallery: [
            {
              id: `g-${timestamp}-1`,
              url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
              caption: 'غرفة الفحص والاستشارات السريرية',
              captionEn: 'Clinical examination room',
            },
            {
              id: `g-${timestamp}-2`,
              url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
              caption: 'صالة الاستقبال وغرفة انتظار المرضى',
              captionEn: 'Reception and patient waiting lounge',
            },
          ],
        },
        style: {
          backgroundColor: '#F8FAFC',
          paddingTop: 'medium',
          paddingBottom: 'medium',
          alignment: 'right',
          showDivider: true,
        },
        animation: {
          enabled: true,
          style: 'fade-up',
          durationMs: 500,
          delayMs: 100,
        },
      };

    case 'testimonials':
      return {
        id,
        type: 'testimonials',
        name: 'تجارب المرضى الموثقة بإقرار رسمي',
        nameEn: 'Verified Patient Testimonials',
        isVisible: true,
        content: {
          title: 'تجارب المرضى المعتمدة',
          titleEn: 'Authorized Patient Experiences',
          subtitle: 'شهادات وتجارب حقيقية ومصرح بنشرها كتابياً وبموافقة صريحة من المرضى',
          subtitleEn: 'Authentic testimonials published exclusively with written patient consent',
          badge: 'تجارب موثقة',
          badgeEn: 'Verified Reviews',
          testimonials: [
            {
              id: `t-${timestamp}-1`,
              patientName: 'أ. م. (مريض مسجل)',
              patientNameEn: 'Patient A. M.',
              feedback: 'تجربة علاجية ممتازة واهتمام فائق بالتفاصيل والمتابعة السريرية المستمرة طوال فترة التعافي.',
              feedbackEn: 'Outstanding medical care and dedicated clinical follow-up throughout my entire recovery.',
              treatmentTag: 'متابعة سريرية',
              date: 'أكتوبر 2026',
              verifiedConsent: true,
            },
          ],
        },
        style: {
          backgroundColor: '#FFFFFF',
          paddingTop: 'medium',
          paddingBottom: 'medium',
          alignment: 'right',
          showDivider: true,
        },
        animation: {
          enabled: true,
          style: 'fade-up',
          durationMs: 500,
          delayMs: 100,
        },
      };

    case 'custom_block':
      return {
        id,
        type: 'custom_block',
        name: 'كتلة نص وصورة مخصصة',
        nameEn: 'Custom Text & Image Block',
        isVisible: true,
        content: {
          title: 'عنوان القسم المخصص',
          titleEn: 'Custom Section Heading',
          subtitle: 'وصف تمهيدي للقسم',
          subtitleEn: 'Introductory description for this block',
          body: 'أدخل أي نصوص أو تفاصيل خاصة بطبيعة عمل العيادة هنا بكل سهولة.',
          bodyEn: 'Add any specific clinical notes or information here.',
          imageUrl: doctor.photoUrl,
          primaryButtonText: 'تواصل معنا',
          primaryButtonTextEn: 'Contact Us',
          primaryButtonAction: 'whatsapp',
        },
        style: {
          backgroundColor: '#FFFFFF',
          paddingTop: 'medium',
          paddingBottom: 'medium',
          alignment: 'right',
          showDivider: true,
        },
        animation: {
          enabled: true,
          style: 'fade-up',
          durationMs: 500,
          delayMs: 100,
        },
      };

    default:
      return {
        id,
        type,
        name: `قسم ${type}`,
        nameEn: `Section ${type}`,
        isVisible: true,
        content: {
          title: `عنوان قسم ${type}`,
          titleEn: `Title for ${type}`,
          subtitle: 'وصف تعريفي إضافي',
          subtitleEn: 'Additional description',
        },
        style: {
          backgroundColor: '#FFFFFF',
          paddingTop: 'medium',
          paddingBottom: 'medium',
          alignment: 'right',
          showDivider: true,
        },
        animation: {
          enabled: true,
          style: 'fade-up',
          durationMs: 500,
          delayMs: 100,
        },
      };
  }
}
