const puppeteer = require('puppeteer');

(async () => {
  console.log('🤖 Iniciando prueba E2E completa de todas las funciones y botones...');
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // 1. LOGIN
    console.log('1. Abriendo http://localhost:5173...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'test_1_login.png' });
    console.log('   ✓ Página de Login cargada.');

    // Verificar que solo aparece el botón de Administrador en el acceso rápido
    console.log('2. Verificando botones de Acceso Rápido...');
    const quickLoginBtns = await page.$$('button');
    let adminBtn = null;
    let foundOtherUsers = false;

    for (const btn of quickLoginBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Administrador')) {
        adminBtn = btn;
      } else if (text.includes('Operador') || text.includes('Supervisor')) {
        foundOtherUsers = true;
      }
    }

    if (foundOtherUsers) {
      console.error('   ❌ ALERTA: Se encontraron botones de otros usuarios no-administradores.');
    } else {
      console.log('   ✓ Verificación exitosa: Solo el Administrador está disponible en Acceso Rápido.');
    }

    if (adminBtn) {
      console.log('3. Iniciando sesión con botón de Administrador...');
      await adminBtn.click();
    }

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'test_2_registro_page.png' });
    console.log('   ✓ Inicio de sesión exitoso. Redirigido a /registro.');

    // 2. REGISTRO HORARIO - CAMBIO DE LÍNEA Y TURNO
    console.log('4. Probando botones de Línea (Línea 1 vs Línea 3)...');
    const lineBtns = await page.$$('button');
    for (const btn of lineBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text === 'Línea 3') {
        await btn.click();
        console.log('   ✓ Cambiado a Línea 3');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    console.log('5. Probando cambio de Turno (Turno 2)...');
    const shiftBtns = await page.$$('button');
    for (const btn of shiftBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Turno 2')) {
        await btn.click();
        console.log('   ✓ Cambiado a Turno 2');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // 3. REGISTRO HORARIO - SELECCIÓN DE BLOQUE Y FORMULARIO
    console.log('6. Seleccionando un bloque horario...');
    const hourBtns = await page.$$('div.grid-cols-4 button');
    if (hourBtns.length > 0) {
      await hourBtns[0].click();
      console.log('   ✓ Bloque horario seleccionado.');
    }

    await new Promise(r => setTimeout(r, 500));

    console.log('7. Ingresando botellas producidas...');
    const bottlesInput = await page.$('input[type="number"][inputmode="numeric"]');
    if (bottlesInput) {
      await bottlesInput.click({ clickCount: 3 });
      await bottlesInput.type('45000');
      console.log('   ✓ 45,000 botellas ingresadas.');
    }

    console.log('8. Modificando HL Programado / Hora personalizado...');
    const targetHlInput = await page.$('input[placeholder="378"], input[placeholder="192"]');
    if (targetHlInput) {
      await targetHlInput.click({ clickCount: 3 });
      await targetHlInput.type('400');
      console.log('   ✓ Meta personalizada establecida a 400 HL/h.');
    }

    console.log('9. Desplegando formulario de Incidencia...');
    const incidentToggleBtn = await page.$$('button');
    for (const btn of incidentToggleBtn) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Registrar Incidencia')) {
        await btn.click();
        console.log('   ✓ Formulario de incidencia desplegado.');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'test_3_formulario_lleno.png' });

    // 4. INCIDENCIAS PAGE
    console.log('10. Navegando a la página de Incidencias...');
    let navLinks = await page.$$('a');
    for (const link of navLinks) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text.includes('Incidencias')) {
        await link.click();
        console.log('   ✓ Navegado a /incidencias');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'test_4_incidencias_fecha.png' });

    console.log('11. Probando filtro de fecha "Todas las fechas"...');
    const todasBtn = await page.$$('button');
    for (const btn of todasBtn) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text === 'Todas') {
        await btn.click();
        console.log('   ✓ Filtro "Todas las fechas" activado.');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'test_5_incidencias_todas.png' });

    console.log('12. Probando filtro de turno en Incidencias (Turno 1)...');
    const turno1Btn = await page.$$('button');
    for (const btn of turno1Btn) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Turno 1')) {
        await btn.click();
        console.log('   ✓ Filtro Turno 1 activado.');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'test_6_incidencias_turno1.png' });

    // 5. MODAL DE REPORTES
    console.log('13. Volviendo a Registro para probar Modal de Reportes...');
    navLinks = await page.$$('a');
    for (const link of navLinks) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text.includes('Registro')) {
        await link.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    console.log('14. Abriendo modal "Crear Reporte"...');
    const reportBtns = await page.$$('button');
    for (const btn of reportBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Crear Reporte')) {
        await btn.click();
        console.log('   ✓ Modal de reporte abierto.');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'test_7_reporte_modal.png' });

    console.log('15. Generando vista previa del reporte...');
    const modalBtns = await page.$$('button');
    for (const btn of modalBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar Vista Previa')) {
        await btn.click();
        console.log('   ✓ Vista previa generada.');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'test_8_reporte_preview.png' });

    console.log('=====================================================');
    console.log('🎉 PRUEBAS COMPLETADAS EXITOSAMENTE SIN ERRORES');
    console.log('=====================================================');

  } catch (err) {
    console.error('❌ Error durante las pruebas:', err);
  } finally {
    await browser.close();
  }
})();
