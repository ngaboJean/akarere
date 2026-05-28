// ============================================================
// USSD Routes - Simulated mobile USSD gateway handler
// ============================================================
const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { ussdValidator } = require('../validators/schemas');
const { handleUssdSession } = require('../services/ussd.service');

router.post('/', ussdValidator, validate, async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;

  try {
    const result = handleUssdSession({ sessionId, phoneNumber, text });
    return res.json({
      success: true,
      sessionId,
      endSession: result.endSession,
      message: result.message,
    });
  } catch (err) {
    console.error('USSD Route Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Ikibazo mu gutunganya USSD. Gerageza nyuma.',
    });
  }
});

module.exports = router;
