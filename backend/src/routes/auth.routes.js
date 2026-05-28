// ============================================================
// Auth Routes - Kwinjira no Gusohoka (Production-Grade)
// ============================================================
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/database');
const { kugenzuraIndangamuntu } = require('../services/nida.service');
const { verifyToken }           = require('../middleware/auth.middleware');
const validate                  = require('../middleware/validate.middleware');
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} = require('../validators/schemas');

// ── Helper: Gukora Tokens ───────────────────────────────────
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } // Short-lived mu production
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

// ── Helper: Normalize telefoni ──────────────────────────────
const normalizeTel = (tel) => {
  const cleaned = tel.replace(/[\s\-]/g, '');
  if (cleaned.startsWith('+250')) return cleaned.replace('+250', '0');
  if (cleaned.startsWith('250'))  return cleaned.replace('250', '0');
  return cleaned;
};

// ── POST /api/auth/iyandikisha ──────────────────────────────
router.post('/iyandikisha', registerValidator, validate, async (req, res) => {
  const { indangamuntu, telephone, amazina, ijambo_banga, email, umudugudu_id } = req.body;
  const normalizedTel = normalizeTel(telephone);

  try {
    // 1. Kugenzura niba indangamuntu cyangwa telefoni isanzwe ihari
    const [existing] = await db.execute(
      'SELECT id, indangamuntu, telephone FROM abakoresha WHERE indangamuntu = ? OR telephone = ?',
      [indangamuntu, normalizedTel]
    );

    if (existing.length) {
      const field = existing[0].indangamuntu === indangamuntu ? 'indangamuntu' : 'telefoni';
      return res.status(409).json({
        success: false,
        message: `Iyi ${field} isanzwe ikoreshwa. Injira cyangwa koresha indi.`,
      });
    }

    // 2. Kugenzura Indangamuntu na NIDA (REQUIRED mu production)
    const nidaResult = await kugenzuraIndangamuntu(indangamuntu);
    if (!nidaResult.valid) {
      return res.status(400).json({
        success: false,
        message: `Indangamuntu ntiyemejwe na NIDA: ${nidaResult.message}`,
        field: 'indangamuntu',
      });
    }

    // 3. Kugenzura Umudugudu (n'inzego zose)
    const [umuduguduData] = await db.execute(
      `SELECT u.id, u.izina AS umudugudu_izina,
              u.akagari_id, a.izina AS akagari_izina,
              a.umurenge_id, um.izina AS umurenge_izina,
              um.akarere_id, ar.izina AS akarere_izina
       FROM umudugudu u
       JOIN akagari a   ON u.akagari_id  = a.id
       JOIN umurenge um ON a.umurenge_id = um.id
       JOIN akarere ar  ON um.akarere_id = ar.id
       WHERE u.id = ?`,
      [umudugudu_id]
    );

    if (!umuduguduData.length) {
      return res.status(400).json({
        success: false,
        message: 'Umudugudu wahisemo ntuboneka. Hitamo umudugudu ukwiye.',
        field: 'umudugudu_id',
      });
    }

    const loc = umuduguduData[0];

    // 4. Kugenzura email niba ihari
    if (email) {
      const [emailExists] = await db.execute(
        'SELECT id FROM abakoresha WHERE email = ?',
        [email.toLowerCase()]
      );
      if (emailExists.length) {
        return res.status(409).json({
          success: false,
          message: 'Iyi email isanzwe ikoreshwa.',
          field: 'email',
        });
      }
    }

    // 5. Guhasha ijambo banga (cost 12 mu production)
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(ijambo_banga, saltRounds);

    // 6. Kubika mu database
    const [result] = await db.execute(
      `INSERT INTO abakoresha
        (indangamuntu, telephone, amazina, ijambo_banga, email,
         role_id, umudugudu_id, akagari_id, umurenge_id, akarere_id,
         nida_verified, nida_data, status)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, TRUE, ?, 'active')`,
      [
        indangamuntu,
        normalizedTel,
        nidaResult.data?.amazina || amazina,
        hashedPassword,
        email ? email.toLowerCase() : null,
        loc.id,
        loc.akagari_id,
        loc.umurenge_id,
        loc.akarere_id,
        JSON.stringify({
          amazina:         nidaResult.data?.amazina,
          itariki_amavuko: nidaResult.data?.itariki_amavuko,
          igitsina:        nidaResult.data?.igitsina,
          verified_at:     new Date().toISOString(),
        }),
      ]
    );

    const { accessToken, refreshToken } = generateTokens(result.insertId);

    await db.execute(
      'UPDATE abakoresha SET refresh_token = ? WHERE id = ?',
      [refreshToken, result.insertId]
    );

    // Ntitwohereze amakuru yose (security)
    res.status(201).json({
      success: true,
      message: 'Konti yawe yashyizweho neza. Murakaza neza!',
      data: {
        id:            result.insertId,
        amazina:       nidaResult.data?.amazina || amazina,
        nida_verified: true,
        aho_atuye: {
          umudugudu: loc.umudugudu_izina,
          akagari:   loc.akagari_izina,
          umurenge:  loc.umurenge_izina,
          akarere:   loc.akarere_izina,
        },
        accessToken,
        refreshToken,
      },
    });

  } catch (err) {
    console.error('Iyandikisha Error:', err);
    // Ntitwohereze amakuru y'ikosa mu production
    res.status(500).json({
      success: false,
      message: 'Ikibazo mu kwiyandikisha. Gerageza nyuma.',
    });
  }
});

// ── POST /api/auth/injira ───────────────────────────────────
router.post('/injira', loginValidator, validate, async (req, res) => {
  const { login, ijambo_banga } = req.body;

  // Normalize login (telefoni cyangwa indangamuntu)
  const normalizedLogin = login.startsWith('+250') ? login.replace('+250', '0')
    : login.startsWith('250') ? login.replace('250', '0')
    : login;

  try {
    const [rows] = await db.execute(
      `SELECT a.id, a.amazina, a.indangamuntu, a.telephone, a.email,
              a.ijambo_banga, a.role_id, a.status, a.nida_verified,
              a.umudugudu_id, a.akagari_id, a.umurenge_id, a.akarere_id,
              a.foto, a.last_login,
              r.slug AS role_slug, r.izina AS role_izina
       FROM abakoresha a
       JOIN roles r ON a.role_id = r.id
       WHERE (a.indangamuntu = ? OR a.telephone = ?)`,
      [normalizedLogin, normalizedLogin]
    );

    // Igisubizo kimwe kugira ngo ntitwohereze amakuru (timing attack prevention)
    const dummyHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uoHe';
    const umukoresha = rows[0] || null;
    const hashToCheck = umukoresha?.ijambo_banga || dummyHash;

    const ijamboNihame = await bcrypt.compare(ijambo_banga, hashToCheck);

    if (!umukoresha || !ijamboNihame) {
      return res.status(401).json({
        success: false,
        message: 'Indangamuntu/Telefoni cyangwa ijambo banga ntabwo bihura.',
      });
    }

    // Kugenzura status ya konti
    if (umukoresha.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Konti yawe yarahagaritswe. Vugana n\'ubuyobozi.',
      });
    }

    if (umukoresha.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Konti yawe ntikora. Vugana n\'ubuyobozi.',
      });
    }

    const { accessToken, refreshToken } = generateTokens(umukoresha.id);

    await db.execute(
      'UPDATE abakoresha SET last_login = NOW(), refresh_token = ? WHERE id = ?',
      [refreshToken, umukoresha.id]
    );

    // Ntitwohereze ijambo banga na refresh_token mu response
    const {
      ijambo_banga: _pwd,
      refresh_token: _rt,
      ...safeUserData
    } = umukoresha;

    res.json({
      success: true,
      message: `Murakaza neza, ${umukoresha.amazina.split(' ')[0]}!`,
      data: {
        umukoresha: safeUserData,
        accessToken,
        refreshToken,
      },
    });

  } catch (err) {
    console.error('Injira Error:', err);
    res.status(500).json({
      success: false,
      message: 'Ikibazo mu kwinjira. Gerageza nyuma.',
    });
  }
});

// ── POST /api/auth/refresh ──────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(401).json({ success: false, message: 'Refresh token irakenewe.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const [rows] = await db.execute(
      `SELECT id, status FROM abakoresha
       WHERE id = ? AND refresh_token = ? AND status = 'active'`,
      [decoded.id, refreshToken]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token ntiyemezwa cyangwa yarangiye.',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    // Rotate refresh token (security best practice)
    await db.execute(
      'UPDATE abakoresha SET refresh_token = ? WHERE id = ?',
      [newRefreshToken, decoded.id]
    );

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Gukuraho refresh token yarangiye
      try {
        const decoded = jwt.decode(refreshToken);
        if (decoded?.id) {
          await db.execute(
            'UPDATE abakoresha SET refresh_token = NULL WHERE id = ?',
            [decoded.id]
          );
        }
      } catch {}
    }
    res.status(401).json({ success: false, message: 'Refresh token ntiyemezwa.' });
  }
});

// ── POST /api/auth/sohoka ───────────────────────────────────
router.post('/sohoka', verifyToken, async (req, res) => {
  try {
    await db.execute(
      'UPDATE abakoresha SET refresh_token = NULL WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, message: 'Wasohowe neza.' });
  } catch {
    res.status(500).json({ success: false, message: 'Ikibazo mu gusohoka.' });
  }
});

// ── GET /api/auth/jye ───────────────────────────────────────
router.get('/jye', verifyToken, (req, res) => {
  // Ntitwohereze amakuru yose (nida_data, refresh_token, etc.)
  const {
    nida_data, refresh_token, ijambo_banga,
    ...safeData
  } = req.user;

  res.json({ success: true, data: safeData });
});

// ── PUT /api/auth/hindura-ijambo-banga ─────────────────────
router.put('/hindura-ijambo-banga', verifyToken, changePasswordValidator, validate, async (req, res) => {
  const { ijambo_banga_rya_kera, ijambo_banga_rishya } = req.body;

  try {
    const [rows] = await db.execute(
      'SELECT ijambo_banga FROM abakoresha WHERE id = ?',
      [req.user.id]
    );

    const isValid = await bcrypt.compare(ijambo_banga_rya_kera, rows[0].ijambo_banga);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Ijambo banga rya kera ntirihura.',
        field: 'ijambo_banga_rya_kera',
      });
    }

    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const newHash = await bcrypt.hash(ijambo_banga_rishya, saltRounds);

    await db.execute(
      'UPDATE abakoresha SET ijambo_banga = ?, refresh_token = NULL WHERE id = ?',
      [newHash, req.user.id]
    );

    res.json({ success: true, message: 'Ijambo banga ryahinduwe neza. Injira nanone.' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Ikibazo mu guhindura ijambo banga.' });
  }
});

module.exports = router;
