import { API } from './api.js';
import { Autocomplete } from './autocomplete.js';
import { Storage } from './storage.js';
import { I18n } from './i18n.js';
import { showPopup } from './utils.js';
import { MapManager } from './map.js';

document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    setupLanguageToggle();
    initHamburgerMenu();
    initStationSearch();
    initTrainSearch();
    loadRecentStations(); // chiama loadRecentStationsMap() internamente
    startTrainCounterPolling();
});

function setupLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.textContent = I18n.getLang().toUpperCase();
        langToggle.addEventListener('click', async () => {
            const newLang = I18n.getLang() === 'it' ? 'en' : 'it';
            await I18n.setLang(newLang);
            langToggle.textContent = newLang.toUpperCase();
            // Ricarica le stazioni recenti per aggiornare i testi
            loadRecentStations();
            // Aggiorna il meteo se presente
            Meteo.load('meteo-container-home');
        });
    }
}

function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    if (hamburger && mainNav) {
        hamburger.addEventListener('click', () => {
            mainNav.classList.toggle('mobile-open');
        });
    }
}

function initStationSearch() {
    const stationSearchInput = document.getElementById('station-search-input');
    const stationAutocompleteList = document.getElementById('station-autocomplete-list');
    const stationSearchForm = document.getElementById('station-search-form');

    if (!stationSearchInput || !stationAutocompleteList || !stationSearchForm) return;

    let selectedStation = null;

    Autocomplete.init(stationSearchInput, stationAutocompleteList, (station) => {
        selectedStation = station;
        navigateToStation(station.id, station.nome);
    });

    stationSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = stationSearchInput.value.trim();
        if (!query) return;

        // Se l'utente aveva già selezionato dall'autocomplete, naviga direttamente
        if (selectedStation && selectedStation.nome === query) {
            navigateToStation(selectedStation.id, selectedStation.nome);
            return;
        }

        // Altrimenti chiama l'API e prende il primo risultato
        const submitBtn = stationSearchForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        try {
            const results = await API.autocompleta(query);
            if (results && results.length > 0) {
                navigateToStation(results[0].id, results[0].nome);
            } else {
                showPopup(I18n.t('general.no_station_found'), 'warning');
            }
        } catch (err) {
            console.error('Errore ricerca stazione:', err);
            showPopup(I18n.t('general.error'), 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

function initTrainSearch() {
    const trainNumberInput = document.getElementById('train-number-input');
    const trainSearchForm = document.getElementById('train-search-form');

    if (!trainNumberInput || !trainSearchForm) return;

    trainSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const trainNumber = trainNumberInput.value.trim();
        if (!trainNumber) return;

        const submitBtn = trainSearchForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const trainInfo = await API.cercaTreno(trainNumber);
            if (trainInfo && trainInfo.codStazione && trainInfo.codice) {
                const dataPartenza = trainInfo.dataPartenza;
                window.location.href = `treno.html?codTreno=${trainInfo.codice}&codPartenza=${trainInfo.codStazione}&dataPartenza=${dataPartenza}`;
            } else {
                showPopup('Treno non trovato.', 'warning');
            }
        } catch (error) {
            console.error('Errore ricerca treno:', error);
            showPopup(error.message || I18n.t('general.error'), 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

function loadRecentStations() {
    const recentStationsGrid = document.getElementById('recent-stations-grid');
    if (recentStationsGrid) {
        recentStationsGrid.innerHTML = '';
        const stations = Storage.leggi();
        if (stations.length > 0) {
            stations.forEach(station => {
                const chip = document.createElement('div');
                chip.classList.add('station-chip');
                chip.innerHTML = `
                    <span>${station.nome}</span>
                    <button class="remove-btn" data-id="${station.id}">&times;</button>
                `;
                chip.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('remove-btn')) {
                        navigateToStation(station.id, station.nome);
                    }
                });
                recentStationsGrid.appendChild(chip);
            });

            recentStationsGrid.querySelectorAll('.remove-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const idToRemove = e.target.dataset.id;
                    let currentStations = Storage.leggi();
                    currentStations = currentStations.filter(s => s.id !== idToRemove);
                    localStorage.setItem(Storage.KEY, JSON.stringify(currentStations));
                    loadRecentStations(); // Ricarica la lista
                });
            });
        }
    }
    // Aggiorna la mappa con le stazioni correnti
    loadRecentStationsMap();
}

function navigateToStation(id, nome) {
    Storage.salva({ id, nome });
    window.location.href = `stazione.html?id=${id}&nome=${encodeURIComponent(nome)}`;
}

// ── Mappa stazioni recenti ────────────────
// Cache coordinate per evitare chiamate API ripetute
const stationCoordsCache = new Map();
let recentMapInitialized = false;

async function loadRecentStationsMap() {
    // Inizializza la mappa una sola volta (Leaflet richiede il container visibile nel DOM)
    if (!recentMapInitialized) {
        MapManager.init('recent-stations-map');
        recentMapInitialized = true;
    }

    const stations = Storage.leggi();

    // Recupera coordinate per le stazioni non ancora in cache
    await Promise.all(stations.map(async (station) => {
        if (stationCoordsCache.has(station.id)) return;
        try {
            const details = await API.dettaglioStazione(station.id);
            if (details?.lat && details?.lon) {
                stationCoordsCache.set(station.id, { lat: details.lat, lon: details.lon });
            }
        } catch (e) {
            console.warn('Coordinate non disponibili per', station.nome);
        }
    }));

    // Pulisce e ridisegna tutti i marker
    MapManager.clearMarkers();
    let hasMarkers = false;
    stations.forEach(station => {
        const coords = stationCoordsCache.get(station.id);
        if (coords) {
            MapManager.addMarker(coords.lat, coords.lon, station.nome, 'verde');
            hasMarkers = true;
        }
    });

    if (hasMarkers) {
        // Adatta la vista per mostrare tutti i marker
        MapManager.fitMarkers(40);
    } else {
        // Nessuna stazione: vista default sull'Italia
        MapManager.map.setView([42.5, 12.5], 6);
    }
}

let animationFrameId = null;
let currentCount = 0;
let targetCount = 0;
const duration = 800; // ms
let startTime = null;

function animateCount(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = (timestamp - startTime) / duration;

    if (progress < 1) {
        const easedProgress = easeOutCubic(progress);
        currentCount = Math.round(currentCount + (targetCount - currentCount) * easedProgress);
        document.querySelector('.train-counter').textContent = currentCount.toLocaleString();
        animationFrameId = requestAnimationFrame(animateCount);
    } else {
        currentCount = targetCount;
        document.querySelector('.train-counter').textContent = currentCount.toLocaleString();
        animationFrameId = null;
        startTime = null;
    }
}

function easeOutCubic(t) {
    return (--t) * t * t + 1;
}

async function updateTrainCounter() {
    try {
        const stats = await API.statistiche();
        const count = stats?.treniCircolanti ?? stats?.numeroTreniCircolanti;
        if (stats && count !== undefined) {
            targetCount = count;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            startTime = null; // Reset start time for new animation
            currentCount = parseInt(document.querySelector('.train-counter').textContent.replace(/,/g, '')) || 0;
            animationFrameId = requestAnimationFrame(animateCount);
        }
    } catch (error) {
        console.error('Errore nel recupero statistiche treni:', error);
    }
}

function startTrainCounterPolling() {
    updateTrainCounter(); // Aggiorna subito al caricamento
    setInterval(updateTrainCounter, 30000); // Ogni 30 secondi
}

// Intersection Observer per scroll reveal (da mettere in global.js o qui)
const scrollRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1 // Trigger when 10% of the item is visible
});

document.querySelectorAll('[data-reveal]').forEach(el => {
    scrollRevealObserver.observe(el);
});
