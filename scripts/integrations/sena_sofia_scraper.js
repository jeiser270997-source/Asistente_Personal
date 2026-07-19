require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function scrapeSofiaPlus() {
  console.log('🚀 Iniciando scraper de SENA Sofia Plus (Rol Aspirante)...');
  
  // headless en false temporalmente para que veas en tiempo real la magia en tu PC local.
  // Cuando verifiques que funciona, cámbialo a true para correr en background.
  const b = await chromium.launch({ headless: false }); 
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: UA,
    locale: 'es-CO',
  });
  const p = await ctx.newPage();

  try {
    const CC = process.env.USER_CC;
    const PASS = process.env.SENA_MOODLE_PASS;

    if (!CC || !PASS) throw new Error("Faltan credenciales USER_CC o SENA_MOODLE_PASS en .env");

    console.log("🔑 Cargando página de login...");
    await p.goto('http://senasofiaplus.edu.co/sofia-public/', { waitUntil: 'load', timeout: 30000 });
    await p.waitForTimeout(3000);

    // Identificar el iframe del login de JSF
    const frames = p.frames();
    const loginFrame = frames.find(f => f.url().includes('login.do') || f.url().includes('authpre'));
    
    if (!loginFrame) throw new Error("No se encontró el iframe de login");

    console.log("✍️ Inyectando credenciales...");
    await loginFrame.fill('input[name="ingreso"]', CC);
    await loginFrame.fill('input[name="josso_password"]', PASS);
    
    // El botón llama a una función JS custom, así que evaluamos la función que lo envía
    console.log("🖱️ Haciendo submit...");
    await loginFrame.evaluate(() => { concatenarValores(); });
    
    console.log("⏳ Esperando navegación al dashboard...");
    await p.waitForTimeout(8000);
    
    // Asegurar que entramos a principal.faces
    if (!p.url().includes('principal.faces')) {
        await p.goto('http://senasofiaplus.edu.co/sofia/home/principal.faces', { waitUntil: 'load', timeout: 30000 });
        await p.waitForTimeout(4000);
    }
    console.log("✅ Dashboard alcanzado.");

    // JSF a veces usa spans o anchor tags simulando menús. Evitamos dar click a los <option> ocultos.
    console.log("🎭 Buscando y clickeando rol 'Aspirante'...");
    const elementsAspirante = await p.$$('text="Aspirante"');
    for (const el of elementsAspirante) {
        if (await el.isVisible()) {
            const tag = await el.evaluate(e => e.tagName.toLowerCase());
            if(tag !== 'option' && tag !== 'title') {
                await el.click();
                await p.waitForTimeout(2000);
                break;
            }
        }
    }

    console.log("📂 Desplegando menú 'Inscripción'...");
    const menuInscripcion = await p.$$('text="Inscripción"');
    for (const el of menuInscripcion) {
       if (await el.isVisible()) {
           const tag = await el.evaluate(e => e.tagName.toLowerCase());
           if(tag !== 'option' && tag !== 'title') {
               await el.click({ force: true });
               await p.waitForTimeout(1500);
               break;
           }
       }
    }

    console.log("📂 Desplegando submenú 'Consultar Programas de Formación'...");
    const menuConsultarProg = await p.$$('text="Consultar Programas de Formación"');
    for (const el of menuConsultarProg) {
        if (await el.isVisible()) {
            const tag = await el.evaluate(e => e.tagName.toLowerCase());
            if(tag !== 'option' && tag !== 'title') {
                await el.click({ force: true });
                await p.waitForTimeout(1500);
                break;
            }
        }
    }

    console.log("📄 Abriendo 'Consultar Inscripciones a Programas de Formación'...");
    const menuConsultarInscrip = await p.$$('text="Consultar Inscripciones a Programas de Formación"');
    for (const el of menuConsultarInscrip) {
        if (await el.isVisible()) {
            const tag = await el.evaluate(e => e.tagName.toLowerCase());
            if(tag !== 'option' && tag !== 'title') {
                await el.click({ force: true });
                break;
            }
        }
    }
    
    console.log("⏳ Esperando a que cargue la tabla AJAX...");
    await p.waitForTimeout(8000); // Dar más tiempo a la respuesta del servidor

    console.log("🔎 Extrayendo tabla de cursos...");
    
    // Podría cargar en un iframe o en el documento principal
    let targetFrame = p;
    for (const frame of p.frames()) {
        const hasTable = await frame.evaluate(() => document.querySelectorAll('table').length > 0);
        if (hasTable && frame !== p.mainFrame()) {
            targetFrame = frame;
            console.log("📌 Tabla encontrada en un iframe hijo.");
            break;
        }
    }

    const data = await targetFrame.evaluate(() => {
        // Encontrar la tabla real basándonos en los ths o simplemente buscando una tabla grande
        const ths = Array.from(document.querySelectorAll('th'));
        let table = null;
        
        if(ths.length > 0) {
            table = ths[0].closest('table');
        } else {
            const tables = document.querySelectorAll('table');
            if(tables.length === 0) return [];
            table = Array.from(tables).reduce((prev, curr) => prev.rows.length > curr.rows.length ? prev : curr, tables[0]);
        }
        
        if (!table) return [];

        const results = [];
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            // La grilla tiene 8 columnas según la imagen: Identificador Ficha, Programa, Nivel, Regional, Centro, Dpto, Modalidad, Estado
            if (cols.length >= 8) { 
                results.push({
                    ficha: cols[0].innerText.trim(),
                    programa: cols[1].innerText.trim(),
                    nivel: cols[2].innerText.trim(),
                    regional: cols[3].innerText.trim(),
                    centro: cols[4].innerText.trim(),
                    departamento: cols[5].innerText.trim(),
                    modalidad: cols[6].innerText.trim(),
                    estado: cols[7].innerText.trim()
                });
            }
        });
        return results;
    });

    console.log(`\n🎉 Extracción finalizada. ${data.length} cursos encontrados.`);
    if(data.length > 0) {
        console.table(data);
    }

    // Guardar los datos extraídos en JSON para Betowa
    const outputDir = path.join(__dirname, '..', '..', 'data', 'estado_sena');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, 'historial_cursos.json');
    fs.writeFileSync(outputFile, JSON.stringify({
        fecha_actualizacion: new Date().toISOString(),
        total: data.length,
        cursos: data
    }, null, 2));
    
    console.log(`\n💾 Historial guardado para Betowa en: ${outputFile}`);

  } catch (error) {
    console.error("❌ Error en el scraper:", error);
  } finally {
    console.log("Cerrando navegador...");
    await b.close();
  }
}

scrapeSofiaPlus();
