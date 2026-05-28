// Gukora hash ikwiye kugira ngo tuyishyire muri seed.sql
const bcrypt = require('./node_modules/bcryptjs');

async function main() {
  const hash = await bcrypt.hash('Test@1234', 10);
  console.log('\nHash ikwiye ya "Test@1234":');
  console.log(hash);
  
  const verify = await bcrypt.compare('Test@1234', hash);
  console.log('Verification:', verify ? '✅ OK' : '❌ FAILED');
}

main();
