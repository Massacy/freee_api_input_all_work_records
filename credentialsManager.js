const { query, encrypt, decrypt } = require('./db');

class CredentialsManager {
  // 認証情報を取得（user_info_idで指定）
  async getCredentials(userInfoId) {
    if (!userInfoId) {
      throw new Error('userInfoId is required');
    }

    console.log(`Getting credentials for userInfoId: ${userInfoId}`);

    // freee_api_user_infoから基本情報を取得
    const userInfoResult = await query(
      'SELECT * FROM freee_api_user_info WHERE id = $1',
      [userInfoId]
    );

    if (userInfoResult.rows.length === 0) {
      throw new Error(`user info not found for ID ${userInfoId}`);
    }

    const userInfo = userInfoResult.rows[0];
    console.log(`Found userInfo for user: ${userInfo.username}`);

    // freee_api_tokensから最新のトークン情報を取得
    const tokenResult = await query(
      'SELECT *, created_at AT TIME ZONE \'UTC\' as created_at_utc FROM freee_api_tokens WHERE user_info_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userInfoId]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error(`Token info not found for userInfoId ${userInfoId}`);
    }

    const tokenInfo = tokenResult.rows[0];
    console.log(`Found token info created at: ${tokenInfo.created_at}`);
    console.log(`UTC time: ${tokenInfo.created_at_utc}`);

    return {
      clientId: userInfo.client_id,
      clientSecret: decrypt(userInfo.client_secret),
      companyId: userInfo.company_id,
      employeeId: userInfo.employee_id,
      refreshToken: decrypt(tokenInfo.refresh_token),
      accessToken: decrypt(tokenInfo.access_token),
      accessTokenExpiresIn: tokenInfo.access_token_expires_in,
      tokenCreatedAt: new Date(tokenInfo.created_at_utc) // UTC時刻を明示的に使用
    };
  }

  // アクセストークンが有効かチェック
  isAccessTokenValid(tokenCreatedAt, expiresIn, verbose = false) {
    // UTC時刻で正確な比較を行う
    const now = new Date();
    const createdAt = new Date(tokenCreatedAt);
    
    // 期限切れ時刻を計算（ミリ秒で計算）
    const expiresAt = new Date(createdAt.getTime() + (expiresIn * 1000));
    
    // 有効性判定（少し余裕を持たせる）
    const bufferSeconds = 60; // 1分のバッファ
    const expiresAtWithBuffer = new Date(expiresAt.getTime() - (bufferSeconds * 1000));
    const isValid = now < expiresAtWithBuffer;
    
    if (verbose) {
      console.log('Token validity check:');
      console.log('  Current time (UTC):', now.toISOString());
      console.log('  Token created (UTC):', createdAt.toISOString());
      console.log('  Expires in (seconds):', expiresIn);
      console.log('  Token expires (UTC):', expiresAt.toISOString());
      console.log('  Buffer time (UTC):', expiresAtWithBuffer.toISOString());
      console.log('  Is valid:', isValid);
      
      if (!isValid) {
        const expiredAgo = Math.floor((now.getTime() - expiresAt.getTime()) / 1000);
        if (expiredAgo > 0) {
          console.log(`  Expired ${expiredAgo} seconds ago`);
        } else {
          console.log(`  Will expire in ${Math.abs(expiredAgo)} seconds`);
        }
      }
    }
    
    return isValid;
  }

  // 新しいトークンを保存
  async updateTokens(userInfoId, accessToken, refreshToken, expiresIn) {
    const result = await query(
      `INSERT INTO freee_api_tokens (user_info_id, refresh_token, access_token, access_token_expires_in, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [userInfoId, encrypt(refreshToken), encrypt(accessToken), expiresIn]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update tokens');
    }

    return result.rows[0];
  }

  // 初期認証情報を保存
  async saveCredentials(credentials) {
    // まずfreee_api_user_infoに保存（upsert処理）
    const userInfoResult = await query(
      `INSERT INTO freee_api_user_info (username, client_id, client_secret, company_id, employee_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET
         client_id = EXCLUDED.client_id,
         client_secret = EXCLUDED.client_secret,
         company_id = EXCLUDED.company_id,
         employee_id = EXCLUDED.employee_id,
         updated_at = NOW()
       RETURNING *`,
      [
        credentials.username,
        credentials.clientId,
        encrypt(credentials.clientSecret),
        credentials.companyId,
        credentials.employeeId
      ]
    );

    if (userInfoResult.rows.length === 0) {
      throw new Error('Failed to save user info');
    }

    const userInfo = userInfoResult.rows[0];

    // 次にfreee_api_tokensに保存
    const tokenResult = await query(
      `INSERT INTO freee_api_tokens (user_info_id, refresh_token, access_token, access_token_expires_in, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        userInfo.id,
        encrypt(credentials.refreshToken),
        encrypt(credentials.accessToken || ''),
        credentials.expiresIn || 0
      ]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error('Failed to save token info');
    }

    return { userInfo, tokenInfo: tokenResult.rows[0] };
  }

  // 利用可能な認証情報一覧を取得
  async listCredentials() {
    const result = await query(
      `SELECT id, username, client_id, company_id, employee_id, created_at
       FROM freee_api_user_info
       ORDER BY created_at DESC`
    );

    return result.rows || [];
  }
}

module.exports = new CredentialsManager();
