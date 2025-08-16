require('dotenv').config();
const credentialsManager = require('./credentialsManager');

async function debugCredentials() {
  console.log('=== 認証情報デバッグ (Neon版) ===');
  
  try {
    console.log('1. 環境変数確認:');
    
    // データベース接続情報の確認
    if (process.env.DATABASE_URL) {
      console.log('   DATABASE_URL:', '設定済み');
      // URLから一部情報を抽出して表示（セキュリティのため一部のみ）
      try {
        const url = new URL(process.env.DATABASE_URL);
        console.log('   データベースホスト:', url.hostname);
        console.log('   データベース名:', url.pathname.slice(1));
        console.log('   ユーザー名:', url.username);
      } catch (e) {
        console.log('   DATABASE_URL形式エラー');
      }
    } else {
      console.log('   DATABASE_URL: 未設定');
      console.log('   DB_HOST:', process.env.DB_HOST ? '設定済み' : '未設定');
      console.log('   DB_NAME:', process.env.DB_NAME ? '設定済み' : '未設定');
      console.log('   DB_USER:', process.env.DB_USER ? '設定済み' : '未設定');
      console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '設定済み' : '未設定');
      console.log('   DB_SSL:', process.env.DB_SSL || 'require (デフォルト)');
    }
    
    console.log('   ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? `設定済み(${process.env.ENCRYPTION_KEY.length}文字)` : '未設定');
    
    // データベース接続テスト
    console.log('\n2. データベース接続テスト:');
    try {
      const { query } = require('./db');
      await query('SELECT NOW() as current_time');
      console.log('   ✅ Neon PostgreSQLに正常に接続できました');
    } catch (error) {
      console.log('   ❌ データベース接続エラー:', error.message);
      console.log('   → .envファイルの設定を確認してください');
      console.log('   → Neonプロジェクトが有効か確認してください');
    }
    
    console.log('\n3. データベーステーブル確認:');
    try {
      const { query } = require('./db');
      
      // テーブル存在確認
      const tableCheck = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('freee_api_user_info', 'freee_api_tokens')
        ORDER BY table_name
      `);
      
      const existingTables = tableCheck.rows.map(row => row.table_name);
      
      if (existingTables.includes('freee_api_user_info')) {
        console.log('   ✅ freee_api_user_infoテーブル: 存在');
        
        // レコード数確認
        const countResult = await query('SELECT COUNT(*) as count FROM freee_api_user_info');
        console.log(`   　　レコード数: ${countResult.rows[0].count}件`);
      } else {
        console.log('   ❌ freee_api_user_infoテーブル: 存在しません');
        console.log('   → npm run setup-db を実行してください');
      }
      
      if (existingTables.includes('freee_api_tokens')) {
        console.log('   ✅ freee_api_tokensテーブル: 存在');
        
        // レコード数確認
        const countResult = await query('SELECT COUNT(*) as count FROM freee_api_tokens');
        console.log(`   　　レコード数: ${countResult.rows[0].count}件`);
      } else {
        console.log('   ❌ freee_api_tokensテーブル: 存在しません');
        console.log('   → npm run setup-db を実行してください');
      }
      
    } catch (error) {
      console.log('   ❌ テーブル確認エラー:', error.message);
    }
    
    console.log('\n4. 保存済み認証情報確認:');
    
    try {
      // まず利用可能な認証情報一覧を取得
      const list = await credentialsManager.listCredentials();
      
      if (list.length === 0) {
        console.log('   ❌ 認証情報が見つかりません');
        console.log('   → setupCredentials.jsを実行してください');
      } else {
        // 最新の認証情報を使用
        const latestId = list[0].id;
        console.log(`   最新の認証情報ID: ${latestId}`);
        
        const credentials = await credentialsManager.getCredentials(latestId);
        console.log('   ✅ 認証情報取得成功');
        console.log('   クライアントID:', credentials.clientId ? credentials.clientId.substring(0, 10) + '...' : '未設定');
        console.log('   会社ID:', credentials.companyId || '未設定');
        console.log('   従業員ID:', credentials.employeeId || '未設定');
        console.log('   リフレッシュトークン:', credentials.refreshToken ? credentials.refreshToken.substring(0, 20) + '...' : '未設定');
        console.log('   アクセストークン:', credentials.accessToken ? 'あり' : 'なし');
        
        if (credentials.tokenCreatedAt && credentials.accessTokenExpiresIn) {
          const isValid = credentialsManager.isAccessTokenValid(credentials.tokenCreatedAt, credentials.accessTokenExpiresIn, true);
          console.log('   トークン有効性:', isValid ? '有効' : '期限切れ');
          
          if (!isValid) {
            const expiresAt = new Date(credentials.tokenCreatedAt.getTime() + (credentials.accessTokenExpiresIn * 1000));
            console.log(`   　　期限切れ日時: ${expiresAt.toLocaleString('ja-JP')}`);
          }
        }
      }
      
    } catch (error) {
      console.log('   ❌ 認証情報取得エラー:', error.message);
      
      if (error.message.includes('user info not found')) {
        console.log('   → setupCredentials.jsを実行してください');
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('   → npm run setup-db を実行してテーブルを作成してください');
      }
    }
    
    console.log('\n5. 利用可能な認証情報一覧:');
    try {
      const list = await credentialsManager.listCredentials();
      console.log(`   登録済みアカウント数: ${list.length}`);
      list.forEach((item, index) => {
        console.log(`   ${index + 1}. ID:${item.id}, ユーザー名:${item.username}, 会社ID:${item.company_id}, 作成日:${new Date(item.created_at).toLocaleString('ja-JP')}`);
      });
    } catch (error) {
      console.log('   ❌ 一覧取得エラー:', error.message);
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('   → npm run setup-db を実行してテーブルを作成してください');
      }
    }
    
    console.log('\n6. 暗号化/復号化テスト:');
    try {
      const { encrypt, decrypt } = require('./db');
      const testText = 'test_encryption_string';
      const encrypted = encrypt(testText);
      const decrypted = decrypt(encrypted);
      
      if (testText === decrypted) {
        console.log('   ✅ 暗号化/復号化: 正常動作');
      } else {
        console.log('   ❌ 暗号化/復号化: エラー');
      }
    } catch (error) {
      console.log('   ❌ 暗号化テストエラー:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  } finally {
    // PostgreSQLコネクションプールを終了
    try {
      const { pool } = require('./db');
      await pool.end();
      console.log('\n=== データベース接続を終了しました ===');
    } catch (e) {
      // 接続が確立されていない場合は無視
    }
  }
  
  console.log('\n=== デバッグ完了 ===');
  console.log('\n💡 トラブルシューティング:');
  console.log('- データベース接続エラー → .envのDATABASE_URLを確認');
  console.log('- テーブル存在しない → npm run setup-db を実行');
  console.log('- 認証情報なし → setupCredentials.js を実行');
  console.log('- 暗号化エラー → ENCRYPTION_KEYが32文字か確認');
}

debugCredentials().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('デバッグ実行エラー:', error);
  process.exit(1);
});
