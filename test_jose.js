import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const { data } = await axios.get('https://josephine.proebiz.com/sk/tenders');
  const $ = cheerio.load(data);
  const items = [];
  
  $('.tender-name').each((i, el) => {
     items.push($(el).text().trim());
  });
  console.log(items.slice(0, 5));
}
test();
