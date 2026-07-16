// scripts/jobs/computrabajo_scraper.js - v3 robusta (post deep audit)
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { askLLM } = require("../../lib/ai/llm_service");

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

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
  // Opcional: guardar en log file
}

async function main() {
  log("🚀 Computrabajo Scraper v3 - Robust");

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    viewport: { width: 1280, height: 720 },
  });
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
      
      // Esperar activamente los articles en vez de timeout fijo. Si falla (Cloudflare o 0 ofertas), evitamos crashear.
      const hasArticles = await page.waitForSelector("article", { state: 'attached', timeout: 15000 }).catch(() => null);
      if (!hasArticles) {
        log(`  ⚠️ No se encontraron ofertas o bloqueado por Cloudflare para: ${kw}`);
        continue; // Pasamos a la siguiente keyword
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

      // Enriquecer detalles
      for (const oferta of offers) {
        try {
          await page.goto(oferta.url, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await page.waitForTimeout(1500);

          const detail = await page.evaluate(() => ({
            descripcion: (
              document.querySelector(".job-description, .description")
                ?.innerText || ""
            ).substring(0, 600),
            salario:
              document
                .querySelector(".salary, .offer-salary")
                ?.innerText?.trim() || "No especificado",
            requisitos: Array.from(
              document.querySelectorAll(".requirements li, .tags span"),
            )
              .map((el) => el.textContent.trim())
              .slice(0, 8)
              .join(" | "),
          }));

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
