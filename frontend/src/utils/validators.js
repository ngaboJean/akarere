// ============================================================
// Frontend Validators - Zod Schemas (Production-Grade)
// Kugenzura amakuru mbere yo kohereza kuri backend
// ============================================================
import { z } from 'zod';

// ── Helpers ─────────────────────────────────────────────────

// Kugenzura indangamuntu y'u Rwanda
const rwandaID = z
  .string()
  .trim()
  .min(16, 'Indangamuntu igomba kuba imibare 16.')
  .max(16, 'Indangamuntu igomba kuba imibare 16 gusa.')
  .regex(/^\d{16}$/, 'Indangamuntu igomba kuba imibare gusa (nta ndangagaciro).')
  .refine(val => val.startsWith('1'), {
    message: "Indangamuntu y'u Rwanda itangira na '1'.",
  });

// Kugenzura telefoni y'u Rwanda
const rwandaPhone = z
  .string()
  .trim()
  .regex(
    /^(\+?250|0)?(7[2-9]\d{7})$/,
    'Nimero ya telefoni ntiyemezwa. Urugero: 0781234567 cyangwa +250781234567'
  );

// Ijambo banga rikomeye
const strongPassword = z
  .string()
  .min(8, 'Ijambo banga rigomba kuba nibura inyuguti 8.')
  .max(128, 'Ijambo banga ni ndende cyane.')
  .regex(/[A-Z]/, 'Ijambo banga rigomba kuba nibura inyuguti nkuru imwe (A-Z).')
  .regex(/[a-z]/, 'Ijambo banga rigomba kuba nibura inyuguti ntoya imwe (a-z).')
  .regex(/\d/,    'Ijambo banga rigomba kuba nibura umubare umwe (0-9).')
  .regex(/[@$!%*?&\-_#]/, 'Ijambo banga rigomba kuba nibura ikimenyetso kimwe kidasanzwe (@$!%*?&-_#).');

// ── AUTH SCHEMAS ─────────────────────────────────────────────

export const registerSchema = z.object({
  indangamuntu: rwandaID,

  telephone: rwandaPhone,

  amazina: z
    .string()
    .trim()
    .min(3, 'Amazina agomba kuba nibura inyuguti 3.')
    .max(100, 'Amazina ni ndende cyane.')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Amazina agomba kuba inyuguti gusa (nta mibare).'),

  ijambo_banga: strongPassword,

  emeza_ijambo_banga: z.string().min(1, 'Emeza ijambo banga.'),

  email: z
    .string()
    .trim()
    .email('Email ntiyemezwa.')
    .max(150, 'Email ni ndende cyane.')
    .optional()
    .or(z.literal('')),

  umudugudu_id: z
    .string()
    .min(1, 'Hitamo Umudugudu wawe.')
    .or(z.number().int().positive()),

  // Cascading selects (required for UX but not sent to API)
  akarere_id:  z.string().min(1, 'Hitamo Akarere.'),
  umurenge_id: z.string().min(1, 'Hitamo Umurenge.'),
  akagari_id:  z.string().min(1, 'Hitamo Akagari.'),
}).refine(data => data.ijambo_banga === data.emeza_ijambo_banga, {
  message: 'Amagambo banga ntahura.',
  path: ['emeza_ijambo_banga'],
});

export const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .min(10, 'Shyiramo indangamuntu (imibare 16) cyangwa telefoni.')
    .max(16, 'Indangamuntu cyangwa telefoni ni ndende cyane.'),

  ijambo_banga: z
    .string()
    .min(1, 'Shyiramo ijambo banga.')
    .max(128, 'Ijambo banga ni ndende cyane.'),
});

export const changePasswordSchema = z.object({
  ijambo_banga_rya_kera: z.string().min(1, 'Shyiramo ijambo banga rya kera.'),

  ijambo_banga_rishya: strongPassword,

  emeza_ijambo_banga_rishya: z.string().min(1, 'Emeza ijambo banga rishya.'),
}).refine(data => data.ijambo_banga_rishya === data.emeza_ijambo_banga_rishya, {
  message: 'Amagambo banga mashya ntahura.',
  path: ['emeza_ijambo_banga_rishya'],
}).refine(data => data.ijambo_banga_rya_kera !== data.ijambo_banga_rishya, {
  message: 'Ijambo banga rishya rigomba gutandukana n\'irya kera.',
  path: ['ijambo_banga_rishya'],
});

// ── NIDA SCHEMA ──────────────────────────────────────────────

export const nidaSchema = z.object({
  indangamuntu: rwandaID,
});

// ── IKIBAZO (ISSUE) SCHEMAS ──────────────────────────────────

const VALID_ICYICIRO = ['umutekano','isuku','imibereho','ibikorwa_remezo','uburezi','ubuzima','ubuhinzi','ibindi'];
const VALID_INTERA   = ['yoroheje','hagati','ikomeye','byihutirwa'];

export const createIssueSchema = z.object({
  umutwe: z
    .string()
    .trim()
    .min(5, 'Umutwe ugomba kuba nibura inyuguti 5.')
    .max(200, 'Umutwe ni mwende cyane (max 200).'),

  ibisobanuro: z
    .string()
    .trim()
    .min(20, 'Ibisobanuro bigomba kuba nibura inyuguti 20.')
    .max(5000, 'Ibisobanuro ni ndende cyane (max 5000).'),

  icyiciro: z
    .enum(VALID_ICYICIRO, { errorMap: () => ({ message: 'Hitamo icyiciro cy\'ikibazo.' }) }),

  intera: z
    .enum(VALID_INTERA)
    .optional()
    .default('yoroheje'),

  latitude: z
    .number()
    .min(-90).max(90)
    .optional()
    .nullable(),

  longitude: z
    .number()
    .min(-180).max(180)
    .optional()
    .nullable(),
});

export const escalateSchema = z.object({
  ibisobanuro: z
    .string()
    .trim()
    .min(10, 'Sobanura impamvu yo gushyira hejuru (nibura inyuguti 10).')
    .max(1000, 'Ibisobanuro ni ndende cyane (max 1000).'),
});

export const resolveSchema = z.object({
  ibisobanuro: z
    .string()
    .trim()
    .min(5, 'Sobanura uko ikibazo gikemutse (nibura inyuguti 5).')
    .max(1000, 'Ibisobanuro ni ndende cyane.'),
});

export const ratingSchema = z.object({
  inyenyeri: z
    .number()
    .int('Inyenyeri zigomba kuba umubare wuzuye.')
    .min(1, 'Inyenyeri zigomba kuba nibura 1.')
    .max(5, 'Inyenyeri ntirengeje 5.'),

  igitekerezo: z
    .string()
    .trim()
    .max(500, 'Igitekerezo ni ndende cyane (max 500).')
    .optional()
    .or(z.literal('')),
});

// ── IMPUSHYA (CERTIFICATE) SCHEMA ───────────────────────────

const VALID_CERT_TYPES = ['indangamuntu','ubutaka','ubuzima','ubuturage','ubukene','ibindi'];

export const createCertSchema = z.object({
  ubwoko: z
    .enum(VALID_CERT_TYPES, { errorMap: () => ({ message: 'Hitamo ubwoko bw\'impushya.' }) }),

  ibisobanuro: z
    .string()
    .trim()
    .max(1000, 'Ibisobanuro ni ndende cyane.')
    .optional()
    .or(z.literal('')),
});

// ── IBIKORWA (PROJECT) SCHEMA ────────────────────────────────

export const createProjectSchema = z.object({
  izina: z
    .string()
    .trim()
    .min(5, 'Izina ry\'umushinga rigomba kuba nibura inyuguti 5.')
    .max(200, 'Izina ni ndende cyane.'),

  ibisobanuro: z
    .string()
    .trim()
    .max(3000, 'Ibisobanuro ni ndende cyane.')
    .optional()
    .or(z.literal('')),

  icyiciro: z
    .enum(['ibikorwa_remezo','uburezi','ubuzima','ubuhinzi','ibindi'])
    .optional()
    .default('ibindi'),

  umurenge_id: z
    .string()
    .optional()
    .or(z.literal('')),

  ingenzi: z
    .string()
    .optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: 'Ingenzi igomba kuba umubare uri hejuru ya 0.',
    }),

  itariki_itangira: z
    .string()
    .optional()
    .or(z.literal('')),

  itariki_irangira: z
    .string()
    .optional()
    .or(z.literal('')),
}).refine(data => {
  if (data.itariki_itangira && data.itariki_irangira) {
    return new Date(data.itariki_irangira) > new Date(data.itariki_itangira);
  }
  return true;
}, {
  message: 'Itariki irangira igomba kuba nyuma y\'itariki itangira.',
  path: ['itariki_irangira'],
});

// ── HELPER: Gukora error message umvikana ───────────────────

export const getFieldError = (errors, fieldName) => {
  if (!errors) return null;
  // Zod errors
  if (errors[fieldName]?.message) return errors[fieldName].message;
  // Express-validator errors (from API)
  if (Array.isArray(errors)) {
    const found = errors.find(e => e.field === fieldName || e.param === fieldName);
    return found?.message || null;
  }
  return null;
};

// ── HELPER: Kugenzura ifoto mbere yo kohereza ───────────────

export const validateFile = (file) => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED  = ['image/jpeg','image/jpg','image/png','application/pdf'];

  if (file.size > MAX_SIZE) {
    return `Ifoto "${file.name}" ni nini cyane. Max: 5MB.`;
  }
  if (!ALLOWED.includes(file.type)) {
    return `Ubwoko bw'ifoto "${file.name}" ntibwemezwa. Emera: JPEG, PNG, PDF.`;
  }
  return null;
};

export const validateFiles = (files) => {
  if (files.length > 5) return 'Amafoto menshi cyane. Max: 5.';
  for (const file of files) {
    const err = validateFile(file);
    if (err) return err;
  }
  return null;
};
