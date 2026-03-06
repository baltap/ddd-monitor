import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const url = 'https://josephine.proebiz.com/sk/tenders';
  console.log(`Navigating to ${url}...`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Look for search input
    const searchExists = await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Hľadať"], input[name*="search"], #search-input');
        return !!input;
    });
    console.log('Search input exists:', searchExists);

    // Try to find the results table/list
    const results = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.tender-item, .list-group-item, tr')).slice(0, 10);
        return items.map(i => i.innerText.substring(0, 100).replace(/\n/g, ' '));
    });
    console.log('Sample content:', results);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
