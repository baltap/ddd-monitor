import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  const url = 'https://www.uradnanastenka.sk/zakazky?filters%5Bquery%5D%5B0%5D=dezinfekcia';
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const items = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div.relative.border-t'));
    return rows.map(el => ({
        title: el.querySelector('h4')?.innerText?.trim(),
        link: el.querySelector('a.link')?.href
    })).filter(i => i.title);
  });
  
  console.log('Found:', items.length);
  await browser.close();
})();
