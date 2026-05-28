// ============================================================
// Notifications Utility - Ohereza Ubutumwa
// ============================================================
const db = require('../config/database');

/**
 * Ohereza ubutumwa kuri umukoresha umwe
 */
const sendNotification = async (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id = null) => {
  try {
    await db.execute(
      `INSERT INTO ubutumwa (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id]
    );
    return true;
  } catch (err) {
    console.error('Notification Error:', err.message);
    return false;
  }
};

/**
 * Ohereza ubutumwa ku bayobozi b'urwego runaka
 */
const notifyLeadersByLevel = async (level, locationId, umutwe, ibisobanuro, reference_id = null) => {
  try {
    const roleMap = {
      umudugudu: { role_id: 2, field: 'umudugudu_id' },
      akagari:   { role_id: 3, field: 'akagari_id' },
      umurenge:  { role_id: 4, field: 'umurenge_id' },
      akarere:   { role_id: 5, field: 'akarere_id' },
    };

    const config = roleMap[level];
    if (!config) return;

    const [leaders] = await db.execute(
      `SELECT id FROM abakoresha WHERE role_id = ? AND ${config.field} = ? AND status = 'active'`,
      [config.role_id, locationId]
    );

    for (const leader of leaders) {
      await sendNotification(leader.id, 'ikibazo', umutwe, ibisobanuro, reference_id);
    }
  } catch (err) {
    console.error('Notify Leaders Error:', err.message);
  }
};

/**
 * Gukora ticket number idasanzwe
 */
const generateTicketNumber = (prefix = 'ISS') => {
  const year    = new Date().getFullYear();
  const random  = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${year}-${random}`;
};

/**
 * Gukora certificate number idasanzwe
 */
const generateCertNumber = () => {
  const year   = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `CERT-${year}-${random}`;
};

module.exports = {
  sendNotification,
  notifyLeadersByLevel,
  generateTicketNumber,
  generateCertNumber,
};
