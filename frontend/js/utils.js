/**
 * Converte un timestamp in millisecondi in una stringa HH:mm.
 * @param {number|null} timestamp - Timestamp Unix in millisecondi.
 * @returns {string} Orario formattato o '--:--' se non valido.
 */
export function formatTime(timestamp) {
    if (!timestamp || timestamp === 0) return '--:--';
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Restituisce una stringa descrittiva per il ritardo.
 * @param {number} minuti - Minuti di ritardo.
 * @returns {string} Stringa formattata (es. "+5 min", "In orario").
 */
export function formatDelay(minuti) {
    if (minuti === 0) return 'In orario';
    if (minuti > 0) return `+${minuti} min`;
    return `${minuti} min`; // Ritardo negativo (anticipo)
}

/**
 * Restituisce la classe CSS appropriata in base ai minuti di ritardo.
 * @param {number} minuti - Minuti di ritardo.
 * @returns {string} Classe CSS ('on-time', 'delay-low', 'delay-medium', 'delay-high').
 */
export function getDelayClass(minuti) {
    if (minuti <= 0) return 'on-time';
    if (minuti <= 5) return 'delay-low';
    if (minuti <= 15) return 'delay-medium';
    return 'delay-high';
}

/**
 * Formatta un timestamp in una stringa DD/MM/YYYY.
 * @param {number} timestamp - Timestamp Unix in millisecondi.
 * @returns {string} Data formattata.
 */
export function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Restituisce il timestamp Unix in millisecondi della mezzanotte di oggi.
 * @returns {number} Timestamp della mezzanotte.
 */
export function todayTimestamp() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
}

/**
 * Mostra un popup modale al centro dello schermo.
 * @param {string} message - Il testo da mostrare.
 * @param {'error'|'warning'|'info'} [type='error']
 */
export function showPopup(message, type = 'error') {
    const existing = document.getElementById('trackit-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'trackit-popup';
    overlay.className = 'popup-overlay';

    const icons = { error: '✕', warning: '⚠', info: 'ℹ' };
    overlay.innerHTML = `
        <div class="popup-box popup-${type}" role="alertdialog" aria-modal="true">
            <span class="popup-icon">${icons[type] ?? icons.info}</span>
            <p class="popup-message">${escapeHtmlPopup(message)}</p>
            <button class="popup-close btn btn-primary">OK</button>
        </div>
    `;

    const close = () => overlay.remove();
    overlay.querySelector('.popup-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    document.body.appendChild(overlay);
}

function escapeHtmlPopup(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
}

/**
 * Crea una funzione debounced che ritarda l'esecuzione della funzione fornita.
 * @param {Function} fn - La funzione da eseguire.
 * @param {number} delay - Il ritardo in millisecondi.
 * @returns {Function} La funzione debounced.
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}
