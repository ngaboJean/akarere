// ============================================================
// Ubutumwa Routes - Notifications
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');

// GET /api/ubutumwa - Ubutumwa bwanjye
router.get('/', verifyToken, async (req, res) => {
  const [rows] = await db.execute(
    `SELECT * FROM ubutumwa WHERE uwakiriye_id = ? ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  const [[{ total }]] = await db.execute(
    'SELECT COUNT(*) AS total FROM ubutumwa WHERE uwakiriye_id = ? AND yasomwe = FALSE',
    [req.user.id]
  );
  res.json({ success: true, data: rows, bitasomwe: total });
});

// PUT /api/ubutumwa/:id/soma - Gusoma ubutumwa
router.put('/:id/soma', verifyToken, async (req, res) => {
  await db.execute(
    'UPDATE ubutumwa SET yasomwe = TRUE WHERE id = ? AND uwakiriye_id = ?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

// PUT /api/ubutumwa/soma-byose - Gusoma byose
router.put('/soma-byose', verifyToken, async (req, res) => {
  await db.execute(
    'UPDATE ubutumwa SET yasomwe = TRUE WHERE uwakiriye_id = ?',
    [req.user.id]
  );
  res.json({ success: true, message: 'Ubutumwa bwose busomwe.' });
});

module.exports = router;
