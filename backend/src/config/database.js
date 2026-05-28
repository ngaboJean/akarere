// ============================================================
// Database Configuration - MySQL Connection Pool
// ============================================================
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'system_yibanze',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+02:00', // Rwanda Time (CAT)
});

// Kugenzura Connexion
pool.getConnection()
  .then(conn => {
    console.log('✅ Connexion ya Database yagenze neza!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Connexion ya Database yarananiranye:', err.message);
    process.exit(1);
  });

module.exports = pool;
