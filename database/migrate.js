// ============================================================
// Database Migration Script
// Kohereza: node database/migrate.js
// ============================================================
require('dotenv').config({ path: '../backend/.env' });
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function migrate() {
  let connection;
  try {
    console.log('🔄 Gutangira migration...');

    connection = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    // Gusoma schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema     = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Gukora tables...');
    await connection.query(schema);
    console.log('✅ Tables zarakozwe neza!');

    // Gusoma seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      console.log('🌱 Gushyiraho amakuru y\'igerageza...');
      await connection.query(seed);
      console.log('✅ Amakuru y\'igerageza yashyizweho!');
    }

    console.log('\n🎉 Migration yarangiye neza!');
    console.log('\n📝 Abakoresha b\'Igerageza:');
    console.log('   Umuturage:    indangamuntu=1199780123456789 | ijambo_banga=Test@1234');
    console.log('   Umukuru:      indangamuntu=1199780234567890 | ijambo_banga=Test@1234');
    console.log('   ES Akagari:   indangamuntu=1199780345678901 | ijambo_banga=Test@1234');
    console.log('   ES Umurenge:  indangamuntu=1199780456789012 | ijambo_banga=Test@1234');
    console.log('   Admin Akarere:indangamuntu=1199780567890123 | ijambo_banga=Test@1234');

  } catch (err) {
    console.error('❌ Migration yarananiranye:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
