require('dotenv').config();
const { supabase } = require('./db');

async function testSupabaseConnection() {
  console.log('=== Supabase接続テスト ===');
  
  try {
    // 1. Supabaseクライアントの確認
    console.log('1. Supabaseクライアント初期化...');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'あり' : 'なし');
    
    // 2. テーブル存在確認
    console.log('\n2. テーブル接続確認...');
    
    // freee_api_my_info テーブルの確認
    const { data: myInfoData, error: myInfoError } = await supabase
      .from('freee_api_my_info')
      .select('id, username')
      .limit(1);
    
    if (myInfoError) {
      console.log('   ❌ freee_api_my_info テーブルエラー:', myInfoError.message);
    } else {
      console.log('   ✅ freee_api_my_info テーブル接続成功');
      console.log('   データ件数:', myInfoData?.length || 0);
    }
    
    // freee_api_tokens テーブルの確認
    const { data: tokensData, error: tokensError } = await supabase
      .from('freee_api_tokens')
      .select('id, my_info_id')
      .limit(1);
    
    if (tokensError) {
      console.log('   ❌ freee_api_tokens テーブルエラー:', tokensError.message);
    } else {
      console.log('   ✅ freee_api_tokens テーブル接続成功');
      console.log('   データ件数:', tokensData?.length || 0);
    }
    
    // 3. 暗号化テスト
    console.log('\n3. 暗号化機能テスト...');
    const { encrypt, decrypt } = require('./db');
    
    if (!process.env.ENCRYPTION_KEY) {
      console.log('   ❌ ENCRYPTION_KEY が設定されていません');
    } else if (process.env.ENCRYPTION_KEY.length !== 32) {
      console.log('   ❌ ENCRYPTION_KEY は32文字である必要があります（現在: ' + process.env.ENCRYPTION_KEY.length + '文字）');
    } else {
      const testText = 'test_secret_123';
      const encrypted = encrypt(testText);
      const decrypted = decrypt(encrypted);
      
      if (testText === decrypted) {
        console.log('   ✅ 暗号化・復号化テスト成功');
      } else {
        console.log('   ❌ 暗号化・復号化テスト失敗');
      }
    }
    
    console.log('\n=== 接続テスト完了 ===');
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
  }
}

testSupabaseConnection();
