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

module.exports = { chooseDate, confirmAction };
