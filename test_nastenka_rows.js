import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  
  const url = 'https://www.uradnanastenka.sk/zakazky?filters%5Bquery%5D%5B0%5D=dezinfekcia';
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const results = await page.evaluate(() => {
    // Standard layout for uradnanastenka seems to use divs with specific classes
    const rows = Array.from(document.querySelectorAll('div.flex.flex-col.overflow-hidden'));
    return rows.map(r => {
        const link = r.querySelector('a[href*="/zakazka/"]');
        if (!link) return null;
        
        const title = link.innerText.trim();
        const wholeText = r.innerText;
        
        // Extracting metadata based on typical structure
        // Usually contains: ID, Name, Buyer, Region, Type, Deadline, Status
        const lines = wholeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        return {
            title,
            link: link.href,
            buyer: lines.find(l => l.includes('Obec') || l.includes('Mesto') || l.includes('správa') || l.includes('Úrad')) || lines[2],
            deadline: lines.find(l => /\d{2}\.\d{2}\.\d{4}/.test(l)) || 'Neznámy',
            status: lines.includes('Aktívne') || lines.includes('Prebiehajúca') ? 'active' : 'expired'
        };
    }).filter(i => i !== null);
  });
  
  console.log(JSON.stringify(results.slice(0, 3), null, 2));
  
  await browser.close();
})();
