// ============================================================
// Inzego Routes - Administrative Units (Districts, Sectors, etc.)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');

// GET /api/inzego/akarere
router.get('/akarere', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM akarere ORDER BY izina');
  res.json({ success: true, data: rows });
});

// GET /api/inzego/umurenge?akarere_id=1
router.get('/umurenge', async (req, res) => {
  const { akarere_id } = req.query;
  const [rows] = await db.execute(
    'SELECT * FROM umurenge WHERE akarere_id = ? ORDER BY izina',
    [akarere_id]
  );
  res.json({ success: true, data: rows });
});

// GET /api/inzego/akagari?umurenge_id=1
router.get('/akagari', async (req, res) => {
  const { umurenge_id } = req.query;
  const [rows] = await db.execute(
    'SELECT * FROM akagari WHERE umurenge_id = ? ORDER BY izina',
    [umurenge_id]
  );
  res.json({ success: true, data: rows });
});

// GET /api/inzego/umudugudu?akagari_id=1
router.get('/umudugudu', async (req, res) => {
  const { akagari_id } = req.query;
  const [rows] = await db.execute(
    'SELECT * FROM umudugudu WHERE akagari_id = ? ORDER BY izina',
    [akagari_id]
  );
  res.json({ success: true, data: rows });
});

module.exports = router;
