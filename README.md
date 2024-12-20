# How to Use

固定の勤怠/休憩時間を指定の日付で一括入力するための freeeAPI の使い方の流れです。
デフォルトで 9:00-18:00 を勤怠時間、12:00-13:00 を休憩時間にしています。悪用は厳禁です。

1. こちらを読んで指示に従って進める(https://developer.freee.co.jp/startguide)

2. アクセスが確認できたら、ログインユーザーの情報を確認する(https://developer.freee.co.jp/reference/hr/reference#operations-tag-ログインユーザー)
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

3. ターミナルで`cp .env.sample .env` を実行して、.env ファイル内に以下のようなフォーマットで必要事項を記入する。

```
COMPANY_ID = 'XXXXXXX'
EMPLOYEE_ID = 'XXXXXXX'
ACCESS_TOKEN = 'xxxxxxxxx'
...
```

replace_info.js 内の年月、日付を変更。（内容が間違っていないか要確認！）

```
const ym = "2024-10"; // 対象に合わせて変更
const days = [1,2,3] // 対象に合わせて変更
```

4. 以下コマンドを実行して、その結果をターミナルに貼り付けて実行（エラーが出ていないか確認すること！）

```
node --env-file=.env replace_info.js
```

---

2-2. 2 回目以降のアクセストークンの取得。
refresh_token を.env ファイルに記載して、以下のコマンドを実行する。
console に表示された access_token と refresh_token を.env に記載する。(refresh_token は次回も使用するので忘れずに)

```
node --env-file=.env getAccessToken.js
```
