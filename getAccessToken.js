const fs = require("fs");
const path = require("path");

module.exports = async function getAccessToken() {
  const tokenUrl = "https://accounts.secure.freee.co.jp/public_api/token";
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const refreshToken = process.env.REFRESH_TOKEN;

  const body = {
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  try {
    const response = await fetch(tokenUrl, options);
    if (!response.ok) {
      throw new Error(JSON.stringify(response));
    }
    const result = await response.json();
    console.log(result);
    const { access_token, refresh_token } = result;
    updateEnvFile(clientId, refresh_token, access_token);
    return access_token;
  } catch (error) {
    console.error("Error getAccessToken: ", error);
  }
};

function updateEnvFile(clientId, refresh_token, accessToken) {
  companyId = process.env.COMPANY_ID;
  employeeId = process.env.EMPLOYEE_ID;
  clientSecret = process.env.CLIENT_SECRET;

  const envPath = path.resolve(__dirname, ".env");
  const data = [
    `CLIENT_ID=${clientId}`,
    `COMPANY_ID=${companyId}`,
    `EMPLOYEE_ID=${employeeId}`,
    `CLIENT_SECRET=${clientSecret}`,
    `REFRESH_TOKEN=${refresh_token}`,
    `ACCESS_TOKEN=${accessToken}`,
  ].join("\n");
  fs.writeFileSync(envPath, data);
  console.log("updated refresh_token and access_token");
}
