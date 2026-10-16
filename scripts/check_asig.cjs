const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/siga_cetpro'
});

async function check() {
  const asig = await pool.query(`SELECT count(*) FROM asignaciones_trabajadores`);
  console.log('Asignaciones trabajadores count:', asig.rows[0].count);

  const trabs = await pool.query(`SELECT id FROM trabajadores LIMIT 3`);
  console.log('Trabajadores disponibles:', trabs.rows.length);

  // Let's see columns in secciones
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'secciones'
  `);
  console.log('Columnas de secciones:', cols.rows.map(c => c.column_name));

  await pool.end();
}
check().catch(console.error);
