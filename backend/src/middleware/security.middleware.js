// ============================================================
// Security Middleware - Production Security Layers
// Kurinda sisitemu mu bikorwa nyakuri
// ============================================================
const rateLimit = require('express-rate-limit');
const db        = require('../config/database');

// ── 1. RATE LIMITERS ────────────────────────────────────────

// Limiter rusange
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // iminota 15
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Ubusabe bwinshi cyane. Gerageza nyuma y\'iminota 15.',
    retryAfter: 15,
  },
  skip: (req) => req.method === 'OPTIONS',
});

// Limiter ikomeye kuri Auth (kurinda brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Inshuro 5 gusa mu minota 15
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Ugerageje kwinjira inshuro nyinshi. Gerageza nyuma y\'iminota 15.',
    retryAfter: 15,
  },
  skipSuccessfulRequests: true, // Ntibara ibisubizo byiza
});

// Limiter kuri NIDA API
const nidaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // isaha 1
  max: 10, // Inshuro 10 mu isaha
  message: {
    success: false,
    message: 'Ugerageje kugenzura indangamuntu inshuro nyinshi. Gerageza nyuma y\'isaha.',
  },
});

// Limiter kuri file upload
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // umunota 1
  max: 10,
  message: {
    success: false,
    message: 'Ugerageje kohereza amafoto menshi cyane. Gerageza nyuma.',
  },
});

// ── 2. INPUT SANITIZATION ───────────────────────────────────

/**
 * Gukuraho ibintu bibi muri request body, query, params
 * Kurinda XSS na SQL Injection
 */
const sanitizeInputs = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Gukuraho null bytes
        let clean = value.replace(/\0/g, '');
        // Gukuraho script tags (XSS)
        clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Gukuraho event handlers
        clean = clean.replace(/on\w+\s*=/gi, '');
        // Gukuraho javascript: protocol
        clean = clean.replace(/javascript:/gi, '');
        // Gukuraho data: protocol mu links
        clean = clean.replace(/data:/gi, '');
        cleaned[key] = clean;
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(v => typeof v === 'string' ? v.replace(/\0/g, '') : v);
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = sanitize(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  if (req.body)   req.body   = sanitize(req.body);
  if (req.query)  req.query  = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// ── 3. CONTENT TYPE CHECK ───────────────────────────────────

/**
 * Kugenzura ko POST/PUT requests zifite Content-Type iyemezwa
 */
const requireJSON = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json') &&
        !contentType.includes('multipart/form-data')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type igomba kuba application/json cyangwa multipart/form-data.',
      });
    }
  }
  next();
};

// ── 4. SUSPICIOUS ACTIVITY DETECTOR ────────────────────────

/**
 * Gufata ibikorwa biragaragara nk'ibikorwa bibi
 */
const detectSuspiciousActivity = (req, res, next) => {
  const suspicious = [
    // SQL Injection patterns
    /(\bUNION\b|\bSELECT\b|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bEXEC\b)/i,
    // Path traversal
    /\.\.\//,
    /\.\.\\/,
    // Null bytes
    /\x00/,
    // LDAP injection
    /[()\\*]/,
  ];

  const checkValue = (val) => {
    if (typeof val !== 'string') return false;
    return suspicious.some(pattern => pattern.test(val));
  };

  const checkObject = (obj) => {
    if (!obj) return false;
    return Object.values(obj).some(v => {
      if (typeof v === 'string') return checkValue(v);
      if (typeof v === 'object') return checkObject(v);
      return false;
    });
  };

  if (checkObject(req.body) || checkObject(req.query)) {
    // Log ibikorwa bibi (mu bikorwa nyakuri, wohereza kuri SIEM)
    console.warn(`⚠️  Suspicious activity detected from IP: ${req.ip} | Path: ${req.path} | UA: ${req.headers['user-agent']}`);

    return res.status(400).json({
      success: false,
      message: 'Ubusabe bwawe burabuze. Gerageza nanone.',
    });
  }

  next();
};

// ── 5. OWNERSHIP CHECK ──────────────────────────────────────

/**
 * Kugenzura ko umukoresha afite uburenganzira ku kibazo
 * Umuturage areba ibibazo bye gusa
 */
const checkIssueOwnership = async (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Ntabwo winjiye.' });

  // Abayobozi bareba byose mu rwego rwabo
  if (user.role_slug !== 'umuturage') return next();

  try {
    const [rows] = await db.execute(
      'SELECT id, umuturage_id FROM ibibazo WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Ikibazo ntikiboneka.' });
    }

    if (rows[0].umuturage_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Ntufite uburenganzira bwo kureba iki kibazo.',
      });
    }

    next();
  } catch (err) {
    console.error('Ownership check error:', err);
    res.status(500).json({ success: false, message: 'Ikibazo mu kugenzura uburenganzira.' });
  }
};

// ── 6. NIDA VERIFIED CHECK ──────────────────────────────────

/**
 * Kugenzura ko umukoresha yemejwe na NIDA mbere yo gutanga ikibazo
 */
const requireNIDAVerified = (req, res, next) => {
  if (!req.user?.nida_verified) {
    return res.status(403).json({
      success: false,
      message: 'Ugomba kugenzura indangamuntu yawe na NIDA mbere yo gukoresha iyi serivisi.',
    });
  }
  next();
};

// ── 7. REQUEST SIZE LIMITER ─────────────────────────────────

/**
 * Kugenzura ubunini bwa request body
 */
const checkRequestSize = (maxSizeMB = 10) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: `Ubusabe bwawe ni bunini cyane. Ntarengeje ${maxSizeMB}MB.`,
      });
    }
    next();
  };
};

module.exports = {
  generalLimiter,
  authLimiter,
  nidaLimiter,
  uploadLimiter,
  sanitizeInputs,
  requireJSON,
  detectSuspiciousActivity,
  checkIssueOwnership,
  requireNIDAVerified,
  checkRequestSize,
};
