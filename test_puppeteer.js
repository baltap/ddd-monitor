import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://www.uvo.gov.sk/vyhladavanie/globalne-vyhladavanie?text=deratizácia', {
    waitUntil: 'networkidle2'
  });

  const html = await page.evaluate(() => document.body.innerHTML);
  const jsonResp = await page.evaluate(() => {
     // Does it load any JSON elements? Or maybe the DOM has specific classes
     return Array.from(document.querySelectorAll('.card, .result-list, .Item')).map(e => e.innerText);
  });
  console.log('Results lengths:', jsonResp.length);
  if (jsonResp.length > 0) console.log(jsonResp[0].substring(0, 300));
  
  await browser.close();
})();
