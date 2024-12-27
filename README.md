# How to Use

固定の勤怠/休憩時間を指定の日付で一括入力するための freeeAPI の使い方の流れです。
実行する当月の平日かつ祝日でない日付に対して処理を行います。
デフォルトで 9:00-18:00 を勤怠時間、12:00-13:00 を休憩時間にしています。

## 初回準備

1. こちらを読んで指示に従って進める(https://developer.freee.co.jp/startguide)
2. 認可コードからリフレッシュトークンとアクセストークンを取得する(https://developer.freee.co.jp/startguide/getting-access-token)

3. アクセスが確認できたら、ログインユーザーの情報を確認する(https://developer.freee.co.jp/reference/hr/reference#operations-tag-ログインユーザー)
   以下のように、companies 内に、対象の事業所の id、employee_id があるので、メモっておく。
   (2 回目以降は 2-2. を参照)

```
  "id": XXXXXXXX,
  "companies": [
    {
      "id": XXXXXXX,
      "name": "XXXXXXX 株式会社",
      "role": "self_only",
      "external_cid": "XXXXXXXXXX",
      "employee_id": XXXXXXX,
      "display_name": "XXXXXXX"
    },
```

4. ターミナルで`cp .env.sample .env` を実行して、.env ファイル内に以下のようなフォーマットで必要事項を記入する。

```
CLIENT_ID =XXXXXXX
COMPANY_ID =XXXXXXX
EMPLOYEE_ID =XXXXXXX
CLIENT_SECRET =XXXXXXX
REFRESH_TOKEN =
ACCESS_TOKEN =
```

そして必要なライブラリのインストールをするため、`npm i`を実行する。

## 実行

以下コマンドを実行する（エラーが出ていないか確認すること！）

```
node --env-file=.env index.js
```

※リフレッシュトークンの有効期限が 90 日間。実行するたびにアクセストークンとリフレッシュトークンを再取得して`.env`を更新しているため、前回の実行から 90 日以上過ぎなければ認可コードを取得するステップは不要。

※平日でも勤務日でない日は freee の勤怠編集のページから個別で未入力にすること。
