import axios from 'axios';
import cron from 'node-cron';
import Parser from 'rss-parser';
import puppeteer from 'puppeteer';
import { EventEmitter } from 'events';
import { sendNewContractsEmail } from './emailService.js';

export const scraperEvents = new EventEmitter();

const parser = new Parser();

// This is where parsed data will live in memory for this demo
let currentContracts = [];
let notifiedIds = new Set();
let lastRunTimestamp = null;

async function fetchUvoSearch() {
  const searchUrl = 'https://www.uvo.gov.sk/vyhladavanie/vyhladavanie-zakaziek?nazovZakazky=deratiz%C3%A1cia&datumAktualizacie=31';
  scraperEvents.emit('status', 'Pripájam sa k ÚVO (Vestník)...');
  console.log(`[UVO] Monitorujem AKTUÁLNE ponuky (posledných 31 dní): ${searchUrl}`);
  
  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Check if the table has results
    const hasResults = await page.evaluate(() => document.querySelectorAll('table tbody tr').length > 0);
    
    if (!hasResults) {
      console.log('[UVO] Žiadne nové ponuky v posledných 31 dňoch.');
      return [];
    }

    const items = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length < 5) return null;
        
        return {
          title: cols[0]?.innerText?.trim(),
          buyer: cols[1]?.innerText?.trim(),
          updated: cols[4]?.innerText?.trim(),
          link: cols[0]?.querySelector('a')?.href
        };
      }).filter(i => i !== null && i.title);
    });

    // For each promising result, we try to get more detail (Sign-up availability)
    for (let i = 0; i < Math.min(items.length, 5); i++) {
        const item = items[i];
        try {
            console.log(`[UVO] Overujem detaily pre: ${item.title}`);
            await page.goto(item.link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            const detailInfo = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('tr'));
                const statusRow = rows.find(r => r.innerText.includes('Stav zákazky:'));
                const status = statusRow ? statusRow.querySelector('td')?.innerText?.replace('VSTÚPIŤ DO EVO', '').trim() : 'Neznámy';
                
                // Try to find if it's EVO (Electronic sign-up possible)
                const isEvo = document.body.innerText.includes('VSTÚPIŤ DO EVO');
                
                return { status, isEvo };
            });

            results.push({
              id: `uvo-live-${Date.now()}-${i}`,
              title: item.title,
              buyer: item.buyer,
              cpv: '90923000-3',
              source: 'ÚVO',
              value: 'Viď vestník',
              deadline: item.updated || 'Prebieha',
              status: detailInfo.status === 'Aktívna' ? 'active' : 'urgent',
              type: detailInfo.isEvo ? 'EVO (Online prihlásenie)' : 'Klasické obstarávanie',
              link: item.link
            });
        } catch (detailErr) {
            // Fallback if detail fetch fails
            results.push({
                id: `uvo-err-${Date.now()}-${i}`,
                title: item.title,
                buyer: item.buyer,
                cpv: '90923000-3',
                source: 'ÚVO',
                value: 'Kontroluje sa...',
                deadline: item.updated,
                status: 'active',
                type: 'Zákazka',
                link: item.link
            });
        }
    }

    console.log(`[UVO] Dokončený monitoring. Nájdených ${results.length} overených aktívnych ponúk.`);

  } catch (err) {
    console.error(`[UVO] Monitoring zlyhal: ${err.message}`);
    return [];
  } finally {
    if (browser) await browser.close();
  }

  return results;
}



/**
 * SCRAPE JOSEPHINE (PROEBIZ)
 * Searches for 'deratizácia' on Josephine and parses the results.
 */
async function scrapeProebiz() {
  const searchUrl = 'https://josephine.proebiz.com/sk/public-tenders/all?filter[search]=deratiz%C3%A1cia';
  scraperEvents.emit('status', 'Skenujem Josephine (Proebiz)...');
  console.log(`[Josephine] Skenujem portál: ${searchUrl}`);
  
  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    
    const items = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cols = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
        if (cols.length < 7) return null;
        
        const titleParts = cols[2].split('\n');
        const buyerParts = cols[4].split('\n');
        const statusParts = cols[6].split('\n');
        
        return {
          id: cols[0],
          title: titleParts[0],
          cpv: titleParts[1] || '90923000-3',
          buyer: buyerParts[0],
          value: cols[5].split('\n')[0] || 'Viď detail',
          deadline: statusParts[0],
          statusText: statusParts[1] || 'Neznámy',
          link: row.querySelector('a')?.href
        };
      }).filter(i => i !== null);
    });

    items.forEach(item => {
      // Only include active or recently finished for the overview
      const isUrgent = item.statusText.includes('Prebiehajúca');
      
      results.push({
        id: `josephine-${item.id}`,
        title: item.title,
        buyer: item.buyer,
        cpv: item.cpv,
        source: 'Josephine',
        value: item.value.includes('EUR') ? item.value : 'Neurčená',
        deadline: item.deadline,
        status: isUrgent ? 'active' : 'expired',
        type: 'Elektronická aukcia / Súťaž',
        link: item.link
      });
    });

    console.log(`[Josephine] Nájdených ${results.length} záznamov.`);

  } catch (err) {
    console.warn(`[Josephine] Monitoring momentálne nedostupný: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

/**
 * SCRAPE ÚRADNÁ NÁSTENKA
 * Aggregates minor contracts from across Slovakia.
 */
async function scrapeUradnaNastenka() {
  const searchUrl = 'https://www.uradnanastenka.sk/zakazky?filters%5Bquery%5D%5B0%5D=dezinfekcia';
  scraperEvents.emit('status', 'Prehľadávam Úradnú nástenku...');
  console.log(`[Nástenka] Monitorujem portál: ${searchUrl}`);
  
  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    
    const items = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('div.relative.border-t'));
      return rows.map(el => {
        const titleEl = el.querySelector('h4');
        const linkEl = el.querySelector('a.link');
        const info = el.querySelector('ul')?.innerText || '';
        if (!titleEl || !linkEl) return null;
        
        return {
          title: titleEl.innerText.trim(),
          link: linkEl.href,
          added: info.match(/Pridané:\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/)?.[1] || 'Dnes',
          price: info.match(/\d+[\s\d]*—?\s*\d+[\s\d]*\s*€/)?.[0] || 'Dohodou'
        };
      }).filter(i => i !== null);
    });

    // We now deep dive into all items (up to 15) to get accurate status/expiry
    for (let i = 0; i < Math.min(items.length, 15); i++) {
        const item = items[i];
        try {
            console.log(`[Nástenka] Sťahujem detail: ${item.title}`);
            await page.goto(item.link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            const detail = await page.evaluate(() => {
                const text = document.body.innerText;
                const lines = text.split('\n').map(l => l.trim());
                
                const locIdx = lines.findIndex(l => l.startsWith('Lokalita:'));
                const location = locIdx !== -1 ? lines[locIdx + 1].replace(/^- /, '') : 'Slovensko';
                
                const valIdx = lines.findIndex(l => l.startsWith('Hodnota:'));
                const value = valIdx !== -1 ? lines[valIdx + 1].replace(/^- /, '') : 'Dohodou';
                
                const expMatch = text.match(/Dátum expirácie:\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/);
                const deadline = expMatch ? expMatch[1] : 'Neznámy';
                
                // Detect expired status from the page content
                const isExpired = text.includes('Expirovaná') || text.includes('Ukončená');
                
                return { location, value, deadline, status: isExpired ? 'expired' : 'active' };
            });

            results.push({ 
                id: `n-deep-${Date.now()}-${i}`, 
                title: item.title, 
                buyer: `Samospráva (${detail.location})`, 
                cpv: '90921000-9', 
                source: 'ÚradnáNástenka.sk', 
                value: detail.value, 
                deadline: detail.deadline, 
                status: detail.status, 
                type: 'Zakázka detail', 
                link: item.link, 
                location: detail.location 
            });
        } catch (e) {
            // Fallback if detail fetch fails
            results.push({ 
                id: `n-fallback-${Date.now()}-${i}`, 
                title: item.title, 
                buyer: 'Samospráva (Slovensko)', 
                cpv: '90921000-9', 
                source: 'ÚradnáNástenka.sk', 
                value: item.price, 
                deadline: item.added, 
                status: 'active', 
                type: 'Zakázka zoznam', 
                link: item.link 
            });
        }
    }

    console.log(`[Nástenka] Hotovo. Načítaných ${results.length} záznamov.`);

  } catch (err) {
    console.error(`[Nástenka] Globálna chyba: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

/**
 * SCRAPE EKS (ELEKTRONICKÝ KONTRAKTAČNÝ SYSTÉM)
 */
async function fetchEksSearch() {
  const portalUrl = 'https://eo.eks.sk/Prehlady/ZakazkyVerejnost';
  scraperEvents.emit('status', 'Preverujem EKS (Trhovisko)...');
  console.log(`[EKS] Spúšťam TRHOVISKO (EO): ${portalUrl}`);
  
  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(portalUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Explicitly perform search to ensure results are filtered
    console.log('[EKS] Vyhľadávam "deratizácia"...');
    await page.waitForSelector('#Query_Vyhladavanie', { timeout: 10000 });
    await page.type('#Query_Vyhladavanie', 'deratizácia');
    await page.keyboard.press('Enter');
    
    // Wait for EKS AJAX to update the table
    await new Promise(r => setTimeout(r, 6000));

    const items = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table#dt1 tbody tr'));
      return rows.map(row => {
        const cols = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
        if (cols.length < 5 || cols[0].includes('Nenašli sa žiadne údaje')) return null;
        
        const mainInfo = cols[0];
        const titleMatch = mainInfo.match(/^(.*?)ETZ\d+/);
        const title = titleMatch ? titleMatch[1].trim() : mainInfo.split('\n')[0];
        
        // Safety keyword check to avoid general results like "Kancelarske potreby"
        const isDdd = /deratiz|dezinsek|dezinfek|škodcov|hlodav/i.test(title);
        if (!isDdd) return null;

        // EKS Status logic
        const isZazmluvnena = mainInfo.toLowerCase().includes('zazmluvnená');
        const isVLehote = mainInfo.toLowerCase().includes('v lehote');
        
        return {
          id: mainInfo.match(/ETZ\d+/)?.[0] || `eks-${Math.random()}`,
          title,
          value: cols[4] || 'Viď detail',
          deadline: cols[3] || 'Ukončené',
          status: isVLehote ? 'active' : (isZazmluvnena ? 'expired' : 'active'),
          link: row.querySelector('a')?.href
        };
      }).filter(i => i !== null);
    });

    items.forEach(item => {
      results.push({
        id: `eks-${item.id}`,
        title: item.title,
        buyer: 'Inštitúcia (EKS)',
        cpv: '90923000-3 (DDD)',
        source: 'EKS',
        value: item.value,
        deadline: item.deadline,
        status: item.status,
        type: 'Trhovisko (EKS)',
        link: item.link
      });
    });

    console.log(`[EKS] Vyfiltrovaných ${results.length} relevantných DDD záznamov.`);

  } catch (err) {
    console.warn(`[EKS] Monitoring zlyhal: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

export async function runScrapers() {
  console.log('\n=============================================');
  console.log('Spúšťam plošný FREE monitoring DDD zákaziek...');
  
  try {
    const scrapedResults = [];
    const scrapers = [
      fetchUvoSearch,
      scrapeProebiz,
      scrapeUradnaNastenka,
      fetchEksSearch
    ];

    for (const scraper of scrapers) {
      console.log(`[Queue] Spúšťam další scraper v poradí...`);
      const res = await scraper();
      scrapedResults.push(res);
      scraperEvents.emit('status', 'Ukladám výsledky a uvoľňujem pamäť...');
      // Malá pauza medzi scrapovaním pre uvoľnenie RAM
      await new Promise(r => setTimeout(r, 2000));
    }
    
    const allResults = scrapedResults.flat();
    
    // Find absolute new items (those we haven't notified about yet)
    // Note: We use title + buyer as a better uniqueness check than just random ID
    const newItems = allResults.filter(item => {
        const uniqueKey = `${item.title}-${item.buyer}`.toLowerCase();
        if (!notifiedIds.has(uniqueKey)) {
            notifiedIds.add(uniqueKey);
            return true;
        }
        return false;
    });

    if (newItems.length > 0) {
        console.log(`[Notification] Zistených ${newItems.length} nových unikátnych zákaziek. Odosielam e-mail...`);
        // For the first run, we might not want to send 100 emails, maybe limit it
        // But for development/demo, we send them.
        await sendNewContractsEmail(newItems);
    } else {
        console.log('[Notification] Žiadne nové unikátne zákazky od poslednej kontroly.');
    }

    currentContracts = allResults;
    lastRunTimestamp = new Date();
    scraperEvents.emit('status', `Monitoring úspešne dokončený. Nájdených ${allResults.length} záznamov.`);
    console.log(`Dokončené! Monitorovaných ${currentContracts.length} záznamov.`);
    console.log('=============================================\n');
    return currentContracts;
  } catch (error) {
    console.error('Chyba počas scrapera:', error);
    return [];
  }
}

export function getContracts() {
  return currentContracts;
}

export function getLastRunTimestamp() {
  return lastRunTimestamp;
}

cron.schedule('0 8-17 * * 1-5', () => runScrapers());
