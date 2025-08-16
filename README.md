# freee API 勤怠入力自動化ツール (Neon版)

このツールは、freee人事労務のAPIを使用して勤務時間を自動入力するNode.jsアプリケーションです。
データベースにはNeon PostgreSQLを使用しています。

実行する当月または先月の平日かつ祝日でない日付に対して処理を行います。
デフォルトで 9:00-18:00 を勤怠時間、12:00-13:00 を休憩時間にしています。

## 前提条件

- Node.js (v14以上)
- Neon PostgreSQLプロジェクト
- freee人事労務のAPIアクセス権限

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Neonプロジェクトの作成

1. [Neon](https://neon.tech)でアカウントを作成
2. 新しいプロジェクトを作成
3. データベース接続文字列を取得

### 3. 環境変数の設定

```bash
cp .env.sample .env
```

`.env`ファイルを編集して、以下の情報を設定してください：

```env
# Neon PostgreSQL Database URL
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require

# 暗号化キー（32文字）
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### 4. データベースのセットアップ

```bash
npm run setup-db
```

このコマンドで必要なテーブルとインデックスが自動作成されます。

### 5. freee認証情報の設定

`.env`ファイルを編集して、freeeのAPI認証情報を設定してください：

```env
# freee API認証情報
FREEE_USERNAME=your_username
FREEE_CLIENT_ID=your_freee_client_id
FREEE_CLIENT_SECRET=your_freee_client_secret
FREEE_COMPANY_ID=your_company_id
FREEE_EMPLOYEE_ID=your_employee_id
FREEE_REFRESH_TOKEN=your_refresh_token
FREEE_ACCESS_TOKEN=your_access_token
FREEE_ACCESS_TOKEN_EXPIRES_IN=21600
```

設定後、以下を実行：
```bash
npm run setup-credentials
```

## 使用方法

### 基本的な使用方法

```bash
npm start
```

### 実行フロー

1. 認証情報の確認
2. 対象月の選択
3. 営業日の自動計算
4. 除外する日付の選択
5. 処理内容の確認
6. 勤怠データの自動入力

## データベース構造

### freee_api_user_info テーブル

| カラム | 型 | 説明 |
|--------|----|----- |
| id | SERIAL | 主キー |
| username | VARCHAR(255) | ユーザー名（一意） |
| client_id | VARCHAR(255) | freee API クライアントID |
| client_secret | TEXT | freee API クライアントシークレット（暗号化） |
| company_id | VARCHAR(255) | 会社ID |
| employee_id | VARCHAR(255) | 従業員ID |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### freee_api_tokens テーブル

| カラム | 型 | 説明 |
|--------|----|----- |
| id | SERIAL | 主キー |
| user_info_id | INTEGER | freee_api_user_infoテーブルの外部キー |
| refresh_token | TEXT | リフレッシュトークン（暗号化） |
| access_token | TEXT | アクセストークン（暗号化） |
| access_token_expires_in | INTEGER | アクセストークンの有効期限（秒） |
| created_at | TIMESTAMP | 作成日時 |

## トラブルシューティング

### データベース接続エラー

1. `.env`ファイルの`DATABASE_URL`が正しく設定されているか確認
2. Neonプロジェクトが有効かつアクセス可能か確認
3. ネットワーク接続を確認

### 認証エラー

1. freeeのAPIキーが有効か確認
2. `.env`で正しい情報が入力されているか確認
3. リフレッシュトークンが期限切れでないか確認

### セキュリティ

- 認証情報は暗号化してデータベースに保存されます
- `ENCRYPTION_KEY`は必ず32文字の安全な文字列を使用してください
- `.env`ファイルはバージョン管理に含めないでください

## 注意事項

- このツールはfreee人事労務の正式なサポート対象外です
- API利用規約を必ず確認してください
- 大量のデータ処理時はAPI制限にご注意ください
- 本番環境での使用前に十分にテストしてください

## 🔧 開発者向け情報

### ファイル構成
```
├── index.js                    # メイン実行ファイル
├── package.json               # 依存関係とスクリプト定義
├── .env.sample               # 環境変数のテンプレート
├── .gitignore                # Git除外ファイル設定
├── README.md                 # このファイル
│
│   ## コアファイル
├── db.js                     # Neon PostgreSQL接続・暗号化機能
├── credentialsManager.js     # 認証情報管理（CRUD操作）
├── getAccessToken.js         # トークン取得・更新
├── executeReplaceInfo.js     # 勤務時間入力API実行
├── generateDate.js           # 営業日生成（土日祖日除外）
├── ioMessage.js              # CLIインターフェース（日付選択・除外機能）
│
│   ## セットアップスクリプト
├── setupDatabase.js          # データベーステーブル作成
├── setupCredentials.js       # 認証情報初期設定（.envから読み込み）
│
│   ## デバッグ・検証ツール
├── debugCredentials.js       # システム状態・認証情報確認
└── validateFreeeCredentials.js # freee API認証テスト（安全版）
```

### 利用可能なコマンド

```bash
# メインアプリケーションの実行
npm start                      # 勤怠入力ツールの実行

# 初期セットアップ
npm run setup-db              # データベーステーブルの作成
npm run setup-credentials     # .envから認証情報を読み込み

# デバッグ・検証
npm run debug-credentials     # システム状態確認（データベース・認証情報）
npm run validate-credentials  # freee API認証テスト（安全版）
```

### カスタマイズ可能な項目
- 勤務時間: `executeReplaceInfo.js` の `work_record_segments`
- 休憩時間: `executeReplaceInfo.js` の `break_records`
- 除外対象: `generateDate.js` で土日祝日以外の条件追加可能
