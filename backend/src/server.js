// ============================================================
// SYSTEM Y'IBANZE - Server (Production-Grade)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');

const {
  generalLimiter,
  authLimiter,
  nidaLimiter,
  sanitizeInputs,
  requireJSON,
  detectSuspiciousActivity,
  checkRequestSize,
} = require('./middleware/security.middleware');

const app = express();

// ── 1. SECURITY HEADERS (Helmet) ───────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// ── 2. CORS ─────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Emera requests zidafite origin (mobile apps, Postman mu dev)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin "${origin}" ntiyemezwa.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // Preflight cache: isaha 24
}));

// ── 3. BODY PARSING ─────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── 4. LOGGING ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── 5. GLOBAL SECURITY MIDDLEWARE ──────────────────────────
app.use(checkRequestSize(10));          // Max 10MB
app.use(sanitizeInputs);               // XSS prevention
app.use(detectSuspiciousActivity);     // SQL injection detection

// ── 6. STATIC FILES ─────────────────────────────────────────
app.use('/uploads', (req, res, next) => {
  // Kurinda direct access ku files zibi
  const ext = path.extname(req.path).toLowerCase();
  if (!['.jpg','.jpeg','.png','.pdf'].includes(ext)) {
    return res.status(403).json({ success: false, message: 'Ntabwo byemezwa.' });
  }
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  etag: true,
}));

// ── 7. ROUTES ───────────────────────────────────────────────
app.use('/api/auth',        authLimiter,  require('./routes/auth.routes'));
app.use('/api/nida',        nidaLimiter,  require('./routes/nida.routes'));
app.use('/api/ussd',         generalLimiter, require('./routes/ussd.routes'));
app.use('/api/abakoresha',  generalLimiter, require('./routes/abakoresha.routes'));
app.use('/api/ibibazo',     generalLimiter, require('./routes/ibibazo.routes'));
app.use('/api/impushya',    generalLimiter, require('./routes/impushya.routes'));
app.use('/api/inzego',      generalLimiter, require('./routes/inzego.routes'));
app.use('/api/raporo',      generalLimiter, require('./routes/raporo.routes'));
app.use('/api/ubutumwa',    generalLimiter, require('./routes/ubutumwa.routes'));
app.use('/api/ibikorwa',    generalLimiter, require('./routes/ibikorwa.routes'));

// ── 8. HEALTH CHECK ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:   true,
    message:   "System y'Ibanze irimo gukora neza 🇷🇼",
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
    version:   process.env.npm_package_version || '1.0.0',
  });
});

// ── 9. 404 HANDLER ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Inzira "${req.method} ${req.path}" ntiboneka.`,
  });
});

// ── 10. GLOBAL ERROR HANDLER ────────────────────────────────
app.use((err, req, res, next) => {
  // CORS error
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  // Log ikosa (mu production, wohereza kuri logging service)
  console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);

  // Ntitwohereze stack trace mu production
  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Hari ikibazo mu Sisitemu. Gerageza nyuma.',
    ...(isDev && { stack: err.stack }),
  });
});

// ── 11. UNHANDLED REJECTIONS ────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// ── 12. START SERVER ────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 System y'Ibanze irimo gukora kuri port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet, CORS, Rate Limiting, Input Sanitization`);
  console.log(`📡 API: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
