require('dotenv').config();
const credentialsManager = require('./credentialsManager');

async function setupInitialCredentials() {
  try {
    console.log('=== freee API認証情報セットアップ (Neon版) ===');
    
    // 環境変数から認証情報を読み込み
    const credentials = {
      username: process.env.FREEE_USERNAME,
      clientId: process.env.FREEE_CLIENT_ID,
      clientSecret: process.env.FREEE_CLIENT_SECRET,
      companyId: process.env.FREEE_COMPANY_ID,
      employeeId: process.env.FREEE_EMPLOYEE_ID,
      refreshToken: process.env.FREEE_REFRESH_TOKEN,
      accessToken: process.env.FREEE_ACCESS_TOKEN,
      expiresIn: parseInt(process.env.FREEE_ACCESS_TOKEN_EXPIRES_IN) || 21600
    };

    // 入力値の検証
    console.log('認証情報を検証中...');
    
    // 例示値のパターンを定義
    const exampleValues = {
      username: ['your_username'],
      clientId: ['your_freee_client_id'],
      clientSecret: ['your_freee_client_secret'],
      companyId: ['your_company_id'],
      employeeId: ['your_employee_id'],
      refreshToken: ['your_refresh_token'],
      accessToken: ['your_access_token']
    };
    
    const requiredFields = ['username', 'clientId', 'clientSecret', 'companyId', 'employeeId', 'refreshToken'];
    const invalidFields = [];
    
    for (const field of requiredFields) {
      const value = credentials[field];
      
      // 空値チェック
      if (!value || value.trim() === '') {
        invalidFields.push({ field, reason: '未設定', value: '(空)' });
        continue;
      }
      
      // 例示値チェック
      if (exampleValues[field] && exampleValues[field].includes(value)) {
        invalidFields.push({ field, reason: '例示値のまま', value });
        continue;
      }
      
      // 明らかに不正な値のチェック
      if (value.includes('your_') || value.includes('your-') || value.includes('example')) {
        invalidFields.push({ field, reason: '例示値と思われる', value });
        continue;
      }
    }
    
    if (invalidFields.length > 0) {
      console.log('⚠️  以下の項目に問題があります:');
      invalidFields.forEach(({ field, reason, value }) => {
        console.log(`   - ${field}: ${reason} (${value})`);
      });
      console.log('\n📝 .envファイルを編集して、実際の認証情報を入力してください。');
      console.log('freee APIの認証情報は以下から取得できます:');
      console.log('https://developer.freee.co.jp/');
      console.log('\n🔧 設定方法:');
      console.log('1. .env.sampleを.envにコピー');
      console.log('2. .envファイル内のFREEE_*の値を実際の値に変更');
      console.log('3. 再度このスクリプトを実行');
      return;
    }

    // データベース接続テスト
    console.log('データベース接続をテスト中...');
    const { query } = require('./db');
    await query('SELECT NOW()');
    console.log('✅ Neon PostgreSQLに正常に接続しました');

    // テーブル存在確認
    console.log('テーブル存在確認中...');
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('freee_api_user_info', 'freee_api_tokens')
    `);
    
    const existingTables = tableCheck.rows.map(row => row.table_name);
    if (!existingTables.includes('freee_api_user_info') || !existingTables.includes('freee_api_tokens')) {
      console.log('❌ 必要なテーブルが存在しません');
      console.log('以下のコマンドを実行してテーブルを作成してください:');
      console.log('npm run setup-db');
      return;
    }
    console.log('✅ 必要なテーブルが存在します');

    // 既存のユーザー確認
    console.log('既存ユーザーを確認中...');
    const existingUserCheck = await query(
      'SELECT id, username FROM freee_api_user_info WHERE username = $1',
      [credentials.username]
    );
    
    if (existingUserCheck.rows.length > 0) {
      console.log(`ℹ️  ユーザー "${credentials.username}" は既に存在します。情報を更新します。`);
    }

    console.log('認証情報をNeon PostgreSQLに保存中...');
    const result = await credentialsManager.saveCredentials(credentials);
    console.log('✅ 認証情報の保存が完了しました!');
    
    console.log('\n📋 保存された情報:');
    console.log('ユーザー名:', credentials.username);
    console.log('クライアントID:', credentials.clientId);
    console.log('会社ID:', credentials.companyId);
    console.log('従業員ID:', credentials.employeeId);
    console.log('リフレッシュトークン:', credentials.refreshToken ? credentials.refreshToken.substring(0, 20) + '...' : '未設定');
    console.log('アクセストークン:', credentials.accessToken ? '設定済み' : '未設定');
    console.log('データベースID:', result.userInfo.id);
    
    console.log('\n🔐 セキュリティ情報:');
    console.log('- client_secretとrefresh_tokenは暗号化されて保存されました');
    console.log('- 認証情報は.envファイルから読み込まれました');
    console.log('- 認証情報はNeon PostgreSQLに安全に保存されています');
    
    console.log('\n🚀 次のステップ:');
    console.log('1. node debugCredentials.js で設定を確認');
    console.log('2. npm start で勤怠入力ツールを実行');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.log('\n📋 確認事項:');
    console.log('1. .envファイルにDATABASE_URLまたはDB接続情報が設定されているか');
    console.log('2. .envファイルにFREEE_*の認証情報が正しく設定されているか');
    console.log('3. ENCRYPTION_KEYが32文字の文字列になっているか');
    console.log('4. Neonプロジェクトが有効でアクセス可能か');
    console.log('5. npm run setup-db でテーブルが作成されているか');
    
    // 詳細なエラー情報
    if (error.message.includes('connect')) {
      console.log('\n🔧 データベース接続エラーの場合:');
      console.log('- DATABASE_URLの形式が正しいか確認');
      console.log('- Neonプロジェクトが稼働しているか確認');
      console.log('- ネットワーク接続を確認');
    }
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n🔧 テーブル作成エラーの場合:');
      console.log('- npm run setup-db を実行してテーブルを作成');
    }
    
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      console.log('\n🔧 重複エラーの場合:');
      console.log('- 同じユーザー名が既に存在します');
      console.log('- .envのFREEE_USERNAMEを変更するか、既存データを確認してください');
    }
    
  } finally {
    // PostgreSQLコネクションプールを終了
    try {
      const { pool } = require('./db');
      await pool.end();
      console.log('\nデータベース接続を終了しました');
    } catch (e) {
      // 接続が確立されていない場合は無視
    }
  }
}

// コマンドライン実行時のみ実行
if (require.main === module) {
  setupInitialCredentials().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('セットアップ実行エラー:', error);
    process.exit(1);
  });
}

module.exports = setupInitialCredentials;
