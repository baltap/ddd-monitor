import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const searchUrl = 'https://eo.eks.sk/Prehlady/ZakazkyVerejnost';
  console.log(`Navigating to ${searchUrl}...`);
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  
  console.log('Typing search query...');
  await page.type('#Query_Vyhladavanie', 'deratizácia');
  
  // Also check "Zákazky v lehote na predkladanie ponúk" if possible
  // Let's try finding the checkbox by ID from previous 'inputs' list if possible, or just skip it for now.

  await page.keyboard.press('Enter');
  
  console.log('Waiting for results to load (AJAX)...');
  await new Promise(r => setTimeout(r, 5000));
  
  const results = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table#dt1 tbody tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 5) return null;
        
        return {
            id: cells[0]?.innerText.trim(),
            title: cells[1]?.innerText.trim(),
            buyer: cells[2]?.innerText.trim(),
            deadline: cells[3]?.innerText.trim(),
            status: cells[6]?.innerText.trim(),
            link: row.querySelector('a')?.href
        };
    }).filter(i => i !== null && i.title);
  });
  
  console.log('Found:', results.length);
  if (results.length > 0) {
    console.log('First result:', JSON.stringify(results[0], null, 2));
  }
  
  await browser.close();
})();
