const getAccessToken = require("./getAccessToken");
const executeReplaceInfo = require("./executeReplaceInfo");
const generateDate = require("./generateDate");

(async () => {
  const accessToken = await getAccessToken();
  const dates = generateDate();
  console.log(dates);
  for (const date of dates) {
    executeReplaceInfo(date, accessToken);
  }
})();
