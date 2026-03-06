import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  
  await page.goto('https://www.uvo.gov.sk/vyhladavanie/vyhladavanie-zakaziek?nazovZakazky=deratizácia', { waitUntil: 'networkidle2' });
  
  // Find all select options
  const selects = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select')).map(s => ({
      name: s.name || s.id,
      options: Array.from(s.options).map(o => ({ text: o.text, value: o.value }))
    }));
  });
  
  console.log('Selects:', JSON.stringify(selects, null, 2));
  
  await browser.close();
})();
