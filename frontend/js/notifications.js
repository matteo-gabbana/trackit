export const Notifications = {
    THRESHOLD_KEY: 'trackit_soglia',
    DEFAULT_THRESHOLD: 5,

    init() {
        // Inizializza la soglia di ritardo leggendola da localStorage
        this.setSoglia(this.getSoglia());
    },

    /**
     * Imposta e salva la soglia di ritardo in localStorage.
     * @param {number} minuti - La soglia di ritardo in minuti.
     */
    setSoglia(minuti) {
        const threshold = parseInt(minuti, 10);
        if (!isNaN(threshold) && threshold >= 0) {
            localStorage.setItem(this.THRESHOLD_KEY, threshold.toString());
        } else {
            localStorage.setItem(this.THRESHOLD_KEY, this.DEFAULT_THRESHOLD.toString());
        }
    },

    /**
     * Restituisce la soglia di ritardo corrente da localStorage.
     * @returns {number} La soglia di ritardo in minuti.
     */
    getSoglia() {
        const stored = localStorage.getItem(this.THRESHOLD_KEY);
        return stored ? parseInt(stored, 10) : this.DEFAULT_THRESHOLD;
    },

    /**
     * Controlla i treni per ritardi superiori alla soglia e applica classi CSS.
     * @param {Array<Object>} treni - Array di oggetti treno con proprietà 'ritardo'.
     * @param {HTMLElement} containerEl - L'elemento contenitore delle righe dei treni.
     */
    check(treni, containerEl) {
        const soglia = this.getSoglia();
        if (!containerEl) return;

        treni.forEach(treno => {
            const row = containerEl.querySelector(`[data-treno-id="${treno.id}"]`); // Assumi che ogni riga abbia un data-treno-id
            if (row) {
                if (treno.ritardo > soglia) {
                    row.classList.add('alert-ritardo');
                    // Aggiungi un badge rosso con i minuti di ritardo
                    let badge = row.querySelector('.badge-ritardo-alert');
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.classList.add('badge', 'delay-high', 'badge-ritardo-alert');
                        row.querySelector('.ritardo-cell').appendChild(badge); // Assumi una cella per il ritardo
                    }
                    badge.textContent = `+${treno.ritardo} min`;
                } else {
                    row.classList.remove('alert-ritardo');
                    const badge = row.querySelector('.badge-ritardo-alert');
                    if (badge) badge.remove();
                }
            }
        });
    },

    /**
     * Mostra un messaggio toast in sovrimpressione.
     * @param {string} messaggio - Il messaggio da mostrare.
     */
    // showToast(messaggio) {
    //     let toastEl = document.querySelector('.toast');
    //     if (!toastEl) {
    //         toastEl = document.createElement('div');
    //         toastEl.classList.add('toast');
    //         document.body.appendChild(toastEl);
    //     }

    //     toastEl.textContent = messaggio;
    //     toastEl.classList.add('show');

    //     setTimeout(() => {
    //         toastEl.classList.remove('show');
    //     }, 4000);
    // }
};
