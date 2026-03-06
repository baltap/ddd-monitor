import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Searching UVO...');
  await page.goto('https://www.uvo.gov.sk/vyhladavanie/globalne-vyhladavanie?text=deratizácia', {
    waitUntil: 'networkidle2'
  });

  const results = await page.evaluate(() => {
    // This is based on UVO global search results structure
    return Array.from(document.querySelectorAll('.isepvo-search-result, .result-item, .card')).map(el => ({
      title: el.querySelector('h3, .title')?.innerText?.trim(),
      buyer: el.querySelector('.buyer, .obstaravatel, p')?.innerText?.trim(),
      link: el.querySelector('a')?.href
    }));
  });

  console.log('Found:', results.length);
  if (results.length > 0) console.log('First:', results[0]);
  
  await browser.close();
})();
