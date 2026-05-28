const bcrypt = require('./node_modules/bcryptjs');

const password = 'Test@1234';
const storedHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

async function check() {
  console.log('Password:', password);
  console.log('Stored hash:', storedHash);
  
  const match = await bcrypt.compare(password, storedHash);
  console.log('Match result:', match);
  
  // Generate correct hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('New correct hash:', newHash);
  
  const verify = await bcrypt.compare(password, newHash);
  console.log('New hash verify:', verify);
}

check();
