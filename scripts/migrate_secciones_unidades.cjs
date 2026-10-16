const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/siga_cetpro'
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL...');
    const ddl = `
      CREATE TABLE IF NOT EXISTS public.secciones_unidades (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
          unidad_id UUID NOT NULL REFERENCES public.unidades_didacticas(id) ON DELETE CASCADE,
          docente_id UUID REFERENCES public.trabajadores(id) ON DELETE SET NULL,
          fecha_inicio DATE NOT NULL,
          fecha_fin DATE NOT NULL,
          horas INTEGER,
          creditos NUMERIC(8, 2),
          estado VARCHAR(30) DEFAULT 'PROGRAMADA' NOT NULL,
          observaciones TEXT,
          fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT secciones_unidades_unique UNIQUE (seccion_id, unidad_id),
          CONSTRAINT secciones_unidades_fechas_check CHECK (fecha_fin >= fecha_inicio)
      );

      CREATE INDEX IF NOT EXISTS idx_secciones_unidades_seccion ON public.secciones_unidades(seccion_id);
      CREATE INDEX IF NOT EXISTS idx_secciones_unidades_unidad ON public.secciones_unidades(unidad_id);
      CREATE INDEX IF NOT EXISTS idx_secciones_unidades_docente ON public.secciones_unidades(docente_id);
    `;
    await client.query(ddl);
    console.log('✅ Table secciones_unidades and indexes created successfully!');
  } catch (err) {
    console.error('❌ Error executing DDL:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
