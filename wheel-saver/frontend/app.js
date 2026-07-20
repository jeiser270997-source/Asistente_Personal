// ─── FIX-102: Gestión de token de autenticación ───────────────────────────
const API_BASE = "http://127.0.0.1:8000";
const STORAGE_KEY = "wheelsaver_token";

function getToken() {
    return localStorage.getItem(STORAGE_KEY) || "";
}

function setToken(token) {
    localStorage.setItem(STORAGE_KEY, token);
}

function getHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) {
        headers["x-wheelsaver-token"] = token;
    }
    return headers;
}

document.addEventListener("DOMContentLoaded", () => {
    // Mostrar/ocultar input de token según si ya hay uno guardado
    const tokenInput = document.getElementById("token-input");
    const currentToken = getToken();
    if (currentToken) {
        tokenInput.value = currentToken;
        document.getElementById("token-status").textContent = "✅ Token configurado";
    } else {
        document.getElementById("token-status").textContent = "⚠️ Sin token — las llamadas a la API fallarán si hay autenticación";
    }

    document.getElementById("btn-save-token").addEventListener("click", () => {
        const token = tokenInput.value.trim();
        if (token) {
            setToken(token);
            document.getElementById("token-status").textContent = "✅ Token guardado";
            loadStats(); // Recargar para verificar que funciona
        } else {
            localStorage.removeItem(STORAGE_KEY);
            document.getElementById("token-status").textContent = "⚠️ Token eliminado";
        }
    });

    loadStats();

    document.getElementById("search-form").addEventListener("submit", (e) => {
        e.preventDefault();
        performSearch();
    });

    document.getElementById("btn-scrape").addEventListener("click", () => {
        triggerScrape();
    });
});

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...options.headers }
    });
    if (res.status === 401) {
        document.getElementById("token-status").textContent = "❌ Token inválido — actualiza el token en el panel superior";
        throw new Error("No autorizado (401) — verifica el token de API");
    }
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

async function loadStats() {
    try {
        const stats = await apiFetch(`${API_BASE}/stats`);
        
        document.getElementById("stat-repos").textContent = stats.total_repos.toLocaleString();
        document.getElementById("stat-langs").textContent = stats.languages;
        document.getElementById("stat-max").textContent = stats.stars_max.toLocaleString();
        document.getElementById("stat-avg").textContent = Math.round(stats.stars_avg).toLocaleString();
    } catch (err) {
        console.error("No se pudo cargar estadisticas", err);
    }
}

async function performSearch() {
    const q = document.getElementById("input-q").value.trim();
    const lang = document.getElementById("input-lang").value.trim();
    const limit = document.getElementById("input-limit").value;

    if (!q) return;

    const resultsCard = document.getElementById("results-card");
    const loading = document.getElementById("loading");
    const tbody = document.getElementById("results-body");

    resultsCard.classList.add("hide");
    loading.classList.remove("hide");
    tbody.innerHTML = "";

    try {
        let url = `${API_BASE}/search?q=${encodeURIComponent(q)}&limit=${limit}`;
        if (lang) url += `&language=${encodeURIComponent(lang)}`;

        const data = await apiFetch(url);

        data.repos.forEach(repo => {
            const tr = document.createElement("tr");
            
            const tdName = document.createElement("td");
            tdName.innerHTML = `<a href="${repo.url}" target="_blank"><strong>${repo.owner}/${repo.name}</strong></a>`;
            
            const tdStars = document.createElement("td");
            tdStars.textContent = "⭐ " + repo.stars.toLocaleString();
            
            const tdLang = document.createElement("td");
            tdLang.textContent = repo.language || "-";
            
            const tdDesc = document.createElement("td");
            tdDesc.className = "text-wrap";
            tdDesc.textContent = repo.description || "-";

            tr.appendChild(tdName);
            tr.appendChild(tdStars);
            tr.appendChild(tdLang);
            tr.appendChild(tdDesc);
            tbody.appendChild(tr);
        });

        resultsCard.classList.remove("hide");
    } catch (err) {
        alert("Error al buscar: " + err.message);
    } finally {
        loading.classList.add("hide");
    }
}

async function triggerScrape() {
    try {
        const data = await apiFetch(`${API_BASE}/scrape?min_stars=500`, { method: "POST" });
        alert("Scraping iniciado en background: " + data.message);
    } catch(err) {
        alert("Error: " + err.message);
    }
}
