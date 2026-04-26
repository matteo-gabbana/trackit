import { API } from './api.js';
import { I18n } from './i18n.js';
import { MapManager } from './map.js';
import { Meteo } from './meteo.js';
import { Notifications } from './notifications.js';
import { Storage } from './storage.js';
import { formatTime, formatDelay, getDelayClass } from './utils.js';

//**
// Gestisce la pagina specifica della stazione
//  */

const ROWS_INITIAL = 5;

const qs = new URLSearchParams(window.location.search);
const stationId = qs.get('id');
const stationName = qs.get('nome') ? decodeURIComponent(qs.get('nome')) : '';

let currentTab = 'partenze';
let refreshTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    Notifications.init();
    setupLanguageToggle();
    initHamburgerMenu();

    if (!stationId) {
        document.querySelector('.station-content').innerHTML =
            `<p>${I18n.t('general.error')}: id stazione mancante.</p>`;
        return;
    }

    // Salva nella cronologia
    if (stationName) Storage.salva({ id: stationId, nome: stationName });

    document.getElementById('station-name').textContent = stationName || stationId;

    Meteo.loadForStation(stationId, 'station-meteo-container');

    setupTabs();
    setupRefresh();
    setupThresholdInput();
    initMap();
    loadTrains();

    // Polling ogni 60s
    refreshTimer = setInterval(loadTrains, 60_000);
});

function setupLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    if (!langToggle) return;
    langToggle.textContent = I18n.getLang().toUpperCase();
    langToggle.addEventListener('click', async () => {
        const newLang = I18n.getLang() === 'it' ? 'en' : 'it';
        await I18n.setLang(newLang);
        langToggle.textContent = newLang.toUpperCase();
        loadTrains();
    });
}

function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    if (!hamburger || !mainNav) return;

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        mainNav.classList.toggle('mobile-open');
    });

    document.addEventListener('click', (e) => {
        if (mainNav.classList.contains('mobile-open') &&
            !mainNav.contains(e.target) &&
            !hamburger.contains(e.target)) {
            mainNav.classList.remove('mobile-open');
        }
    });
}

function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            updateLocalityHeader();
            loadTrains();
        });
    });
}

function updateLocalityHeader() {
    const th = document.getElementById('th-locality');
    if (!th) return;
    if (currentTab === 'arrivi') {
        th.textContent = I18n.t('general.departure'); // "Partenza"
        th.setAttribute('data-i18n', 'general.departure');
    } else {
        th.textContent = I18n.t('station.destination'); // "Destinazione"
        th.setAttribute('data-i18n', 'station.destination');
    }
}

function setupRefresh() {
    const btn = document.getElementById('refresh-button');
    if (btn) btn.addEventListener('click', loadTrains);
}

function setupThresholdInput() {
    const input = document.getElementById('delay-threshold-input');
    if (!input) return;
    input.value = Notifications.getSoglia();
    input.addEventListener('change', () => {
        Notifications.setSoglia(input.value);
        // Ri-applica evidenziazioni alle righe attuali
        renderCachedRows();
    });
}

async function initMap() {
    try {
        MapManager.init('station-map');
        if (!stationId) return;

        const details = await API.dettaglioStazione(stationId);
        const lat = details?.lat;
        const lon = details?.lon;
        if (lat && lon) {
            const label = details?.nome || stationName || stationId;
            MapManager.addMarker(lat, lon, label, 'verde');
            MapManager.centerOn(lat, lon, 13);
        }
    } catch (e) {
        console.error('Mappa non inizializzata:', e);
    }
}

let lastTrains = [];

async function loadTrains() {
    const loader = document.getElementById('loader-train-list');
    const tbody = document.querySelector('#train-table tbody');
    const noMsg = document.getElementById('no-trains-message');
    if (loader) loader.style.display = 'block';
    if (tbody) tbody.innerHTML = '';
    if (noMsg) noMsg.style.display = 'none';

    try {
        const orario = buildOrarioParam();
        const data = currentTab === 'partenze'
            ? await API.partenze(stationId, orario)
            : await API.arrivi(stationId, orario);

        lastTrains = Array.isArray(data) ? data : [];
        renderCachedRows();
        updateLastUpdate();
    } catch (err) {
        console.error('Errore caricamento treni:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5">${I18n.t('general.error')}</td></tr>`;
        }
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function renderCachedRows() {
    const tbody = document.querySelector('#train-table tbody');
    const noMsg = document.getElementById('no-trains-message');
    const showMoreContainer = document.getElementById('show-more-container');
    const showMoreBtn = document.getElementById('show-more-btn');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (showMoreContainer) showMoreContainer.style.display = 'none';
    if (noMsg) noMsg.style.display = 'none';

    if (!lastTrains.length) {
        if (noMsg) { noMsg.textContent = I18n.t('station.no_results'); noMsg.style.display = 'block'; }
        return;
    }

    const soglia = Notifications.getSoglia();

    lastTrains.forEach((t, index) => {
        const numero = t.compNumeroTreno || t.numeroTreno || '';
        const localita = currentTab === 'partenze'
            ? (t.destinazione || '')
            : (t.origine || '');
        const orarioTs = currentTab === 'partenze'
            ? (t.orarioPartenza || t.orario_partenza || null)
            : (t.orarioArrivo || t.orario_arrivo || null);
        const ritardo = Number.isFinite(t.ritardo) ? t.ritardo : 0;
        const stato = buildStato(t);

        const tr = document.createElement('tr');
        tr.dataset.trenoId = numero;
        if (ritardo > soglia) tr.classList.add('alert-ritardo');
        // Nascondi le righe oltre le prime ROWS_INITIAL
        if (index >= ROWS_INITIAL) tr.classList.add('row-hidden');

        const labelLocalita = currentTab === 'arrivi'
            ? I18n.t('general.departure')
            : I18n.t('station.destination');

        tr.innerHTML = `
            <td data-label="${I18n.t('station.train')}">${escapeHtml(String(numero))}</td>
            <td data-label="${labelLocalita}">${escapeHtml(localita)}</td>
            <td data-label="${I18n.t('station.scheduled_time')}">${formatTime(orarioTs)}</td>
            <td data-label="${I18n.t('station.delay')}" class="ritardo-cell ${getDelayClass(ritardo)}">${formatDelay(ritardo)}</td>
            <td data-label="${I18n.t('station.status')}">${escapeHtml(stato)}</td>
        `;

        // Click sulla riga -> vai al dettaglio treno
        const codOrigine = t.codOrigine || t.codiceStazioneOrigine || stationId;
        if (t.numeroTreno && codOrigine) {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => {
                const codTreno = String(t.numeroTreno);
                const dataPartenza = t.dataPartenzaTreno || t.millisDataPartenza
                    || (() => { const m = new Date(); m.setHours(0,0,0,0); return m.getTime(); })();
                const url = `treno.html?codTreno=${encodeURIComponent(codTreno)}`
                    + `&codPartenza=${encodeURIComponent(codOrigine)}`
                    + `&dataPartenza=${dataPartenza}`;
                window.location.href = url;
            });
        }

        tbody.appendChild(tr);
    });

    // Mostra il pulsante "Mostra di più" se ci sono righe nascoste
    if (lastTrains.length > ROWS_INITIAL && showMoreContainer && showMoreBtn) {
        showMoreContainer.style.display = 'block';
        // Rimuovi listener precedenti sostituendo il bottone con un clone
        const newBtn = showMoreBtn.cloneNode(true);
        showMoreContainer.replaceChild(newBtn, showMoreBtn);
        newBtn.addEventListener('click', () => {
            tbody.querySelectorAll('tr.row-hidden').forEach(r => r.classList.remove('row-hidden'));
            showMoreContainer.style.display = 'none';
        });
    }
}

function buildStato(t) {
    if (t.nonPartito) return 'Non partito';
    if (t.inStazione) return 'In stazione';
    if (t.provvedimento === 1) return 'Soppresso';
    if (t.provvedimento === 2) return 'Deviato';
    if (t.ritardo === 0) return I18n.t('general.on_time');
    return '';
}

function buildOrarioParam() {
    // viaggiatreno accetta la stringa Date().toString() in inglese.
    // Genero un formato equivalente ignorando la locale del browser.
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pad = n => String(n).padStart(2, '0');
    const tzOff = -d.getTimezoneOffset();
    const tzSign = tzOff >= 0 ? '+' : '-';
    const tzH = pad(Math.floor(Math.abs(tzOff) / 60));
    const tzM = pad(Math.abs(tzOff) % 60);
    return `${days[d.getDay()]} ${months[d.getMonth()]} ${pad(d.getDate())} ${d.getFullYear()}`
        + ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} GMT${tzSign}${tzH}${tzM}`;
}

function updateLastUpdate() {
    const el = document.getElementById('last-update-time');
    if (!el) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    el.textContent = `${I18n.t('station.last_update')} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
