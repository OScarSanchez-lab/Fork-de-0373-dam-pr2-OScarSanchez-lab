const ciudades = [
    {
        nombre: "Barcelona",
        pais: "Espanya",
        latitud: 41.3851,
        longitud: 2.1734,
        monedaLocal: "Euro (€)",
        code: "eur"
    },
    {
        nombre: "London",
        pais: "Regne Unit",
        latitud: 51.5074,
        longitud: -0.1278,
        monedaLocal: "Lliura esterlina (£)",
        code: "gbp"
    },
    {
        nombre: "Paris",
        pais: "França",
        latitud: 48.8566,
        longitud: 2.3522,
        monedaLocal: "Euro (€)",
        code: "eur"
    },
    {
        nombre: "New York",
        pais: "Estats Units",
        latitud: 40.7128,
        longitud: -74.0060,
        monedaLocal: "Dòlar americà ($)",
        code: "usd"
    },
    {
        nombre: "Tokyo",
        pais: "Japó",
        latitud: 35.6762,
        longitud: 139.6503,
        monedaLocal: "Ien (¥)",
        code: "jpy"
    }
];

let ciutatActual = null;
let tempActual   = null;
let taxaCanvi    = null;

const select    = document.getElementById("city-select");
const dashboard = document.getElementById("dashboard");
const loadingEl = document.getElementById("loading");
const errorEl   = document.getElementById("error-msg");
const errorText = document.getElementById("error-text");
const convertBtn = document.getElementById("convert-btn");
const eurInput  = document.getElementById("eur-amount");

ciudades.forEach((ciudad, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = ciudad.nombre;
    select.appendChild(option);
});

select.addEventListener("change", async () => {
    const index = parseInt(select.value);
    ciutatActual = ciudades[index];
    await carregarDades(ciutatActual);
});

convertBtn.addEventListener("click", () => {
    if (!ciutatActual || taxaCanvi === null) return;
    convertirMoneda();
});

async function carregarDades(ciudad) {
    mostrarLoading(true);
    amagarError();
    dashboard.style.display = "none";

    try {
        const [temps, canvi] = await Promise.all([
            fetchTemps(ciudad.latitud, ciudad.longitud),
            fetchCanviMoneda(ciudad.code)
        ]);

        tempActual = temps.temperatura;
        taxaCanvi  = canvi;

        mostrarResum(ciudad, temps);
        mostrarTemps(temps);
        mostrarConversor(ciudad, canvi);
        mostrarRecomanacio(ciudad, temps, canvi);

        dashboard.style.display = "grid";
    } catch (error) {
        mostrarError("No s'han pogut carregar les dades. Comprova la connexió.");
        console.error(error);
    } finally {
        mostrarLoading(false);
    }
}

async function fetchTemps(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json();

    const temperatura  = data.current?.temperature_2m ?? null;
    const precipitacio = data.current?.precipitation   ?? 0;

    return { temperatura, precipitacio };
}

async function fetchCanviMoneda(monedaDesti) {
    if (monedaDesti === "eur") return 1;

    const url = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Currency API error: ${response.status}`);
    const data = await response.json();

    const taxa = data.eur?.[monedaDesti];
    if (!taxa) throw new Error(`Moneda no trobada: ${monedaDesti}`);
    return taxa;
}

function mostrarResum(ciudad, temps) {
    document.getElementById("ciudad-val").textContent = ciudad.nombre;
    document.getElementById("pais-val").textContent   = ciudad.pais;
    document.getElementById("temp-summary").textContent =
        temps.temperatura !== null ? `${temps.temperatura} °C` : "—";
    document.getElementById("coin-val").textContent = ciudad.monedaLocal;
}

function mostrarTemps(temps) {
    document.getElementById("temp-weather").textContent =
        temps.temperatura !== null ? `${temps.temperatura} °C` : "—";

    const precipVal = temps.precipitacio;
    document.getElementById("prec-weather").textContent =
        precipVal !== null ? `${precipVal} mm` : "—";

    document.getElementById("rain-label").textContent = getRainLabel(precipVal);
}

function getRainLabel(mm) {
    if (mm === null || mm === undefined) return "—";
    if (mm < 0.5) return "Sense pluja";
    if (mm < 5)   return "Possibles precipitacions";
    return "Probable pluja";
}

function mostrarConversor(ciudad, taxa) {
    const amount  = parseFloat(eurInput.value) || 100;
    const resultat = (amount * taxa).toFixed(2);

    document.getElementById("currency-result").style.display = "block";
    document.getElementById("eur-display").textContent       = `${amount} EUR`;
    document.getElementById("converted-display").textContent = `${resultat} ${ciudad.code.toUpperCase()}`;
    document.getElementById("rate-note").textContent         =
        `1 EUR = ${taxa.toFixed(4)} ${ciudad.code.toUpperCase()}`;
}

function convertirMoneda() {
    if (!ciutatActual || taxaCanvi === null) return;
    mostrarConversor(ciutatActual, taxaCanvi);
}

function mostrarRecomanacio(ciudad, temps, taxa) {
    let msg = "";
    const t  = temps.temperatura;
    const mm = temps.precipitacio;
    const amount   = 100;
    const resultat = (amount * taxa).toFixed(0);

    if (t !== null && t >= 20 && mm < 1) {
        msg = `Avui fa bon temps per passejar per ${ciudad.nombre}. Temperatura de ${t}°C!`;
    } else if (t !== null && t < 10) {
        msg = `Recorda portar jaqueta: la temperatura a ${ciudad.nombre} és baixa (${t}°C).`;
    } else if (mm >= 5) {
        msg = `Porta paraigua! Hi ha probabilitat de pluja a ${ciudad.nombre}.`;
    } else {
        msg = `${amount} EUR equivalen a ${resultat} ${ciudad.code.toUpperCase()}. Bon viatge a ${ciudad.nombre}!`;
    }

    document.getElementById("funfact").textContent = msg;
}

function mostrarLoading(visible) {
    loadingEl.style.display = visible ? "block" : "none";
}
function mostrarError(missatge) {
    errorText.textContent = missatge;
    errorEl.style.display = "block";
}
function amagarError() {
    errorEl.style.display = "none";
}