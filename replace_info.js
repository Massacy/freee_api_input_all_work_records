const dayjs = require("dayjs");
const jh = require("japanese-holidays");
const executeTask = require("./executeTask");

const days = []; // 当月の平日の日付を格納する配列
const generateDate = () => {
  let ymd = dayjs("2024-05").startOf("month").format("YYYY-MM-DD");
  const ymdEnd = dayjs("2024-05")
    .add(1, "M")
    .startOf("month")
    .format("YYYY-MM-DD");
  dayjs.extend(weekday);
  while (dayjs(ymd).isBefore(dayjs(ymdEnd))) {
    // 平日かつ祝日でない日付を配列に追加
    if (
      0 < dayjs(ymd).day() &&
      dayjs(ymd).day() < 6 &&
      !jh.isHoliday(new Date(ymd))
    ) {
      days.push(ymd);
    }
    ymd = dayjs(ymd).add(1, "day").format("YYYY-MM-DD");
  }
};
generateDate();

console.log(days);

for (const day of days) {
  console.log(day);
  await executeTask(date);
}
