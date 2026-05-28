// ============================================================
// NIDA API Service - Rwanda National ID Validation
// ============================================================
const axios = require('axios');

/**
 * Kugenzura Indangamuntu na NIDA API
 * Validates a Rwandan National ID against the NIDA database
 *
 * @param {string} indangamuntu - 16-digit National ID number
 * @returns {Object} - NIDA validation result
 */
const kugenzuraIndangamuntu = async (indangamuntu) => {
  // Kugenzura imiterere y'indangamuntu (16 digits)
  if (!/^\d{16}$/.test(indangamuntu)) {
    return {
      valid: false,
      message: 'Indangamuntu igomba kuba imibare 16 gusa.',
      data: null
    };
  }

  try {
    // Iyo nta NIDA API yateganijwe cyangwa turi mu iterambere,
    // dukoresha response y'igerageza kugirango application ikore neza.
    const useMockNIDA = !process.env.NIDA_API_URL || process.env.NODE_ENV !== 'production';
    if (useMockNIDA) {
      return simulateNIDAResponse(indangamuntu);
    }

    // Production: Gukoresha NIDA API nyakuri
    const response = await axios.post(
      `${process.env.NIDA_API_URL}/verify`,
      { nid: indangamuntu },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NIDA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.status === 'success') {
      return {
        valid: true,
        message: 'Indangamuntu yemejwe na NIDA.',
        data: {
          amazina:        response.data.foreName + ' ' + response.data.surnames,
          itariki_amavuko: response.data.dateOfBirth,
          igitsina:       response.data.sex,
          aho_avukiye:    response.data.placeOfBirth,
          foto:           response.data.photo,
        }
      };
    }

    return { valid: false, message: 'Indangamuntu ntiyemejwe na NIDA.', data: null };

  } catch (error) {
    console.error('NIDA API Error:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        valid: false,
        message: 'NIDA API ntibashije gutumanahana. Gerageza nyuma.',
        data: null
      };
    }

    if (error.response?.status === 404) {
      return {
        valid: false,
        message: 'Indangamuntu ntiboneka muri NIDA.',
        data: null
      };
    }

    return {
      valid: false,
      message: 'Ikibazo mu kugenzura indangamuntu. Gerageza nyuma.',
      data: null
    };
  }
};

/**
 * Simulation ya NIDA mu gihe cy'iterambere (Development)
 */
const simulateNIDAResponse = (indangamuntu) => {
  // Indangamuntu zitangira na '1' ni iz'abagabo, '2' ni iz'abagore (simplified)
  const igitsina = indangamuntu.startsWith('1') ? 'Gabo' : 'Gore';

  const suffix = indangamuntu.slice(-4);
  const names = [
    'UWIMANA Jean Pierre',
    'HABIMANA Emmanuel',
    'MUKAMANA Alice',
    'NIYONZIMA Patrick',
    'BIZIMANA Robert',
    'MUKESHIMANA Ange',
    'NAZIRUTIYA Claire',
  ];
  const selectedName = names[parseInt(suffix, 10) % names.length];

  return {
    valid: true,
    message: 'Indangamuntu yemejwe (Simulation).',
    data: {
      amazina:         selectedName,
      itariki_amavuko: '1990-05-15',
      igitsina:        igitsina,
      aho_avukiye:     'Kigali',
      indangamuntu:    indangamuntu,
      foto:            null,
      _note:           'Ibi ni amakuru y\'igerageza gusa. Mu bikorwa nyakuri, amakuru avuye kuri NIDA.'
    }
  };
};

module.exports = { kugenzuraIndangamuntu };
