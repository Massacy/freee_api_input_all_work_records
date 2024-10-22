const employeeId = process.env.EMPLOYEE_ID;
const companyId = process.env.COMPANY_ID;
const accessToken = process.env.ACCESS_TOKEN;

const ym = "2024-10"; // 対象に合わせて変更
const days = []; //[22, 23, 24, 25, 28, 29, 30, 31]; // 対象に合わせて変更

const generateDate = async () => {
  for (const day of days) {
    const day_str = ("00" + day).slice(-2);
    const date = `${ym}-${day_str}`;
    console.log(date);
    const url = `https://api.freee.co.jp/hr/api/v1/employees/${employeeId}/work_records/${date}`;
    const body = {
      company_id: companyId,
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
    console.log(result);
  }
};

generateDate();
