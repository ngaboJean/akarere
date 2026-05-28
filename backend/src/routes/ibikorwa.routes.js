// ============================================================
// Ibikorwa Routes - Government Projects (Production-Grade)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { verifyToken, requireDistrict, requireSectorAndAbove } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createProjectValidator,
  updateProgressValidator,
  idParamValidator,
} = require('../validators/schemas');

// ── GET /api/ibikorwa ───────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.id, p.izina, p.ibisobanuro, p.icyiciro, p.status,
              p.aho_bigeze, p.ingenzi, p.ingenzi_yakoreshejwe,
              p.itariki_itangira, p.itariki_irangira, p.created_at,
              ar.izina AS akarere_izina, um.izina AS umurenge_izina
       FROM ibikorwa p
       LEFT JOIN akarere ar  ON p.akarere_id  = ar.id
       LEFT JOIN umurenge um ON p.umurenge_id = um.id
       WHERE p.akarere_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.akarere_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET ibikorwa error:', err);
    res.status(500).json({ success: false, message: 'Ikibazo mu gufata ibikorwa.' });
  }
});

// ── POST /api/ibikorwa ──────────────────────────────────────
router.post('/',
  verifyToken,
  requireDistrict,
  createProjectValidator,
  validate,
  async (req, res) => {
    try {
      const {
        izina, ibisobanuro, icyiciro,
        umurenge_id, ingenzi,
        itariki_itangira, itariki_irangira,
      } = req.body;

      // Kugenzura umurenge niba wahawe
      if (umurenge_id) {
        const [umurenge] = await db.execute(
          'SELECT id FROM umurenge WHERE id = ? AND akarere_id = ?',
          [umurenge_id, req.user.akarere_id]
        );
        if (!umurenge.length) {
          return res.status(400).json({
            success: false,
            message: 'Umurenge wahisemo ntuboneka mu Akarere yawe.',
            field: 'umurenge_id',
          });
        }
      }

      const [result] = await db.execute(
        `INSERT INTO ibikorwa
          (izina, ibisobanuro, icyiciro, akarere_id, umurenge_id,
           ingenzi, itariki_itangira, itariki_irangira, status, aho_bigeze)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'gutegurwa', 0)`,
        [
          izina,
          ibisobanuro || null,
          icyiciro || 'ibindi',
          req.user.akarere_id,
          umurenge_id || null,
          ingenzi || 0,
          itariki_itangira || null,
          itariki_irangira || null,
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Umushinga washyizweho neza.',
        data: { id: result.insertId },
      });

    } catch (err) {
      console.error('POST ibikorwa error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu gushyiraho umushinga.' });
    }
  }
);

// ── PUT /api/ibikorwa/:id/progress ─────────────────────────
router.put('/:id/progress',
  verifyToken,
  requireSectorAndAbove,
  updateProgressValidator,
  validate,
  async (req, res) => {
    try {
      const { aho_bigeze, status } = req.body;
      const projectId = parseInt(req.params.id);

      const [rows] = await db.execute(
        'SELECT id, status AS current_status FROM ibikorwa WHERE id = ? AND akarere_id = ?',
        [projectId, req.user.akarere_id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Umushinga ntuboneka.' });
      }

      // Kugenzura logic: niba byarangiye, aho_bigeze igomba kuba 100
      if (status === 'byarangiye' && aho_bigeze < 100) {
        return res.status(400).json({
          success: false,
          message: 'Umushinga urangiye ugomba kuba 100% byarangiye.',
        });
      }

      await db.execute(
        `UPDATE ibikorwa
         SET aho_bigeze = ?, status = ?, updated_at = NOW()
         WHERE id = ?`,
        [aho_bigeze, status, projectId]
      );

      res.json({ success: true, message: 'Aho bigeze buvuguruwe neza.' });

    } catch (err) {
      console.error('Update progress error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu kuvugurura aho bigeze.' });
    }
  }
);

module.exports = router;
