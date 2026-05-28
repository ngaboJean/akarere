// Fix passwords in database - generate correct bcrypt hashes
require('dotenv').config();
const bcrypt = require('./node_modules/bcryptjs');
const mysql  = require('./node_modules/mysql2/promise');

async function fixPasswords() {
  console.log('\n🔧 Gukosora amagambo banga mu database...\n');

  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'system_yibanze',
  });

  try {
    // Generate correct hash for Test@1234
    const password = 'Test@1234';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Verify it works
    const verify = await bcrypt.compare(password, hash);
    console.log('Verification:', verify ? '✅ OK' : '❌ FAILED');
    
    if (!verify) {
      throw new Error('Hash verification failed!');
    }

    // Update all test users
    const [result] = await connection.execute(
      'UPDATE abakoresha SET ijambo_banga = ?',
      [hash]
    );
    
    console.log(`\n✅ Abakoresha ${result.affectedRows} bavuguruwe neza!`);

    // Verify login works
    const [users] = await connection.execute(
      'SELECT id, amazina, indangamuntu, telephone, ijambo_banga FROM abakoresha'
    );

    console.log('\n🔍 Kugenzura abakoresha:');
    for (const user of users) {
      const ok = await bcrypt.compare(password, user.ijambo_banga);
      console.log(`   ${ok ? '✅' : '❌'} ${user.amazina} (${user.indangamuntu})`);
    }

    console.log('\n✅ Byose byakozwe neza!');
    console.log('\n📋 Injira na:');
    console.log('   Indangamuntu: 1199780123456789');
    console.log('   Ijambo banga: Test@1234');

  } finally {
    await connection.end();
  }
}

fixPasswords().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
