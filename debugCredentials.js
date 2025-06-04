require('dotenv').config();
const credentialsManager = require('./credentialsManager');

async function debugCredentials() {
  console.log('=== 認証情報デバッグ ===');
  
  try {
    console.log('1. 環境変数確認:');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '設定済み' : '未設定');
    console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '設定済み' : '未設定');
    console.log('   ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? `設定済み(${process.env.ENCRYPTION_KEY.length}文字)` : '未設定');
    
    console.log('\n2. 保存済み認証情報確認:');
    
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
        console.log('   ユーザー名:', credentials.clientId ? '設定済み' : '未設定');
        console.log('   クライアントID:', credentials.clientId ? credentials.clientId.substring(0, 10) + '...' : '未設定');
        console.log('   会社ID:', credentials.companyId || '未設定');
        console.log('   従業員ID:', credentials.employeeId || '未設定');
        console.log('   リフレッシュトークン:', credentials.refreshToken ? credentials.refreshToken.substring(0, 20) + '...' : '未設定');
        console.log('   アクセストークン:', credentials.accessToken ? 'あり' : 'なし');
        
        if (credentials.tokenCreatedAt && credentials.accessTokenExpiresIn) {
          const isValid = credentialsManager.isAccessTokenValid(credentials.tokenCreatedAt, credentials.accessTokenExpiresIn);
          console.log('   トークン有効性:', isValid ? '有効' : '期限切れ');
        }
      }
      
    } catch (error) {
      console.log('   ❌ 認証情報取得エラー:', error.message);
      
      if (error.message.includes('My info not found')) {
        console.log('   → setupCredentials.jsを実行してください');
      }
    }
    
    console.log('\n3. 利用可能な認証情報一覧:');
    try {
      const list = await credentialsManager.listCredentials();
      console.log(`   登録済みアカウント数: ${list.length}`);
      list.forEach((item, index) => {
        console.log(`   ${index + 1}. ID:${item.id}, ユーザー名:${item.username}, 会社ID:${item.company_id}`);
      });
    } catch (error) {
      console.log('   ❌ 一覧取得エラー:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
  }
  
  console.log('\n=== デバッグ完了 ===');
}

debugCredentials();
