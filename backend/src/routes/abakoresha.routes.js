// ============================================================
// Abakoresha Routes - User Management (Production-Grade)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { verifyToken, requireDistrict } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  updateUserStatusValidator,
  updateUserRoleValidator,
  idParamValidator,
} = require('../validators/schemas');
const { query } = require('express-validator');

// ── GET /api/abakoresha ─────────────────────────────────────
router.get('/', verifyToken, requireDistrict, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('role_id').optional().isInt({ min: 1, max: 5 }).toInt(),
  query('status').optional().isIn(['active','inactive','suspended']),
], validate, async (req, res) => {
  try {
    const { page = 1, limit = 20, role_id, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'a.akarere_id = ?';
    const params = [req.user.akarere_id];

    if (role_id) { where += ' AND a.role_id = ?'; params.push(role_id); }
    if (status)  { where += ' AND a.status = ?';  params.push(status); }

    const [rows] = await db.execute(
      `SELECT a.id, a.amazina, a.indangamuntu, a.telephone, a.email,
              a.status, a.nida_verified, a.last_login, a.created_at,
              r.izina AS role_izina, r.slug AS role_slug,
              ud.izina AS umudugudu, ak.izina AS akagari, um.izina AS umurenge
       FROM abakoresha a
       JOIN roles r        ON a.role_id      = r.id
       LEFT JOIN umudugudu ud ON a.umudugudu_id = ud.id
       LEFT JOIN akagari ak   ON a.akagari_id   = ak.id
       LEFT JOIN umurenge um  ON a.umurenge_id  = um.id
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM abakoresha a WHERE ${where}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });

  } catch (err) {
    console.error('GET abakoresha error:', err);
    res.status(500).json({ success: false, message: 'Ikibazo mu gufata abakoresha.' });
  }
});

// ── PUT /api/abakoresha/:id/status ──────────────────────────
router.put('/:id/status',
  verifyToken,
  requireDistrict,
  updateUserStatusValidator,
  validate,
  async (req, res) => {
    try {
      const { status } = req.body;
      const targetId   = parseInt(req.params.id);

      // Ntushobora guhindura status yawe ubwawe
      if (targetId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Ntushobora guhindura status ya konti yawe ubwawe.',
        });
      }

      // Kugenzura ko umukoresha ari mu akarere yawe
      const [rows] = await db.execute(
        'SELECT id, amazina, role_id FROM abakoresha WHERE id = ? AND akarere_id = ?',
        [targetId, req.user.akarere_id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Umukoresha ntiboneka.' });
      }

      // Ntushobora guhindura status y'umuyobozi w'akarere
      if (rows[0].role_id === 5) {
        return res.status(403).json({
          success: false,
          message: 'Ntushobora guhindura status y\'umuyobozi w\'akarere.',
        });
      }

      await db.execute(
        'UPDATE abakoresha SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, targetId]
      );

      // Niba hagaritswe, gukuraho refresh token
      if (status === 'suspended') {
        await db.execute(
          'UPDATE abakoresha SET refresh_token = NULL WHERE id = ?',
          [targetId]
        );
      }

      res.json({
        success: true,
        message: `Status ya ${rows[0].amazina} yahindutse neza: ${status}`,
      });

    } catch (err) {
      console.error('Update status error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu guhindura status.' });
    }
  }
);

// ── PUT /api/abakoresha/:id/role ────────────────────────────
router.put('/:id/role',
  verifyToken,
  requireDistrict,
  updateUserRoleValidator,
  validate,
  async (req, res) => {
    try {
      const { role_id } = req.body;
      const targetId    = parseInt(req.params.id);

      if (targetId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Ntushobora guhindura uruhare rwawe ubwawe.',
        });
      }

      const [rows] = await db.execute(
        'SELECT id, amazina FROM abakoresha WHERE id = ? AND akarere_id = ?',
        [targetId, req.user.akarere_id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Umukoresha ntiboneka.' });
      }

      await db.execute(
        'UPDATE abakoresha SET role_id = ?, updated_at = NOW() WHERE id = ?',
        [role_id, targetId]
      );

      // Gukuraho session kugira ngo uruhare rushya rukorere
      await db.execute(
        'UPDATE abakoresha SET refresh_token = NULL WHERE id = ?',
        [targetId]
      );

      res.json({
        success: true,
        message: `Uruhare rwa ${rows[0].amazina} rwahinduwe neza.`,
      });

    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ success: false, message: 'Ikibazo mu guhindura uruhare.' });
    }
  }
);

module.exports = router;
