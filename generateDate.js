const dayjs = require("dayjs");
const weekday = require("dayjs/plugin/weekday");
const jh = require("japanese-holidays");

module.exports = function generateDate(targetDate) {
  const dates = []; // 対象月の平日の日付を格納する配列
  let ymd = dayjs(targetDate).startOf("month").format("YYYY-MM-DD");
  const ymdEnd = dayjs(targetDate)
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
      dates.push(ymd);
    }
    ymd = dayjs(ymd).add(1, "day").format("YYYY-MM-DD");
  }
  return dates;
};
