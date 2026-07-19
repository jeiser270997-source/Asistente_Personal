// scripts/jobs/computrabajo_scraper.js - v4 bulletproof (FIX-011)
require("dotenv").config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { askLLM } = require("../../lib/ai/llm_service");
const { PATHS } = require('../../lib/data/paths');

const OUT_FILE = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "artifacts",
  "jobs",
  "computrabajo.json",
);
const DATA_DIR = path.dirname(OUT_FILE);
const STATE_PATH = PATHS.COMPUTRABAJO_STATE;

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

async function main() {
  log("🚀 Computrabajo Scraper v4 - Persistente y Robusto");

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const contextOpts = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    viewport: { width: 1280, height: 720 },
  };

  // Cargar sesión si existe para evadir Cloudflare en búsquedas (FIX-011)
  if (fs.existsSync(STATE_PATH)) {
    contextOpts.storageState = STATE_PATH;
    log('📂 Usando sesión persistente para escaneo.');
  }

  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  const keywords = [
    "qa",
    "tester",
    "playwright",
    "automation",
    "soporte tecnico",
    "mesa de ayuda",
  ];
  let allOffers = [];

  for (const kw of keywords) {
    const url = `https://co.computrabajo.com/trabajo-de-${encodeURIComponent(kw)}-en-medellin?by=publicationDate`;
    log(`Scraping: ${kw}`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });

      // Esperar activamente los articles en vez de timeout fijo
      const hasArticles = await page.waitForSelector("article", { state: 'attached', timeout: 15000 }).catch(() => null);
      if (!hasArticles) {
        log(`  ⚠️ No se encontraron ofertas o bloqueado por Cloudflare para: ${kw}`);
        continue;
      }

      const offers = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll("article").forEach((article, index) => {
          if (index > 8) return; // limitar por página
          const link = article.querySelector("h2 a, h3 a");
          if (link) {
            results.push({
              titulo: link.textContent.trim(),
              url: link.href,
              empresa:
                article.querySelector(".company")?.textContent.trim() || "N/A",
              lugar:
                article.querySelector(".location")?.textContent.trim() ||
                "Medellín",
            });
          }
        });
        return results;
      });

      // Enriquecer detalles con selectores en cascada
      for (const oferta of offers) {
        try {
          await page.goto(oferta.url, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await page.waitForTimeout(1500);

          const detail = await page.evaluate(() => {
            // Selectores en cascada para descripción
            const descSelectors = ['.job-description', '.description', '[class*="descripcion"]', '.detail-content', 'main p'];
            let descripcion = '';
            for (const sel of descSelectors) {
              const el = document.querySelector(sel);
              if (el && el.innerText) {
                descripcion = el.innerText.substring(0, 600);
                break;
              }
            }

            // Selectores en cascada para salario
            const salarySelectors = ['.salary', '.offer-salary', '[class*="salario"]', '[class*="salary"]', '.money'];
            let salario = 'No especificado';
            for (const sel of salarySelectors) {
              const el = document.querySelector(sel);
              if (el && el.innerText) {
                salario = el.innerText.trim();
                break;
              }
            }

            // Requisitos con selectores en cascada
            const reqSelectors = ['.requirements li', '.tags span', '[class*="requisito"] li', '.offer-requirements li'];
            let requisitos = '';
            for (const sel of reqSelectors) {
              const items = document.querySelectorAll(sel);
              if (items.length > 0) {
                requisitos = Array.from(items).map(el => el.textContent.trim()).slice(0, 8).join(" | ");
                break;
              }
            }

            return { descripcion, salario, requisitos };
          });

          Object.assign(oferta, detail);
        } catch (e) {
          log(`  ⚠️ Detalle falló para ${oferta.titulo}`);
        }
      }

      allOffers = allOffers.concat(offers);
      log(`  → ${offers.length} ofertas`);
    } catch (e) {
      log(`❌ Error en ${kw}: ${e.message}`);
    }
  }

  await browser.close();

  const data = {
    fecha: new Date().toISOString(),
    total: allOffers.length,
    ofertas: allOffers,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2));
  log(`✅ Scraping completado: ${allOffers.length} ofertas guardadas`);
}

main().catch((e) => log(`❌ Fatal: ${e.message}`));
