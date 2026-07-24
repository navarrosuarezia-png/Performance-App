require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createUser() {
  try {
    const res = await pool.query(
      `INSERT INTO profiles (email, full_name, role) 
       VALUES ($1, $2, $3) RETURNING *`,
      ['Rodolfo@gmail.com', 'Rodolfo', 'operador']
    );
    console.log('Usuario creado exitosamente:', res.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      console.log('El usuario ya existe. Actualizando...');
      const res = await pool.query(
        `UPDATE profiles SET full_name = $2, role = $3 WHERE email = $1 RETURNING *`,
        ['Rodolfo@gmail.com', 'Rodolfo', 'operador']
      );
      console.log('Usuario actualizado:', res.rows[0]);
    } else {
      console.error('Error creando usuario:', err);
    }
  } finally {
    pool.end();
  }
}

createUser();
