// ============================================================
// Impushya Routes - Certificate Requests
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { body, validationResult } = require('express-validator');
const { verifyToken, requireLeader } = require('../middleware/auth.middleware');

// GET /api/impushya - Gufata impushya
router.get('/', verifyToken, async (req, res) => {
  const user = req.user;
  let where = '1=1';
  const params = [];

  if (user.role_slug === 'umuturage') {
    where += ' AND c.umuturage_id = ?'; params.push(user.id);
  } else if (user.role_slug === 'umukuru_umudugudu') {
    where += ' AND c.umudugudu_id = ?'; params.push(user.umudugudu_id);
  } else if (user.role_slug === 'es_akagari') {
    where += ' AND ud.akagari_id = ?'; params.push(user.akagari_id);
  }

  const [rows] = await db.execute(
    `SELECT c.*, a.amazina AS umuturage_amazina, ud.izina AS umudugudu_izina
     FROM impushya c
     JOIN abakoresha a ON c.umuturage_id = a.id
     JOIN umudugudu ud ON c.umudugudu_id = ud.id
     WHERE ${where}
     ORDER BY c.created_at DESC`,
    params
  );
  res.json({ success: true, data: rows });
});

// POST /api/impushya - Gusaba impushya
router.post('/', verifyToken, [
  body('ubwoko').isIn(['indangamuntu','ubutaka','ubuzima','ubuturage','ubukene','ibindi'])
    .withMessage('Ubwoko bw\'impushya ntibwemezwa.'),
  body('ibisobanuro').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { ubwoko, ibisobanuro } = req.body;
  const certNumber = `CERT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const [result] = await db.execute(
    `INSERT INTO impushya (cert_number, ubwoko, umuturage_id, umudugudu_id, ibisobanuro)
     VALUES (?, ?, ?, ?, ?)`,
    [certNumber, ubwoko, req.user.id, req.user.umudugudu_id, ibisobanuro || null]
  );

  res.status(201).json({
    success: true,
    message: 'Gusaba impushya byagenze neza. Uzabona igisubizo vuba.',
    data: { id: result.insertId, cert_number: certNumber }
  });
});

// PUT /api/impushya/:id/emeza - Kwemeza impushya
router.put('/:id/emeza', verifyToken, requireLeader, async (req, res) => {
  await db.execute(
    `UPDATE impushya SET status = 'yemejwe', yemejwe_na = ?, yemejwe_igihe = NOW() WHERE id = ?`,
    [req.user.id, req.params.id]
  );

  const [[cert]] = await db.execute('SELECT umuturage_id FROM impushya WHERE id = ?', [req.params.id]);
  await db.execute(
    `INSERT INTO ubutumwa (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id)
     VALUES (?, 'impushya', 'Impushya yawe yemejwe!', 'Impushya yawe yemejwe. Ushobora kuyikura.', ?)`,
    [cert.umuturage_id, req.params.id]
  );

  res.json({ success: true, message: 'Impushya yemejwe neza.' });
});

// PUT /api/impushya/:id/anze - Kwanga impushya
router.put('/:id/anze', verifyToken, requireLeader, async (req, res) => {
  await db.execute(
    `UPDATE impushya SET status = 'yanzwe' WHERE id = ?`,
    [req.params.id]
  );
  res.json({ success: true, message: 'Impushya yanzwe.' });
});

module.exports = router;
