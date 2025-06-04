require('dotenv').config();
const getAccessToken = require("./getAccessToken");
const executeReplaceInfo = require("./executeReplaceInfo");
const { chooseDate, selectDatesToExclude, confirmAction } = require("./ioMessage");
const generateDate = require("./generateDate");
const credentialsManager = require('./credentialsManager');

(async () => {
  try {
    // 1. 利用可能な認証情報を確認
    console.log("認証情報を確認中...");
    const credentialsList = await credentialsManager.listCredentials();
    
    if (credentialsList.length === 0) {
      throw new Error('認証情報が見つかりません。setupCredentials.js を実行してください。');
    }
    
    // 最新の認証情報を使用
    const myInfoId = credentialsList[0].id;
    console.log(`使用する認証情報: ${credentialsList[0].username} (ID: ${myInfoId})`);

    // 2. 対象月を選択
    const targetDate = await chooseDate();
    
    // 3. 対象月の営業日を生成
    const allDates = generateDate(targetDate);
    console.log(`\n対象月: ${targetDate.substring(0, 7)}`);
    
    if (allDates.length === 0) {
      console.log("対象となる営業日がありません。");
      return;
    }
    
    // 4. 除外する日付を選択
    const finalDates = await selectDatesToExclude(allDates);
    
    if (finalDates.length === 0) {
      console.log("処理対象の日付がありません。処理を終了します。");
      return;
    }
    
    // 5. 実行確認
    console.log("\n=== 処理内容の確認 ===");
    console.log(`使用する認証情報: ${credentialsList[0].username}`);
    console.log(`勤務時間を入力する日付数: ${finalDates.length}日`);
    const isExec = await confirmAction();
    
    if (!isExec) return;

    // 6. アクセストークンを取得
    console.log("\nアクセストークンを取得中...");
    const accessToken = await getAccessToken(myInfoId);
    
    console.log("勤務時間の入力を開始します...");
    let processedCount = 0;
    
    for (const date of finalDates) {
      try {
        processedCount++;
        console.log(`\n[${processedCount}/${finalDates.length}] ${date} の勤務時間を入力中...`);
        await executeReplaceInfo(date, accessToken, myInfoId);
        console.log(`✅ ${date} の処理が完了しました`);
      } catch (error) {
        console.error(`❌ ${date} の処理でエラーが発生しました:`, error.message);
        
        // エラー時の継続確認
        const continueAnswer = await require("inquirer").prompt([
          {
            type: "confirm",
            name: "continue",
            message: "エラーが発生しましたが、残りの日付の処理を続行しますか？",
            default: true
          }
        ]);
        
        if (!continueAnswer.continue) {
          console.log("処理を中断しました。");
          break;
        }
      }
    }
    
    console.log(`\n=== 処理完了 ===`);
    console.log(`処理済み: ${processedCount}/${finalDates.length}日`);
    
  } catch (error) {
    console.error("予期しないエラーが発生しました:", error);
    console.error(error.stack);
  }
})();
