require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('UPDATE profiles SET password_hash = $1 WHERE email = $2', ['12345', 'Rodolfo@gmail.com'])
  .then(() => console.log('Password set'))
  .catch(console.error)
  .finally(() => pool.end());
