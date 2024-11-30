//変数を書き換えて利用します。
const token_url = "https://accounts.secure.freee.co.jp/public_api/token";
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;

const body = {
  grant_type: "refresh_token",
  client_id: client_id,
  client_secret: client_secret,
  refresh_token: refresh_token,
};

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
};

async function getAccessToken() {
  const response = await fetch(token_url, options);
  if (!response.ok) {
    throw new Error(JSON.stringify(response));
  }
  const result = await response.json();
  console.log(result);
}

getAccessToken();
