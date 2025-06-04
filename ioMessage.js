const inquirer = require("inquirer");
const dayjs = require("dayjs");

const chooseDate = async () => {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "対象月を選択してください",
      choices: ["先月", "当月"],
    },
  ]);
  const targetDate = new Date();
  let ymd;
  switch (answers.action) {
    case "先月":
      ymd = dayjs(targetDate)
        .startOf("month")
        .subtract(1, "month")
        .format("YYYY-MM-DD");
      return ymd;
    case "当月":
      ymd = dayjs(targetDate).startOf("month").format("YYYY-MM-DD");
      return ymd;
  }
};

/**
 * 日付リストから除外する日付を選択する機能
 * @param {Array<string>} dates - 対象となる日付配列（YYYY-MM-DD形式）
 * @returns {Array<string>} - 除外する日付を除いた日付配列
 */
const selectDatesToExclude = async (dates) => {
  if (dates.length === 0) {
    console.log("対象となる日付がありません。");
    return dates;
  }

  // 日付を表示用に変換（曜日付き）
  const dateChoices = dates.map(date => {
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dayjs(date).day()];
    return {
      name: `${date} (${dayOfWeek})`,
      value: date,
      checked: false // デフォルトでは除外しない
    };
  });

  console.log(`\n対象期間の営業日: ${dates.length}日`);
  console.log("除外したい日付がある場合は選択してください");
  console.log("↑↓で移動、スペースで選択/解除、Enterで確定");

  const excludeAnswer = await inquirer.prompt([
    {
      type: "checkbox",
      name: "excludeDates",
      message: "除外する日付を選択してください（何も選択しない場合は全ての日付が対象になります）",
      choices: dateChoices,
      pageSize: 10
    }
  ]);

  const excludedDates = excludeAnswer.excludeDates;
  const finalDates = dates.filter(date => !excludedDates.includes(date));

  // 結果を表示
  if (excludedDates.length > 0) {
    console.log(`\n除外された日付: ${excludedDates.length}日`);
    excludedDates.forEach(date => {
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dayjs(date).day()];
      console.log(`  - ${date} (${dayOfWeek})`);
    });
  }

  console.log(`\n最終的な対象日付: ${finalDates.length}日`);
  if (finalDates.length > 0) {
    finalDates.forEach(date => {
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dayjs(date).day()];
      console.log(`  - ${date} (${dayOfWeek})`);
    });
  }

  return finalDates;
};

const confirmAction = async () => {
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "execute",
      message: "実行しますか？ (y/n)",
      validate: function (input) {
        input = input.toLowerCase();
        if (input === "y" || input === "n") {
          return true;
        }
        return "y または n を入力してください";
      },
    },
  ]);

  if (answer.execute.toLowerCase() === "y") {
    console.log("実行します...");
    return true;
  } else {
    console.log("キャンセルしました");
    return false;
  }
};

module.exports = { chooseDate, selectDatesToExclude, confirmAction };
