require('dotenv').config();
const credentialsManager = require('./credentialsManager');

async function validateFreeeCredentials() {
  try {
    console.log('=== freee API認証情報検証ツール (安全版) ===');
    
    // 1. 保存済み認証情報一覧を取得
    console.log('1. 保存済み認証情報を確認中...');
    const credentialsList = await credentialsManager.listCredentials();
    
    if (credentialsList.length === 0) {
      console.log('❌ 認証情報が見つかりません');
      console.log('npm run setup-credentials を実行してください');
      return;
    }
    
    console.log(`✅ ${credentialsList.length}件の認証情報が見つかりました`);
    credentialsList.forEach((item, index) => {
      console.log(`   ${index + 1}. ID:${item.id}, ユーザー名:${item.username}, 会社ID:${item.company_id}`);
    });
    
    // 最新の認証情報を使用
    const userInfoId = credentialsList[0].id;
    console.log(`\n使用する認証情報ID: ${userInfoId}`);
    
    // 2. 認証情報の詳細を取得
    console.log('\n2. 認証情報の詳細を取得中...');
    const credentials = await credentialsManager.getCredentials(userInfoId);
    
    console.log('認証情報詳細:');
    console.log('  ユーザー名:', credentials.clientId ? '設定済み' : '未設定');
    console.log('  クライアントID:', credentials.clientId ? credentials.clientId.substring(0, 20) + '...' : '未設定');
    console.log('  クライアントシークレット:', credentials.clientSecret ? 'あり' : 'なし');
    console.log('  会社ID:', credentials.companyId || '未設定');
    console.log('  従業員ID:', credentials.employeeId || '未設定');
    console.log('  リフレッシュトークン:', credentials.refreshToken ? credentials.refreshToken.substring(0, 30) + '...' : '未設定');
    console.log('  アクセストークン:', credentials.accessToken ? 'あり' : 'なし');
    
    if (credentials.tokenCreatedAt) {
      console.log('  トークン作成日時:', credentials.tokenCreatedAt.toLocaleString('ja-JP'));
      console.log('  トークン有効期限:', credentials.accessTokenExpiresIn, '秒');
      
      const isValid = credentialsManager.isAccessTokenValid(credentials.tokenCreatedAt, credentials.accessTokenExpiresIn, true);
      console.log('  トークン有効性:', isValid ? '有効' : '期限切れ');
    }
    
    // 3. 認証情報の検証（実際のAPIコールは行わない）
    console.log('\n3. 認証情報の妥当性検証...');
    
    const validationResults = [];
    
    // 必須フィールドの確認
    if (!credentials.clientId || credentials.clientId.trim() === '') {
      validationResults.push('❌ CLIENT_IDが未設定');
    } else if (credentials.clientId.length < 10) {
      validationResults.push('⚠️ CLIENT_IDが短すぎる可能性 (現在: ' + credentials.clientId.length + '文字)');
    } else {
      validationResults.push('✅ CLIENT_ID: 設定済み (' + credentials.clientId.length + '文字)');
    }
    
    if (!credentials.clientSecret || credentials.clientSecret.trim() === '') {
      validationResults.push('❌ CLIENT_SECRETが未設定');
    } else if (credentials.clientSecret.length < 50) {
      validationResults.push('⚠️ CLIENT_SECRETが短すぎる可能性 (現在: ' + credentials.clientSecret.length + '文字)');
    } else {
      validationResults.push('✅ CLIENT_SECRET: 設定済み (' + credentials.clientSecret.length + '文字)');
    }
    
    if (!credentials.refreshToken || credentials.refreshToken.trim() === '') {
      validationResults.push('❌ REFRESH_TOKENが未設定');
    } else if (credentials.refreshToken.length < 30) {
      validationResults.push('⚠️ REFRESH_TOKENが短すぎる可能性 (現在: ' + credentials.refreshToken.length + '文字)');
    } else {
      validationResults.push('✅ REFRESH_TOKEN: 設定済み (' + credentials.refreshToken.length + '文字)');
    }
    
    if (!credentials.companyId || credentials.companyId.trim() === '') {
      validationResults.push('❌ COMPANY_IDが未設定');
    } else {
      validationResults.push('✅ COMPANY_ID: 設定済み');
    }
    
    if (!credentials.employeeId || credentials.employeeId.trim() === '') {
      validationResults.push('❌ EMPLOYEE_IDが未設定');
    } else {
      validationResults.push('✅ EMPLOYEE_ID: 設定済み');
    }
    
    console.log('検証結果:');
    validationResults.forEach(result => console.log(`  ${result}`));
    
    // 4. 実際のAPIテストを行うかの確認
    console.log('\n⚠️ 重要な警告:');
    console.log('freee APIのtokenエンドポイントをテストすると、新しいトークンが発行され、');
    console.log('現在のrefresh_tokenが無効になります。失敗すると認証情報が使用不能になる');
    console.log('可能性があります。');
    
    const inquirer = require('inquirer');
    const { shouldTest } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldTest',
        message: 'それでも実際のfreee API認証テストを実行しますか？（危険）',
        default: false
      }
    ]);
    
    if (!shouldTest) {
      console.log('\n✅ 安全のため、実際のAPIテストをスキップしました。');
      console.log('\n💡 推奨事項:');
      console.log('- 認証情報に問題がある場合は、freee開発者ページで新しいトークンを取得');
      console.log('- .envファイルを更新後、npm run setup-credentials を実行');
      console.log('- 実際のテストは npm start で本アプリケーションを実行して確認');
      return;
    }
    
    // 5. 実際のfreee APIテスト（危険・ユーザーが明示的に承認した場合のみ）
    console.log('\n5. freee APIトークンエンドポイントをテスト中...');
    console.log('⚠️ 注意: このテストは既存のトークンを無効化します');
    
    const tokenUrl = "https://accounts.secure.freee.co.jp/public_api/token";
    const body = {
      grant_type: "refresh_token",
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
    };

    console.log('リクエスト詳細:');
    console.log('  URL:', tokenUrl);
    console.log('  grant_type:', body.grant_type);
    console.log('  client_id:', body.client_id);
    console.log('  client_secret:', body.client_secret ? body.client_secret.substring(0, 20) + '...' : 'なし');
    console.log('  refresh_token:', body.refresh_token ? body.refresh_token.substring(0, 30) + '...' : 'なし');

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };

    console.log('\nfreee APIにリクエスト送信中...');
    const response = await fetch(tokenUrl, options);
    
    console.log('レスポンス:');
    console.log('  ステータス:', response.status);
    console.log('  ステータステキスト:', response.statusText);
    console.log('  ヘッダー:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('  ボディ:', responseText);
    
    if (response.ok) {
      console.log('\n✅ freee API認証テスト成功！');
      
      try {
        const result = JSON.parse(responseText);
        if (result.access_token && result.refresh_token) {
          console.log('新しいトークンを取得しました');
          console.log('アクセストークン（先頭20文字）:', result.access_token.substring(0, 20) + '...');
          console.log('有効期限:', result.expires_in, '秒');
          
          console.log('\n🚨 重要: 古いrefresh_tokenは既に無効になっています');
          console.log('新しいトークンを必ず保存してください。保存しないと認証不能になります。');
          
          // 必ず保存する（選択肢を与えない）
          await credentialsManager.updateTokens(userInfoId, result.access_token, result.refresh_token, result.expires_in);
          console.log('✅ 新しいトークンを自動保存しました（安全のため強制保存）');
        }
      } catch (e) {
        console.log('⚠️ レスポンスのJSONパースに失敗');
        console.log('❌ 認証情報が破損した可能性があります');
      }
      
    } else {
      console.log('\n❌ freee API認証テスト失敗');
      console.log('🚨 既存のrefresh_tokenが無効化された可能性があります');
      
      if (response.status === 401) {
        console.log('\n🔍 401エラーの原因分析:');
        console.log('- client_idまたはclient_secretが間違っている');
        console.log('- refresh_tokenが既に無効または期限切れ');
        console.log('- freeeアプリケーションの設定に問題がある');
        
        console.log('\n💡 復旧方法:');
        console.log('1. freee開発者ページ(https://developer.freee.co.jp/)にログイン');
        console.log('2. OAuth認証フローを再実行してrefresh_tokenを再取得');
        console.log('3. .envファイルの認証情報を更新');
        console.log('4. npm run setup-credentials を再実行');
      }
    }
    
  } catch (error) {
    console.error('\n❌ 検証中にエラーが発生しました:', error.message);
    console.error('スタックトレース:', error.stack);
  } finally {
    // データベース接続を終了
    try {
      const { pool } = require('./db');
      await pool.end();
      console.log('\nデータベース接続を終了しました');
    } catch (e) {
      // 無視
    }
  }
}

// コマンドライン実行時のみ実行
if (require.main === module) {
  validateFreeeCredentials().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('検証実行エラー:', error);
    process.exit(1);
  });
}

module.exports = validateFreeeCredentials;
