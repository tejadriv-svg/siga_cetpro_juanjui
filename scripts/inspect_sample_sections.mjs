import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(':5432/', ':6543/'),
  ssl: { rejectUnauthorized: false }
});

async function inspectProgramsModules() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT 
        p.id as programa_id,
        p.nombre as programa_nombre,
        p.codigo as programa_codigo,
        pe.id as plan_estudio_id,
        pe.codigo as plan_codigo,
        m.id as modulo_id,
        m.codigo as modulo_codigo,
        m.nombre as modulo_nombre,
        m.orden as modulo_orden
      FROM programas p
      JOIN planes_estudios pe ON pe.programa_id = p.id
      JOIN modulos m ON m.plan_estudio_id = pe.id
      WHERE (
        p.nombre ILIKE '%costura y acabados%' OR
        p.nombre ILIKE '%soporte t_cnico%' OR
        p.nombre ILIKE '%apoyo administrativo%'
      )
      ORDER BY p.nombre, m.orden;
    `);

    console.log('PROGRAMAS Y MÓDULOS:');
    console.table(res.rows);

    const periodos2026 = await client.query(`
      SELECT 
        pc.id as periodo_clases_id,
        pc.codigo as periodo_clases_codigo,
        pa.id as periodo_academico_id,
        pa.codigo as periodo_academico_codigo,
        pc.fecha_inicio,
        pc.fecha_fin
      FROM periodos_clases pc
      JOIN periodos_academicos pa ON pc.periodo_academico_id = pa.id
      WHERE pa.codigo LIKE '2026%'
      ORDER BY pa.codigo;
    `);

    console.log('\nPERIODOS 2026:');
    console.table(periodos2026.rows);

  } finally {
    client.release();
    await pool.end();
  }
}

inspectProgramsModules().catch(console.error);
