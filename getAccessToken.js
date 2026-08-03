const credentialsManager = require('./credentialsManager');

module.exports = async function getAccessToken(userInfoId) {
  if (!userInfoId) {
    throw new Error('userInfoId is required');
  }

  const tokenUrl = "https://accounts.secure.freee.co.jp/public_api/token";
  
  try {
    const credentials = await credentialsManager.getCredentials(userInfoId);
    
    // アクセストークンの有効期限をチェック
    if (credentials.accessToken && 
        credentialsManager.isAccessTokenValid(credentials.tokenCreatedAt, credentials.accessTokenExpiresIn)) {
      console.log('Using existing access token');
      return credentials.accessToken;
    }

    console.log('Access token expired or not found, refreshing...');

    const body = {
      grant_type: "refresh_token",
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
    };

    console.log('Sending refresh token request...');

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };

    const response = await fetch(tokenUrl, options);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      // エラーレスポンスの詳細を取得
      let errorDetails;
      try {
        errorDetails = await response.text();
        console.log('Error response body:', errorDetails);
      } catch (e) {
        console.log('Could not read error response body');
      }
      
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails || 'No details available'}`);
    }

    const result = await response.json();
    console.log('Token refresh successful');
    
    const { access_token, refresh_token, expires_in } = result;

    if (!access_token || !refresh_token) {
      throw new Error('Invalid response: missing access_token or refresh_token');
    }

    // 新しいトークンを保存
    await credentialsManager.updateTokens(userInfoId, access_token, refresh_token, expires_in);
    
    console.log('Access token refreshed and saved to Neon database');
    return access_token;
    
  } catch (error) {
    console.error("Error getAccessToken: ", error);
    
    // 詳細なエラー情報を提供
    if (error.message.includes('401')) {
      console.error('\n🔍 401 Unauthorized エラーの考えられる原因:');
      console.error('1. refresh_tokenが無効または期限切れ');
      console.error('2. client_idまたはclient_secretが間違っている');
      console.error('3. freee APIの認証設定に問題がある');
      console.error('\n💡 対処方法:');
      console.error('1. node debugCredentials.js で認証情報を確認');
      console.error('2. freee開発者ページで新しいrefresh_tokenを取得');
      console.error('3. .envファイルの認証情報を更新');
    }
    
    throw error;
  }
};
