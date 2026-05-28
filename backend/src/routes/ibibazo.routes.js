// ============================================================
// Ibibazo Routes - Issue Management (Production-Grade)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const multer  = require('multer');

const { verifyToken, requireLeader } = require('../middleware/auth.middleware');
const validate                        = require('../middleware/validate.middleware');
const {
  requireNIDAVerified,
  checkIssueOwnership,
  uploadLimiter,
} = require('../middleware/security.middleware');
const {
  createIssueValidator,
  escalateValidator,
  resolveValidator,
  ratingValidator,
  messageValidator,
  listIssuesValidator,
  idParamValidator,
} = require('../validators/schemas');

// ── Multer - Gutunga Amafoto (Secure) ──────────────────────
const ALLOWED_MIME = ['image/jpeg','image/jpg','image/png','application/pdf'];
const ALLOWED_EXT  = /\.(jpeg|jpg|png|pdf)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/ibibazo');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Gukoresha UUID kugira ngo ntihindure izina ry'ifoto (security)
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    // Kugenzura MIME type na extension (double check)
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Ubwoko bw\'ifoto ntibwemezwa. Emera: JPEG, PNG, PDF gusa.'));
    }
    if (!ALLOWED_EXT.test(file.originalname)) {
      return cb(new Error('Extension y\'ifoto ntiyemezwa.'));
    }
    cb(null, true);
  },
});

// Multer error handler
const handleUpload = (req, res, next) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ifoto ni nini cyane. Max: 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Amafoto menshi cyane. Max: 5.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Escalation Map
const ESCALATION_MAP = {
  umudugudu: 'akagari',
  akagari:   'umurenge',
  umurenge:  'akarere',
};

// ── GET /api/ibibazo ────────────────────────────────────────
router.get('/', verifyToken, listIssuesValidator, validate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, icyiciro, urwego } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const user   = req.user;

    let whereClause = '1=1';
    const params    = [];

    // Scope bitewe n'uruhare (Row-Level Security)
    switch (user.role_slug) {
      case 'umuturage':
        whereClause += ' AND i.umuturage_id = ?';
        params.push(user.id);
        break;
      case 'umukuru_umudugudu':
        whereClause += ' AND i.umudugudu_id = ?';
        params.push(user.umudugudu_id);
        break;
      case 'es_akagari':
        whereClause += ' AND i.akagari_id = ?';
        params.push(user.akagari_id);
        break;
      case 'es_umurenge':
        whereClause += ' AND i.umurenge_id = ?';
        params.push(user.umurenge_id);
        break;
      case 'admin_akarere':
        whereClause += ' AND i.akarere_id = ?';
        params.push(user.akarere_id);
        break;
      default:
        return res.status(403).json({ success: false, message: 'Uruhare ntirwemezwa.' });
    }

    if (status)   { whereClause += ' AND i.status = ?';          params.push(status); }
    if (icyiciro) { whereClause += ' AND i.icyiciro = ?';        params.push(icyiciro); }
    if (urwego)   { whereClause += ' AND i.urwego_rwahawe = ?';  params.push(urwego); }

    const safeLimit  = Math.min(parseInt(limit), 100);
    const safeOffset = Math.max(parseInt(offset), 0);

    const [ibibazo] = await db.execute(
      `SELECT i.id, i.ticket_number, i.umutwe, i.icyiciro, i.intera,
              i.status, i.urwego_rwahawe, i.created_at, i.updated_at,
              a.amazina AS umuturage_amazina, a.telephone AS umuturage_tel,
              ud.izina AS umudugudu_izina,
              ak.izina AS akagari_izina,
              um.izina AS umurenge_izina,
              ar.izina AS akarere_izina
       FROM ibibazo i
       JOIN abakoresha a   ON i.umuturage_id = a.id
       JOIN umudugudu ud   ON i.umudugudu_id = ud.id
       LEFT JOIN akagari ak   ON i.akagari_id  = ak.id
       LEFT JOIN umurenge um  ON i.umurenge_id = um.id
       LEFT JOIN akarere ar   ON i.akarere_id  = ar.id
       WHERE ${whereClause}
       ORDER BY
         CASE i.intera
           WHEN 'byihutirwa' THEN 1
           WHEN 'ikomeye'    THEN 2
           WHEN 'hagati'     THEN 3
           ELSE 4
         END,
         i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, safeOffset]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM ibibazo i WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: ibibazo,
      pagination: {
        page:  parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });

  } catch (err) {
    console.error('GET ibibazo error:', err);
    res.status(500).json({ success: false, message: 'Ikibazo mu gufata ibibazo.' });
  }
});

// ── GET /api/ibibazo/:id ────────────────────────────────────
router.get('/:id', verifyToken, idParamValidator, validate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT i.*,
              a.amazina AS umuturage_amazina, a.telephone AS umuturage_tel,
              ud.izina AS umudugudu_izina, ak.izina AS akagari_izina,
              um.izina AS umurenge_izina, ar.izina AS akarere_izina
       FROM ibibazo i
       JOIN abakoresha a   ON i.umuturage_id = a.id
       JOIN umudugudu ud   ON i.umudugudu_id = ud.id
       LEFT JOIN akagari ak   ON i.akagari_id  = ak.id
       LEFT JOIN umurenge um  ON i.umurenge_id = um.id
       LEFT JOIN akarere ar   ON i.akarere_id  = ar.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Ikibazo ntikiboneka.' });
    }

    const ikibazo = rows[0];

    // Row-Level Security: Umuturage areba ikibazo cye gusa
    if (req.user.role_slug === 'umuturage' && ikibazo.umuturage_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ntufite uburenganzira bwo kureba iki kibazo.' });
    }

    // Kugenzura ko umuyobozi ari mu rwego rw'ikibazo
    if (!canViewIssue(req.user, ikibazo)) {
      return res.status(403).json({ success: false, message: 'Ntufite uburenganzira bwo kureba iki kibazo.' });
    }

    const [logs] = await db.execute(
      `SELECT ib.id, ib.igikorwa, ib.urwego_bwasaga, ib.urwego_bwageze,
              ib.ibisobanuro, ib.created_at,
              a.amazina AS ukoreye_amazina, r.izina AS ukoreye_role
       FROM ibyakozwe ib
       JOIN abakoresha a ON ib.ukoreye = a.id
       JOIN roles r      ON a.role_id  = r.id
       WHERE ib.ikibazo_id = ?
       ORDER BY ib.created_at ASC`,
      [req.params.id]
    );

    // Inyandiko z'ibanga: Abayobozi gusa
    let messages = [];
    if (req.user.role_slug !== 'umuturage') {
      const [msgs] = await db.execute(
        `SELECT iz.id, iz.ubutumwa, iz.created_at, iz.uwanditse_id,
                a.amazina AS uwanditse_amazina, r.izina AS uwanditse_role
         FROM inyandiko_zibanga iz
         JOIN abakoresha a ON iz.uwanditse_id = a.id
         JOIN roles r      ON a.role_id       = r.id
         WHERE iz.ikibazo_id = ?
         ORDER BY iz.created_at ASC`,
        [req.params.id]
      );
      messages = msgs;
    }

    res.json({
      success: true,
      data: { ...ikibazo, ibyakozwe: logs, inyandiko: messages },
    });

  } catch (err) {
    console.error('GET ikibazo error:', err);
    res.status(500).json({ success: false, message: 'Ikibazo mu gufata amakuru.' });
  }
});

// ── POST /api/ibibazo ───────────────────────────────────────
router.post('/',
  verifyToken,
  requireNIDAVerified,
  uploadLimiter,
  handleUpload,
  createIssueValidator,
  validate,
  async (req, res) => {
    const { umutwe, ibisobanuro, icyiciro, intera, latitude, longitude } = req.body;
    const user = req.user;

    // Umuturage gusa ashobora gutanga ikibazo
    if (user.role_slug !== 'umuturage') {
      return res.status(403).json({
        success: false,
        message: 'Abayobozi ntibashobora gutanga ibibazo. Iyi serivisi ni iy\'abaturage.',
      });
    }

    try {
      const [umuduguduData] = await db.execute(
        `SELECT u.id, u.akagari_id, a.umurenge_id, um.akarere_id
         FROM umudugudu u
         JOIN akagari a   ON u.akagari_id  = a.id
         JOIN umurenge um ON a.umurenge_id = um.id
         WHERE u.id = ?`,
        [user.umudugudu_id]
      );

      if (!umuduguduData.length) {
        return res.status(400).json({
          success: false,
          message: 'Umudugudu wawe ntuboneka. Vugana n\'ubuyobozi.',
        });
      }

      // Gukora ticket number idasanzwe
      const year         = new Date().getFullYear();
      const randomPart   = Math.floor(Math.random() * 900000) + 100000;
      const ticketNumber = `ISS-${year}-${randomPart}`;

      // Kugenzura ko ticket number itabaho
      const [existing] = await db.execute(
        'SELECT id FROM ibibazo WHERE ticket_number = ?',
        [ticketNumber]
      );
      if (existing.length) {
        // Retry na timestamp
        const ts = Date.now().toString().slice(-6);
        const finalTicket = `ISS-${year}-${ts}`;
        req.ticketNumber = finalTicket;
      } else {
        req.ticketNumber = ticketNumber;
      }

      const attachments = req.files?.map(f => ({
        filename: f.filename,
        mimetype: f.mimetype,
        size:     f.size,
      })) || [];

      const [result] = await db.execute(
        `INSERT INTO ibibazo
          (ticket_number, umutwe, ibisobanuro, icyiciro, intera,
           umuturage_id, umudugudu_id, akagari_id, umurenge_id, akarere_id,
           urwego_rwahawe, attachments, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'umudugudu', ?, ?, ?)`,
        [
          req.ticketNumber, umutwe, ibisobanuro, icyiciro,
          intera || 'yoroheje',
          user.id, user.umudugudu_id,
          umuduguduData[0].akagari_id,
          umuduguduData[0].umurenge_id,
          umuduguduData[0].akarere_id,
          JSON.stringify(attachments),
          latitude  || null,
          longitude || null,
        ]
      );

      await db.execute(
        `INSERT INTO ibyakozwe (ikibazo_id, ukoreye, igikorwa, urwego_bwageze, ibisobanuro)
         VALUES (?, ?, 'byashyizwe', 'umudugudu', 'Ikibazo cyashyizwe na umuturage.')`,
        [result.insertId, user.id]
      );

      // Ohereza ubutumwa kuri Umukuru w'Umudugudu
      await notifyLeaders(result.insertId, user.umudugudu_id, umutwe);

      res.status(201).json({
        success: true,
        message: 'Ikibazo cyawe cyashyizwe neza. Uzabona igisubizo vuba.',
        data: {
          id:            result.insertId,
          ticket_number: req.ticketNumber,
        },
      });

    } catch (err) {
      console.error('POST ikibazo error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu gutanga ikibazo.' });
    }
  }
);

// ── POST /api/ibibazo/:id/shyira-hejuru ────────────────────
router.post('/:id/shyira-hejuru',
  verifyToken,
  requireLeader,
  escalateValidator,
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM ibibazo WHERE id = ?',
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Ikibazo ntikiboneka.' });
      }

      const ikibazo = rows[0];

      // Kugenzura ko ikibazo kitarakemuka
      if (['yemejwe','yanzwe','ifunzwe'].includes(ikibazo.status)) {
        return res.status(400).json({
          success: false,
          message: `Ikibazo gifite status "${ikibazo.status}" ntishobora gushyirwa hejuru.`,
        });
      }

      const urwegoRushya = ESCALATION_MAP[ikibazo.urwego_rwahawe];
      if (!urwegoRushya) {
        return res.status(400).json({
          success: false,
          message: 'Iki kibazo kiri ku rwego rwa nyuma (Akarere). Ntishobora gushyirwa hejuru.',
        });
      }

      // Kugenzura uburenganzira bw'umuyobozi
      if (!checkEscalationPermission(req.user.role_slug, ikibazo.urwego_rwahawe)) {
        return res.status(403).json({
          success: false,
          message: `Nk'${req.user.role_izina}, ntushobora gushyira hejuru ikibazo kiri ku rwego rwa "${ikibazo.urwego_rwahawe}".`,
        });
      }

      await db.execute(
        `UPDATE ibibazo
         SET status = 'yashyizwe_hejuru', urwego_rwahawe = ?, updated_at = NOW()
         WHERE id = ?`,
        [urwegoRushya, ikibazo.id]
      );

      await db.execute(
        `INSERT INTO ibyakozwe
          (ikibazo_id, ukoreye, igikorwa, urwego_bwasaga, urwego_bwageze, ibisobanuro)
         VALUES (?, ?, 'byashyizwe_hejuru', ?, ?, ?)`,
        [ikibazo.id, req.user.id, ikibazo.urwego_rwahawe, urwegoRushya, req.body.ibisobanuro]
      );

      // Ubutumwa kuri umuturage
      await db.execute(
        `INSERT INTO ubutumwa (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id)
         VALUES (?, 'ikibazo', 'Ikibazo cyawe cyashyizwe hejuru', ?, ?)`,
        [
          ikibazo.umuturage_id,
          `Ikibazo #${ikibazo.ticket_number} cyashyizwe ku rwego rwa ${urwegoRushya}.`,
          ikibazo.id,
        ]
      );

      // Ubutumwa ku bayobozi b'urwego rushya
      await notifyLeadersByLevel(urwegoRushya, ikibazo, ikibazo.umutwe);

      res.json({
        success: true,
        message: `Ikibazo cyashyizwe hejuru ku rwego rwa ${urwegoRushya} neza.`,
        data: { urwego_rushya: urwegoRushya },
      });

    } catch (err) {
      console.error('Escalate error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu gushyira hejuru.' });
    }
  }
);

// ── POST /api/ibibazo/:id/emeza ─────────────────────────────
router.post('/:id/emeza',
  verifyToken,
  requireLeader,
  resolveValidator,
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM ibibazo WHERE id = ?',
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Ikibazo ntikiboneka.' });
      }

      const ikibazo = rows[0];

      if (ikibazo.status === 'yemejwe') {
        return res.status(400).json({ success: false, message: 'Iki kibazo gisanzwe gikemutse.' });
      }

      if (!canViewIssue(req.user, ikibazo)) {
        return res.status(403).json({ success: false, message: 'Ntufite uburenganzira bwo gukemura iki kibazo.' });
      }

      await db.execute(
        `UPDATE ibibazo
         SET status = 'yemejwe', yemejwe_igihe = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [ikibazo.id]
      );

      await db.execute(
        `INSERT INTO ibyakozwe (ikibazo_id, ukoreye, igikorwa, urwego_bwasaga, ibisobanuro)
         VALUES (?, ?, 'byakemutse', ?, ?)`,
        [ikibazo.id, req.user.id, ikibazo.urwego_rwahawe, req.body.ibisobanuro]
      );

      await db.execute(
        `INSERT INTO ubutumwa (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id)
         VALUES (?, 'ikibazo', '✅ Ikibazo cyawe gikemutse!', ?, ?)`,
        [
          ikibazo.umuturage_id,
          `Ikibazo #${ikibazo.ticket_number} gikemutse: ${req.body.ibisobanuro}`,
          ikibazo.id,
        ]
      );

      res.json({ success: true, message: 'Ikibazo gikemutse neza.' });

    } catch (err) {
      console.error('Resolve error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu kwemeza.' });
    }
  }
);

// ── POST /api/ibibazo/:id/inyandiko ─────────────────────────
router.post('/:id/inyandiko',
  verifyToken,
  requireLeader,
  messageValidator,
  validate,
  async (req, res) => {
    try {
      // Kugenzura ko ikibazo kihari
      const [rows] = await db.execute(
        'SELECT id FROM ibibazo WHERE id = ?',
        [req.params.id]
      );
      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Ikibazo ntikiboneka.' });
      }

      await db.execute(
        'INSERT INTO inyandiko_zibanga (ikibazo_id, uwanditse_id, ubutumwa) VALUES (?, ?, ?)',
        [req.params.id, req.user.id, req.body.ubutumwa]
      );

      res.status(201).json({ success: true, message: 'Ubutumwa bwoherejwe neza.' });

    } catch (err) {
      console.error('Message error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu kohereza ubutumwa.' });
    }
  }
);

// ── POST /api/ibibazo/:id/rating ────────────────────────────
router.post('/:id/rating',
  verifyToken,
  ratingValidator,
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.execute(
        `SELECT id, umuturage_id, status, inyenyeri
         FROM ibibazo WHERE id = ?`,
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Ikibazo ntikiboneka.' });
      }

      const ikibazo = rows[0];

      if (ikibazo.umuturage_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Ntushobora gusuzuma iki kibazo.' });
      }

      if (ikibazo.status !== 'yemejwe') {
        return res.status(400).json({ success: false, message: 'Ushobora gusa gusuzuma ikibazo gikemutse.' });
      }

      if (ikibazo.inyenyeri !== null) {
        return res.status(400).json({ success: false, message: 'Usanzwe wasuzumye iki kibazo.' });
      }

      await db.execute(
        'UPDATE ibibazo SET inyenyeri = ?, igitekerezo_nyuma = ? WHERE id = ?',
        [req.body.inyenyeri, req.body.igitekerezo || null, req.params.id]
      );

      res.json({ success: true, message: 'Murakoze gusuzuma serivisi yacu!' });

    } catch (err) {
      console.error('Rating error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu gusuzuma.' });
    }
  }
);

// ── Helpers ─────────────────────────────────────────────────

const checkEscalationPermission = (roleSlug, currentLevel) => {
  const permissions = {
    umukuru_umudugudu: ['umudugudu'],
    es_akagari:        ['umudugudu', 'akagari'],
    es_umurenge:       ['akagari', 'umurenge'],
    admin_akarere:     ['umurenge', 'akarere'],
  };
  return permissions[roleSlug]?.includes(currentLevel) || false;
};

const canViewIssue = (user, ikibazo) => {
  switch (user.role_slug) {
    case 'umuturage':         return ikibazo.umuturage_id === user.id;
    case 'umukuru_umudugudu': return ikibazo.umudugudu_id === user.umudugudu_id;
    case 'es_akagari':        return ikibazo.akagari_id   === user.akagari_id;
    case 'es_umurenge':       return ikibazo.umurenge_id  === user.umurenge_id;
    case 'admin_akarere':     return ikibazo.akarere_id   === user.akarere_id;
    default: return false;
  }
};

const notifyLeaders = async (ikibazoId, umuduguduId, umutwe) => {
  try {
    const [leaders] = await db.execute(
      `SELECT id FROM abakoresha
       WHERE umudugudu_id = ? AND role_id = 2 AND status = 'active'`,
      [umuduguduId]
    );
    for (const leader of leaders) {
      await db.execute(
        `INSERT INTO ubutumwa (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id)
         VALUES (?, 'ikibazo', '🔔 Ikibazo gishya mu Mudugudu wawe', ?, ?)`,
        [leader.id, `Ikibazo gishya: ${umutwe}`, ikibazoId]
      );
    }
  } catch (err) {
    console.error('Notify leaders error:', err.message);
  }
};

const notifyLeadersByLevel = async (level, ikibazo, umutwe) => {
  try {
    const levelConfig = {
      akagari:  { role_id: 3, field: 'akagari_id',  value: ikibazo.akagari_id },
      umurenge: { role_id: 4, field: 'umurenge_id', value: ikibazo.umurenge_id },
      akarere:  { role_id: 5, field: 'akarere_id',  value: ikibazo.akarere_id },
    };
    const cfg = levelConfig[level];
    if (!cfg) return;

    const [leaders] = await db.execute(
      `SELECT id FROM abakoresha
       WHERE role_id = ? AND ${cfg.field} = ? AND status = 'active'`,
      [cfg.role_id, cfg.value]
    );

    for (const leader of leaders) {
      await db.execute(
        `INSERT INTO ubutumwa (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id)
         VALUES (?, 'ikibazo', '⬆️ Ikibazo cyashyizwe hejuru', ?, ?)`,
        [leader.id, `Ikibazo gishya ku rwego rwawe: ${umutwe}`, ikibazo.id]
      );
    }
  } catch (err) {
    console.error('Notify by level error:', err.message);
  }
};

module.exports = router;
