import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const url = 'https://www.uvo.gov.sk/vyhladavanie/vyhladavanie-zakaziek?nazovZakazky=deratiz%C3%A1cia';
  console.log(`Navigating to ${url}...`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the table or a known element to appear
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => console.log('Table not found via selector "table"'));

    const items = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length < 3) return null;
        return {
          title: cols[0]?.innerText?.trim(),
          buyer: cols[1]?.innerText?.trim(),
          cpv: cols[2]?.innerText?.trim(),
          updated: cols[4]?.innerText?.trim(),
          link: cols[0]?.querySelector('a')?.href
        };
      }).filter(i => i !== null);
    });

    console.log(`Found ${items.length} items.`);
    if (items.length > 0) {
      console.log('Sample item:', items[0]);
    } else {
      // If table search failed, log the HTML to see what's there
      const body = await page.evaluate(() => document.body.innerHTML.substring(0, 1000));
      console.log('Body sample:', body);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
