require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- Lines ---
app.get('/api/lines', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM lines ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lines/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM lines WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Line not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SKUs ---
app.get('/api/skus', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM skus ORDER BY code');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Profiles / Auth ---
app.get('/api/profiles', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, full_name, role FROM profiles');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT id, email, full_name, role, password_hash FROM profiles WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    const user = rows[0];
    if (user.password_hash && user.password_hash !== password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Remove password from response
    delete user.password_hash;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Hourly Logs ---
app.get('/api/hourly-logs', async (req, res) => {
  try {
    const { date, line_id, shift } = req.query;
    let query = 'SELECT * FROM hourly_logs WHERE 1=1';
    const params = [];
    
    if (date) { params.push(date); query += ` AND production_date = $${params.length}`; }
    if (line_id) { params.push(line_id); query += ` AND line_id = $${params.length}`; }
    if (shift) { params.push(shift); query += ` AND shift_number = $${params.length}`; }
    
    const { rows } = await pool.query(query + ' ORDER BY hour_start', params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hourly-logs', async (req, res) => {
  try {
    let { 
      line_id, date, shift, hour_block, sku_id, 
      bottles_produced, target_hl, operator_id, notes 
    } = req.body;
    
    const hour_start = hour_block;
    // Calculate hour_end simply by adding 1 hour to the string 'HH:MM'
    let hourEndH = parseInt(hour_start.split(':')[0]) + 1;
    if (hourEndH === 24) hourEndH = 0;
    const hour_end = `${hourEndH.toString().padStart(2, '0')}:00`;

    // Check if exists
    const check = await pool.query(
      'SELECT id FROM hourly_logs WHERE line_id = $1 AND production_date = $2 AND shift_number = $3 AND hour_start = $4',
      [line_id, date, shift, hour_start]
    );
    
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Log already exists for this hour' });
    }

    const { rows } = await pool.query(
      `INSERT INTO hourly_logs (line_id, production_date, shift_number, hour_start, hour_end, sku_id, bottles_produced, planned_hl, user_id, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [line_id, date, shift, hour_start, hour_end, sku_id, bottles_produced, target_hl, operator_id, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/hourly-logs/:id', async (req, res) => {
  try {
    const { bottles_produced, notes } = req.body;
    const { rows } = await pool.query(
      'UPDATE hourly_logs SET bottles_produced = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [bottles_produced, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Incidents ---
app.get('/api/incidents', async (req, res) => {
  try {
    const { hourly_log_id, date, line_id, shift } = req.query;
    let query = `
      SELECT i.*, hl.production_date, hl.shift_number, hl.hour_start, hl.line_id
      FROM incidents i
      LEFT JOIN hourly_logs hl ON i.hourly_log_id = hl.id
      WHERE 1=1
    `;
    const params = [];
    
    if (hourly_log_id) {
      params.push(hourly_log_id);
      query += ` AND i.hourly_log_id = $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND hl.production_date = $${params.length}`;
    }
    if (line_id) {
      params.push(line_id);
      query += ` AND hl.line_id = $${params.length}`;
    }
    if (shift) {
      params.push(shift);
      query += ` AND hl.shift_number = $${params.length}`;
    }

    query += ' ORDER BY hl.production_date DESC, hl.shift_number DESC, hl.hour_start DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/incidents', async (req, res) => {
  try {
    const { hourly_log_id, category, downtime_minutes, priority, description, reported_by } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO incidents (hourly_log_id, category, downtime_minutes, priority, description, reported_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [hourly_log_id, category, downtime_minutes, priority, description, reported_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard Views ---
app.get('/api/dashboard/hourly', async (req, res) => {
  try {
    const { date, line_id } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM v_hourly_performance WHERE production_date = $1 AND line_id = $2 ORDER BY hour_start',
      [date, line_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
