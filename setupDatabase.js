require('dotenv').config();
const { query } = require('./db');

async function setupDatabase() {
  try {
    console.log('データベースのセットアップを開始します...');

    // freee_api_user_infoテーブルの作成
    console.log('freee_api_user_infoテーブルを作成中...');
    await query(`
      CREATE TABLE IF NOT EXISTS freee_api_user_info (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        client_id VARCHAR(255) NOT NULL,
        client_secret TEXT NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        employee_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // freee_api_tokensテーブルの作成
    console.log('freee_api_tokensテーブルを作成中...');
    await query(`
      CREATE TABLE IF NOT EXISTS freee_api_tokens (
        id SERIAL PRIMARY KEY,
        user_info_id INTEGER REFERENCES freee_api_user_info(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL,
        access_token TEXT,
        access_token_expires_in INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // インデックスの作成
    console.log('インデックスを作成中...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_freee_api_tokens_user_info_id 
      ON freee_api_tokens(user_info_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_freee_api_tokens_created_at 
      ON freee_api_tokens(created_at)
    `);

    // updated_atを自動更新するトリガー関数の作成
    console.log('トリガー関数を作成中...');
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // updated_atのトリガーを作成
    await query(`
      DROP TRIGGER IF EXISTS update_freee_api_user_info_updated_at ON freee_api_user_info
    `);
    
    await query(`
      CREATE TRIGGER update_freee_api_user_info_updated_at
        BEFORE UPDATE ON freee_api_user_info
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('✅ データベースのセットアップが完了しました！');
    console.log('');
    console.log('次のステップ:');
    console.log('1. .env.sample を .env にコピーして、Neonの接続情報を設定してください');
    console.log('2. setupCredentials.js を実行してfreee認証情報を入力してください');
    
  } catch (error) {
    console.error('❌ データベースセットアップでエラーが発生しました:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// このスクリプトが直接実行された場合
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
