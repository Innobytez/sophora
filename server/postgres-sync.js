import crypto from "node:crypto";
import { MessageChannel, Worker, receiveMessageOnPort } from "node:worker_threads";

function buildError(payload = {}) {
  const error = new Error(payload.message || "Database error.");
  if (payload.code) error.code = payload.code;
  if (payload.detail) error.detail = payload.detail;
  if (payload.statusCode) error.statusCode = payload.statusCode;
  return error;
}

class PostgresStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  get(...params) {
    return this.database.request("query", {
      mode: "get",
      sql: this.sql,
      params,
      txId: this.database.currentTransactionId
    });
  }

  all(...params) {
    return this.database.request("query", {
      mode: "all",
      sql: this.sql,
      params,
      txId: this.database.currentTransactionId
    });
  }

  run(...params) {
    return this.database.request("query", {
      mode: "run",
      sql: this.sql,
      params,
      txId: this.database.currentTransactionId
    });
  }
}

export class PostgresSyncDatabase {
  constructor(connectionString) {
    const { port1, port2 } = new MessageChannel();
    this.responsePort = port1;
    this.currentTransactionId = null;
    this.worker = new Worker(new URL("./postgres-worker.js", import.meta.url), {
      workerData: {
        connectionString,
        responsePort: port2
      },
      transferList: [port2]
    });
  }

  request(type, payload = {}) {
    const signalBuffer = new SharedArrayBuffer(4);
    const signal = new Int32Array(signalBuffer);
    const id = crypto.randomUUID();
    this.worker.postMessage({
      id,
      type,
      payload,
      signalBuffer
    });

    Atomics.wait(signal, 0, 0);
    const envelope = receiveMessageOnPort(this.responsePort)?.message;
    if (!envelope || envelope.id !== id) {
      throw new Error("Database worker response mismatch.");
    }
    if (!envelope.ok) {
      throw buildError(envelope.error);
    }
    return envelope.result;
  }

  prepare(sql) {
    return new PostgresStatement(this, sql);
  }

  exec(sql) {
    return this.request("exec", {
      sql,
      txId: this.currentTransactionId
    });
  }

  transaction(callback) {
    return (...args) => {
      if (this.currentTransactionId) {
        throw new Error("Nested transactions are not supported.");
      }
      const txId = crypto.randomUUID();
      this.request("begin", { txId });
      this.currentTransactionId = txId;
      try {
        const result = callback(...args);
        this.request("commit", { txId });
        return result;
      } catch (error) {
        try {
          this.request("rollback", { txId });
        } catch {
          // Ignore rollback errors so the original exception is preserved.
        }
        throw error;
      } finally {
        this.currentTransactionId = null;
      }
    };
  }

  close() {
    this.worker.terminate();
  }
}
