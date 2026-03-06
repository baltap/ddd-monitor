import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  
  const url = 'https://www.uvo.gov.sk/vyhladavanie/vyhladavanie-zakaziek/detail/549579';
  console.log(`Checking ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Look for the latest notice
  const noticeLink = await page.evaluate(() => {
    // Look for links that contain 'Oznámenie o vyhlásení' or similar
    const links = Array.from(document.querySelectorAll('a'));
    const notice = links.find(a => a.innerText.includes('Oznámenie o vyhlásení'));
    return notice ? notice.href : null;
  });
  
  console.log('Notice link:', noticeLink);
  
  if (noticeLink) {
    await page.goto(noticeLink, { waitUntil: 'networkidle2' });
    const deadline = await page.evaluate(() => {
        // Search for 'Lehota na predkladanie ponúk'
        const bodyText = document.body.innerText;
        const index = bodyText.indexOf('Lehota na predkladanie ponúk');
        if (index === -1) return 'Not found';
        return bodyText.substring(index, index + 100).split('\n')[0];
    });
    console.log('Deadline:', deadline);
  }
  
  await browser.close();
})();
