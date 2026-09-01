require('dotenv').config();
const { Pool, types } = require('pg');
const crypto = require('crypto');

// このDBの created_at/updated_at は TIMESTAMP（タイムゾーンなし）で、
// 常にセッションが UTC の状態で NOW()/CURRENT_TIMESTAMP により書き込まれる前提。
// pgのデフォルト挙動では、この型の値を読み込む際にNode.jsプロセスの
// ローカルタイムゾーンとして解釈してDateを組み立ててしまうため、
// 実行環境のタイムゾーン（開発者のマシン、Raycast経由の実行など）によって
// 数時間単位で時刻がズレるバグが起きる（過去に一度発生・修正・再発している）。
// ここでtimestamp(OID 1114)の型パーサーを上書きし、常にUTCとして
// 解釈させることで、どのクエリ・どの実行環境でも一貫した結果にする。
types.setTypeParser(types.builtins.TIMESTAMP, (value) => (value === null ? null : new Date(`${value}Z`)));

// 環境変数の検証
const DATABASE_URL = process.env.DATABASE_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// データベース接続設定
let dbConfig;

if (DATABASE_URL) {
  // DATABASE_URLを使用した接続
  dbConfig = {
    connectionString: DATABASE_URL,
    // セッションのtimezoneをUTCに固定する。DBプロバイダ側のデフォルト設定に
    // 依存せず、created_at等のTIMESTAMP(タイムゾーンなし)列への書き込み・
    // 読み込みが常にUTC基準で一貫するようにするため。
    options: '-c timezone=UTC',
    ssl: {
      rejectUnauthorized: false // Neonの場合は通常これが必要
    }
  };
} else {
  // 個別設定を使用した接続
  const DB_HOST = process.env.DB_HOST;
  const DB_PORT = process.env.DB_PORT || 5432;
  const DB_NAME = process.env.DB_NAME;
  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_SSL = process.env.DB_SSL || 'require';

  if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error('Database configuration is incomplete. Please check your .env file.');
  }

  dbConfig = {
    host: DB_HOST,
    port: parseInt(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    // セッションのtimezoneをUTCに固定する（理由は上記のDATABASE_URL分岐と同じ）
    options: '-c timezone=UTC',
    ssl: DB_SSL === 'require' ? { rejectUnauthorized: false } : false
  };
}

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required. Please check your .env file.');
}

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long.');
}

// PostgreSQL接続プールの初期化
const pool = new Pool(dbConfig);

// 接続テスト
pool.on('connect', (client) => {
  console.log('Connected to Neon PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encrypted = textParts[1];
    
    if (iv.length !== 16) {
      throw new Error('Invalid IV length');
    }
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    console.error('Encrypted text:', encryptedText);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// データベースクエリのヘルパー関数
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, encrypt, decrypt };
