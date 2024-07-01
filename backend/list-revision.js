const { chromium } = require('playwright');

const url = 'https://tradingeconomics.com/bonds';

async function scrapeBonds() {
    try {
        // Launch a new browser instance
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        
        // Go to the bonds page
        await page.goto(url, { waitUntil: 'networkidle' });

        // Increase timeout and wait for the main content to load
        await page.waitForTimeout(10000); // 10 seconds delay to ensure content is loaded
        await page.waitForSelector('table.table > tbody > tr', { timeout: 60000 }); // 60 seconds timeout

        // Extract the bond data
        const bonds = await page.evaluate(() => {
            const rows = document.querySelectorAll('table.table > tbody > tr');
            const data = [];
            
            rows.forEach(row => {
                const country = row.querySelector('td.datatable-item-first b').innerText.trim();
                const yieldValue = row.querySelector('td#p').innerText.trim();
                const dailyChange = row.querySelector('td#nch').innerText.trim();
                const changePercent = row.querySelector('td.datatable-heatmap:nth-child(5)').innerText.trim();
                const date = row.querySelector('td#date').innerText.trim();
                
                data.push({ country, yield: yieldValue, dailyChange, changePercent, date });
            });

            return data;
        });

        console.log(bonds);

        // Close the browser
        await browser.close();
    } catch (error) {
        console.error('Error scraping data:', error);
    }
}

scrapeBonds();

