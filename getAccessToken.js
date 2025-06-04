const credentialsManager = require('./credentialsManager');

module.exports = async function getAccessToken(myInfoId = null) {
  const tokenUrl = "https://accounts.secure.freee.co.jp/public_api/token";
  
  try {
    // myInfoIdが指定されていない場合は最新のものを取得
    if (myInfoId === null) {
      const list = await credentialsManager.listCredentials();
      if (list.length === 0) {
        throw new Error('No credentials found. Please run setupCredentials.js first.');
      }
      myInfoId = list[0].id;
      console.log(`Using latest credential ID: ${myInfoId}`);
    }
    
    const credentials = await credentialsManager.getCredentials(myInfoId);
    
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

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };

    const response = await fetch(tokenUrl, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const { access_token, refresh_token, expires_in } = result;

    // Supabaseに新しいトークンを保存
    await credentialsManager.updateTokens(myInfoId, access_token, refresh_token, expires_in);
    
    console.log('Access token refreshed and saved to Supabase');
    return access_token;
  } catch (error) {
    console.error("Error getAccessToken: ", error);
    throw error;
  }
};
