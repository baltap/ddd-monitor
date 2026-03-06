import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Try search directly via URL if possible, otherwise explore main page
  const url = 'https://www.uradnanastenka.sk/hladat?q=deratizácia';
  console.log(`Navigating to ${url}...`);
  
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Status:', response.status());
    
    const results = await page.evaluate(() => {
        // Broad selector to see what's there
        const items = Array.from(document.querySelectorAll('article, .item, tr, .search-result')).slice(0, 10);
        return items.map(i => ({ 
            text: i.innerText.substring(0, 200).replace(/\n/g, ' '),
            link: i.querySelector('a')?.href 
        }));
    });
    console.log('Results:', JSON.stringify(results, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
