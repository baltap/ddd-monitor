import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  
  const searchUrl = 'https://eo.eks.sk/Prehlady/ZakazkyVerejnost';
  await page.goto(searchUrl, { waitUntil: 'networkidle2' });
  
  console.log('Typing search...');
  await page.type('#Query_Vyhladavanie', 'deratizácia');
  await page.keyboard.press('Enter');
  
  console.log('Waiting for table change...');
  await new Promise(r => setTimeout(r, 6000));
  
  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table#dt1 tbody tr')).map(row => row.innerText.trim());
  });
  
  console.log('Results sample (first 3):', results.slice(0, 3));
  
  await browser.close();
})();
