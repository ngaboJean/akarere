// ============================================================
// Migration Runner - System y'Ibanze
// Kohereza: node run_migration.js (uvuye muri database/)
//       cyangwa: node database/run_migration.js (uvuye muri root)
// ============================================================

// Gukoresha node_modules za backend
const path = require('path');
const fs   = require('fs');

// Shaka backend node_modules
const backendPath = path.join(__dirname, '../backend');
const envPath     = path.join(backendPath, '.env');

// Load .env manually (nta dotenv)
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
  console.log('✅ .env file yasomwe neza');
} else {
  console.warn('⚠️  .env file ntiboneka, tukoresha defaults');
}

// Load mysql2 from backend node_modules
const mysql2Path = path.join(backendPath, 'node_modules', 'mysql2', 'promise');
const mysql = require(mysql2Path);

const DB_CONFIG = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset:            'utf8mb4',
};

const schemaPath = path.join(__dirname, 'schema.sql');
const seedPath   = path.join(__dirname, 'seed.sql');

async function runMigration() {
  console.log('\n🇷🇼  System y\'Ibanze - Database Migration');
  console.log('='.repeat(55));
  console.log(`📡 Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log(`👤 User: ${DB_CONFIG.user}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'system_yibanze'}`);
  console.log('='.repeat(55));

  let connection;

  try {
    // ── 1. Guhuza na MySQL ────────────────────────────────
    console.log('\n📡 Guhuza na MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connexion yagenze neza!');

    // ── 2. Gukora database ────────────────────────────────
    const dbName = process.env.DB_NAME || 'system_yibanze';
    console.log(`\n📦 Gukora database "${dbName}"...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${dbName}\``);
    console.log('✅ Database yashyizweho!');

    // ── 3. Gukuraho tables za kera ────────────────────────
    console.log('\n🗑️  Gukuraho tables za kera (fresh migration)...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const [tables] = await connection.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${dbName}'`
    );

    if (tables.length > 0) {
      for (const row of tables) {
        const tName = row.table_name || row.TABLE_NAME;
        await connection.query(`DROP TABLE IF EXISTS \`${tName}\``);
        console.log(`   🗑  Yakuweho: ${tName}`);
      }
    } else {
      console.log('   (Nta tables zihari)');
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tables za kera zakuweho!');

    // ── 4. Gushyiraho schema ──────────────────────────────
    console.log('\n📋 Gushyiraho schema...');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file ntiboneka: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Gutandukanya SQL statements neza
    const statements = parseSQL(schema);
    let tableCount = 0;
    let indexCount = 0;
    let insertCount = 0;

    for (const stmt of statements) {
      const upper = stmt.toUpperCase().trim();
      if (!upper) continue;

      try {
        await connection.query(stmt);

        if (upper.startsWith('CREATE TABLE')) {
          const m = stmt.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i);
          if (m) { console.log(`   ✓ Table: ${m[1]}`); tableCount++; }
        } else if (upper.startsWith('CREATE INDEX') || upper.startsWith('CREATE UNIQUE INDEX')) {
          indexCount++;
        } else if (upper.startsWith('INSERT')) {
          insertCount++;
        }
      } catch (err) {
        const msg = err.message || '';
        // Skip harmless errors
        if (msg.includes('Duplicate entry') ||
            msg.includes('already exists') ||
            msg.includes('Duplicate key name')) {
          // Ignore
        } else if (upper.startsWith('SET ') || upper.startsWith('USE ')) {
          // Ignore SET/USE errors
        } else {
          console.warn(`   ⚠️  Warning [${upper.substring(0,30)}...]: ${msg.substring(0,100)}`);
        }
      }
    }

    console.log(`\n✅ Schema yashyizweho:`);
    console.log(`   • Tables:  ${tableCount}`);
    console.log(`   • Indexes: ${indexCount}`);
    console.log(`   • Inserts: ${insertCount}`);

    // ── 5. Seed data ──────────────────────────────────────
    console.log('\n🌱 Gushyiraho amakuru y\'igerageza...');

    if (!fs.existsSync(seedPath)) {
      console.warn('   ⚠️  Seed file ntiboneka, tuzirengagiza.');
    } else {
      const seed = fs.readFileSync(seedPath, 'utf8');
      const seedStmts = parseSQL(seed);
      let seedRows = 0;

      for (const stmt of seedStmts) {
        if (!stmt.trim()) continue;
        try {
          const [result] = await connection.query(stmt);
          if (result && result.affectedRows) seedRows += result.affectedRows;
        } catch (err) {
          const msg = err.message || '';
          if (!msg.includes('Duplicate entry') && !msg.includes('Duplicate key')) {
            console.warn(`   ⚠️  Seed: ${msg.substring(0, 100)}`);
          }
        }
      }
      console.log(`✅ Seed data yashyizweho: ${seedRows} rows`);
    }

    // ── 6. Verification ───────────────────────────────────
    console.log('\n🔍 Kugenzura tables...');
    const [finalTables] = await connection.query(
      `SELECT table_name, table_rows
       FROM information_schema.tables
       WHERE table_schema = '${dbName}'
       ORDER BY table_name`
    );

    console.log('\n   ┌─────────────────────────────┬───────┐');
    console.log('   │ Table                       │ Rows  │');
    console.log('   ├─────────────────────────────┼───────┤');
    for (const t of finalTables) {
      const name = (t.table_name || t.TABLE_NAME).padEnd(27);
      const rows = String(t.table_rows || t.TABLE_ROWS || 0).padStart(5);
      console.log(`   │ ${name} │ ${rows} │`);
    }
    console.log('   └─────────────────────────────┴───────┘');

    // ── 7. Abakoresha b'igerageza ─────────────────────────
    const [users] = await connection.query(
      `SELECT a.amazina, a.indangamuntu, a.telephone, r.izina AS uruhare
       FROM abakoresha a
       JOIN roles r ON a.role_id = r.id
       ORDER BY a.role_id`
    );

    console.log('\n👥 Abakoresha b\'Igerageza (Ijambo banga: Test@1234):');
    console.log('   ┌──────────────────────────┬──────────────────┬──────────────┬──────────────────────────┐');
    console.log('   │ Amazina                  │ Indangamuntu     │ Telefoni     │ Uruhare                  │');
    console.log('   ├──────────────────────────┼──────────────────┼──────────────┼──────────────────────────┤');
    for (const u of users) {
      const amazina  = u.amazina.padEnd(24);
      const id       = u.indangamuntu.padEnd(16);
      const tel      = u.telephone.padEnd(12);
      const uruhare  = u.uruhare.padEnd(24);
      console.log(`   │ ${amazina} │ ${id} │ ${tel} │ ${uruhare} │`);
    }
    console.log('   └──────────────────────────┴──────────────────┴──────────────┴──────────────────────────┘');

    // ── 8. Summary ────────────────────────────────────────
    console.log('\n' + '='.repeat(55));
    console.log('🎉 Migration yarangiye neza!');
    console.log('='.repeat(55));
    console.log('\n📋 Intambwe zikurikira:');
    console.log('\n  1️⃣  Tangira Backend:');
    console.log('     cd backend');
    console.log('     npm run dev');
    console.log('\n  2️⃣  Tangira Frontend (terminal nshya):');
    console.log('     cd frontend');
    console.log('     npm install');
    console.log('     npm start');
    console.log('\n  3️⃣  Kugenzura API:');
    console.log('     http://localhost:5000/api/health');
    console.log('\n  4️⃣  Injira muri sisitemu:');
    console.log('     http://localhost:3000');
    console.log('     Indangamuntu: 1199780123456789');
    console.log('     Ijambo banga: Test@1234');
    console.log('='.repeat(55) + '\n');

  } catch (err) {
    console.error('\n❌ Migration yarananiranye!');
    console.error('   Ikosa:', err.message);

    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL ntikora. Intambwe zo gukemura:');
      console.error('   1. Fungura XAMPP Control Panel');
      console.error('   2. Kanda "Start" hafi ya MySQL');
      console.error('   3. Gerageza nanone');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Password ntiyemezwa. Kugenzura .env file:');
      console.error('   DB_USER=root');
      console.error('   DB_PASSWORD=  (nta password kuri XAMPP default)');
    }

    process.exit(1);
  } finally {
    if (connection) {
      try { await connection.end(); } catch {}
    }
  }
}

// ── Helper: Parse SQL statements ─────────────────────────────
function parseSQL(sql) {
  const results = [];
  let current   = '';
  let inString  = false;
  let strChar   = '';
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < sql.length; i++) {
    const ch   = sql[i];
    const next = sql[i + 1] || '';

    // Line comment
    if (!inString && !inComment && ch === '-' && next === '-') {
      inLineComment = true;
    }
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }

    // Block comment
    if (!inString && ch === '/' && next === '*') {
      inComment = true; i++; continue;
    }
    if (inComment && ch === '*' && next === '/') {
      inComment = false; i++; continue;
    }
    if (inComment) continue;

    // String handling
    if (!inString && (ch === "'" || ch === '"' || ch === '`')) {
      inString = true; strChar = ch;
    } else if (inString && ch === strChar && sql[i-1] !== '\\') {
      inString = false;
    }

    // Statement separator
    if (!inString && ch === ';') {
      const stmt = current.trim();
      if (stmt) results.push(stmt);
      current = '';
      continue;
    }

    current += ch;
  }

  const last = current.trim();
  if (last) results.push(last);

  return results.filter(s => s.length > 0);
}

runMigration();
