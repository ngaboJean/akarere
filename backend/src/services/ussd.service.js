// ============================================================
// USSD Service - Simulated mobile menu for system access
// ============================================================

const formatMenu = (lines) => lines.join('\n');

const buildMainMenu = () => formatMenu([
  'Murakaza neza kuri System y\'Ibanze',
  '1. Iyandikishe',
  '2. Injira',
  '3. Gutanga Ikibazo',
  '4. Ubufasha',
  '0. Sohoka',
]);

const handleUssdSession = ({ sessionId, phoneNumber, text }) => {
  const rawText = (text || '').trim();
  const steps = rawText.length ? rawText.split('*').filter(Boolean) : [];
  const stage = steps.length;
  const input = steps[stage - 1] || '';

  if (stage === 0) {
    return { message: buildMainMenu(), endSession: false };
  }

  switch (steps[0]) {
    case '1':
      if (stage === 1) {
        return {
          message: 'Shyiramo indangamuntu yawe ya 16. Urugero: 1199780123456789',
          endSession: false,
        };
      }
      if (stage === 2) {
        return {
          message: 'Turimo kwakira ubusabe bwawe bwo kwiyandikisha. Tuzakumenyesha vuba.',
          endSession: true,
        };
      }
      break;

    case '2':
      if (stage === 1) {
        return {
          message: 'Shyiramo telefoni ukoresha cyangwa indangamuntu:',
          endSession: false,
        };
      }
      if (stage === 2) {
        return {
          message: 'Twakiriye ubusabe bwawe bwo kwinjira. Ongera ugerageze mu minota mike.',
          endSession: true,
        };
      }
      break;

    case '3':
      if (stage === 1) {
        return {
          message: formatMenu([
            'Hitamo icyiciro cy\'ikibazo:',
            '1. Umutekano',
            '2. Isuku',
            '3. Imibereho',
            '4. Ibikorwa remezo',
            '0. Subira inyuma',
          ]),
          endSession: false,
        };
      }
      if (stage === 2) {
        const categories = {
          '1': 'umutekano',
          '2': 'isuku',
          '3': 'imibereho',
          '4': 'ibikorwa remezo',
        };
        const category = categories[input] || 'icyiciro kitazwi';

        return {
          message: `Twakiriye icyifuzo cyawe ku cyiciro: ${category}. Tuzakumenyesha uko giteye.`, 
          endSession: true,
        };
      }
      break;

    case '4':
      return {
        message: formatMenu([
          'Ushobora kutwandikira kuri:',
          'Email: support@systemyibanze.rw',
          'Telefoni: 0781234567',
          'Murakoze gukoresha System y\'Ibanze.',
        ]),
        endSession: true,
      };

    case '0':
      return {
        message: 'Murakoze. Murakoze gukoresha System y\'Ibanze.',
        endSession: true,
      };

    default:
      return {
        message: `Ihitamo ryanyu '${steps[0]}' ntabwo ryemewe.\n\n${buildMainMenu()}`,
        endSession: false,
      };
  }

  return {
    message: 'Habayeho ikibazo mu gusobanukirwa USSD yawe. Ongera ugerageze.',
    endSession: true,
  };
};

module.exports = { handleUssdSession };
