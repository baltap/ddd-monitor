import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const { data } = await axios.get('https://www.uvo.gov.sk/vestnik-a-registre/registre/vyhladavanie-zakaziek?kriteria%5Bq%5D=deratiz%C3%A1cia', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    console.log(data.substring(0, 1500));
  } catch(e) {
    console.error(e.message);
  }
}
test();
