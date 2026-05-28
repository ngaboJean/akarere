// ============================================================
// Auth Middleware - JWT + RBAC (Production-Grade)
// ============================================================
const jwt = require('jsonwebtoken');
const db  = require('../config/database');

// ── verifyToken ─────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Ntabwo winjiye. Injira mbere yo gukomeza.',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];

    // Kugenzura ko token ifite imiterere ikwiye (3 parts)
    if (token.split('.').length !== 3) {
      return res.status(401).json({
        success: false,
        message: 'Token ntiyemezwa.',
        code: 'INVALID_TOKEN',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Igihe cya session cyarangiye. Injira nanone.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token ntiyemezwa.',
        code: 'INVALID_TOKEN',
      });
    }

    // Kugenzura ko id iri mu token ari umubare
    if (!decoded.id || typeof decoded.id !== 'number') {
      return res.status(401).json({
        success: false,
        message: 'Token irimo amakuru atemewe.',
        code: 'INVALID_TOKEN',
      });
    }

    // Gufata amakuru y'umukoresha (fresh from DB kuri buri request)
    const [rows] = await db.execute(
      `SELECT a.id, a.amazina, a.indangamuntu, a.telephone, a.email,
              a.role_id, r.slug AS role_slug, r.izina AS role_izina,
              a.umudugudu_id, a.akagari_id, a.umurenge_id, a.akarere_id,
              a.status, a.nida_verified, a.foto
       FROM abakoresha a
       JOIN roles r ON a.role_id = r.id
       WHERE a.id = ?`,
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Konti ntiboneka.',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = rows[0];

    // Kugenzura status ya konti
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Konti yawe yarahagaritswe. Vugana n\'ubuyobozi.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Konti yawe ntikora.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('verifyToken error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Ikibazo mu kugenzura uburenganzira.',
    });
  }
};

// ── requireRole ─────────────────────────────────────────────
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Ntabwo winjiye.',
        code: 'NO_AUTH',
      });
    }

    if (!roles.includes(req.user.role_slug)) {
      return res.status(403).json({
        success: false,
        message: `Ntufite uburenganzira bwo gukora ibi. Uruhare rwawe: "${req.user.role_izina}". Bisabwa: ${roles.join(' cyangwa ')}.`,
        code: 'INSUFFICIENT_ROLE',
      });
    }

    next();
  };
};

// ── Predefined Role Guards ───────────────────────────────────
const requireLeader = requireRole(
  'umukuru_umudugudu', 'es_akagari', 'es_umurenge', 'admin_akarere'
);

const requireCellAndAbove = requireRole(
  'es_akagari', 'es_umurenge', 'admin_akarere'
);

const requireSectorAndAbove = requireRole(
  'es_umurenge', 'admin_akarere'
);

const requireDistrict = requireRole('admin_akarere');

const requireCitizen = requireRole('umuturage');

module.exports = {
  verifyToken,
  requireRole,
  requireLeader,
  requireCellAndAbove,
  requireSectorAndAbove,
  requireDistrict,
  requireCitizen,
};
