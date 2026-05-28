// ============================================================
// VALIDATION SCHEMAS - Production-Grade Input Validation
// Kugenzura amakuru yose ashyirwamo muri sisitemu
// ============================================================
const { body, param, query } = require('express-validator');

// ── Helpers ─────────────────────────────────────────────────

// Kugenzura indangamuntu y'u Rwanda (16 digits, valid structure)
const rwandaIDPattern = /^1(19[5-9]|[2-9]\d{2})\d{12}$/;

// Kugenzura telefoni y'u Rwanda
const rwandaPhonePattern = /^(\+?250|0)?(7[2-9]\d{7})$/;

// Kugenzura email
const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Sanitize: Gukuraho HTML tags zose (XSS prevention)
const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/[<>"'`]/g, '')           // Remove dangerous chars
    .trim();
};

// ── AUTH VALIDATORS ─────────────────────────────────────────

const registerValidator = [
  body('indangamuntu')
    .trim()
    .notEmpty().withMessage('Indangamuntu irakenewe.')
    .matches(/^\d{16}$/).withMessage('Indangamuntu igomba kuba imibare 16 gusa.')
    .custom((val) => {
      // Kugenzura imiterere y'indangamuntu y'u Rwanda
      if (!/^1\d{15}$/.test(val)) {
        throw new Error('Indangamuntu y\'u Rwanda itangira na 1 ikurikirwa n\'imibare 15.');
      }
      return true;
    }),

  body('telephone')
    .trim()
    .notEmpty().withMessage('Telefoni irakenewe.')
    .custom((val) => {
      const cleaned = val.replace(/[\s\-]/g, '');
      if (!rwandaPhonePattern.test(cleaned)) {
        throw new Error('Nimero ya telefoni y\'u Rwanda ntiyemezwa. Urugero: 0781234567 cyangwa +250781234567');
      }
      return true;
    }),

  body('amazina')
    .trim()
    .notEmpty().withMessage('Amazina arakenewe.')
    .isLength({ min: 3, max: 100 }).withMessage('Amazina agomba kuba hagati ya 3 na 100 inyuguti.')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage('Amazina agomba kuba inyuguti gusa (nta mibare).')
    .customSanitizer(sanitizeText),

  body('ijambo_banga')
    .notEmpty().withMessage('Ijambo banga irakenewe.')
    .isLength({ min: 8, max: 128 }).withMessage('Ijambo banga rigomba kuba hagati ya 8 na 128 inyuguti.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_#])[A-Za-z\d@$!%*?&\-_#]{8,}$/)
    .withMessage('Ijambo banga rigomba kuba: inyuguti nkuru (A-Z), inyuguti ntoya (a-z), umubare (0-9), n\'ikimenyetso kidasanzwe (@$!%*?&).'),

  body('emeza_ijambo_banga')
    .notEmpty().withMessage('Emeza ijambo banga.')
    .custom((value, { req }) => {
      if (value !== req.body.ijambo_banga) {
        throw new Error('Amagambo banga ntahura.');
      }
      return true;
    }),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Email ntiyemezwa.')
    .isLength({ max: 150 }).withMessage('Email ni ndende cyane.')
    .normalizeEmail()
    .customSanitizer(sanitizeText),

  body('umudugudu_id')
    .notEmpty().withMessage('Hitamo Umudugudu wawe.')
    .isInt({ min: 1 }).withMessage('Umudugudu ntiyemezwa.')
    .toInt(),
];

const loginValidator = [
  body('login')
    .trim()
    .notEmpty().withMessage('Shyiramo indangamuntu cyangwa telefoni.')
    .isLength({ min: 10, max: 16 }).withMessage('Indangamuntu cyangwa telefoni ntiyemezwa.')
    .customSanitizer(sanitizeText),

  body('ijambo_banga')
    .notEmpty().withMessage('Shyiramo ijambo banga.')
    .isLength({ min: 1, max: 128 }).withMessage('Ijambo banga ni ndende cyane.'),
];

const changePasswordValidator = [
  body('ijambo_banga_rya_kera')
    .notEmpty().withMessage('Shyiramo ijambo banga rya kera.'),

  body('ijambo_banga_rishya')
    .notEmpty().withMessage('Shyiramo ijambo banga rishya.')
    .isLength({ min: 8, max: 128 }).withMessage('Ijambo banga rigomba kuba nibura inyuguti 8.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_#])[A-Za-z\d@$!%*?&\-_#]{8,}$/)
    .withMessage('Ijambo banga rigomba kuba: inyuguti nkuru, ntoya, umubare, n\'ikimenyetso kidasanzwe.')
    .custom((val, { req }) => {
      if (val === req.body.ijambo_banga_rya_kera) {
        throw new Error('Ijambo banga rishya rigomba gutandukana n\'irya kera.');
      }
      return true;
    }),

  body('emeza_ijambo_banga')
    .notEmpty().withMessage('Emeza ijambo banga rishya.')
    .custom((val, { req }) => {
      if (val !== req.body.ijambo_banga_rishya) {
        throw new Error('Amagambo banga mashya ntahura.');
      }
      return true;
    }),
];

// ── NIDA VALIDATOR ──────────────────────────────────────────

const nidaValidator = [
  body('indangamuntu')
    .trim()
    .notEmpty().withMessage('Indangamuntu irakenewe.')
    .matches(/^\d{16}$/).withMessage('Indangamuntu igomba kuba imibare 16 gusa.')
    .custom((val) => {
      if (!/^1\d{15}$/.test(val)) {
        throw new Error('Indangamuntu y\'u Rwanda itangira na 1.');
      }
      // Kugenzura umubare w'umwaka (digits 2-5 = birth year range)
      const yearPart = parseInt(val.substring(1, 5));
      const currentYear = new Date().getFullYear();
      if (yearPart < 1900 || yearPart > currentYear) {
        throw new Error('Indangamuntu irimo umwaka utemewe.');
      }
      return true;
    }),
];

// ── IKIBAZO (ISSUE) VALIDATORS ──────────────────────────────

const VALID_ICYICIRO = ['umutekano','isuku','imibereho','ibikorwa_remezo','uburezi','ubuzima','ubuhinzi','ibindi'];
const VALID_INTERA   = ['yoroheje','hagati','ikomeye','byihutirwa'];
const VALID_STATUS   = ['gutegereza','mu_gikorwa','yashyizwe_hejuru','yemejwe','yanzwe','ifunzwe'];

const createIssueValidator = [
  body('umutwe')
    .trim()
    .notEmpty().withMessage('Umutwe w\'ikibazo urakenewe.')
    .isLength({ min: 5, max: 200 }).withMessage('Umutwe ugomba kuba hagati ya 5 na 200 inyuguti.')
    .customSanitizer(sanitizeText),

  body('ibisobanuro')
    .trim()
    .notEmpty().withMessage('Ibisobanuro birakenewe.')
    .isLength({ min: 20, max: 5000 }).withMessage('Ibisobanuro bigomba kuba hagati ya 20 na 5000 inyuguti.')
    .customSanitizer(sanitizeText),

  body('icyiciro')
    .notEmpty().withMessage('Icyiciro cy\'ikibazo kirakenewe.')
    .isIn(VALID_ICYICIRO).withMessage(`Icyiciro ntiyemezwa. Hitamo muri: ${VALID_ICYICIRO.join(', ')}`),

  body('intera')
    .optional()
    .isIn(VALID_INTERA).withMessage(`Intera ntiyemezwa. Hitamo muri: ${VALID_INTERA.join(', ')}`),

  body('latitude')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude ntiyemezwa.')
    .toFloat(),

  body('longitude')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude ntiyemezwa.')
    .toFloat(),
];

const escalateValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID y\'ikibazo ntiyemezwa.')
    .toInt(),

  body('ibisobanuro')
    .trim()
    .notEmpty().withMessage('Sobanura impamvu yo gushyira hejuru.')
    .isLength({ min: 10, max: 1000 }).withMessage('Ibisobanuro bigomba kuba hagati ya 10 na 1000 inyuguti.')
    .customSanitizer(sanitizeText),
];

const resolveValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID y\'ikibazo ntiyemezwa.')
    .toInt(),

  body('ibisobanuro')
    .trim()
    .notEmpty().withMessage('Sobanura uko ikibazo gikemutse.')
    .isLength({ min: 5, max: 1000 }).withMessage('Ibisobanuro bigomba kuba hagati ya 5 na 1000 inyuguti.')
    .customSanitizer(sanitizeText),
];

const ratingValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID y\'ikibazo ntiyemezwa.')
    .toInt(),

  body('inyenyeri')
    .notEmpty().withMessage('Inyenyeri zirakenewe.')
    .isInt({ min: 1, max: 5 }).withMessage('Inyenyeri zigomba kuba hagati ya 1 na 5.')
    .toInt(),

  body('igitekerezo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Igitekerezo ni ndende cyane (max 500).')
    .customSanitizer(sanitizeText),
];

const messageValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID y\'ikibazo ntiyemezwa.')
    .toInt(),

  body('ubutumwa')
    .trim()
    .notEmpty().withMessage('Ubutumwa burakenewe.')
    .isLength({ min: 2, max: 2000 }).withMessage('Ubutumwa bugomba kuba hagati ya 2 na 2000 inyuguti.')
    .customSanitizer(sanitizeText),
];

const listIssuesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page igomba kuba umubare uri hejuru ya 0.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit igomba kuba hagati ya 1 na 100.')
    .toInt(),

  query('status')
    .optional()
    .isIn(VALID_STATUS).withMessage('Status ntiyemezwa.'),

  query('icyiciro')
    .optional()
    .isIn(VALID_ICYICIRO).withMessage('Icyiciro ntiyemezwa.'),
];

// ── IMPUSHYA (CERTIFICATE) VALIDATORS ──────────────────────

const VALID_CERT_TYPES = ['indangamuntu','ubutaka','ubuzima','ubuturage','ubukene','ibindi'];

const createCertValidator = [
  body('ubwoko')
    .notEmpty().withMessage('Ubwoko bw\'impushya burakenewe.')
    .isIn(VALID_CERT_TYPES).withMessage(`Ubwoko ntibwemezwa. Hitamo muri: ${VALID_CERT_TYPES.join(', ')}`),

  body('ibisobanuro')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Ibisobanuro ni ndende cyane (max 1000).')
    .customSanitizer(sanitizeText),
];

// ── IBIKORWA (PROJECTS) VALIDATORS ─────────────────────────

const VALID_PROJECT_STATUS   = ['gutegurwa','mu_gikorwa','byarangiye','byahagaritswe'];
const VALID_PROJECT_ICYICIRO = ['ibikorwa_remezo','uburezi','ubuzima','ubuhinzi','ibindi'];

const createProjectValidator = [
  body('izina')
    .trim()
    .notEmpty().withMessage('Izina ry\'umushinga irakenewe.')
    .isLength({ min: 5, max: 200 }).withMessage('Izina rigomba kuba hagati ya 5 na 200 inyuguti.')
    .customSanitizer(sanitizeText),

  body('ibisobanuro')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 3000 }).withMessage('Ibisobanuro ni ndende cyane.')
    .customSanitizer(sanitizeText),

  body('icyiciro')
    .optional()
    .isIn(VALID_PROJECT_ICYICIRO).withMessage('Icyiciro ntiyemezwa.'),

  body('umurenge_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Umurenge ntiyemezwa.')
    .toInt(),

  body('ingenzi')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 999999999999 }).withMessage('Ingenzi ntiyemezwa.')
    .toFloat(),

  body('itariki_itangira')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Itariki itangira ntiyemezwa (YYYY-MM-DD).'),

  body('itariki_irangira')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Itariki irangira ntiyemezwa (YYYY-MM-DD).')
    .custom((val, { req }) => {
      if (req.body.itariki_itangira && val <= req.body.itariki_itangira) {
        throw new Error('Itariki irangira igomba kuba nyuma y\'itariki itangira.');
      }
      return true;
    }),
];

const updateProgressValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID y\'umushinga ntiyemezwa.')
    .toInt(),

  body('aho_bigeze')
    .notEmpty().withMessage('Aho bigeze birakenewe.')
    .isInt({ min: 0, max: 100 }).withMessage('Aho bigeze bigomba kuba hagati ya 0 na 100.')
    .toInt(),

  body('status')
    .notEmpty().withMessage('Status irakenewe.')
    .isIn(VALID_PROJECT_STATUS).withMessage('Status ntiyemezwa.'),
];

// ── USER MANAGEMENT VALIDATORS ──────────────────────────────

const updateUserStatusValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID y\'umukoresha ntiyemezwa.')
    .toInt(),

  body('status')
    .notEmpty().withMessage('Status irakenewe.')
    .isIn(['active','inactive','suspended']).withMessage('Status ntiyemezwa.'),
];

const updateUserRoleValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID y\'umukoresha ntiyemezwa.')
    .toInt(),

  body('role_id')
    .notEmpty().withMessage('Uruhare rurakenewe.')
    .isInt({ min: 1, max: 5 }).withMessage('Uruhare ntirwemezwa.')
    .toInt(),
];

// ── PARAM VALIDATORS ────────────────────────────────────────

const idParamValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID ntiyemezwa.')
    .toInt(),
];

// ── USSD VALIDATOR ─────────────────────────────────────────
const ussdValidator = [
  body('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID irakenewe.'),

  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Nimero ya telefoni irakenewe.')
    .custom((val) => {
      const cleaned = val.replace(/[\s\-]/g, '');
      if (!rwandaPhonePattern.test(cleaned)) {
        throw new Error('Nimero ya telefoni y\'u Rwanda ntiyemezwa.');
      }
      return true;
    }),

  body('text')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage('Ibyanditse mu USSD bigomba kuba umwandiko.')
    .customSanitizer(sanitizeText),
];

module.exports = {
  // Auth
  registerValidator,
  loginValidator,
  changePasswordValidator,
  // NIDA
  nidaValidator,
  ussdValidator,
  // Issues
  createIssueValidator,
  escalateValidator,
  resolveValidator,
  ratingValidator,
  messageValidator,
  listIssuesValidator,
  // Certificates
  createCertValidator,
  // Projects
  createProjectValidator,
  updateProgressValidator,
  // Users
  updateUserStatusValidator,
  updateUserRoleValidator,
  // Generic
  idParamValidator,
};
