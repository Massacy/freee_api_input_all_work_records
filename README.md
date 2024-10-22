# How to Use

固定の勤怠/休憩時間を指定の日付で一括入力するための freeeAPI の使い方の流れです。
デフォルトで 9:00-18:00 を勤怠時間、12:00-13:00 を休憩時間にしています。悪用は厳禁です。

1. こちらを読んで指示に従って進める(https://developer.freee.co.jp/startguide)

2. アクセスが確認できたら、ログインユーザーの情報を確認する(https://developer.freee.co.jp/reference/hr/reference#operations-tag-ログインユーザー)
   以下のように、companies 内に、対象の事業所の id、employee_id があるので、メモっておく。

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

3. .env ファイル内に以下のようなフォーマットで必要事項を記入する。

```
COMPANY_ID = 'XXXXXXX'
EMPLOYEE_ID = 'XXXXXXX'
ACCESS_TOKEN = 'xxxxxxxxx'
```

replace_info.js 内の年月、日付を変更。

```
const ym = "2024-10"; // 対象に合わせて変更
const days = [1,2,3] // 対象に合わせて変更
```

4. 以下コマンドを実行して、その結果をターミナルに貼り付けて実行（内容が間違っていないか要確認！）

```
node --env-file=.env replace_info.js
```
