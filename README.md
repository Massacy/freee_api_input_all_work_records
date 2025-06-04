# How to Use

固定の勤怠/休憩時間を指定の日付で一括入力するための freeeAPI の使い方の流れです。
実行する当月の平日かつ祝日でない日付に対して処理を行います。
デフォルトで 9:00-18:00 を勤怠時間、12:00-13:00 を休憩時間にしています。

## 🆕 Supabase版の特徴

- 認証情報をSupabaseデータベースに暗号化して安全に保存
- 複数ユーザー・複数アカウントの管理が可能
- アクセストークンの有効期限を自動チェック
- トークンの更新履歴をDBで管理

## 初回準備

### 1. freee API設定
1. こちらを読んで指示に従って進める(https://developer.freee.co.jp/startguide)
2. 認可コードからリフレッシュトークンとアクセストークンを取得する(https://developer.freee.co.jp/startguide/getting-access-token)

3. アクセスが確認できたら、ログインユーザーの情報を確認する(https://developer.freee.co.jp/reference/hr/reference#operations-tag-ログインユーザー)
   以下のように、companies 内に、対象の事業所の id、employee_id があるので、メモっておく。

```json
{
  "id": 12345678,
  "companies": [
    {
      "id": 1234567,
      "name": "Example Company 株式会社",
      "role": "self_only",
      "external_cid": "EXT1234567890",
      "employee_id": 123456,
      "display_name": "Example User"
    }
  ]
}
```

### 2. Supabase設定
1. 必要なライブラリのインストール:
```bash
npm install
```

2. 環境変数を設定（.envファイルは.env.sampleからコピーして作成）:
```bash
cp .env.sample .env
```

3. .envファイルを編集して実際の値を設定:
```env
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
ENCRYPTION_KEY=your-actual-32-character-encryption-key
```

### 3. 認証情報をデータベースに保存
1. `setupCredentials.js` ファイルを編集して、実際の認証情報を入力:
```javascript
const credentials = {
  username: 'yamada_taro',                    // 任意のユーザー名
  clientId: 'abc123xyz789',                   // freeeのCLIENT_ID
  clientSecret: 'secret_abc123_example',      // freeeのCLIENT_SECRET
  companyId: '123456',                        // freeeのCOMPANY_ID
  employeeId: '789012',                       // freeeのEMPLOYEE_ID
  refreshToken: 'refresh_token_example_here'  // freeeのREFRESH_TOKEN
};
```

2. セットアップスクリプトを実行:
```bash
node setupCredentials.js
```

3. 🔐 セキュリティのため、`setupCredentials.js`から実際の認証情報を削除することをお勧めします。

## 🔒 セキュリティに関する重要な注意

- **絶対に** `.env` ファイルをGitにコミットしないでください
- `setupCredentials.js` に実際の認証情報を入力した後は、値を例示用に戻してからコミットしてください
- `ENCRYPTION_KEY` は十分に複雑で予測困難な32文字の文字列を使用してください
- 本番環境では環境変数やシークレット管理サービスの使用を検討してください

## 実行

以下コマンドを実行する（エラーが出ていないか確認すること！）

```bash
node index.js
```

- コマンドラインから「先月」か「当月」か選ぶ。（実行タイミングによって、対象とする月が異なるため）
- 対象となる日付がリスト表示されるので、間違いなければ、「y」 を入力する。

## 🔄 従来版からの変更点

| 項目 | 従来版 | Supabase版 |
|------|--------|------------|
| **認証情報保存** | .envファイル（プレーンテキスト） | Supabaseデータベース（暗号化） |
| **複数アカウント** | 不可 | 可能 |
| **トークン管理** | ファイル上書き | 履歴保存 |
| **有効期限チェック** | なし | 自動チェック |
| **セキュリティ** | 低い | 高い（暗号化） |

## 📝 注意事項

- リフレッシュトークンの有効期限は90日間
- 実行するたびにアクセストークンを自動更新してデータベースに保存
- 平日でも勤務日でない日は freee の勤怠編集のページから個別で未入力にすること
- 複数のアカウントを管理する場合は、`getAccessToken(myInfoId)` と `executeReplaceInfo(date, accessToken, myInfoId)` の引数でIDを指定

## 🛠️ トラブルシューティング

### エラー: "My info not found"
- `setupCredentials.js`が正常に実行されているか確認
- Supabaseの接続情報が正しいか確認

### エラー: "Token info not found"  
- 初期セットアップで refresh_token が正しく保存されているか確認
- Supabaseのテーブル構造が正しいか確認

### 暗号化/復号化エラー
- `ENCRYPTION_KEY`が32文字の文字列になっているか確認
- 同じ暗号化キーを使用しているか確認
