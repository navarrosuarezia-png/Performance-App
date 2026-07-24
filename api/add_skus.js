require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query(
    `INSERT INTO skus (code, description, bottle_volume_liters, brand) VALUES
      ('PC630RT', 'Pilsen Callao 630ml Retornable', 0.6300, 'Pilsen Callao'),
      ('CT620RT-TEL', 'Cristal Trujillo 620ml Retornable TEL', 0.6200, 'Cristal Trujillo')
    ON CONFLICT (code) DO NOTHING`
  );
  const { rows } = await pool.query('SELECT code, description, bottle_volume_liters FROM skus ORDER BY code');
  console.log('SKUs actuales:');
  rows.forEach(r => console.log(`  ${r.code} | ${r.description} | ${r.bottle_volume_liters}L`));
  process.exit(0);
})();
