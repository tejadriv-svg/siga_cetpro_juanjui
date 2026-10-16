import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import { INSTITUCION_ACTUAL, PROGRAMAS_SEED } from '../data/initialData.js';

dotenv.config();

const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.SQL_HOST,
        user: process.env.SQL_ADMIN_USER,
        password: process.env.SQL_ADMIN_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: false,
      }
);

const db = drizzle(pool, { schema });

async function seed() {
  console.log('Seeding Database...');
  
  // 1. Seed CETPRO
  console.log('Seeding CETPRO...');
  const [cetpro] = await db.insert(schema.cetpros).values({
    nombre: INSTITUCION_ACTUAL.nombre,
    codigoModular: INSTITUCION_ACTUAL.codigoModular,
    codigoLocal: INSTITUCION_ACTUAL.codigoLocal,
    ruc: INSTITUCION_ACTUAL.ruc,
    dreGre: INSTITUCION_ACTUAL.dre,
    ugel: INSTITUCION_ACTUAL.ugel,
    direccion: INSTITUCION_ACTUAL.direccion,
    distrito: INSTITUCION_ACTUAL.distrito,
    provincia: INSTITUCION_ACTUAL.provincia,
    region: INSTITUCION_ACTUAL.region,
    telefonoFijo: INSTITUCION_ACTUAL.telefono,
    tipoGestion: INSTITUCION_ACTUAL.tipoGestion,
  }).returning();

  // 2. Seed Sede
  console.log('Seeding Sede...');
  const [sede] = await db.insert(schema.sedes).values({
    cetproId: cetpro.id,
    codigo: 'S01',
    nombre: 'Sede Principal',
    direccion: INSTITUCION_ACTUAL.direccion,
    distrito: INSTITUCION_ACTUAL.distrito,
    provincia: INSTITUCION_ACTUAL.provincia,
    region: INSTITUCION_ACTUAL.region,
  }).returning();

  // 3. Nivel Formativo
  console.log('Seeding Nivel Formativo...');
  const [nivelTecnico] = await db.insert(schema.nivelesFormativos).values({
    codigo: 'TEC',
    nombre: 'Técnico',
    descripcion: 'Nivel Formativo Técnico',
  }).returning();
  
  const [nivelAuxiliar] = await db.insert(schema.nivelesFormativos).values({
    codigo: 'AUX',
    nombre: 'Auxiliar Técnico',
    descripcion: 'Nivel Formativo Auxiliar Técnico',
  }).returning();

  // 4. Programas
  console.log('Seeding Programas...');
  for (const prog of PROGRAMAS_SEED) {
    const isAuxiliar = prog.nombre.includes('Auxiliar');
    await db.insert(schema.programas).values({
      codigo: prog.codigo,
      nombre: prog.nombre,
      descripcion: prog.descripcion,
      duracionHorasReferencial: prog.totalHoras,
      nivelFormativoId: isAuxiliar ? nivelAuxiliar.id : nivelTecnico.id,
    });
  }

  console.log('Seeding Completed successfully!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
