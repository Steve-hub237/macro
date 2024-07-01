const puppeteer = require('puppeteer-core');
const { insertBondValues, updateBondValues } = require('../database/databaseInterface');
const { bonds, bondNameMap } = require('../utils/bond');

async function scrapeBonds() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
  });
  const page = await browser.newPage();

  // Set a user agent to mimic a real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    await page.goto('https://tradingeconomics.com/bonds', {
      waitUntil: 'networkidle2',
    });

    console.log('Page loaded');
    await page.waitForSelector('table.table > tbody > tr', { timeout: 10000 });
    console.log('Table selector found');

    const bondsData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.table > tbody > tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          bond: cells[1]?.innerText.trim(),
          yield: parseFloat(cells[2]?.innerText.trim()),
          change: parseFloat(cells[3]?.dataset.value),
          changePc: parseFloat(cells[4]?.dataset.value),
          high: parseFloat(cells[5]?.dataset.value),
          low: parseFloat(cells[6]?.dataset.value),
          time: cells[7]?.innerText.trim()
        };
      });
    });

    const filteredBonds = filterRedundantBonds(bondsData).map(bond => {
      const bondName = bondNameMap[bond.bond];
      
      const percent = (bond.change / (bond.yield - bond.change)) * 100;
      const percentChange = Math.round(percent * 100) / 100;

      if (bondName && bonds[bondName]) {
        return {
          bondId: bonds[bondName].id.toString(),
          countryId: bonds[bondName].countryId.toString(),
          bond: bondName,
          yield: bond.yield,
          change: bond.change,
          changePc: bond.changePc,
          chg: percentChange,
          high: bond.high,
          low: bond.low,
          time: bond.time
        };
      }
      return null;
    }).filter(bond => bond !== null);

    console.log(filteredBonds);
    return filteredBonds;
  } catch (error) {
    console.error(`There was an error: ${error}`);
  } finally {
    await browser.close();
  }
}

function filterRedundantBonds(bondsData) {
  const seenCountries = new Set();
  return bondsData.filter(bond => {
    if (seenCountries.has(bond.bond)) {
      return false;
    } else {
      seenCountries.add(bond.bond);
      return true;
    }
  });
}

async function storeBonds() {
  const bondData = await scrapeBonds();
  for (const data of bondData) {
    await insertBondValues(data);
  }
}

async function updateBonds() {
  const bondData = await scrapeBonds();
  for (const data of bondData) {
    await updateBondValues(data);
  }
}

module.exports = { scrapeBonds, storeBonds, updateBonds };












