import { Router } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

export const explorerRouter = Router();

async function validateTable(tableName: string) {
  const validTablesResult = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  return validTablesResult.rows.map(r => r.table_name).includes(tableName);
}

// 1. List tables with estimated row counts
explorerRouter.get('/tables', async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        t.table_name,
        COALESCE(c.reltuples, 0) as estimated_rows
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `);
    res.json(result.rows.map(r => r.table_name));
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error fetching tables' });
  }
});

// 2. Execute Custom SQL query (Console DBeaver-style)
explorerRouter.post('/query', async (req, res) => {
  const startTime = Date.now();
  try {
    const { sqlQuery } = req.body;
    if (!sqlQuery || typeof sqlQuery !== 'string' || !sqlQuery.trim()) {
      return res.status(400).json({ error: 'Consulta SQL vacía' });
    }

    const trimmedQuery = sqlQuery.trim();
    const result = await db.execute(sql.raw(trimmedQuery));
    const executionTimeMs = Date.now() - startTime;

    const rows = result.rows || [];
    const rowCount = (result as any).rowCount !== undefined ? (result as any).rowCount : rows.length;
    const command = (result as any).command || 'QUERY';
    const fields = (result as any).fields?.map((f: any) => f.name) || (rows.length > 0 ? Object.keys(rows[0]) : []);

    res.json({
      success: true,
      rows,
      rowCount,
      fields,
      command,
      executionTimeMs,
    });
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    console.error('SQL Execution error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al ejecutar la consulta SQL',
      executionTimeMs,
    });
  }
});

// 3. Get schema with primary keys and constraints
explorerRouter.get('/tables/:tableName/schema', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });
    
    const result = await db.execute(sql.raw(`
      SELECT 
        c.column_name, 
        c.data_type, 
        c.udt_name, 
        c.is_nullable, 
        c.column_default,
        c.character_maximum_length,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key,
        (
          SELECT array_to_json(array_agg(e.enumlabel ORDER BY e.enumsortorder))
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = c.udt_name
        ) AS enum_values
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = '${tableName}'
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_name = '${tableName}'
      ORDER BY c.ordinal_position;
    `));
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching schema: ' + error.message });
  }
});

// 4. Get table DDL script
explorerRouter.get('/tables/:tableName/ddl', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });

    const colsRes = await db.execute(sql.raw(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position;
    `));

    const pksRes = await db.execute(sql.raw(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = '${tableName}';
    `));

    const fksRes = await db.execute(sql.raw(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '${tableName}';
    `));

    const colLines = colsRes.rows.map((c: any) => {
      let typeStr = c.data_type;
      if (c.data_type === 'character varying' && c.character_maximum_length) {
        typeStr = `varchar(${c.character_maximum_length})`;
      }
      const notNull = c.is_nullable === 'NO' ? ' NOT NULL' : '';
      const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
      return `  "${c.column_name}" ${typeStr}${notNull}${def}`;
    });

    if (pksRes.rows.length > 0) {
      const pkCols = pksRes.rows.map((r: any) => `"${r.column_name}"`).join(', ');
      colLines.push(`  PRIMARY KEY (${pkCols})`);
    }

    fksRes.rows.forEach((fk: any) => {
      colLines.push(`  FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}")`);
    });

    const ddl = `CREATE TABLE public."${tableName}" (\n${colLines.join(',\n')}\n);`;

    res.json({ ddl, foreignKeys: fksRes.rows });
  } catch (error: any) {
    res.status(500).json({ error: 'Error generating DDL: ' + error.message });
  }
});

// 5. Add new column to table
explorerRouter.post('/tables/:tableName/columns', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });

    const { columnName, dataType, isNullable, defaultValue } = req.body;

    if (!columnName || !dataType) {
      return res.status(400).json({ error: 'El nombre de la columna y el tipo de dato son requeridos' });
    }

    // Clean column name (alphanumeric + underscore only)
    const cleanColName = columnName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanColName) {
      return res.status(400).json({ error: 'Nombre de columna inválido' });
    }

    let alterQuery = `ALTER TABLE "${tableName}" ADD COLUMN "${cleanColName}" ${dataType}`;
    
    if (defaultValue && defaultValue.trim() !== '') {
      alterQuery += ` DEFAULT ${defaultValue.trim()}`;
    }

    if (isNullable === false) {
      alterQuery += ` NOT NULL`;
    }

    await db.execute(sql.raw(alterQuery));

    res.json({ 
      success: true, 
      message: `Columna "${cleanColName}" agregada exitosamente a la tabla "${tableName}"`,
      columnName: cleanColName 
    });
  } catch (error: any) {
    console.error('Error adding column:', error);
    res.status(400).json({ error: error.message || 'Error al agregar columna' });
  }
});

// 6. Drop column from table
explorerRouter.delete('/tables/:tableName/columns/:columnName', async (req, res) => {
  try {
    const { tableName, columnName } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });

    if (!columnName) return res.status(400).json({ error: 'Nombre de columna requerido' });

    const cleanColName = columnName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const dropQuery = `ALTER TABLE "${tableName}" DROP COLUMN "${cleanColName}" CASCADE;`;

    await db.execute(sql.raw(dropQuery));

    res.json({ 
      success: true, 
      message: `Columna "${cleanColName}" eliminada exitosamente de la tabla "${tableName}"` 
    });
  } catch (error: any) {
    console.error('Error dropping column:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar columna' });
  }
});

// 7. Truncate Table
explorerRouter.post('/tables/:tableName/truncate', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });

    await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE;`));

    res.json({ success: true, message: `Tabla "${tableName}" vaciada exitosamente.` });
  } catch (error: any) {
    console.error('Error truncating table:', error);
    res.status(400).json({ error: error.message || 'Error al vaciar la tabla' });
  }
});

// 8. Get data
explorerRouter.get('/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });
    
    // Support limit=all or custom limit numbers up to 10000; default 500 for normal view
    let limitClause = ' LIMIT 500';
    if (req.query.limit === 'all') {
      limitClause = '';
    } else if (req.query.limit) {
      const parsed = parseInt(req.query.limit as string);
      if (!isNaN(parsed) && parsed > 0) {
        limitClause = ` LIMIT ${parsed}`;
      }
    }
    
    let query = `SELECT * FROM "${tableName}"`;
    if (tableName === 'personas') {
      query = `SELECT p.*, TRIM(COALESCE(p.nombres, '') || ' ' || COALESCE(p.apellido_paterno, '') || ' ' || COALESCE(p.apellido_materno, '')) AS _display_label FROM "${tableName}" p ORDER BY p.apellido_paterno, p.nombres`;
    } else if (tableName === 'estudiantes') {
      query = `SELECT e.*, TRIM(COALESCE(e.codigo_estudiante || ' - ', '') || COALESCE(p.nombres, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS _display_label 
               FROM "${tableName}" e LEFT JOIN "personas" p ON e.persona_id = p.id ORDER BY p.apellido_paterno, p.nombres`;
    } else if (tableName === 'trabajadores') {
      query = `SELECT t.*, TRIM(COALESCE(p.nombres, '') || ' ' || COALESCE(p.apellido_paterno, '') || ' (' || COALESCE(t.cargo, 'Personal') || ')') AS _display_label 
               FROM "${tableName}" t LEFT JOIN "personas" p ON t.persona_id = p.id ORDER BY p.apellido_paterno, p.nombres`;
    } else if (tableName === 'matriculas') {
      query = `SELECT m.*, TRIM(COALESCE(p.nombres, '') || ' ' || COALESCE(p.apellido_paterno, '') || ' (' || COALESCE(m.codigo_matricula, 'Sin Código') || ')') AS _display_label 
               FROM "${tableName}" m LEFT JOIN "estudiantes" e ON m.estudiante_id = e.id LEFT JOIN "personas" p ON e.persona_id = p.id ORDER BY m.fecha_matricula DESC NULLS LAST, m.codigo_matricula DESC`;
    } else if (tableName === 'usuarios') {
      query = `SELECT u.*, COALESCE(TRIM(u.username || CASE WHEN p.nombres IS NOT NULL THEN ' (' || p.nombres || ' ' || COALESCE(p.apellido_paterno, '') || ')' ELSE '' END), u.username) AS _display_label 
               FROM "${tableName}" u LEFT JOIN "personas" p ON u.persona_id = p.id ORDER BY u.username`;
    } else if (tableName === 'usuarios_roles') {
      query = `SELECT ur.*, (COALESCE(u.username, 'Usuario') || ' → ' || COALESCE(rs.nombre, 'Rol')) AS _display_label
               FROM "${tableName}" ur 
               LEFT JOIN "usuarios" u ON ur.usuario_id = u.id 
               LEFT JOIN "roles_sistemas" rs ON ur.rol_sistema_id = rs.id 
               ORDER BY u.username, rs.nombre`;
    } else if (tableName === 'roles_permisos') {
      query = `SELECT rp.*, (COALESCE(rs.nombre, 'Rol') || ' → ' || COALESCE(p.nombre, 'Permiso')) AS _display_label
               FROM "${tableName}" rp 
               LEFT JOIN "roles_sistemas" rs ON rp.rol_sistema_id = rs.id 
               LEFT JOIN "permisos" p ON rp.permiso_id = p.id 
               ORDER BY rs.nombre, p.modulo, p.codigo`;
    } else if (tableName === 'personas_roles') {
      query = `SELECT pr.*, (TRIM(COALESCE(p.nombres, '') || ' ' || COALESCE(p.apellido_paterno, '')) || ' → ' || COALESCE(rp.nombre, 'Rol')) AS _display_label
               FROM "${tableName}" pr 
               LEFT JOIN "personas" p ON pr.persona_id = p.id 
               LEFT JOIN "roles_personas" rp ON pr.rol_persona_id = rp.id 
               ORDER BY p.apellido_paterno, rp.nombre`;
    } else if (tableName === 'roles_sistemas' || tableName === 'roles_personas') {
      query = `SELECT r.*, r.nombre AS _display_label FROM "${tableName}" r ORDER BY r.nombre`;
    } else if (tableName === 'permisos') {
      query = `SELECT p.*, (p.codigo || ' - ' || p.nombre) AS _display_label FROM "${tableName}" p ORDER BY p.modulo, p.codigo`;
    } else if (tableName === 'programas') {
      query = `SELECT p.*, (p.codigo || ' - ' || p.nombre) AS _display_label FROM "${tableName}" p ORDER BY p.nombre`;
    } else if (tableName === 'planes_estudios') {
      query = `SELECT pe.*, (pe.codigo || ' - ' || pe.nombre) AS _display_label FROM "${tableName}" pe ORDER BY pe.nombre`;
    } else if (tableName === 'modulos') {
      query = `SELECT m.*, (m.codigo || ' - ' || m.nombre) AS _display_label FROM "${tableName}" m ORDER BY m.nombre`;
    } else if (tableName === 'unidades_didacticas') {
      query = `SELECT u.*, (u.codigo || ' - ' || u.nombre) AS _display_label FROM "${tableName}" u ORDER BY u.nombre`;
    } else if (tableName === 'secciones') {
      query = `SELECT s.*, s.nombre AS _display_label FROM "${tableName}" s ORDER BY s.nombre`;
    } else if (tableName === 'aulas') {
      query = `SELECT a.*, (a.codigo || ' - ' || a.nombre) AS _display_label FROM "${tableName}" a ORDER BY a.nombre`;
    } else if (tableName === 'sedes') {
      query = `SELECT s.*, s.nombre AS _display_label FROM "${tableName}" s ORDER BY s.nombre`;
    } else if (tableName === 'periodos_academicos') {
      query = `SELECT pa.*, pa.nombre AS _display_label FROM "${tableName}" pa ORDER BY pa.nombre`;
    } else if (tableName === 'periodos_lectivos') {
      query = `SELECT pl.*, pl.nombre AS _display_label FROM "${tableName}" pl ORDER BY pl.nombre`;
    } else if (tableName === 'periodos_clases') {
      query = `SELECT pc.*, pc.nombre AS _display_label FROM "${tableName}" pc ORDER BY pc.nombre`;
    } else if (tableName === 'conceptos_pagos') {
      query = `SELECT cp.*, cp.concepto AS _display_label FROM "${tableName}" cp ORDER BY cp.concepto`;
    } else if (tableName === 'metodos_pagos') {
      query = `SELECT mp.*, COALESCE(mp.metodo, mp.codigo) AS _display_label FROM "${tableName}" mp ORDER BY mp.metodo`;
    } else if (tableName === 'tipos_documentos_archivos') {
      query = `SELECT tda.*, tda.nombre AS _display_label FROM "${tableName}" tda ORDER BY tda.nombre`;
    } else if (tableName === 'cetpros') {
      query = `SELECT c.*, (c.codigo_modular || ' - ' || c.nombre) AS _display_label FROM "${tableName}" c ORDER BY c.nombre`;
    } else if (tableName === 'bienes_patrimoniales') {
      query = `SELECT b.*, (b.codigo_patrimonial || ' - ' || b.descripcion) AS _display_label FROM "${tableName}" b ORDER BY b.descripcion`;
    } else if (tableName === 'capacidades') {
      query = `SELECT c.*, (c.codigo || ' - ' || c.descripcion) AS _display_label FROM "${tableName}" c ORDER BY c.codigo`;
    } else if (tableName === 'competencias') {
      query = `SELECT c.*, (c.codigo || ' - ' || c.descripcion) AS _display_label FROM "${tableName}" c ORDER BY c.codigo`;
    } else if (tableName === 'turnos') {
      query = `SELECT t.*, t.nombre AS _display_label FROM "${tableName}" t ORDER BY t.nombre`;
    } else if (tableName === 'niveles_formativos') {
      query = `SELECT nf.*, nf.nombre AS _display_label FROM "${tableName}" nf ORDER BY nf.nombre`;
    } else if (tableName === 'sectores_economicos') {
      query = `SELECT se.*, se.nombre AS _display_label FROM "${tableName}" se ORDER BY se.nombre`;
    } else if (tableName === 'familias_productivas') {
      query = `SELECT fp.*, (fp.codigo || ' - ' || fp.nombre) AS _display_label FROM "${tableName}" fp ORDER BY fp.nombre`;
    } else if (tableName === 'actividades_economicas') {
      query = `SELECT ae.*, (ae.codigo || ' - ' || ae.nombre) AS _display_label FROM "${tableName}" ae ORDER BY ae.nombre`;
    } else if (tableName === 'documentos') {
      query = `SELECT d.*, COALESCE(d.nombre_archivo, 'Documento') AS _display_label FROM "${tableName}" d ORDER BY d.fecha_carga DESC NULLS LAST`;
    } else {
      const colsRes = await db.execute(sql.raw(`SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}'`));
      const cols = colsRes.rows.map((r: any) => r.column_name);
      let labelCol = null;
      if (cols.includes('nombre')) labelCol = 'nombre';
      else if (cols.includes('nombres')) labelCol = 'nombres';
      else if (cols.includes('nombre_modulo')) labelCol = 'nombre_modulo';
      else if (cols.includes('concepto')) labelCol = 'concepto';
      else if (cols.includes('descripcion')) labelCol = 'descripcion';
      else if (cols.includes('titulo')) labelCol = 'titulo';
      else if (cols.includes('codigo')) labelCol = 'codigo';
      
      if (labelCol) query = `SELECT t.*, t."${labelCol}" AS _display_label FROM "${tableName}" t`;
    }
    
    query += limitClause;
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error: any) {
    console.error(`Error fetching table data for ${req.params.tableName}:`, error);
    res.status(500).json({ error: error?.message || 'Error fetching table data' });
  }
});

async function normalizeTablePayload(tableName: string, data: Record<string, any>) {
  const colsRes = await db.execute(sql.raw(`
    SELECT 
      c.column_name, 
      c.data_type, 
      c.udt_name, 
      c.is_nullable,
      (
        SELECT array_to_json(array_agg(e.enumlabel ORDER BY e.enumsortorder))
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = c.udt_name
      ) AS enum_values
    FROM information_schema.columns c
    WHERE c.table_name = '${tableName}'
  `));

  const colMap = new Map<string, any>();
  colsRes.rows.forEach((r: any) => colMap.set(r.column_name, r));

  const normalized: Record<string, any> = {};
  for (const [k, val] of Object.entries(data)) {
    if (k.startsWith('_')) continue;
    const colDef = colMap.get(k);

    if (val === '' || val === undefined) {
      if (colDef && colDef.is_nullable === 'YES') {
        normalized[k] = null;
      } else if (val === '') {
        normalized[k] = null;
      }
      continue;
    }

    if (colDef && colDef.enum_values && Array.isArray(colDef.enum_values)) {
      const allowed: string[] = colDef.enum_values;
      const strVal = String(val).trim();

      // Exact match
      if (allowed.includes(strVal)) {
        normalized[k] = strVal;
        continue;
      }

      // Case-insensitive match
      const caseMatch = allowed.find(a => a.toLowerCase() === strVal.toLowerCase());
      if (caseMatch) {
        normalized[k] = caseMatch;
        continue;
      }

      // Special institutional enum mappings
      if (colDef.udt_name === 'estado_trabajador_enum') {
        if (strVal.toUpperCase() === 'INACTIVO') {
          normalized[k] = 'Cesante';
          continue;
        }
        if (strVal.toUpperCase() === 'ACTIVO') {
          normalized[k] = 'Activo';
          continue;
        }
      } else if (colDef.udt_name === 'condicion_trabajador_enum') {
        if (strVal.toLowerCase().includes('nombrad')) {
          normalized[k] = 'Nombrado(a)';
          continue;
        }
        if (strVal.toLowerCase().includes('contratad')) {
          normalized[k] = 'Contratado(a)';
          continue;
        }
      } else if (colDef.udt_name === 'estado_act_inact') {
        if (strVal.toUpperCase() === 'ACTIVO') {
          normalized[k] = 'Activo';
          continue;
        }
        if (strVal.toUpperCase() === 'INACTIVO') {
          normalized[k] = 'Inactivo';
          continue;
        }
      }

      normalized[k] = strVal;
    } else {
      normalized[k] = val;
    }
  }

  return normalized;
}

// 9. Insert data
explorerRouter.post('/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });
    
    const data = await normalizeTablePayload(tableName, req.body);
    const keys = Object.keys(data).filter(k => !k.startsWith('_'));
    const values = keys.map(k => data[k]);
    
    if (keys.length === 0) return res.status(400).json({ error: 'Empty body' });
    
    const columns = keys.map(k => `"${k}"`).join(', ');
    
    const sqlChunks = [];
    sqlChunks.push(sql.raw(`INSERT INTO "${tableName}" (${columns}) VALUES (`));
    for (let i = 0; i < values.length; i++) {
      if (i > 0) sqlChunks.push(sql.raw(`, `));
      sqlChunks.push(sql`${values[i]}`);
    }
    sqlChunks.push(sql.raw(`) RETURNING *`));
    
    const finalSql = sql.join(sqlChunks);
    const result = await db.execute(finalSql);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error inserting data' });
  }
});

// 10. Update data
explorerRouter.put('/tables/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });
    
    const data = await normalizeTablePayload(tableName, req.body);
    const keys = Object.keys(data).filter(k => !k.startsWith('_'));
    const values = keys.map(k => data[k]);
    
    if (keys.length === 0) return res.status(400).json({ error: 'Empty body' });
    
    const sqlChunks = [];
    sqlChunks.push(sql.raw(`UPDATE "${tableName}" SET `));
    for (let i = 0; i < keys.length; i++) {
      if (i > 0) sqlChunks.push(sql.raw(`, `));
      sqlChunks.push(sql.raw(`"${keys[i]}" = `));
      sqlChunks.push(sql`${values[i]}`);
    }
    sqlChunks.push(sql.raw(` WHERE id = `));
    sqlChunks.push(sql`${id}`);
    sqlChunks.push(sql.raw(` RETURNING *`));
    
    const finalSql = sql.join(sqlChunks);
    const result = await db.execute(finalSql);
    
    // Smart cascading deactivation
    if (tableName === 'programas' && (data.estado === 'INACTIVO' || data.estado === 'Inactivo')) {
      try {
        const modResult = await db.execute(sql.raw(`UPDATE "modulos" SET estado = 'Inactivo' WHERE "programa_id" = '${id}' RETURNING id`));
        const modIds = modResult.rows.map((r) => r.id);
        
        if (modIds.length > 0) {
          const idsList = modIds.map(i => `'${i}'`).join(',');
          await db.execute(sql.raw(`UPDATE "secciones" SET estado = 'Inactivo' WHERE "modulo_id" IN (${idsList})`));
        }
      } catch (err) {
        console.error('Cascade error:', err);
      }
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error updating data' });
  }
});

// 11. Delete data
explorerRouter.delete('/tables/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    if (!(await validateTable(tableName))) return res.status(400).json({ error: 'Invalid table name' });
    
    const finalSql = sql`DELETE FROM ${sql.raw(`"${tableName}"`)} WHERE id = ${id} RETURNING *`;
    const result = await db.execute(finalSql);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error deleting data' });
  }
});

