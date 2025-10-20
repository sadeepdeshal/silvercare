const axios = require('axios');

async function run() {
  const base = 'http://localhost:5000/api/doctor/2'; // change doctor id as needed
  try {
    console.log('1) Listing current blocks...');
    let res = await axios.get(`${base}/blocked`);
    console.log(res.data);

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const yyyy = date.getFullYear();
    const mm = (date.getMonth()+1).toString().padStart(2,'0');
    const dd = date.getDate().toString().padStart(2,'0');
    const d = `${yyyy}-${mm}-${dd}`;

    console.log('\n2) Trying to create a non-overlapping block 13:00-15:00 tomorrow...');
    res = await axios.post(`${base}/blocked`, { date: d, allDay: false, startTime: '13:00', endTime: '15:00', reason: 'Not available' });
    console.log(res.data);

    console.log('\n3) List after insert...');
    res = await axios.get(`${base}/blocked?from=${d}&to=${d}`);
    console.log(res.data);
  } catch (e) {
    if (e.response) console.error('Error:', e.response.status, e.response.data);
    else console.error('Error:', e.message);
  }
}

run();
