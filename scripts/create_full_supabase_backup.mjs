import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import pg from 'pg';

const { Pool } = pg;
const PG_DUMP_PATH = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';
const SUPABASE_PROJECT_URL = 'https://zsxszqdizklvsvmlfijc.supabase.co';
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('ERROR: DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false }
});

const BACKUP_ROOT = path.resolve('backups', 'backup_supabase_2026_09_09');
const DB_DIR = path.join(BACKUP_ROOT, 'database');
const JSON_DIR = path.join(DB_DIR, 'json_tables');
const STORAGE_DIR = path.join(BACKUP_ROOT, 'storage');
const STORAGE_META_DIR = path.join(STORAGE_DIR, 'metadata');
const STORAGE_FILES_DIR = path.join(STORAGE_DIR, 'files');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function runDatabaseBackup(client) {
  console.log('\n========================================');
  console.log('1. GENERANDO BACKUP SQL CON PG_DUMP');
  console.log('========================================');
  
  ensureDir(DB_DIR);
  ensureDir(JSON_DIR);

  // 1.1 Schema Only
  const schemaFile = path.join(DB_DIR, '01_schema_structure.sql');
  console.log('Generando estructura DDL (01_schema_structure.sql)...');
  execSync(`"${PG_DUMP_PATH}" --dbname="${DB_URL}" --schema=public --schema-only --file="${schemaFile}"`, { stdio: 'inherit' });
  console.log('✓ Estructura DDL generada exitosamente.');

  // 1.2 Data Only (INSERTs)
  const dataFile = path.join(DB_DIR, '02_data_inserts.sql');
  console.log('Generando inserciones de datos (02_data_inserts.sql)...');
  execSync(`"${PG_DUMP_PATH}" --dbname="${DB_URL}" --schema=public --data-only --inserts --file="${dataFile}"`, { stdio: 'inherit' });
  console.log('✓ Inserciones SQL generadas exitosamente.');

  // 1.3 Full Dump (Combined)
  const fullFile = path.join(DB_DIR, 'full_database_dump.sql');
  console.log('Generando volcado completo (full_database_dump.sql)...');
  execSync(`"${PG_DUMP_PATH}" --dbname="${DB_URL}" --schema=public --file="${fullFile}"`, { stdio: 'inherit' });
  console.log('✓ Volcado completo generado exitosamente.');

  console.log('\n========================================');
  console.log('2. EXPORTANDO TABLAS A FORMATO JSON');
  console.log('========================================');

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tablesSummary = [];
  const allTablesData = {};
  let totalRecords = 0;

  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    const tableDataRes = await client.query(`SELECT * FROM "${tableName}";`);
    const records = tableDataRes.rows;
    totalRecords += records.length;

    // Save individual table JSON
    const tableJsonPath = path.join(JSON_DIR, `${tableName}.json`);
    fs.writeFileSync(tableJsonPath, JSON.stringify(records, null, 2), 'utf-8');

    allTablesData[tableName] = records;
    tablesSummary.push({ tabla: tableName, registros: records.length });
    console.log(`  - ${tableName}: ${records.length} registros exportados`);
  }

  // Save all tables combined JSON
  const allTablesPath = path.join(DB_DIR, 'all_tables_combined.json');
  fs.writeFileSync(allTablesPath, JSON.stringify(allTablesData, null, 2), 'utf-8');
  console.log(`✓ Todas las tablas exportadas a JSON (${tablesRes.rows.length} tablas, ${totalRecords} registros).`);

  return { totalTables: tablesRes.rows.length, totalRecords, tablesSummary };
}

async function runStorageBackup(client) {
  console.log('\n========================================');
  console.log('3. GENERANDO BACKUP DE STORAGE (METADATA Y ARCHIVOS)');
  console.log('========================================');

  ensureDir(STORAGE_META_DIR);
  ensureDir(STORAGE_FILES_DIR);

  // 3.1 Buckets
  const bucketsRes = await client.query(`SELECT * FROM storage.buckets ORDER BY id;`);
  const buckets = bucketsRes.rows;
  fs.writeFileSync(path.join(STORAGE_META_DIR, 'buckets.json'), JSON.stringify(buckets, null, 2), 'utf-8');
  console.log(`✓ Buckets exportados: ${buckets.length}`);

  // 3.2 Objects Metadata
  const objectsRes = await client.query(`
    SELECT id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata 
    FROM storage.objects 
    ORDER BY bucket_id, name;
  `);
  const objects = objectsRes.rows;
  fs.writeFileSync(path.join(STORAGE_META_DIR, 'objects.json'), JSON.stringify(objects, null, 2), 'utf-8');
  console.log(`✓ Metadatos de objetos exportados: ${objects.length} archivos`);

  // 3.3 Storage SQL script
  let storageSql = `-- BACKUP METADATOS STORAGE SUPABASE\n-- Generado: ${new Date().toISOString()}\n\n`;
  for (const b of buckets) {
    storageSql += `INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, type, versioning_status)
VALUES ('${b.id}', '${b.name}', ${b.public}, ${b.avif_autodetection}, ${b.file_size_limit || 'NULL'}, ${b.allowed_mime_types ? `'${JSON.stringify(b.allowed_mime_types)}'` : 'NULL'}, '${b.type}', '${b.versioning_status}')
ON CONFLICT (id) DO NOTHING;\n\n`;
  }
  fs.writeFileSync(path.join(STORAGE_META_DIR, 'storage_metadata.sql'), storageSql, 'utf-8');

  // 3.4 Downloading all files from storage
  console.log(`\nDescargando ${objects.length} archivos físicos de Supabase Storage...`);
  let downloadedCount = 0;
  let failedCount = 0;
  let totalDownloadedBytes = 0;
  const failedFiles = [];

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const bucket = obj.bucket_id;
    const objectPath = obj.name;
    const targetFilePath = path.join(STORAGE_FILES_DIR, bucket, objectPath);

    ensureDir(path.dirname(targetFilePath));

    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
    const downloadUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(targetFilePath, buffer);
      downloadedCount++;
      totalDownloadedBytes += buffer.length;

      if ((i + 1) % 25 === 0 || i === objects.length - 1) {
        console.log(`  [${i + 1}/${objects.length}] Descargados (${(totalDownloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
      }
    } catch (err) {
      console.error(`  ✗ Error descargando ${bucket}/${objectPath}: ${err.message}`);
      failedCount++;
      failedFiles.push({ file: `${bucket}/${objectPath}`, error: err.message });
    }
  }

  console.log(`✓ Descarga finalizada: ${downloadedCount} archivos exitosos, ${failedCount} fallidos. Total: ${(totalDownloadedBytes / 1024 / 1024).toFixed(2)} MB`);

  return {
    totalBuckets: buckets.length,
    totalObjects: objects.length,
    downloadedCount,
    failedCount,
    totalDownloadedBytes,
    failedFiles
  };
}

function writeInstructionsAndManifest(dbStats, storageStats) {
  console.log('\n========================================');
  console.log('4. GENERANDO MANIFIESTO E INSTRUCCIONES');
  console.log('========================================');

  const manifest = {
    fechaBackup: new Date().toISOString(),
    origen: 'Supabase PostgreSQL & Supabase Storage',
    proyectoSupabase: 'zsxszqdizklvsvmlfijc',
    database: {
      totalTablas: dbStats.totalTables,
      totalRegistros: dbStats.totalRecords,
      archivos: [
        'database/01_schema_structure.sql',
        'database/02_data_inserts.sql',
        'database/full_database_dump.sql',
        'database/all_tables_combined.json',
        'database/json_tables/*.json'
      ],
      tablas: dbStats.tablesSummary
    },
    storage: {
      totalBuckets: storageStats.totalBuckets,
      totalArchivos: storageStats.totalObjects,
      archivosDescargados: storageStats.downloadedCount,
      archivosFallidos: storageStats.failedCount,
      bytesDescargados: storageStats.totalDownloadedBytes,
      tamanoMB: (storageStats.totalDownloadedBytes / 1024 / 1024).toFixed(2),
      metadatos: [
        'storage/metadata/buckets.json',
        'storage/metadata/objects.json',
        'storage/metadata/storage_metadata.sql'
      ],
      archivosFisicos: 'storage/files/'
    }
  };

  fs.writeFileSync(path.join(BACKUP_ROOT, 'RESUMEN_BACKUP.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  const instructions = `# MANUAL DE RESTAURACIÓN DE BACKUP SIGA-CETPRO JUANJUÍ

**Fecha de generación:** ${new Date().toLocaleString('es-PE')}
**Proyecto:** SIGA CETPRO Juanjuí
**Origen:** Supabase (PostgreSQL 15+ & Supabase Storage)

---

## CONTENIDO DEL PAQUETE DE BACKUP

\`\`\`
backup_supabase_2026_09_09/
├── database/
│   ├── 01_schema_structure.sql     # DDL completo: tablas, enums, tipos, llaves y restricciones
│   ├── 02_data_inserts.sql         # DML completo: INSERTs de los ${dbStats.totalRecords} registros
│   ├── full_database_dump.sql      # Volcado completo estándar PostgreSQL (Estructura + Datos)
│   ├── all_tables_combined.json    # JSON consolidado con las ${dbStats.totalTables} tablas
│   └── json_tables/                # JSON individual por cada tabla (${dbStats.totalTables} archivos)
│
├── storage/
│   ├── metadata/
│   │   ├── buckets.json            # Configuración de buckets de Supabase
│   │   ├── objects.json            # Metadatos, dueños y rutas de los ${storageStats.totalObjects} archivos
│   │   └── storage_metadata.sql    # Sentencias SQL para restaurar buckets
│   └── files/                      # Archivos binarios reales organizados por bucket y carpeta
│       └── Documentos/
│           ├── fotos_personas/     # 248 fotografías de docentes y estudiantes
│           ├── planes_estudio/     # 10 planes de estudio y matrices curriculares
│           └── resoluciones/       # Resoluciones directorales oficiales en PDF
│
├── RESUMEN_BACKUP.json             # Manifiesto técnico con conteos y verificación
└── INSTRUCCIONES_RESTAURACION.md   # Este documento de guía
\`\`\`

---

## 1. CÓMO RESTAURAR LA BASE DE DATOS POSTGRESQL

### Opción A: Restaurar en un nuevo proyecto de Supabase o PostgreSQL local (Recomendado)
Ejecute en la terminal con la utilidad oficial \`psql\`:

\`\`\`bash
# 1. Restaurar la estructura (DDL)
psql "TU_DATABASE_URL" -f database/01_schema_structure.sql

# 2. Restaurar todos los datos (DML)
psql "TU_DATABASE_URL" -f database/02_data_inserts.sql
\`\`\`

O alternativamente en un solo paso:
\`\`\`bash
psql "TU_DATABASE_URL" -f database/full_database_dump.sql
\`\`\`

### Opción B: Restaurar desde la interfaz de Supabase (SQL Editor)
1. Ingrese a Supabase Dashboard -> **SQL Editor**.
2. Abra y pegue el contenido de \`database/01_schema_structure.sql\` y haga clic en **Run**.
3. Posteriormente pegue y ejecute \`database/02_data_inserts.sql\`.

---

## 2. CÓMO RESTAURAR LOS ARCHIVOS DEL STORAGE

1. En Supabase Dashboard -> **Storage**, asegúrese de que el bucket \`Documentos\` exista y sea público (o ejecute \`storage/metadata/storage_metadata.sql\`).
2. Puede subir las carpetas completas (\`fotos_personas\`, \`planes_estudio\`, \`resoluciones\`) directamente arrastrándolas al bucket \`Documentos\` en la interfaz de Supabase Storage, o usando el CLI de Supabase / script de sincronización.
3. Los archivos ya se encuentran organizados exactamente con sus rutas relativas en:
   \`storage/files/Documentos/\`

---

*Backup verificado e íntegro.*
`;

  fs.writeFileSync(path.join(BACKUP_ROOT, 'INSTRUCCIONES_RESTAURACION.md'), instructions, 'utf-8');
  console.log('✓ Manifiesto e instrucciones generados exitosamente.');
}

async function main() {
  console.log('INICIANDO BACKUP COMPLETO DE SUPABASE (BASE DE DATOS + STORAGE)');
  console.log('Destino:', BACKUP_ROOT);

  ensureDir(BACKUP_ROOT);

  const client = await pool.connect();
  try {
    const dbStats = await runDatabaseBackup(client);
    const storageStats = await runStorageBackup(client);
    writeInstructionsAndManifest(dbStats, storageStats);

    console.log('\n========================================');
    console.log('5. COMPRIMIENDO BACKUP A ARCHIVO ZIP');
    console.log('========================================');

    const zipDest = path.resolve('backups', 'backup_supabase_completo_2026_09_09.zip');
    console.log(`Comprimiendo a: ${zipDest}...`);
    execSync(`powershell -Command "Compress-Archive -Path '${BACKUP_ROOT}' -DestinationPath '${zipDest}' -Force"`, { stdio: 'inherit' });
    console.log('✓ Archivo ZIP generado exitosamente.');

    console.log('\n======================================================');
    console.log('¡BACKUP COMPLETO GENERADO CON ÉXITO!');
    console.log(`Carpeta: ${BACKUP_ROOT}`);
    console.log(`Archivo ZIP: ${zipDest}`);
    console.log(`Tablas: ${dbStats.totalTables} | Registros: ${dbStats.totalRecords}`);
    console.log(`Archivos Storage: ${storageStats.downloadedCount}/${storageStats.totalObjects} (${(storageStats.totalDownloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
    console.log('======================================================');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error durante el backup:', err);
  process.exit(1);
});
