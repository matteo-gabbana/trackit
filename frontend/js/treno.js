import { API } from './api.js';
import { I18n } from './i18n.js';
import { MapManager } from './map.js';
import { formatTime, formatDelay, getDelayClass } from './utils.js';

const qs = new URLSearchParams(window.location.search);
const codTreno = qs.get('codTreno');
const codPartenza = qs.get('codPartenza');
const dataPartenza = qs.get('dataPartenza');

let refreshTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    setupLanguageToggle();
    initHamburgerMenu();

    if (!codTreno || !codPartenza || !dataPartenza) {
        document.querySelector('.train-detail-layout').innerHTML =
            `<p>${I18n.t('general.error')}: parametri treno mancanti.</p>`;
        return;
    }

    document.getElementById('train-number').textContent = codTreno;

    const refreshBtn = document.getElementById('refresh-button');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndamento);

    try { MapManager.init('train-map'); } catch (e) { console.error('Mappa:', e); }

    loadAndamento();
    refreshTimer = setInterval(loadAndamento, 60_000);
});

function setupLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    if (!langToggle) return;
    langToggle.textContent = I18n.getLang().toUpperCase();
    langToggle.addEventListener('click', async () => {
        const newLang = I18n.getLang() === 'it' ? 'en' : 'it';
        await I18n.setLang(newLang);
        langToggle.textContent = newLang.toUpperCase();
        loadAndamento();
    });
}

function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    if (hamburger && mainNav) {
        hamburger.addEventListener('click', () => mainNav.classList.toggle('mobile-open'));
    }
}

async function loadAndamento() {
    const loader = document.getElementById('loader-timeline');
    const timeline = document.getElementById('train-timeline');
    if (loader) loader.style.display = 'block';
    if (timeline) timeline.innerHTML = '';

    try {
        const data = await API.andamento(codPartenza, codTreno, dataPartenza);
        renderHeader(data);
        renderTimeline(data);
        await renderMapMarkers(data);
        updateLastUpdate();
    } catch (err) {
        console.error('Errore andamento treno:', err);
        if (timeline) timeline.innerHTML = `<p>${I18n.t('general.error')}</p>`;
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function renderHeader(data) {
    if (!data) return;
    const origine = data.origine || data.origineEstera || '';
    const destinazione = data.destinazione || data.destinazioneEstera || '';
    const ritardo = Number.isFinite(data.ritardo) ? data.ritardo : 0;

    setText('train-origin-name', origine);
    setText('train-destination-name', destinazione);

    const delayEl = document.getElementById('current-delay-value');
    if (delayEl) {
        delayEl.textContent = formatDelay(ritardo);
        delayEl.className = getDelayClass(ritardo);
    }
}

function renderTimeline(data) {
    const timeline = document.getElementById('train-timeline');
    if (!timeline) return;

    const fermate = (data && Array.isArray(data.fermate)) ? data.fermate : [];
    if (!fermate.length) {
        timeline.innerHTML = `<p>${I18n.t('station.no_results')}</p>`;
        return;
    }

    timeline.innerHTML = '';
    fermate.forEach(f => {
        const stato = fermataStato(f);
        const orarioArrivoProg = f.arrivo_teorico || f.programmata || null;
        const orarioArrivoReale = f.arrivoReale || null;
        const orarioPartenzaProg = f.partenza_teorica || null;
        const orarioPartenzaReale = f.partenzaReale || null;
        const ritardo = Number.isFinite(f.ritardo) ? f.ritardo : 0;

        const item = document.createElement('div');
        item.classList.add('timeline-item', `timeline-${stato}`);
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <h3>${escapeHtml(f.stazione || '')}</h3>
                <div class="timeline-times">
                    <span><strong>${I18n.t('general.arrival')}:</strong> ${formatTime(orarioArrivoProg)}${orarioArrivoReale ? ` → ${formatTime(orarioArrivoReale)}` : ''}</span>
                    <span><strong>${I18n.t('general.departure')}:</strong> ${formatTime(orarioPartenzaProg)}${orarioPartenzaReale ? ` → ${formatTime(orarioPartenzaReale)}` : ''}</span>
                </div>
                <span class="badge ${getDelayClass(ritardo)}">${formatDelay(ritardo)}</span>
            </div>
        `;

        // Click sulla fermata → pagina stazione
        if (f.id && f.stazione) {
            item.style.cursor = 'pointer';
            item.title = `Vai a ${f.stazione}`;
            item.addEventListener('click', () => {
                window.location.href =
                    `stazione.html?id=${encodeURIComponent(f.id)}&nome=${encodeURIComponent(f.stazione)}`;
            });
        }

        timeline.appendChild(item);
    });
}

function fermataStato(f) {
    // actualFermataType: 0 non ancora, 1 passata, 2 prossima / in corso
    if (f.actualFermataType === 1) return 'passed';
    if (f.actualFermataType === 2 || f.actualFermataType === 3) return 'current';
    return 'future';
}

async function renderMapMarkers(data) {
    if (!MapManager.map) return;
    MapManager.clearMarkers();

    const idOrigine     = data?.idOrigine;
    const idDestinazione = data?.idDestinazione;
    const nomeOrigine   = data?.origine     || idOrigine     || '';
    const nomeDest      = data?.destinazione || idDestinazione || '';

    // Recupera le coordinate di partenza e arrivo in parallelo
    const [origResult, destResult] = await Promise.allSettled([
        idOrigine      ? API.dettaglioStazione(idOrigine)      : Promise.resolve(null),
        idDestinazione ? API.dettaglioStazione(idDestinazione) : Promise.resolve(null),
    ]);

    const orig = origResult.status === 'fulfilled' ? origResult.value : null;
    const dest = destResult.status === 'fulfilled' ? destResult.value : null;

    if (orig?.lat && orig?.lon) {
        MapManager.addMarker(orig.lat, orig.lon, nomeOrigine, 'rosso');
    }
    if (dest?.lat && dest?.lon) {
        MapManager.addMarker(dest.lat, dest.lon, nomeDest, 'blu');
    }

    // Adatta la vista per mostrare entrambi i marker (o centra su uno solo)
    const hasOrig = !!(orig?.lat && orig?.lon);
    const hasDest = !!(dest?.lat && dest?.lon);
    if (hasOrig && hasDest) {
        MapManager.fitMarkers();
    } else if (hasOrig) {
        MapManager.centerOn(orig.lat, orig.lon, 8);
    } else if (hasDest) {
        MapManager.centerOn(dest.lat, dest.lon, 8);
    }
}

function updateLastUpdate() {
    const el = document.getElementById('last-update-time');
    if (!el) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    el.textContent = `${I18n.t('station.last_update')} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
