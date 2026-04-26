import { API } from './api.js';

/**
 * Gestisce le traduzioni dell'interfaccia utente.
 */
export const I18n = {
    translations: {
        it: {
            'nav.home': 'Home',
            'nav.news': 'News',
            'footer.credit': 'TrackIT — Dati da Trenitalia/Viaggiatreno',
            'search.station_placeholder': 'Cerca stazione...', 
            'search.train_placeholder': 'Numero treno...', 
            'search.button_station': 'Cerca Stazione',
            'search.button_train': 'Cerca Treno',
            'home.trains_in_circulation': 'treni in circolazione ora',
            'home.recent_stations': 'Stazioni recenti',
            'home.meteo_title': 'Meteo Italia',
            'station.departures': 'Partenze',
            'station.arrivals': 'Arrivi',
            'station.last_update': 'Ultimo aggiornamento:',
            'station.train': 'Treno',
            'station.destination': 'Destinazione',
            'station.origin': 'Provenienza',
            'station.scheduled_time': 'Orario Previsto',
            'station.delay': 'Ritardo',
            'station.status': 'Stato',
            'station.no_results': 'Nessun risultato trovato.',
            'station.alert_threshold': 'Avvisa se ritardo >',
            'station.min': 'min',
            'news.title': 'Ultime Notizie',
            'news.no_news': 'Nessuna notizia disponibile al momento.',
            'general.loading': 'Caricamento...', 
            'general.error': 'Si è verificato un errore.',
            'general.no_station_found': 'Nessuna stazione trovata',
            'general.on_time': 'In orario',
            'general.train_number': 'Treno',
            'general.origin': 'Origine',
            'general.destination': 'Destinazione',
            'general.current_delay': 'Ritardo attuale',
            'general.stops': 'Fermate',
            'general.arrival': 'Arrivo',
            'general.departure': 'Partenza',
            'general.passed': 'Passata',
            'general.current': 'Attuale',
            'general.future': 'Futura',
            'general.link': 'Leggi di più',
            'general.refresh': 'Aggiorna',
            'meteo.fallback': 'Dati meteo non disponibili.',
        },
        en: {
            'nav.home': 'Home',
            'nav.news': 'News',
            'footer.credit': 'TrackIT — Data from Trenitalia/Viaggiatreno',
            'search.station_placeholder': 'Search station...', 
            'search.train_placeholder': 'Train number...', 
            'search.button_station': 'Search Station',
            'search.button_train': 'Search Train',
            'home.trains_in_circulation': 'trains in circulation now',
            'home.recent_stations': 'Recent stations',
            'home.meteo_title': 'Italy Weather',
            'station.departures': 'Departures',
            'station.arrivals': 'Arrivals',
            'station.last_update': 'Last update:',
            'station.train': 'Train',
            'station.destination': 'Destination',
            'station.origin': 'Origin',
            'station.scheduled_time': 'Scheduled Time',
            'station.delay': 'Delay',
            'station.status': 'Status',
            'station.no_results': 'No results found.',
            'station.alert_threshold': 'Alert if delay >',
            'station.min': 'min',
            'news.title': 'Latest News',
            'news.no_news': 'No news available at the moment.',
            'general.loading': 'Loading...', 
            'general.error': 'An error occurred.',
            'general.no_station_found': 'No station found',
            'general.on_time': 'On time',
            'general.train_number': 'Train',
            'general.origin': 'Origin',
            'general.destination': 'Destination',
            'general.current_delay': 'Current delay',
            'general.stops': 'Stops',
            'general.arrival': 'Arrival',
            'general.departure': 'Departure',
            'general.passed': 'Passed',
            'general.current': 'Current',
            'general.future': 'Future',
            'general.link': 'Read more',
            'general.refresh': 'Refresh',
            'meteo.fallback': 'Weather data not available.',
        },
    },
    currentLang: 'it',
    LANG_KEY: 'trackit_lang',

    /**
     * Imposta la lingua corrente e aggiorna l'interfaccia.
     * @param {string} lang - La lingua da impostare ('it' o 'en').
     */
    async setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem(this.LANG_KEY, lang);
        document.documentElement.lang = lang; // Aggiorna l'attributo lang dell'HTML
        this.applyTranslations();

        // Carica stringhe da Trenitalia come fallback/integrazione
        try {
            const apiTranslations = await API.lingua(lang);
            console.log('Traduzioni API Trenitalia:', apiTranslations);
        } catch (error) {
            console.error('Errore nel caricamento delle traduzioni API:', error);
        }
    },

    /**
     * Restituisce la lingua corrente, leggendola da localStorage o usando il default.
     * @returns {string} La lingua corrente.
     */
    getLang() {
        return localStorage.getItem(this.LANG_KEY) || 'it';
    },

    /**
     * Restituisce la stringa tradotta per la chiave data.
     * @param {string} key - La chiave della stringa da tradurre.
     * @returns {string} La stringa tradotta o la chiave stessa se non trovata.
     */
    t(key) {
        return this.translations[this.currentLang][key] || key;
    },

    /**
     * Applica le traduzioni a tutti gli elementi con attributo data-i18n.
     */
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.textContent = this.t(key);
            }
        });
    },

    /**
     * Inizializza il modulo di internazionalizzazione.
     */
    init() {
        this.setLang(this.getLang()); // Imposta la lingua iniziale e applica le traduzioni
    }
};
