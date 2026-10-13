import { DoctorProfile, FirebaseConnectionConfig } from '../types/doctor';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  limit,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  getIdTokenResult,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

const FIREBASE_CONFIG_KEY = 'doctorbrand_cms_firebase_config_v1';
const ADMIN_SESSION_KEY = 'doctorbrand_cms_admin_session_v1';

export type DatabaseMode = 'local' | 'firestore';

export interface DatabaseStatus {
  mode: DatabaseMode;
  isCloudConnected: boolean;
  message: string;
  config?: FirebaseConnectionConfig | null;
  lastSyncTime?: string;
}

// Global cached Firestore and Auth instance if active
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let currentFirebaseConfig: FirebaseConnectionConfig | null = null;

// Initialize Firebase if config exists in environment or localStorage
export function initFirebaseConfig(): FirebaseConnectionConfig | null {
  try {
    // 1. Check Vite / Vercel Environment Variables
    const envApiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_API_KEY;
    const envProjectId = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_PROJECT_ID;
    if (envApiKey && envProjectId) {
      const envConfig: FirebaseConnectionConfig = {
        apiKey: envApiKey,
        projectId: envProjectId,
        authDomain: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        storageBucket: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
        messagingSenderId: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_APP_ID || '',
      };
      setupFirestoreInstance(envConfig);
      currentFirebaseConfig = envConfig;
      return envConfig;
    }

    // 2. Check LocalStorage configuration saved by admin
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const config = JSON.parse(raw) as FirebaseConnectionConfig;
      if (config.apiKey && config.projectId) {
        setupFirestoreInstance(config);
        currentFirebaseConfig = config;
        return config;
      }
    }
  } catch (e) {
    console.error('Failed reading firebase config', e);
  }
  return null;
}

function setupFirestoreInstance(config: FirebaseConnectionConfig) {
  try {
    const app = getApps().find((candidate) => candidate.options.projectId === config.projectId)
      ?? (getApps().length === 0
        ? initializeApp(config)
        : initializeApp(config, `medframe-${config.projectId}`));
    firestoreInstance = getFirestore(app);
    try {
      authInstance = getAuth(app);
    } catch (authErr) {
      console.warn('Firebase Auth initialize warning', authErr);
      authInstance = null;
    }
    return firestoreInstance;
  } catch (e) {
    console.error('Failed to initialize Firebase instance', e);
    firestoreInstance = null;
    authInstance = null;
    return null;
  }
}

// Initialize on boot
initFirebaseConfig();

async function requireAdmin(): Promise<void> {
  if (!firestoreInstance || !currentFirebaseConfig || !authInstance?.currentUser) {
    throw new Error('يلزم تسجيل الدخول إلى Firebase بحساب مسؤول قبل تعديل البيانات.');
  }
  const token = await getIdTokenResult(authInstance.currentUser);
  if (token.claims.admin !== true) {
    throw new Error('هذا الحساب غير مخول لإدارة بيانات الأطباء.');
  }
}

export type DoctorFetchErrorType =
  | 'not_found'
  | 'not_published'
  | 'permission_denied'
  | 'connection_error'
  | 'firebase_not_configured';

export interface DoctorFetchResult {
  doctor: DoctorProfile | null;
  error?: DoctorFetchErrorType;
  errorMessage?: string;
  source: 'firestore' | 'local';
}

// API methods
export async function getAllDoctors(): Promise<DoctorProfile[]> {
  if (!firestoreInstance || !currentFirebaseConfig) return [];
  const currentUser = authInstance?.currentUser;
  const token = currentUser ? await getIdTokenResult(currentUser) : null;
  const isAdmin = token?.claims.admin === true;
  const doctorsQuery = isAdmin
    ? collection(firestoreInstance, 'doctors')
    : query(collection(firestoreInstance, 'doctors'), where('status', '==', 'published'));
  const snapshot = await getDocs(doctorsQuery);
  return snapshot.docs.map((item) => item.data() as DoctorProfile);
}

/**
 * Diagnostic loader for a doctor by slug or id, returning full diagnostic result
 * Handles public visitor access, draft detection, network error differentiation, and local fallback.
 */
export async function fetchDoctorBySlugWithDiagnosis(slug: string): Promise<DoctorFetchResult> {
  if (!slug) {
    return { doctor: null, error: 'not_found', errorMessage: 'لم يتم تحديد رابط الطبيب', source: 'local' };
  }
  if (!firestoreInstance || !currentFirebaseConfig) {
    return {
      doctor: null,
      error: 'firebase_not_configured',
      errorMessage: 'الموقع غير متصل بقاعدة بيانات Firebase، لذلك لا يمكن عرض صفحات الأطباء.',
      source: 'local',
    };
  }

  let decoded = slug.trim().toLowerCase();
  try {
    decoded = decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    // Keep decoded
  }
  const clean = decoded.replace(/^\/+|\/+$/g, '');
  const cleanWithoutDr = clean.replace(/^(dr[-_]|doctor[-_])/, '');

  const matchesSlug = (docSlug?: string, docId?: string) => {
    if (!docSlug && !docId) return false;
    const s = (docSlug || '').toLowerCase().trim();
    const sWithoutDr = s.replace(/^(dr[-_]|doctor[-_])/, '');
    const id = (docId || '').toLowerCase().trim();

    return (
      s === clean ||
      s === `dr-${clean}` ||
      s === `dr-${cleanWithoutDr}` ||
      sWithoutDr === cleanWithoutDr ||
      id === clean ||
      id === `doc-${clean}` ||
      id === cleanWithoutDr
    );
  };

  const currentUser = authInstance?.currentUser;
  const token = currentUser ? await getIdTokenResult(currentUser) : null;
  const isAdmin = token?.claims.admin === true;

  // 1. Check Cloud Firestore if configured
  if (firestoreInstance && currentFirebaseConfig) {
    try {
      if (isAdmin) {
        // ---------------- ADMIN MODE (Can view published and draft doctors) ----------------
        // A. Direct query by exact slug
        try {
          const q = query(
            collection(firestoreInstance, 'doctors'),
            where('slug', '==', clean),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            return { doctor: snap.docs[0].data() as DoctorProfile, source: 'firestore' };
          }
        } catch (e) {
          console.warn('Admin query by exact slug failed', e);
        }

        // B. Query variation with 'dr-' prefix
        if (clean !== `dr-${cleanWithoutDr}`) {
          try {
            const q = query(
              collection(firestoreInstance, 'doctors'),
              where('slug', '==', `dr-${cleanWithoutDr}`),
              limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              return { doctor: snap.docs[0].data() as DoctorProfile, source: 'firestore' };
            }
          } catch {}
        }

        // C. Direct document get by ID
        try {
          const docRef = doc(firestoreInstance, 'doctors', clean);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { doctor: docSnap.data() as DoctorProfile, source: 'firestore' };
          }
        } catch {}

        // D. Full collection scan for admin
        try {
          const allSnap = await getDocs(collection(firestoreInstance, 'doctors'));
          for (const d of allSnap.docs) {
            const docData = d.data() as DoctorProfile;
            if (matchesSlug(docData.slug, docData.id)) {
              return { doctor: docData, source: 'firestore' };
            }
          }
        } catch {}
      } else {
        // ---------------- PUBLIC VISITOR MODE ----------------
        // Must query with status == 'published' to adhere strictly to Firestore security rules
        const queryAttemptErrors: any[] = [];

        // A. Query published doctor by exact slug
        try {
          const q = query(
            collection(firestoreInstance, 'doctors'),
            where('status', '==', 'published'),
            where('slug', '==', clean),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            return { doctor: snap.docs[0].data() as DoctorProfile, source: 'firestore' };
          }
        } catch (err: any) {
          queryAttemptErrors.push(err);
        }

        // B. Query published doctor with 'dr-' prefix variation
        if (clean !== `dr-${cleanWithoutDr}`) {
          try {
            const q = query(
              collection(firestoreInstance, 'doctors'),
              where('status', '==', 'published'),
              where('slug', '==', `dr-${cleanWithoutDr}`),
              limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              return { doctor: snap.docs[0].data() as DoctorProfile, source: 'firestore' };
            }
          } catch (err: any) {
            queryAttemptErrors.push(err);
          }
        }

        // C. Query all published doctors and match in client
        try {
          const qPublished = query(
            collection(firestoreInstance, 'doctors'),
            where('status', '==', 'published')
          );
          const snapPublished = await getDocs(qPublished);
          for (const d of snapPublished.docs) {
            const docData = d.data() as DoctorProfile;
            if (matchesSlug(docData.slug, docData.id)) {
              return { doctor: docData, source: 'firestore' };
            }
          }
        } catch (err: any) {
          queryAttemptErrors.push(err);
        }

        // D. Try direct getDoc by ID
        try {
          const docRef = doc(firestoreInstance, 'doctors', clean);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const docData = docSnap.data() as DoctorProfile;
            if (docData.status === 'published') {
              return { doctor: docData, source: 'firestore' };
            } else {
              return {
                doctor: null,
                error: 'not_published',
                errorMessage: 'هذا الموقع الطبي في وضع المسودة (Draft) ولم يتم نشره للجمهور بعد من قِبل إدارة النظام.',
                source: 'firestore',
              };
            }
          }
        } catch (err: any) {
          if (err?.code === 'permission-denied') {
            // A permission-denied error on getDoc indicates the document exists but status != 'published'
            return {
              doctor: null,
              error: 'not_published',
              errorMessage: 'الموقع الطبي قيد التجهيز والنشر (مسودة غير منشورة). يرجى نشره من لوحة الإدارة.',
              source: 'firestore',
            };
          }
          queryAttemptErrors.push(err);
        }

        // If any error was permission-denied or network error:
        const hasPermissionDenied = queryAttemptErrors.some(
          (e) => e?.code === 'permission-denied' || String(e?.message).includes('permissions')
        );
        const hasNetworkError = queryAttemptErrors.some(
          (e) => e?.code === 'unavailable' || String(e?.message).includes('network') || String(e?.message).includes('offline')
        );

        if (hasNetworkError) {
          return {
            doctor: null,
            error: 'connection_error',
            errorMessage: 'تعذر الاتصال بقاعدة بيانات Firebase السحابية. يرجى التحقق من اتصال الإنترنت.',
            source: 'firestore',
          };
        }

        if (hasPermissionDenied) {
          return {
            doctor: null,
            error: 'permission_denied',
            errorMessage: 'صلاحيات الوصول مقيدة. تأكد من أن الموقع منشور (Published) في لوحة الإدارة.',
            source: 'firestore',
          };
        }
      }
    } catch (e: any) {
      console.warn('Firestore query by slug error', e);
      if (e?.code === 'unavailable' || String(e?.message).includes('network')) {
        return {
          doctor: null,
          error: 'connection_error',
          errorMessage: 'فشل الاتصال بقاعدة البيانات السحابية.',
          source: 'firestore',
        };
      }
    }
  }

  // Firestore remains authoritative: stale browser caches must never republish
  // an unpublished, deleted, or previously cached doctor profile.
  return {
    doctor: null,
    error: 'not_found',
    errorMessage: `لم يتم العثور على أي طبيب مرتبط بالرابط: /doctors/${slug}`,
    source: 'firestore',
  };
}

export async function getDoctorBySlug(slug: string): Promise<DoctorProfile | null> {
  const result = await fetchDoctorBySlugWithDiagnosis(slug);
  return result.doctor;
}

export async function getDoctorById(id: string): Promise<DoctorProfile | null> {
  if (!firestoreInstance || !currentFirebaseConfig) return null;
  const snapshot = await getDoc(doc(firestoreInstance, 'doctors', id));
  return snapshot.exists() ? snapshot.data() as DoctorProfile : null;
}

export async function saveDoctor(doctor: DoctorProfile): Promise<DoctorProfile> {
  await requireAdmin();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(doctor.id)) {
    throw new Error('معرّف ملف الطبيب غير صالح.');
  }
  if (!doctor.fullName.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doctor.slug)) {
    throw new Error('أدخل اسم الطبيب ورابطاً صالحاً بحروف إنجليزية صغيرة وأرقام وواصلات.');
  }
  if (!['draft', 'pending', 'published'].includes(doctor.status)) {
    throw new Error('حالة النشر غير صالحة.');
  }
  const updatedDoctor: DoctorProfile = {
    ...doctor,
    updatedAt: new Date().toISOString(),
  };

  const docRef = doc(firestoreInstance!, 'doctors', updatedDoctor.id);
  await setDoc(docRef, updatedDoctor);

  return updatedDoctor;
}

export async function deleteDoctor(id: string): Promise<boolean> {
  await requireAdmin();
  await deleteDoc(doc(firestoreInstance!, 'doctors', id));

  return true;
}

export async function duplicateDoctor(id: string): Promise<DoctorProfile> {
  const original = await getDoctorById(id);
  if (!original) {
    throw new Error('الطبيب المطلوب غير موجود');
  }

  // Generate unique slug
  let counter = 1;
  let newSlug = `${original.slug}-copy`;
  const existingDoctors = await getAllDoctors();
  while (existingDoctors.some((d) => d.slug.toLowerCase() === newSlug.toLowerCase())) {
    counter++;
    newSlug = `${original.slug}-copy-${counter}`;
  }

  const newDoctor: DoctorProfile = {
    ...JSON.parse(JSON.stringify(original)),
    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    slug: newSlug,
    fullName: `${original.fullName} (نسخة مكررة)`,
    status: 'draft', // duplicated profiles always start as draft
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveDoctor(newDoctor);
  return newDoctor;
}

export async function exportDoctorsToJson(): Promise<string> {
  const doctors = await getAllDoctors();
  return JSON.stringify(doctors, null, 2);
}

export async function importDoctorsFromJson(jsonStr: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error('الملف المستورد يجب أن يحتوي على مصفوفة بيانات صالحة.');
    }
    // Basic validation
    for (const item of parsed) {
      if (!item.id || !item.slug || !item.fullName) {
        throw new Error('بيانات الطبيب غير مكتملة في الملف المستورد (يجب توفر الاسم والرابط والمعرف).');
      }
    }
    if (parsed.length > 500) throw new Error('لا يمكن استيراد أكثر من 500 ملف في عملية واحدة.');
    await requireAdmin();
    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const item of parsed as DoctorProfile[]) {
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(item.id)
        || !item.fullName?.trim()
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)
        || !['draft', 'pending', 'published'].includes(item.status)) {
        throw new Error('ملف الاستيراد يحتوي على معرّف أو اسم أو رابط أو حالة نشر غير صالحة.');
      }
      if (ids.has(item.id) || slugs.has(item.slug)) throw new Error('ملف الاستيراد يحتوي على معرّف أو رابط مكرر.');
      ids.add(item.id);
      slugs.add(item.slug);
    }
    const batch = writeBatch(firestoreInstance!);
    for (const item of parsed as DoctorProfile[]) {
      batch.set(doc(firestoreInstance!, 'doctors', item.id), item);
    }
    await batch.commit();
    return parsed.length;
  } catch (err) {
    throw new Error('خطأ في استيراد البيانات: ' + (err instanceof Error ? err.message : 'تنسيق غير صالح'));
  }
}

// Database mode verification with strict timeout and diagnostics
export async function testAndSaveFirebaseConfig(
  config: FirebaseConnectionConfig
): Promise<{ success: boolean; message: string; step?: string; fixGuide?: string }> {
  if (!authInstance?.currentUser || authInstance.app.options.projectId !== config.projectId) {
    return {
      success: false,
      step: 'Firebase project mismatch',
      message: 'إعداد Firebase يجب أن يطابق المشروع الذي سجّل المسؤول دخوله إليه.',
      fixGuide: 'استخدم متغيرات البيئة VITE_FIREBASE_* في Vercel للمشروع الحالي، ثم سجّل الدخول بحساب المسؤول من Firebase Authentication الخاص بالمشروع نفسه.',
    };
  }

  try {
    const testApp = getApps().find((candidate) => candidate.options.projectId === config.projectId)
      ?? initializeApp(config, `medframe-${config.projectId}`);
    const testDb = getFirestore(testApp);

    // Timeout promise (7 seconds) to prevent hanging indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT_FIRESTORE_STUCK'));
      }, 7000);
    });

    // A public read verifies connectivity without writing a probe record or
    // requiring a temporary, broadly writable diagnostics collection.
    const readPromise = getDocs(query(
      collection(testDb, 'doctors'),
      where('status', '==', 'published'),
      limit(1),
    ));
    await Promise.race([readPromise, timeoutPromise]);

    // If test write succeeded, save config in localStorage
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    currentFirebaseConfig = config;
    firestoreInstance = testDb;

    return {
      success: true,
      message: 'تم التحقق من اتصال القراءة بمشروع Firebase. لم يتم تغيير أو مزامنة أي سجل.',
    };
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);

    if (errStr.includes('TIMEOUT_FIRESTORE_STUCK')) {
      return {
        success: false,
        step: 'Firestore Database Creation / Connection Hanging',
        message: 'انتهت مهلة الاتصال (Timeout): الخادم علّق ولم يستجب خلال 7 ثوانٍ.',
        fixGuide: 'السبب الشائع: لم يتم إنشاء قاعدة بيانات Cloud Firestore بعد داخل مشروع Firebase Console. انتقل إلى Firebase Console -> Build -> Firestore Database واضغط على "Create database".',
      };
    }

    if (errStr.includes('permission-denied') || errStr.includes('insufficient permissions')) {
      return {
        success: false,
        step: 'Firestore Security Rules',
        message: 'تم رفض الاتصال بسبب قواعد الأمان (Permission Denied).',
        fixGuide: 'قواعد Firestore في الكونسول تمنع الكتابة. افتح Firebase Console -> Firestore Database -> تبويب Rules، والصق محتوى ملف firestore.rules المرفق.',
      };
    }

    if (errStr.includes('failed-precondition') || errStr.includes('not-found') || errStr.includes('Database not found')) {
      return {
        success: false,
        step: 'Firestore Database Not Initialized',
        message: 'قاعدة بيانات Firestore غير موجودة بالمشروع.',
        fixGuide: 'في Firebase Console، افتح Cloud Firestore واضغط على "Create Database" واختر المنطقة الجغرافية (مثل eur3 أو nam5).',
      };
    }

    if (errStr.includes('api-key-not-valid') || errStr.includes('invalid-api-key')) {
      return {
        success: false,
        step: 'Firebase API Key Validation',
        message: 'مفتاح apiKey المدخل غير صالح أو لا ينتمي لهذا المشروع.',
        fixGuide: 'تأكد من نسخ apiKey و projectId من Project Settings -> Web App في Firebase Console.',
      };
    }

    return {
      success: false,
      step: 'General Connection Failure',
      message: `فشل الاتصال: ${errStr}`,
      fixGuide: 'تأكد من تطابق بيانات التكوين وتفعيل Cloud Firestore في وضع الإنتاج أو الاختبار.',
    };
  }
}

export function disconnectFirebase(): void {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
  currentFirebaseConfig = null;
  firestoreInstance = null;
  authInstance = null;
}

export function getDatabaseStatus(): DatabaseStatus {
  if (currentFirebaseConfig && firestoreInstance) {
    return {
      mode: 'firestore',
      isCloudConnected: true,
      message: `متصل بسحابة Firebase Firestore (المشروع: ${currentFirebaseConfig.projectId})`,
      config: currentFirebaseConfig,
    };
  }

  return {
    mode: 'local',
    isCloudConnected: false,
    message: 'Firebase غير متصل. سجّل الدخول إلى مشروع Firebase قبل إدارة ملفات الأطباء.',
    config: null,
  };
}

// ---------------- Admin Authentication Services ----------------

export interface AdminUser {
  email: string;
  uid: string;
  isFirebaseUser: boolean;
}

// Check initial local session if stored
export function getAdminUser(): AdminUser | null {
  // Authorization is resolved asynchronously from Firebase ID token claims by
  // subscribeToAuthChanges. Never trust a browser-stored session as an admin role.
  return null;
}

export function subscribeToAuthChanges(callback: (user: AdminUser | null) => void): () => void {
  if (!authInstance) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(authInstance, async (user) => {
    if (!user) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      callback(null);
      return;
    }

    try {
      const token = await getIdTokenResult(user);
      if (token.claims.admin !== true) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        await signOut(authInstance!);
        callback(null);
        return;
      }

      const admin: AdminUser = {
        email: user.email || 'admin@medframe.studio',
        uid: user.uid,
        isFirebaseUser: true,
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
      callback(admin);
    } catch (error) {
      console.warn('Unable to verify Firebase administrator claim', error);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      callback(null);
    }
  });
}

export async function adminSignIn(email: string, pass: string): Promise<AdminUser> {
  const cleanEmail = email.trim();
  if (!authInstance || !currentFirebaseConfig) {
    throw new Error('إعداد Firebase Authentication مطلوب لتسجيل دخول المسؤول.');
  }

  const credential = await signInWithEmailAndPassword(authInstance, cleanEmail, pass);
  const token = await getIdTokenResult(credential.user);
  if (token.claims.admin !== true) {
    await signOut(authInstance);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    throw new Error('هذا الحساب غير مخول للوصول إلى لوحة الإدارة.');
  }

  const user: AdminUser = {
    email: credential.user.email || cleanEmail,
    uid: credential.user.uid,
    isFirebaseUser: true,
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function adminSignOut(): Promise<void> {
  if (authInstance) {
    try {
      await signOut(authInstance);
    } catch (e) {
      console.warn('Firebase signOut error', e);
    }
  }
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

