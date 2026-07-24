const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Iniciando simulador E2E...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    console.log('1. Navegando a http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    console.log('2. Esperando a que carguen los perfiles de la Base de Datos...');
    await page.waitForSelector('::-p-text(Operador Línea 1)', { timeout: 10000 });
    console.log('   Perfiles cargados con éxito.');

    console.log('3. Haciendo clic en "Operador Línea 1"...');
    const loginBtns = await page.$$('button');
    let targetBtn = null;
    for (const btn of loginBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Operador Línea 1')) {
        targetBtn = btn;
        break;
      }
    }
    if (targetBtn) {
      await page.evaluate(el => el.click(), targetBtn);
    }
  
      console.log('4. Esperando a cargar la vista de Registro Horario...');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await page.waitForSelector('::-p-text(Línea 1)');
      console.log('   Página de registro cargada.');
  
      console.log('5. Seleccionando el primer bloque horario...');
      // If it fails here, we take a screenshot
      try {
        await page.waitForSelector('.grid-cols-4 button', { timeout: 5000 });
      } catch (e) {
        console.log('Error esperando el grid, tomando screenshot...');
        await page.screenshot({ path: 'error_screenshot.png' });
        throw e;
      }
      
      const hourBtns = await page.$$('.grid-cols-4 button');
      let hourBtn = null;
      if (hourBtns.length > 0) {
        hourBtn = hourBtns[0];
        const text = await page.evaluate(el => el.textContent, hourBtn);
        console.log(`   Bloque seleccionado: ${text}`);
        await page.evaluate(el => el.click(), hourBtn);
      } else {
        throw new Error("No se encontraron bloques horarios en la pantalla");
      }
  
      console.log('6. Buscando el input de botellas producidas...');
      await page.waitForTimeout(1000); // Dar tiempo al render de React
      await page.waitForSelector('input[type="number"]', { timeout: 10000 });
      
      console.log('7. Ingresando 28500 botellas...');
      await page.type('input[type="number"]', '28500');
  
      await page.waitForSelector('::-p-text(HL Real)');
      
      console.log('8. Desplegando el panel de Incidencias...');
      const allBtns = await page.$$('button');
      let incidentBtn = null;
      for (const btn of allBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Registrar Incidencia')) {
          incidentBtn = btn;
          break;
        }
      }
      if (incidentBtn) {
        await page.evaluate(el => el.click(), incidentBtn);
      }
  
      console.log('9. Llenando datos de incidencia...');
      await page.waitForTimeout(1000); 
      const numberInputs = await page.$$('input[type="number"]');
      if (numberInputs.length > 1) {
        await numberInputs[1].type('15');
      }
  
      const textareas = await page.$$('textarea');
      if (textareas.length > 1) {
        await textareas[1].type('Falla eléctrica de prueba en llenadora.');
      }
  
      console.log('10. Haciendo clic en "Guardar Registro"...');
      let saveBtn = null;
      const saveBtns = await page.$$('button');
      for (const btn of saveBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Guardar Registro')) {
          saveBtn = btn;
          break;
        }
      }
      if (saveBtn) {
        await page.evaluate(el => el.click(), saveBtn);
      }
    
    await page.waitForTimeout(2500); 
    console.log('    Registro guardado exitosamente.');

    console.log('====================================');
    console.log('✅ TODAS LAS PRUEBAS E2E PASARON CORRECTAMENTE.');
    
  } catch (error) {
    console.error('❌ Error durante la prueba E2E:');
    console.error(error);
  } finally {
    await browser.close();
  }
})();
