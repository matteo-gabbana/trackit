/**
 * Gestisce la cronologia delle stazioni recenti in localStorage.
 */
export const Storage = {
    KEY: 'trackit_stazioni_recenti',
    MAX_ITEMS: 5,

    /**
     * Salva una stazione nella cronologia.
     * @param {{nome: string, id: string}} stazione - Oggetto stazione con nome e id.
     */
    salva(stazione) {
        let stazioni = this.leggi();

        // Rimuovi duplicati per id
        stazioni = stazioni.filter(s => s.id !== stazione.id);

        // Aggiungi la nuova stazione all'inizio
        stazioni.unshift(stazione);

        // Limita al numero massimo di elementi
        if (stazioni.length > this.MAX_ITEMS) {
            stazioni = stazioni.slice(0, this.MAX_ITEMS);
        }

        localStorage.setItem(this.KEY, JSON.stringify(stazioni));
    },

    /**
     * Legge la cronologia delle stazioni.
     * @returns {Array<{nome: string, id: string}>} Array di stazioni recenti.
     */
    leggi() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Cancella la cronologia delle stazioni.
     */
    cancella() {
        localStorage.removeItem(this.KEY);
    }
};
