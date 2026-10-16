const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/siga_cetpro'
});

async function run() {
  console.log('--- Sincronizando y poblando secciones_unidades ---');
  
  const secCount = await pool.query('SELECT count(*) FROM secciones');
  const uniCount = await pool.query('SELECT count(*) FROM unidades_didacticas');
  console.log(`Secciones existentes: ${secCount.rows[0].count}`);
  console.log(`Unidades didácticas existentes: ${uniCount.rows[0].count}`);

  const insertQuery = `
    INSERT INTO secciones_unidades (
      seccion_id, unidad_id, docente_id, fecha_inicio, fecha_fin,
      horas, creditos, estado, fecha_registro, fecha_actualizacion
    )
    SELECT 
      s.id as seccion_id,
      u.id as unidad_id,
      COALESCE(
        (SELECT at.trabajador_id FROM asignaciones_trabajadores at WHERE at.seccion_id = s.id AND (at.unidad_id = u.id OR at.unidad_id IS NULL) LIMIT 1),
        (SELECT at2.trabajador_id FROM asignaciones_trabajadores at2 WHERE at2.seccion_id = s.id LIMIT 1),
        (SELECT t.id FROM trabajadores t LIMIT 1)
      ) as docente_id,
      COALESCE(pc.fecha_inicio, CURRENT_DATE) as fecha_inicio,
      COALESCE(pc.fecha_fin, CURRENT_DATE + INTERVAL '4 months') as fecha_fin,
      COALESCE(u.horas, 0) as horas,
      COALESCE(u.creditos, 0) as creditos,
      'PROGRAMADA' as estado,
      CURRENT_TIMESTAMP as fecha_registro,
      CURRENT_TIMESTAMP as fecha_actualizacion
    FROM secciones s
    JOIN unidades_didacticas u ON u.modulo_id = s.modulo_id
    LEFT JOIN periodos_clases pc ON s.periodo_clases_id = pc.id
    ON CONFLICT (seccion_id, unidad_id) DO UPDATE SET
      docente_id = COALESCE(secciones_unidades.docente_id, EXCLUDED.docente_id),
      horas = COALESCE(secciones_unidades.horas, EXCLUDED.horas),
      creditos = COALESCE(secciones_unidades.creditos, EXCLUDED.creditos),
      fecha_actualizacion = CURRENT_TIMESTAMP
    RETURNING id;
  `;

  const res = await pool.query(insertQuery);
  console.log(`Registros procesados/insertados en secciones_unidades: ${res.rowCount}`);

  const total = await pool.query(`
    SELECT count(*) as total,
           count(docente_id) as con_docente,
           count(fecha_inicio) as con_fecha
    FROM secciones_unidades
  `);
  console.log('Estadísticas finales de secciones_unidades:', total.rows[0]);

  const sample = await pool.query(`
    SELECT su.id, s.nombre as seccion, u.codigo as unidad, su.fecha_inicio, su.fecha_fin, su.horas, su.creditos, su.estado
    FROM secciones_unidades su
    JOIN secciones s ON su.seccion_id = s.id
    JOIN unidades_didacticas u ON su.unidad_id = u.id
    ORDER BY s.nombre, u.codigo
    LIMIT 10;
  `);
  console.log('Muestra de 10 registros cargados en PostgreSQL:');
  console.table(sample.rows);

  await pool.end();
  console.log('--- Poblado completado exitosamente ---');
}

run().catch((err) => {
  console.error('Error poblando secciones_unidades:', err);
  process.exit(1);
});
