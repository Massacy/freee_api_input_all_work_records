const employeeId = process.env.EMPLOYEE_ID
const companyId = process.env.COMPANY_ID
const accessToken = process.env.ACCESS_TOKEN
const ym = process.env.YM
const days = process.env.DAYS.split(',');

const generateDate = () =>{
	for (day of days) {
		const date = `${ym}-${day}`;
		const req = `curl -X PUT "https://api.freee.co.jp/hr/api/v1/employees/${employeeId}/work_records/${date}" -H "accept: application/json" -H "Authorization: Bearer ${accessToken}" -H "Content-Type: application/json" -H "FREEE-VERSION: 2022-02-01" -d "{\\"company_id\\":${companyId},\\"break_records\\":[{\\"clock_in_at\\":\\"${date} 12:00:00\\",\\"clock_out_at\\":\\"${date} 13:00:00\\"}],\\"work_record_segments\\":[{\\"clock_in_at\\":\\"${date} 09:00:00\\",\\"clock_out_at\\":\\"${date} 18:00:00\\"}]}"`;
		console.log(req);
	}
}

generateDate();
