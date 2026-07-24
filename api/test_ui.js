const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Check if we need to login
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      console.log('Logging in...');
      await page.type('input[type="email"]', 'admin@motupe.com');
      await page.type('input[type="password"]', 'admin123'); // Assuming standard mock pwd
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('Taking screenshot of Dashboard...');
    await page.screenshot({ path: 'dashboard.png' });

    console.log('Navigating to Incidents...');
    // Find the Incidents link in sidebar
    const links = await page.$$('a');
    for (const link of links) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text.includes('Incidencias')) {
        await link.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('Taking screenshot of Incidents...');
    await page.screenshot({ path: 'incidents.png' });

    console.log('Navigating to Log (Registro)...');
    for (const link of links) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text.includes('Registro')) {
        await link.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('Taking screenshot of Hourly Log...');
    await page.screenshot({ path: 'hourly_log.png' });
    
    console.log('Clicking "Crear Reporte"...');
    // Find button containing "Crear Reporte"
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Crear Reporte')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('Taking screenshot of Report Modal...');
    await page.screenshot({ path: 'report_modal.png' });
    
    // Generate preview
    const previewBtns = await page.$$('button');
    for (const btn of previewBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar Vista Previa')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    console.log('Taking screenshot of Report Preview...');
    await page.screenshot({ path: 'report_preview.png' });

  } catch (error) {
    console.error('Error during automation:', error);
  } finally {
    await browser.close();
    console.log('Done.');
  }
})();
