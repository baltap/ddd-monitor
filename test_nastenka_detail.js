import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  
  const url = 'https://www.uradnanastenka.sk/zakazka/2117045-servis-cistenie-a-dezinfekcia-vzduchotechnickych-zariadeni';
  console.log(`Checking detail: ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const detail = await page.evaluate(() => {
    const text = document.body.innerText;
    
    // Extract Expiration
    const expMatch = text.match(/Dátum expirácie:\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/);
    const status = text.includes('Expirovaná') ? 'expired' : (text.includes('Aktívna') ? 'active' : 'unknown');
    
    // Extract Location
    const locMatch = text.match(/Lokalita:\s*([^- \n][^\n]+)/);
    // Alternatively look for the bullet point after 'Lokalita:'
    const lines = text.split('\n').map(l => l.trim());
    const locIdx = lines.findIndex(l => l.startsWith('Lokalita:'));
    const location = locIdx !== -1 ? lines[locIdx + 1] : 'Neznáma';

    // Extract Value
    const valIdx = lines.findIndex(l => l.startsWith('Hodnota:'));
    const value = valIdx !== -1 ? lines[valIdx + 1] : 'Dohodou';

    return {
      expiration: expMatch ? expMatch[1] : null,
      status,
      location,
      value
    };
  });
  
  console.log('Parsed detail:', detail);
  
  await browser.close();
})();
