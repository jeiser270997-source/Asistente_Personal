require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Función para normalizar textos (quitar tildes, mayúsculas y espacios extra)
function normalizar(texto) {
    if(!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function scrapeBetowaOffers(p) {
    console.log('\n🌐 Extrayendo oferta en vivo desde Betowa (page_size=100)...');
    
    let allCourses = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `https://betowa.sena.edu.co/oferta?page_size=100&page=${page}&modality=V`;
        console.log(`Cargando página ${page}: ${url}`);
        
        await p.goto(url, { waitUntil: 'load', timeout: 30000 });
        await p.waitForTimeout(3000); // Tiempo para renderizado de React
        
        const coursesOnPage = await p.evaluate(() => {
            const cards = document.querySelectorAll('a[href*="programId"]');
            return [...cards].map(a => {
                const href = a.getAttribute('href') || '';
                const match = href.match(/programId=(\d+)/);
                const article = a.closest('article') || a;
                const text = article.innerText || '';
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                return {
                    programId: match ? parseInt(match[1]) : null,
                    name: lines[0] || '',
                    details: lines.slice(1).join(' | '),
                    href: href.split('?')[0]
                };
            }).filter(c => c.programId);
        });

        if (coursesOnPage.length === 0) {
            hasMore = false;
        } else {
            allCourses.push(...coursesOnPage);
            if(coursesOnPage.length < 100) {
                hasMore = false;
            } else {
                page++;
            }
        }
    }

    console.log(`✅ Total extraído de Betowa: ${allCourses.length} cursos virtuales.`);
    return allCourses;
}

(async () => {
    // 1. Cargar el historial de Sofia Plus y el Roadmap
    const dataDir = path.join(__dirname, '..', '..', 'data');
    const historialPath = path.join(dataDir, 'estado_sena', 'historial_cursos.json');
    const roadmapPath = path.join(dataDir, 'state', 'bootcamp', 'roadmap_qa_sena.json');

    if (!fs.existsSync(historialPath)) {
        console.error("❌ No se encontró el historial de cursos. Ejecuta primero sena_sofia_scraper.js");
        process.exit(1);
    }
    
    if (!fs.existsSync(roadmapPath)) {
        console.error("❌ No se encontró el roadmap. Verifica data/state/bootcamp/roadmap_qa_sena.json");
        process.exit(1);
    }

    const historialData = JSON.parse(fs.readFileSync(historialPath, 'utf-8'));
    const roadmapData = JSON.parse(fs.readFileSync(roadmapPath, 'utf-8'));
    
    const historial = historialData.cursos;
    
    // Contar los cupos basados en el roadmap
    const cursosActivos = historial.filter(c => 
        roadmapData.reglas.estados_activos.includes(c.estado)
    );
    const limite = roadmapData.limite_simultaneo || 4;
    const cuposDisponibles = limite - cursosActivos.length;
    
    console.log(`\n=== ESTADO ACTUAL (Perfil: ${roadmapData.perfil}) ===`);
    console.log(`Cursos activos (${roadmapData.reglas.estados_activos.join(', ')}): ${cursosActivos.length}`);
    console.log(`Cupos disponibles para inscripción: ${cuposDisponibles}`);
    
    if (cuposDisponibles <= 0) {
        console.log(`\n⚠️ LÍMITE ALCANZADO: No puedes inscribirte a más cursos. Tienes ${cursosActivos.length} activos.`);
    }

    // Nombres del historial a excluir
    const cursosExcluir = historial
        .filter(c => roadmapData.reglas.excluir_estados.includes(c.estado))
        .map(c => normalizar(c.programa));

    // 2. Extraer de Betowa
    const b = await chromium.launch({ headless: false }); // headless en false para que veas la ventana
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();

    const CC = process.env.USER_CC;
    const PASS = process.env.SENA_MOODLE_PASS;

    console.log('\n🔑 Iniciando sesión en Betowa...');
    await p.goto('https://betowa.sena.edu.co/iniciar-sesion', { waitUntil: 'load', timeout: 30000 });
    await p.waitForTimeout(1000);
    await p.locator('button[aria-haspopup=listbox]').first().click();
    await p.waitForTimeout(300);
    await p.click('button[role=option]:has-text("Cédula de Ciudadanía")');
    await p.fill('input[name=documentNumber]', CC);
    await p.fill('input[name=password]', PASS);
    await p.click('button:has-text("Iniciar sesión")');
    await p.waitForTimeout(4000);
    
    // 3. Extraer oferta
    const betowaOferta = await scrapeBetowaOffers(p);

    // 4. Filtrar oferta basada en el roadmap
    console.log(`\n⚙️ Cruzando base de Betowa con el Roadmap paso a paso...`);
    
    // Agrupar recomendaciones por Fase
    const recomendacionesPorFase = [];
    let descartadosRepetidos = 0;

    for (const fase of roadmapData.fases) {
        const keywordsFase = fase.cursos_clave.map(k => normalizar(k));
        const cursosEncontradosFase = [];

        betowaOferta.forEach(oferta => {
            const nameOferta = normalizar(oferta.name);
            
            // Revisa si es un curso de esta fase
            const esDeFase = keywordsFase.some(k => nameOferta.includes(k));
            
            if (esDeFase) {
                // Verificar exclusión (Ya lo tiene o ya lo hizo)
                const repetido = cursosExcluir.some(hist => nameOferta.includes(hist) || hist.includes(nameOferta));
                if (repetido) {
                    descartadosRepetidos++;
                } else {
                    cursosEncontradosFase.push(oferta);
                }
            }
        });

        // Eliminar duplicados exactos dentro de la fase
        const unicos = Array.from(new Map(cursosEncontradosFase.map(item => [item.programId, item])).values());
        
        recomendacionesPorFase.push({
            fase: fase.fase,
            nombre: fase.nombre,
            cursos: unicos
        });
    }

    console.log(`\n🚫 Descartados por repetidos (del Roadmap pero ya superados/activos): ${descartadosRepetidos}`);

    // Mostrar el paso a paso
    console.log(`\n🏆 ROADMAP QA AUTOMATION - RECOMENDACIONES (Cupos Libres: ${cuposDisponibles})`);
    
    let recomendacionFuerte = null;
    let recoMostradas = 0;

    recomendacionesPorFase.forEach(f => {
        if (f.cursos.length > 0) {
            console.log(`\n--- FASE ${f.fase}: ${f.nombre} ---`);
            f.cursos.slice(0, 5).forEach((c) => {
                if(!recomendacionFuerte) recomendacionFuerte = c;
                console.log(`  🔹 ${c.name}`);
                console.log(`     Link: https://betowa.sena.edu.co${c.href}`);
                recoMostradas++;
            });
            if(f.cursos.length > 5) {
                console.log(`     ... y ${f.cursos.length - 5} más en esta fase.`);
            }
        } else {
             console.log(`\n--- FASE ${f.fase}: ${f.nombre} ---`);
             console.log(`  [No se encontró oferta activa en Betowa o ya los terminaste]`);
        }
    });

    // Guardar recomendaciones
    const outPath = path.join(dataDir, 'estado_sena', 'recomendaciones_betowa.json');
    fs.writeFileSync(outPath, JSON.stringify({
        cuposLibres: cuposDisponibles,
        recomendacionesPorFase
    }, null, 2));
    
    console.log(`\n💾 Resultados detallados guardados en: ${outPath}`);

    // AUTO-INSCRIPCIÓN
    if (cuposDisponibles > 0 && recomendacionFuerte) {
        console.log(`\n🚀 INICIANDO AUTO-INSCRIPCIÓN...`);
        console.log(`Intentando matricularte en: ${recomendacionFuerte.name}`);
        
        const enrollUrl = `https://betowa.sena.edu.co${recomendacionFuerte.href}?programId=${recomendacionFuerte.programId}&modality=V`;
        console.log(`Navegando a: ${enrollUrl}`);
        
        await p.goto(enrollUrl, { waitUntil: 'load', timeout: 30000 });
        await p.waitForTimeout(4000);
        
        const btn = p.locator('button:has-text("Inscribirme")');
        const btnExists = await btn.count();
        
        if (btnExists > 0) {
            console.log(`📸 Tomando screenshot ANTES del click...`);
            await p.screenshot({ path: path.join(dataDir, 'estado_sena', 'betowa_antes_inscripcion.png') });
            
            console.log(`🖱️ Botón 'Inscribirme' encontrado. Haciendo click...`);
            await btn.first().click();
            await p.waitForTimeout(2000); // Esperar que abra el modal
            
            // Modal 1: Seleccionar Jornada Virtual y Continuar
            console.log(`🖱️ Seleccionando 'Jornada Virtual' (en el modal)...`);
            const jornadaElements = p.getByText('Jornada Virtual', { exact: false });
            await jornadaElements.last().waitFor({ state: 'visible', timeout: 10000 });
            await jornadaElements.last().click();
            await p.waitForTimeout(1000);
            
            console.log(`🖱️ Haciendo click en 'Continuar'...`);
            await p.getByRole('button', { name: /Continuar/i }).first().click();
            await p.waitForTimeout(3000); // Esperar modal 2
            
            // Modal 2: Confirmar inscripción
            console.log(`🖱️ Haciendo click en 'Confirmar inscripción'...`);
            await p.getByRole('button', { name: /Confirmar inscripci/i }).first().click();
            await p.waitForTimeout(5000); // Esperar que procese la matrícula
            
            // Modal 3: Éxito
            console.log(`🖱️ Haciendo click en 'Entendido'...`);
            await p.getByRole('button', { name: /Entendido/i }).first().click();
            await p.waitForTimeout(2000);
            
            console.log(`📸 Tomando screenshot DESPUÉS del proceso completo...`);
            await p.screenshot({ path: path.join(dataDir, 'estado_sena', 'betowa_despues_inscripcion.png') });

            console.log(`🎉 AUTO-INSCRIPCIÓN COMPLETADA CON ÉXITO.`);
        } else {
            console.log(`❌ No se encontró el botón 'Inscribirme' en la página. Puede que el curso ya no tenga cupos o requiera un código de empresa.`);
        }
    } else if (cuposDisponibles <= 0) {
        console.log(`\n🛑 No se ejecutará auto-inscripción. Límite de 4 cursos alcanzado.`);
    }

    await b.close();
})();
