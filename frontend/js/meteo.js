import { API } from './api.js';
import { I18n } from './i18n.js';

//**
// Gestisce il meteo
//  */

const TEMPO_LABELS = {
    1: 'Sereno',
    2: 'Poco nuvoloso',
    3: 'Nuvoloso',
    4: 'Coperto',
    101: 'Pioggia',
    102: 'Temporali',
    103: 'Neve',
    104: 'Nebbia',
};

export const Meteo = {
    /**
     * Carica il meteo per una specifica stazione e lo mostra nel contenitore.
     * @param {string} stationId   - Codice stazione (es. "S08409").
     * @param {string} containerId - ID del contenitore HTML.
     */
    async loadForStation(stationId, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !stationId) return;
        try {
            const meteoData = await API.meteo();
            const entry = meteoData?.[stationId];
            if (!entry) { container.innerHTML = ''; return; }
            const temp = entry.oggiTemperatura ?? '--';
            const desc = TEMPO_LABELS[entry.oggiTempo] || '';
            container.innerHTML = `
                <div class="meteo-station-widget">
                    <span class="meteo-temp">${temp}°C</span>
                    ${desc ? `<span class="meteo-desc">${escapeHtml(desc)}</span>` : ''}
                </div>`;
        } catch (e) {
            container.innerHTML = '';
        }
    },

    /**
     * Carica e renderizza il widget meteo in un contenitore specificato.
     * @param {string} containerId - L'ID dell'elemento HTML dove renderizzare il widget.
     */
    async load(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenitore meteo non trovato: ${containerId}`);
            return;
        }

        container.innerHTML = `<p>${I18n.t('general.loading')}</p>`;

        try {
            const meteoData = await API.meteo();
            const entries = extractEntries(meteoData);
            if (!entries.length) {
                container.innerHTML = `<p>${I18n.t('meteo.fallback')}</p>`;
                return;
            }

            // Mostra le prime 6 città come cards
            const html = entries.slice(0, 6).map(e => `
                <div class="meteo-card">
                    <h3>${escapeHtml(e.localita)}</h3>
                    <p class="meteo-temp">${e.temperatura}°C</p>
                    <p class="meteo-desc">${escapeHtml(e.descrizione)}</p>
                </div>
            `).join('');
            container.innerHTML = `<div class="meteo-widget">${html}</div>`;
        } catch (error) {
            console.error('Errore nel caricamento meteo:', error);
            container.innerHTML = `<p>${I18n.t('meteo.fallback')}</p>`;
        }
    }
};

function extractEntries(data) {
    if (!data || typeof data !== 'object') return [];
    // L'API restituisce un oggetto: { "Sxxxxx": {...}, ... }
    return Object.values(data)
        .filter(v => v && typeof v === 'object')
        .map(v => ({
            localita: v.localita || v.nomeStazione || v.codStazione || '',
            temperatura: v.oggiTemperatura ?? v.temperatura ?? '--',
            descrizione: TEMPO_LABELS[v.oggiTempo] || TEMPO_LABELS[v.oggiTempoMattino] || '',
        }))
        .filter(e => e.localita);
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
