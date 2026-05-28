// ============================================================
// Raporo Routes - Analytics & Reports (District Dashboard)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { verifyToken, requireLeader, requireDistrict } = require('../middleware/auth.middleware');

// ── GET /api/raporo/dashboard - Amakuru y'Akarere ──────────
router.get('/dashboard', verifyToken, requireLeader, async (req, res) => {
  try {
    const user = req.user;
    let akarereId = user.akarere_id;

    // Statistike z'ibibazo
    const [stats] = await db.execute(
      `SELECT
         COUNT(*) AS byose,
         SUM(CASE WHEN status = 'gutegereza'      THEN 1 ELSE 0 END) AS gutegereza,
         SUM(CASE WHEN status = 'mu_gikorwa'      THEN 1 ELSE 0 END) AS mu_gikorwa,
         SUM(CASE WHEN status = 'yashyizwe_hejuru' THEN 1 ELSE 0 END) AS yashyizwe_hejuru,
         SUM(CASE WHEN status = 'yemejwe'         THEN 1 ELSE 0 END) AS yemejwe,
         SUM(CASE WHEN status = 'yanzwe'          THEN 1 ELSE 0 END) AS yanzwe
       FROM ibibazo
       WHERE akarere_id = ?`,
      [akarereId]
    );

    // Ibibazo bitewe n'icyiciro
    const [byIcyiciro] = await db.execute(
      `SELECT icyiciro, COUNT(*) AS umubare
       FROM ibibazo WHERE akarere_id = ?
       GROUP BY icyiciro ORDER BY umubare DESC`,
      [akarereId]
    );

    // Ibibazo bya buri Umurenge
    const [byUmurenge] = await db.execute(
      `SELECT um.izina AS umurenge,
              COUNT(i.id) AS byose,
              SUM(CASE WHEN i.status = 'yemejwe' THEN 1 ELSE 0 END) AS yakemutse,
              SUM(CASE WHEN i.status = 'gutegereza' THEN 1 ELSE 0 END) AS gutegereza
       FROM umurenge um
       LEFT JOIN ibibazo i ON um.id = i.umurenge_id
       WHERE um.akarere_id = ?
       GROUP BY um.id, um.izina`,
      [akarereId]
    );

    // Ibibazo by'iminsi 30 ishize (trend)
    const [trend] = await db.execute(
      `SELECT DATE(created_at) AS itariki, COUNT(*) AS umubare
       FROM ibibazo
       WHERE akarere_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY itariki ASC`,
      [akarereId]
    );

    // Gusuzuma (Satisfaction Rate)
    const [[satisfaction]] = await db.execute(
      `SELECT AVG(inyenyeri) AS average_rating, COUNT(inyenyeri) AS total_ratings
       FROM ibibazo WHERE akarere_id = ? AND inyenyeri IS NOT NULL`,
      [akarereId]
    );

    // Ibikorwa rya Leta
    const [ibikorwa] = await db.execute(
      `SELECT id, izina, icyiciro, status, aho_bigeze, ingenzi, itariki_irangira
       FROM ibikorwa WHERE akarere_id = ? ORDER BY created_at DESC LIMIT 5`,
      [akarereId]
    );

    // Abakoresha bashya (iminsi 7)
    const [[newUsers]] = await db.execute(
      `SELECT COUNT(*) AS umubare FROM abakoresha
       WHERE akarere_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [akarereId]
    );

    res.json({
      success: true,
      data: {
        statistike:   stats[0],
        byIcyiciro,
        byUmurenge,
        trend,
        satisfaction,
        ibikorwa,
        abakoresha_bashya: newUsers.umubare
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ikibazo mu gufata amakuru ya dashboard.' });
  }
});

// ── GET /api/raporo/umurenge/:id - Raporo y'Umurenge ───────
router.get('/umurenge/:id', verifyToken, requireLeader, async (req, res) => {
  try {
    const [stats] = await db.execute(
      `SELECT
         COUNT(*) AS byose,
         SUM(CASE WHEN status = 'gutegereza' THEN 1 ELSE 0 END) AS gutegereza,
         SUM(CASE WHEN status = 'yemejwe'    THEN 1 ELSE 0 END) AS yakemutse,
         AVG(inyenyeri) AS gusuzuma_hagati
       FROM ibibazo WHERE umurenge_id = ?`,
      [req.params.id]
    );

    const [byAkagari] = await db.execute(
      `SELECT ak.izina AS akagari,
              COUNT(i.id) AS byose,
              SUM(CASE WHEN i.status = 'yemejwe' THEN 1 ELSE 0 END) AS yakemutse
       FROM akagari ak
       LEFT JOIN ibibazo i ON ak.id = i.akagari_id
       WHERE ak.umurenge_id = ?
       GROUP BY ak.id, ak.izina`,
      [req.params.id]
    );

    res.json({ success: true, data: { stats: stats[0], byAkagari } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Ikibazo mu gufata raporo.' });
  }
});

// ── GET /api/raporo/export - Kohereza Raporo (CSV) ─────────
router.get('/export', verifyToken, requireDistrict, async (req, res) => {
  try {
    const { itariki_itangira, itariki_irangira } = req.query;
    const [data] = await db.execute(
      `SELECT i.ticket_number, i.umutwe, i.icyiciro, i.status,
              i.urwego_rwahawe, i.created_at, i.yemejwe_igihe,
              a.amazina AS umuturage, ud.izina AS umudugudu,
              ak.izina AS akagari, um.izina AS umurenge
       FROM ibibazo i
       JOIN abakoresha a ON i.umuturage_id = a.id
       JOIN umudugudu ud ON i.umudugudu_id = ud.id
       LEFT JOIN akagari ak ON i.akagari_id = ak.id
       LEFT JOIN umurenge um ON i.umurenge_id = um.id
       WHERE i.akarere_id = ?
         AND (? IS NULL OR i.created_at >= ?)
         AND (? IS NULL OR i.created_at <= ?)
       ORDER BY i.created_at DESC`,
      [req.user.akarere_id,
       itariki_itangira || null, itariki_itangira || null,
       itariki_irangira || null, itariki_irangira || null]
    );

    // Gukora CSV
    const headers = ['Nimero','Umutwe','Icyiciro','Status','Urwego','Itariki','Umuturage','Umudugudu','Akagari','Umurenge'];
    const csv = [
      headers.join(','),
      ...data.map(r => [
        r.ticket_number, `"${r.umutwe}"`, r.icyiciro, r.status,
        r.urwego_rwahawe, r.created_at, `"${r.umuturage}"`,
        r.umudugudu, r.akagari, r.umurenge
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="raporo-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel
  } catch (err) {
    res.status(500).json({ success: false, message: 'Ikibazo mu kohereza raporo.' });
  }
});

module.exports = router;
