// ============================================================
// Validation Middleware - Production Error Handler
// ============================================================
const { validationResult } = require('express-validator');

/**
 * Middleware yo kugenzura validation errors
 * Isubiza amakosa yuzuye kandi yumvikana
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Gukusanya amakosa yose mu buryo bwumvikana
    const formattedErrors = errors.array().map(err => ({
      field:   err.path || err.param || 'unknown',
      message: err.msg,
      value:   err.value !== undefined
        ? (typeof err.value === 'string' && err.value.length > 50
            ? err.value.substring(0, 50) + '...'
            : err.value)
        : undefined,
    }));

    // Ikibazo cya mbere gusa (kugira ngo ubutumwa busobanutse)
    const firstError = formattedErrors[0];

    return res.status(422).json({
      success: false,
      message: firstError.message,
      errors:  formattedErrors,
    });
  }
  next();
};

module.exports = validate;
