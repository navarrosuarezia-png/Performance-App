require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedData() {
  console.log('🌱 Iniciando llenado de datos realista...');
  try {
    // 1. Obtener IDs maestros
    const linesRes = await pool.query('SELECT * FROM lines');
    const lines = linesRes.rows;
    
    const skusRes = await pool.query('SELECT * FROM skus');
    const skus = skusRes.rows;

    const usersRes = await pool.query('SELECT * FROM profiles WHERE role = $1', ['operador']);
    const users = usersRes.rows;

    if (lines.length === 0 || skus.length === 0 || users.length === 0) {
      throw new Error('Faltan datos maestros (líneas, skus o usuarios).');
    }

    const today = new Date().toISOString().split('T')[0]; // Fecha actual
    
    // Limpiar logs de hoy por si acaso para no violar restricciones UNIQUE
    await pool.query('DELETE FROM hourly_logs WHERE production_date = $1', [today]);

    // Horarios por turno
    const shifts = {
      1: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
      2: ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
      3: ['23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00']
    };

    const incidentCategories = ['mecanica', 'electrica', 'insumos', 'operativa', 'servicios', 'calidad'];
    
    for (const line of lines) {
      console.log(`Llenando datos para ${line.name}...`);
      const isL3 = line.name.includes('3');
      const maxSpeed = line.nominal_speed_bph;
      const targetHl = line.target_hl_per_hour;
      
      // Asignar SKU aleatorio por línea
      const lineSku = isL3 
        ? skus.find(s => s.code === 'PT620RT') || skus[0] // Pilsen para L3
        : skus.find(s => s.code === 'CR650RT') || skus[1]; // Cristal para L1

      const operator = users.find(u => u.email.includes(isL3 ? '3' : '1')) || users[0];

      for (const [shiftNum, hours] of Object.entries(shifts)) {
        for (const hour of hours) {
          // Generar produccion aleatoria: entre 60% y 98% del máximo
          const efficiency = (Math.random() * (0.98 - 0.60) + 0.60);
          const bottles = Math.floor(maxSpeed * efficiency);
          
          let hourEndH = parseInt(hour.split(':')[0]) + 1;
          if (hourEndH === 24) hourEndH = 0;
          const hourEnd = `${hourEndH.toString().padStart(2, '0')}:00`;

          // Insertar log
          const logRes = await pool.query(
            `INSERT INTO hourly_logs 
            (line_id, production_date, shift_number, hour_start, hour_end, sku_id, bottles_produced, planned_hl, user_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [line.id, today, shiftNum, hour, hourEnd, lineSku.id, bottles, targetHl, operator.id]
          );

          // Un 20% de probabilidad de tener un incidente en esta hora si la eficiencia fue baja (< 75%)
          if (efficiency < 0.75 && Math.random() < 0.5) {
            const cat = incidentCategories[Math.floor(Math.random() * incidentCategories.length)];
            const downtime = Math.floor(Math.random() * 30) + 5; // 5 a 35 min
            await pool.query(
              `INSERT INTO incidents (hourly_log_id, category, downtime_minutes, priority, description, reported_by)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [logRes.rows[0].id, cat, downtime, downtime > 20 ? 'alta' : 'media', `Simulación de falla ${cat} causando ${downtime} min de paro.`, operator.id]
            );
          }
        }
      }
    }

    console.log('✅ Datos simulados insertados con éxito para la fecha:', today);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error llenando datos:', err);
    process.exit(1);
  }
}

seedData();
