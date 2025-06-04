require('dotenv').config();
const getAccessToken = require('./getAccessToken');
const credentialsManager = require('./credentialsManager');

async function testGetAccessToken() {
  console.log('=== アクセストークン取得テスト ===');
  
  try {
    // 利用可能な認証情報を取得
    console.log('利用可能な認証情報を確認中...');
    const credentialsList = await credentialsManager.listCredentials();
    
    if (credentialsList.length === 0) {
      console.log('❌ 認証情報が見つかりません');
      console.log('💡 解決方法:');
      console.log('   1. setupCredentials.jsに実際のfreee認証情報を入力');
      console.log('   2. node setupCredentials.js を実行');
      return;
    }
    
    console.log(`✅ ${credentialsList.length}件の認証情報が見つかりました`);
    
    // 最新の認証情報を使用
    const latestCredential = credentialsList[0];
    const myInfoId = latestCredential.id;
    
    console.log(`使用する認証情報: ID=${myInfoId}, ユーザー名=${latestCredential.username}`);
    
    console.log('1. アクセストークンの取得を試行...');
    const accessToken = await getAccessToken(); // 引数なしで自動的に最新IDを使用
    
    if (accessToken) {
      console.log('✅ アクセストークン取得成功');
      console.log('   トークン（最初の20文字）:', accessToken.substring(0, 20) + '...');
      console.log('   トークン長:', accessToken.length);
    } else {
      console.log('❌ アクセストークンが取得できませんでした');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    
    if (error.message.includes('My info not found')) {
      console.log('\n💡 解決方法:');
      console.log('   1. setupCredentials.jsに実際のfreee認証情報を入力');
      console.log('   2. node setupCredentials.js を実行');
    } else if (error.message.includes('Token info not found')) {
      console.log('\n💡 解決方法:');
      console.log('   1. setupCredentials.jsのrefreshTokenが正しいか確認');
      console.log('   2. 初期セットアップを再実行');
    } else if (error.message.includes('HTTP error')) {
      console.log('\n💡 解決方法:');
      console.log('   1. freeeの認証情報が正しいか確認');
      console.log('   2. refresh_tokenの有効期限を確認（90日）');
    }
  }
  
  console.log('\n=== テスト完了 ===');
}

testGetAccessToken();
