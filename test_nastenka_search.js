import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  
  console.log('Navigating to homepage...');
  await page.goto('https://www.uradnanastenka.sk/', { waitUntil: 'networkidle2' });
  
  // Find the search input
  const placeholder = 'Hľadať stavebné práce, rekonštrukcie, ...';
  await page.type(`input[placeholder="${placeholder}"]`, 'deratizácia');
  await page.keyboard.press('Enter');
  
  console.log('Waiting for results...');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  const results = await page.evaluate(() => {
    // Looking for some kind of cards or rows
    const cards = Array.from(document.querySelectorAll('.card, .tender, .item, article'));
    return cards.map(c => ({
        title: c.querySelector('h2, h3, .title')?.innerText?.trim(),
        meta: c.querySelector('.meta, .info, .buyer')?.innerText?.trim(),
        link: c.querySelector('a')?.href
    })).filter(r => r.title);
  });
  
  console.log('Found results:', results.length);
  if (results.length > 0) console.log('Sample:', results[0]);
  
  await browser.close();
})();
