import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://postgres.tejadriv-svg:A9t6!X4kL9#mQ2$z@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function regularize() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Iniciando regularización para estudiante Breydy Carito Acosta Guevara (DNI 47794662)...');

    // 1. Regularizar Matrícula 1 (M1)
    // ID: 49f144ec-390f-4bc6-9822-3af428faec9c
    // Reasignar seccion_id a la sección oficial de 2025-1: SEC-S3496-1-001-M1-2025-1-A (id: 41fd9bd7-626e-4060-9ff4-4a2f57ce3e55)
    const resM1 = await client.query(`
      UPDATE matriculas
      SET seccion_id = '41fd9bd7-626e-4060-9ff4-4a2f57ce3e55'
      WHERE id = '49f144ec-390f-4bc6-9822-3af428faec9c'
      RETURNING id, codigo_matricula, seccion_id, periodo_academico_id;
    `);
    console.log('Matrícula 1 actualizada:', resM1.rows[0]);

    // 2. Regularizar Matrícula 2 (M2)
    // ID: 63317320-1736-49b3-8722-ef067c744615
    // Reasignar seccion_id a la sección oficial de 2025-2: SEC-S3496-1-001-M2-2025-2-A (id: 5945f319-7d05-4b61-a95d-e44ad0142e3d)
    // Reasignar periodo_academico_id al periodo 2025-2 (id: e5991b05-2c1e-4929-9634-9c4410cc0255)
    // Actualizar codigo_matricula a '47794662-S3496-1-001-M2-2025-2'
    const resM2 = await client.query(`
      UPDATE matriculas
      SET seccion_id = '5945f319-7d05-4b61-a95d-e44ad0142e3d',
          periodo_academico_id = 'e5991b05-2c1e-4929-9634-9c4410cc0255',
          codigo_matricula = '47794662-S3496-1-001-M2-2025-2'
      WHERE id = '63317320-1736-49b3-8722-ef067c744615'
      RETURNING id, codigo_matricula, seccion_id, periodo_academico_id;
    `);
    console.log('Matrícula 2 actualizada:', resM2.rows[0]);

    // 3. Eliminar la sección fantasma que quedó vacía: SEC-S3496-1-001-M2-2025-1-A (id: 25e4944d-720b-4941-8b90-d40331911ede)
    // Verificar primero que ya no tenga matriculados
    const countCheck = await client.query(`
      SELECT count(*) as count FROM matriculas WHERE seccion_id = '25e4944d-720b-4941-8b90-d40331911ede';
    `);
    console.log('Alumnos restantes en sección fantasma:', countCheck.rows[0].count);

    if (parseInt(countCheck.rows[0].count, 10) === 0) {
      await client.query(`
        DELETE FROM secciones WHERE id = '25e4944d-720b-4941-8b90-d40331911ede';
      `);
      console.log('Sección fantasma SEC-S3496-1-001-M2-2025-1-A eliminada con éxito.');
    }

    // 4. Actualizar conteos de matriculados en las secciones correspondientes
    // M1 2025-1: 41fd9bd7-626e-4060-9ff4-4a2f57ce3e55
    await client.query(`
      UPDATE secciones s
      SET matriculados = (SELECT count(*) FROM matriculas m WHERE m.seccion_id = s.id)
      WHERE s.id IN ('41fd9bd7-626e-4060-9ff4-4a2f57ce3e55', '5945f319-7d05-4b61-a95d-e44ad0142e3d', '55e81240-459b-44d6-b097-b32b7d9ffb05');
    `);

    // Consultar el estado final de las secciones afectadas
    const secStatus = await client.query(`
      SELECT id, codigo, nombre, matriculados FROM secciones
      WHERE id IN ('41fd9bd7-626e-4060-9ff4-4a2f57ce3e55', '5945f319-7d05-4b61-a95d-e44ad0142e3d', '55e81240-459b-44d6-b097-b32b7d9ffb05')
      ORDER BY codigo;
    `);
    console.log('Estado de secciones actualizadas:', secStatus.rows);

    await client.query('COMMIT');
    console.log('Regularización completada exitosamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la regularización:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

regularize();
