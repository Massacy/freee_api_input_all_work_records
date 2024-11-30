const executeTask = require("./executeTask");

const ym = "2024-11"; // 対象に合わせて変更
const days = []; // 対象に合わせて変更
// const days = [
//   1, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29,
// ];

const generateDate = async () => {
  for (const day of days) {
    const day_str = ("00" + day).slice(-2);
    const date = `${ym}-${day_str}`;
    console.log(date);
    await executeTask(date);
  }
};

generateDate();
