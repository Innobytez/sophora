import { parentPort, workerData } from "node:worker_threads";

import pg from "pg";

const { Pool, types } = pg;

types.setTypeParser(20, (value) => Number.parseInt(value, 10));
types.setTypeParser(21, (value) => Number.parseInt(value, 10));
types.setTypeParser(23, (value) => Number.parseInt(value, 10));
types.setTypeParser(700, (value) => Number.parseFloat(value));
types.setTypeParser(701, (value) => Number.parseFloat(value));
types.setTypeParser(1700, (value) => Number.parseFloat(value));

const responsePort = workerData.responsePort;
const pool = new Pool({
  connectionString: workerData.connectionString
});

const transactions = new Map();

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    current += char;

    if (char === "'" && !inDouble) {
      if (inSingle && next === "'") {
        current += next;
        index += 1;
        continue;
      }
      inSingle = !inSingle;
      continue;
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if (char === ";" && !inSingle && !inDouble) {
      const trimmed = current.slice(0, -1).trim();
      if (trimmed) statements.push(trimmed);
      current = "";
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

function rewriteCommonSql(sql) {
  return String(sql || "")
    .replace(/\bjson_array\s*\(/gi, "json_build_array(");
}

function replaceQuestionPlaceholders(sql, params) {
  let index = 0;
  let output = "";
  let inSingle = false;
  let inDouble = false;

  for (let cursor = 0; cursor < sql.length; cursor += 1) {
    const char = sql[cursor];
    const next = sql[cursor + 1];

    if (char === "'" && !inDouble) {
      output += char;
      if (inSingle && next === "'") {
        output += next;
        cursor += 1;
        continue;
      }
      inSingle = !inSingle;
      continue;
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      output += char;
      continue;
    }

    if (char === "?" && !inSingle && !inDouble) {
      index += 1;
      output += `$${index}`;
      continue;
    }

    output += char;
  }

  return {
    text: output,
    values: params
  };
}

function replaceNamedPlaceholders(sql, namedParams) {
  const values = [];
  const text = sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, key) => {
    values.push(namedParams[key]);
    return `$${values.length}`;
  });
  return { text, values };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function prepareSql(sql, params = [], mode = "all") {
  const rawSql = rewriteCommonSql(String(sql || "").trim());
  const pragmaMatch = rawSql.match(/^PRAGMA\s+table_info\(([^)]+)\)$/i);
  if (pragmaMatch) {
    return {
      special: "pragma_table_info",
      tableName: pragmaMatch[1].replace(/^["']|["']$/g, "")
    };
  }

  const args = Array.isArray(params) ? params : [params];
  const bindingSource = args.length === 1 && isPlainObject(args[0]) ? args[0] : args;
  const replaced = isPlainObject(bindingSource)
    ? replaceNamedPlaceholders(rawSql, bindingSource)
    : replaceQuestionPlaceholders(rawSql, bindingSource);

  let text = replaced.text;
  if (mode === "run" && /^\s*insert\b/i.test(text) && !/\breturning\b/i.test(text)) {
    text = `${text} RETURNING id`;
  }

  return {
    text,
    values: replaced.values
  };
}

async function queryPragmaTableInfo(client, tableName) {
  const sql = `
    SELECT
      columns.column_name AS name,
      columns.udt_name AS type,
      CASE WHEN columns.is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
      columns.column_default AS dflt_value,
      CASE WHEN constraints.constraint_type = 'PRIMARY KEY' THEN 1 ELSE 0 END AS pk
    FROM information_schema.columns AS columns
    LEFT JOIN information_schema.key_column_usage AS key_usage
      ON key_usage.table_schema = columns.table_schema
      AND key_usage.table_name = columns.table_name
      AND key_usage.column_name = columns.column_name
    LEFT JOIN information_schema.table_constraints AS constraints
      ON constraints.table_schema = key_usage.table_schema
      AND constraints.table_name = key_usage.table_name
      AND constraints.constraint_name = key_usage.constraint_name
    WHERE columns.table_schema = current_schema()
      AND columns.table_name = $1
    ORDER BY columns.ordinal_position ASC
  `;
  const result = await client.query(sql, [tableName]);
  return result.rows.map((row, index) => ({
    cid: index,
    ...row
  }));
}

async function withClient(txId) {
  if (!txId) return pool;
  const client = transactions.get(txId);
  if (!client) {
    throw new Error(`Transaction ${txId} not found.`);
  }
  return client;
}

async function executeQuery({ sql, params, mode, txId }) {
  const client = await withClient(txId);
  const prepared = prepareSql(sql, params, mode);
  if (prepared.special === "pragma_table_info") {
    return queryPragmaTableInfo(client, prepared.tableName);
  }

  const result = await client.query(prepared.text, prepared.values);
  if (mode === "get") {
    return result.rows[0];
  }
  if (mode === "run") {
    return {
      changes: result.rowCount,
      lastInsertRowid: result.rows[0]?.id ? Number(result.rows[0].id) : 0
    };
  }
  return result.rows;
}

async function executeSqlBatch(sql, txId) {
  const client = await withClient(txId);
  const statements = splitSqlStatements(sql);
  let lastResult = null;
  for (const statement of statements) {
    lastResult = await client.query(rewriteCommonSql(statement));
  }
  return {
    changes: lastResult?.rowCount || 0
  };
}

async function handleRequest(message) {
  const { type, payload = {} } = message;
  if (type === "begin") {
    const client = await pool.connect();
    await client.query("BEGIN");
    transactions.set(payload.txId, client);
    return true;
  }
  if (type === "commit") {
    const client = transactions.get(payload.txId);
    if (!client) return true;
    try {
      await client.query("COMMIT");
    } finally {
      client.release();
      transactions.delete(payload.txId);
    }
    return true;
  }
  if (type === "rollback") {
    const client = transactions.get(payload.txId);
    if (!client) return true;
    try {
      await client.query("ROLLBACK");
    } finally {
      client.release();
      transactions.delete(payload.txId);
    }
    return true;
  }
  if (type === "exec") {
    return executeSqlBatch(payload.sql, payload.txId);
  }
  if (type === "query") {
    return executeQuery(payload);
  }
  throw new Error(`Unsupported database worker request: ${type}`);
}

parentPort.on("message", async (message) => {
  const signal = new Int32Array(message.signalBuffer);
  try {
    const result = await handleRequest(message);
    responsePort.postMessage({
      id: message.id,
      ok: true,
      result
    });
  } catch (error) {
    responsePort.postMessage({
      id: message.id,
      ok: false,
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail
      }
    });
  } finally {
    Atomics.store(signal, 0, 1);
    Atomics.notify(signal, 0, 1);
  }
});
