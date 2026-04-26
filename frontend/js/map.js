/**
 * Gestisce l'interazione con la mappa Leaflet.
 */
export const MapManager = {
    map: null,
    markers: null,
    polyline: null,

    /**
     * Inizializza la mappa Leaflet.
     * @param {string} containerId - ID dell'elemento HTML che conterrà la mappa.
     */
    init(containerId) {
        if (this.map) return;

        this.markers = L.featureGroup();

        this.map = L.map(containerId).setView([42.5, 12.5], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(this.map);

        this.markers.addTo(this.map);
    },

    /**
     * Aggiunge un marker colorato alla mappa.
     * @param {number} lat
     * @param {number} lng
     * @param {string} label  - testo popup
     * @param {'verde'|'rosso'|'blu'|'stazione'|'treno'} tipo
     */
    addMarker(lat, lng, label, tipo = 'stazione') {
        if (!this.map || !this.markers) return null;

        const icon = L.divIcon({
            className: '',          // nessuna classe Leaflet di default
            html: `<div class="marker-${tipo}"></div>`,
            iconSize:    [32, 32],
            iconAnchor:  [16, 32],
            popupAnchor: [0, -34],
        });

        const marker = L.marker([lat, lng], { icon }).bindPopup(label);
        this.markers.addLayer(marker);
        return marker;
    },

    /** Rimuove tutti i marker. */
    clearMarkers() {
        if (this.markers) this.markers.clearLayers();
    },

    /** Centra la mappa su lat/lng con lo zoom dato. */
    centerOn(lat, lng, zoom = 13) {
        if (this.map) this.map.setView([lat, lng], zoom);
    },

    /**
     * Adatta la vista per mostrare tutti i marker aggiunti.
     * @param {number} [padding=60]
     */
    fitMarkers(padding = 60) {
        if (!this.map || !this.markers) return;
        const bounds = this.markers.getBounds();
        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 12 });
        }
    },

    /**
     * Disegna una polyline tra le coordinate delle fermate.
     * @param {Array<{lat: number, lng: number}>} fermate
     */
    // addPercorso(fermate) {
    //     if (!this.map) return;
    //     if (this.polyline) {
    //         this.map.removeLayer(this.polyline);
    //         this.polyline = null;
    //     }
    //     if (fermate && fermate.length > 1) {
    //         const latlngs = fermate.map(f => [f.lat, f.lng]);
    //         this.polyline = L.polyline(latlngs, {
    //             color: '#2C3E50', weight: 4, opacity: 0.7,
    //         }).addTo(this.map);
    //         this.map.fitBounds(this.polyline.getBounds(), { padding: [40, 40] });
    //     }
    // },
};
