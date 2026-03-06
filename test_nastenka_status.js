import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  const url = 'https://www.uradnanastenka.sk/zakazky?filters%5Bquery%5D%5B0%5D=dezinfekcia';
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div.relative.border-t')).map(el => ({
        title: el.querySelector('h4')?.innerText?.trim(),
        link: el.querySelector('a.link')?.href
    })).filter(i => i.title);
  });
  
  for (let i = 0; i < 5; i++) {
    await page.goto(items[i].link, { waitUntil: 'domcontentloaded' });
    const isExpired = await page.evaluate(() => document.body.innerText.includes('Expirovaná'));
    console.log(items[i].title, 'Expired:', isExpired);
  }
  
  await browser.close();
})();
