// Risolvo l'URL del backend in modo relativo alla pagina, così funziona sia
// servendo la root che una sottocartella (es. http://localhost/trackit/frontend/).
const API_BASE = new URL('../backend/index.php', window.location.href).pathname;

/**
 * Effettua una chiamata API al backend.
 * @param {string} route - La rotta API da chiamare (es. 'stazione/autocompleta').
 * @param {Object} params - Oggetto di parametri da aggiungere alla query string.
 * @returns {Promise<Object>} - La risposta JSON dell'API.
 * @throws {Error} Se la chiamata API fallisce.
 */
async function apiFetch(route, params = {}) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('route', route);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
            url.searchParams.append(k, v);
        }
    });

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: `Errore HTTP: ${res.status}` }));
            throw new Error(`Errore API: ${errorData.error || res.statusText}`);
        }
        return res.json();
    } catch (error) {
        console.error("Errore in apiFetch:", error);
        throw error; // Rilancia l'errore per essere gestito a monte
    }
}

// Esporta funzioni specifiche per ogni endpoint
export const API = {
    /**
     * Autocompleta il nome di una stazione.
     * @param {string} q - Stringa di ricerca.
     * @returns {Promise<Array<{nome: string, id: string}>>}
     */
    autocompleta: (q) => apiFetch('stazione/autocompleta', { q }),

    /**
     * Recupera le partenze da una stazione.
     * @param {string} id - Codice della stazione.
     * @param {string} [orario] - Orario in formato DD/MM/YYYY HH:mm (opzionale, default ora corrente).
     * @returns {Promise<Object>}
     */
    dettaglioStazione: (id) => apiFetch('stazione/dettaglio', { id }),

    partenze: (id, orario) => apiFetch('stazione/partenze', { id, orario }),

    /**
     * Recupera gli arrivi a una stazione.
     * @param {string} id - Codice della stazione.
     * @param {string} [orario] - Orario in formato DD/MM/YYYY HH:mm (opzionale, default ora corrente).
     * @returns {Promise<Object>}
     */
    arrivi: (id, orario) => apiFetch('stazione/arrivi', { id, orario }),

    /**
     * Cerca un treno per numero.
     * @param {string} numero - Numero del treno.
     * @returns {Promise<{codice: string, stazione: string, codStazione: string}>}
     */
    cercaTreno: (numero) => apiFetch('treno/cerca', { numero }),

    /**
     * Recupera l'andamento di un treno.
     * @param {string} codPartenza - Codice della stazione di partenza.
     * @param {string} codTreno - Codice del treno.
     * @param {string} dataPartenza - Timestamp Unix in ms della mezzanotte del giorno di partenza.
     * @returns {Promise<Object>}
     */
    andamento: (codPartenza, codTreno, dataPartenza) =>
        apiFetch('treno/andamento', { codPartenza, codTreno, dataPartenza }),

    /**
     * Recupera le tratte (fermate) di un treno.
     * @param {string} codPartenza - Codice della stazione di partenza.
     * @param {string} codTreno - Codice del treno.
     * @param {string} dataPartenza - Timestamp Unix in ms della mezzanotte del giorno di partenza.
     * @returns {Promise<Object>}
     */
    tratte: (codPartenza, codTreno, dataPartenza) =>
        apiFetch('treno/tratte', { codPartenza, codTreno, dataPartenza }),

    /**
     * Recupera le news.
     * @param {string} [lang='it'] - Lingua (it o en).
     * @returns {Promise<Object>}
     */
    news: (lang = 'it') => apiFetch('news', { lang }),

    /**
     * Recupera i dati meteo.
     * @returns {Promise<Object>}
     */
    meteo: () => apiFetch('meteo'),

    /**
     * Recupera le statistiche sui treni circolanti.
     * @returns {Promise<Object>}
     */
    statistiche: () => apiFetch('statistiche'),

    /**
     * Recupera le stringhe di lingua.
     * @param {string} [lang='it'] - Lingua (it o en).
     * @returns {Promise<Object>}
     */
    lingua: (lang = 'it') => apiFetch('lingua', { lang }),
};
