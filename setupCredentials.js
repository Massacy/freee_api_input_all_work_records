require('dotenv').config();
const credentialsManager = require('./credentialsManager');

async function setupInitialCredentials() {
  try {
    console.log('=== freee API認証情報セットアップ ===');
    
    // ここに実際のfreee認証情報を入力してください
    const credentials = {
      username: 'yamada_taro',        // 任意のユーザー名（例: yamada_taro）
      clientId: 'abc123xyz789',       // freeeのCLIENT_ID
      clientSecret: 'secret_abc123',  // freeeのCLIENT_SECRET
      companyId: '123456',            // freeeのCOMPANY_ID
      employeeId: '789012',           // freeeのEMPLOYEE_ID
      refreshToken: 'refresh_token_example', // freeeのREFRESH_TOKEN
      accessToken: 'access_token_example', // freeeのACCESS_TOKEN
      expiresIn: 21600
    };

    console.log('認証情報をSupabaseに保存中...');
    const result = await credentialsManager.saveCredentials(credentials);
    console.log('✅ 認証情報の保存が完了しました!');
    console.log('ユーザー名:', credentials.username);
    console.log('リフレッシュトークン:', credentials.refreshToken);
    console.log('アクセストークン:', credentials.accessToken || '(未取得)');
    
    console.log('\n🔐 セキュリティ情報:');
    console.log('- client_secretとrefresh_tokenは暗号化されて保存されました');
    console.log('- このスクリプトから実際の認証情報を削除することをお勧めします');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.log('\n📋 確認事項:');
    console.log('1. .envファイルにSUPABASE_URLとSUPABASE_ANON_KEYが設定されているか');
    console.log('2. ENCRYPTION_KEYが32文字の文字列になっているか');
    console.log('3. Supabaseのテーブルが正しく作成されているか');
  }
}

// コマンドライン実行時のみ実行
if (require.main === module) {
  setupInitialCredentials();
}

module.exports = setupInitialCredentials;
