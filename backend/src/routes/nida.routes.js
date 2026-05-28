// ============================================================
// NIDA Routes - National ID Validation (Production-Grade)
// ============================================================
const express = require('express');
const router  = express.Router();
const { kugenzuraIndangamuntu } = require('../services/nida.service');
const validate                  = require('../middleware/validate.middleware');
const { nidaValidator }         = require('../validators/schemas');
const { nidaLimiter }           = require('../middleware/security.middleware');

// ── POST /api/nida/genzura ──────────────────────────────────
router.post('/genzura', nidaLimiter, nidaValidator, validate, async (req, res) => {
  const { indangamuntu } = req.body;

  try {
    const result = await kugenzuraIndangamuntu(indangamuntu);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        field: 'indangamuntu',
      });
    }

    // Ntitwohereze amakuru yose ya NIDA (security - data minimization)
    res.json({
      success: true,
      message: result.message,
      data: {
        amazina:         result.data.amazina,
        itariki_amavuko: result.data.itariki_amavuko,
        igitsina:        result.data.igitsina,
        aho_avukiye:     result.data.aho_avukiye,
        // Ntitwohereze foto mu response (bandwidth + privacy)
      },
    });

  } catch (err) {
    console.error('NIDA Route Error:', err);
    res.status(500).json({
      success: false,
      message: 'Ikibazo mu kugenzura indangamuntu. Gerageza nyuma.',
    });
  }
});

module.exports = router;
