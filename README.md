# freee API 勤怠時間一括入力ツール

固定の勤怠/休憩時間を指定の日付で一括入力するための freeeAPI の使い方の流れです。
実行する当月または先月の平日かつ祝日でない日付に対して処理を行います。
デフォルトで 9:00-18:00 を勤怠時間、12:00-13:00 を休憩時間にしています。

## 🔄 改良版の特徴

- 認証情報をSupabaseデータベースに暗号化して安全に保存
- 複数ユーザー・複数アカウントの管理が可能
- アクセストークンの有効期限を自動チェック
- トークンの更新履歴をDBで管理
- **🎯 NEW: 日付除外機能** - 有給や休暇日など、個別の日付を除外可能

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

## 実行方法

以下コマンドを実行する（エラーが出ていないか確認すること！）

```bash
node index.js
```

### 📋 実行の流れ

1. **対象月の選択**
   - 「先月」または「当月」を選択

2. **📅 日付除外機能（NEW）**
   - 対象月の営業日一覧が表示される
   - 除外したい日付をチェックボックスで選択
   - **操作方法:**
     - `↑↓キー`: 項目間の移動
     - `スペースキー`: 選択/解除  
     - `Enterキー`: 確定

3. **最終確認**
   - 処理対象の日付数を確認
   - 「y」で実行開始

4. **一括処理実行**
   - 各日付の勤務時間を順次入力
   - 進捗状況をリアルタイム表示

### 💡 日付除外機能の使用例

```
対象期間の営業日: 22日
除外したい日付がある場合は選択してください
↑↓で移動、スペースで選択/解除、Enterで確定

❯ ◯ 2025-05-01 (木)
  ◯ 2025-05-02 (金)
  ❯ 2025-05-07 (水)  ← スペースで選択
  ◯ 2025-05-08 (木)
  ❯ 2025-05-09 (金)  ← スペースで選択
  ...

除外された日付: 2日
  - 2025-05-07 (水)
  - 2025-05-09 (金)

最終的な対象日付: 20日
```

## 🎯 活用シーン

| シーン | 使用方法 |
|--------|----------|
| **通常の月末処理** | 除外なしで全営業日を一括入力 |
| **有給取得月** | 有給日を除外して残りの日を一括入力 |
| **年末年始** | 特別休暇日を除外 |
| **出張月** | 出張日を除外して通常勤務日のみ処理 |
| **研修参加月** | 研修日や会議日を除外 |

## 🔄 従来版からの変更点

| 項目 | 従来版 | 改良版 |
|------|--------|------------|
| **認証情報保存** | .envファイル（プレーンテキスト） | Supabaseデータベース（暗号化） |
| **複数アカウント** | 不可 | 可能 |
| **トークン管理** | ファイル上書き | 履歴保存 |
| **有効期限チェック** | なし | 自動チェック |
| **日付除外** | なし | **✅ チェックボックス選択** |
| **エラーハンドリング** | 基本的 | 詳細なエラー処理と継続確認 |
| **セキュリティ** | 低い | 高い（暗号化） |

## 📝 注意事項

- リフレッシュトークンの有効期限は90日間
- 実行するたびにアクセストークンを自動更新してデータベースに保存
- **除外した日付は freee の勤怠編集のページから個別で入力してください**
- 複数のアカウントを管理する場合は、`getAccessToken(myInfoId)` と `executeReplaceInfo(date, accessToken, myInfoId)` の引数でIDを指定
- 処理中にエラーが発生した場合、残りの日付の処理を継続するか選択できます

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

### チェックボックスが動作しない
- ターミナルの種類を確認（iTerm、Terminal.app、VS Code統合ターミナルなど）
- `node index.js` を直接ターミナルから実行
- SSH接続やリモート環境では動作しない場合があります

## 🔧 開発者向け情報

### ファイル構成
```
├── index.js              # メイン実行ファイル
├── ioMessage.js          # CLI インターフェース（日付除外機能含む）
├── generateDate.js       # 営業日生成
├── credentialsManager.js # 認証情報管理
├── getAccessToken.js     # トークン取得・更新
├── executeReplaceInfo.js # 勤務時間入力API実行
├── db.js                 # Supabase接続・暗号化機能
└── setupCredentials.js   # 初期認証情報設定
```

### カスタマイズ可能な項目
- 勤務時間: `executeReplaceInfo.js` の `work_record_segments`
- 休憩時間: `executeReplaceInfo.js` の `break_records`
- 除外対象: `generateDate.js` で土日祝日以外の条件追加可能
