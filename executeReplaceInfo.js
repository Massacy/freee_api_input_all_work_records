const credentialsManager = require('./credentialsManager');

module.exports = async function executeReplaceInfo(date, accessToken, myInfoId = 1) {
  const credentials = await credentialsManager.getCredentials(myInfoId);
  
  const url = `https://api.freee.co.jp/hr/api/v1/employees/${credentials.employeeId}/work_records/${date}`;
  const body = {
    company_id: credentials.companyId,
    break_records: [
      {
        clock_in_at: `${date} 12:00:00`,
        clock_out_at: `${date} 13:00:00`,
      },
    ],
    work_record_segments: [
      {
        clock_in_at: `${date} 09:00:00`,
        clock_out_at: `${date} 18:00:00`,
      },
    ],
  };
  const options = {
    method: "PUT",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "FREEE-VERSION": "2022-02-01",
    },
    body: JSON.stringify(body),
  };
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  const message = {
    日付: result.date,
    勤務時間: result.work_record_segments,
    休憩時間: result.break_records,
  };
  console.log(message);
};
