const { supabase, encrypt, decrypt } = require('./db');

class CredentialsManager {
  // 認証情報を取得（my_info_idで指定）
  async getCredentials(myInfoId) {
    if (!myInfoId) {
      throw new Error('myInfoId is required');
    }

    console.log(`Getting credentials for myInfoId: ${myInfoId}`);

    // freee_api_my_infoから基本情報を取得
    const { data: myInfo, error: myInfoError } = await supabase
      .from('freee_api_my_info')
      .select('*')
      .eq('id', myInfoId)
      .single();

    if (myInfoError) {
      console.error('MyInfo error:', myInfoError);
      throw new Error(`My info not found for ID ${myInfoId}: ${myInfoError.message}`);
    }

    if (!myInfo) {
      throw new Error(`My info not found for ID ${myInfoId}`);
    }

    console.log(`Found myInfo for user: ${myInfo.username}`);

    // freee_api_tokensから最新のトークン情報を取得
    const { data: tokenInfo, error: tokenError } = await supabase
      .from('freee_api_tokens')
      .select('*')
      .eq('my_info_id', myInfoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError) {
      console.error('Token error:', tokenError);
      throw new Error(`Token info not found for myInfoId ${myInfoId}: ${tokenError.message}`);
    }

    if (!tokenInfo) {
      throw new Error(`Token info not found for myInfoId ${myInfoId}`);
    }

    console.log(`Found token info created at: ${tokenInfo.created_at}`);

    return {
      clientId: myInfo.client_id,
      clientSecret: decrypt(myInfo.client_secret),
      companyId: myInfo.company_id,
      employeeId: myInfo.employee_id,
      refreshToken: decrypt(tokenInfo.refresh_token),
      accessToken: decrypt(tokenInfo.access_token),
      accessTokenExpiresIn: tokenInfo.access_token_expires_in,
      tokenCreatedAt: new Date(tokenInfo.created_at)
    };
  }

  // アクセストークンが有効かチェック
  isAccessTokenValid(tokenCreatedAt, expiresIn) {
    const now = new Date();
    const expiresAt = new Date(tokenCreatedAt.getTime() + (expiresIn * 1000));
    return now < expiresAt;
  }

  // 新しいトークンを保存
  async updateTokens(myInfoId, accessToken, refreshToken, expiresIn) {
    const { data, error } = await supabase
      .from('freee_api_tokens')
      .insert([{
        my_info_id: myInfoId,
        refresh_token: encrypt(refreshToken),
        access_token: encrypt(accessToken),
        access_token_expires_in: expiresIn
      }])
      .select();

    if (error) {
      throw new Error(`Failed to update tokens: ${error.message}`);
    }

    return data[0];
  }

  // 初期認証情報を保存
  async saveCredentials(credentials) {
    // まずfreee_api_my_infoに保存
    const { data: myInfo, error: myInfoError } = await supabase
      .from('freee_api_my_info')
      .upsert([{
        username: credentials.username,
        client_id: credentials.clientId,
        client_secret: encrypt(credentials.clientSecret),
        company_id: credentials.companyId,
        employee_id: credentials.employeeId
      }])
      .select()
      .single();

    if (myInfoError) {
      throw new Error(`Failed to save my info: ${myInfoError.message}`);
    }

    // 次にfreee_api_tokensに保存
    const { data: tokenInfo, error: tokenError } = await supabase
      .from('freee_api_tokens')
      .insert([{
        my_info_id: myInfo.id,
        refresh_token: encrypt(credentials.refreshToken),
        access_token: encrypt(credentials.accessToken || ''),
        access_token_expires_in: credentials.expiresIn || 0
      }])
      .select();

    if (tokenError) {
      throw new Error(`Failed to save token info: ${tokenError.message}`);
    }

    return { myInfo, tokenInfo: tokenInfo[0] };
  }

  // 利用可能な認証情報一覧を取得
  async listCredentials() {
    const { data, error } = await supabase
      .from('freee_api_my_info')
      .select(`
        id,
        username,
        client_id,
        company_id,
        employee_id,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list credentials: ${error.message}`);
    }

    return data || [];
  }
}

module.exports = new CredentialsManager();
