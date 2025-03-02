const getAccessToken = require("./getAccessToken");
const executeReplaceInfo = require("./executeReplaceInfo");
const { chooseDate, confirmAction } = require("./ioMessage");
const generateDate = require("./generateDate");

(async () => {
  const targetDate = await chooseDate();
  const dates = generateDate(targetDate);
  console.log(dates);
  const isExec = await confirmAction();
  if (!isExec) return;

  const accessToken = await getAccessToken();
  for (const date of dates) {
    executeReplaceInfo(date, accessToken);
  }
})();
