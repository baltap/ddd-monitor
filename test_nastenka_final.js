import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  
  const url = 'https://www.uradnanastenka.sk/zakazky?filters%5Bquery%5D%5B0%5D=dezinfekcia';
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const results = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div.relative.border-t'));
    return items.map(el => {
        const titleEl = el.querySelector('h4');
        const linkEl = el.querySelector('a.link');
        if (!titleEl || !linkEl) return null;
        
        const infoList = el.querySelector('ul');
        const infoText = infoList ? infoList.innerText : '';
        
        return {
            title: titleEl.innerText.trim(),
            link: linkEl.href,
            value: infoText.match(/\d+[\s\d]*—?\s*\d+[\s\d]*\s*€/)?.[0] || 'Dohodou',
            added: infoText.match(/Pridané:\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/)?.[1] || 'Dnes'
        };
    }).filter(i => i !== null);
  });
  
  console.log(JSON.stringify(results.slice(0, 3), null, 2));
  
  await browser.close();
})();
