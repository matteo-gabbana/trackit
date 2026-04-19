import { API } from './api.js';
import { debounce } from './utils.js';
import { I18n } from './i18n.js';

export const Autocomplete = {
    /**
     * Inizializza la funzionalità di autocompletamento.
     * @param {HTMLInputElement} inputEl - L'elemento input su cui applicare l'autocomplete.
     * @param {HTMLElement} listEl - L'elemento UL/DIV dove renderizzare i risultati.
     * @param {Function} onSelect - Callback da eseguire quando un elemento viene selezionato.
     */
    init(inputEl, listEl, onSelect) {
        let currentResults = [];
        let selectedIndex = -1;

        const fetchData = async (query) => {
            if (query.length < 2) {
                listEl.innerHTML = '';
                listEl.style.display = 'none';
                return;
            }
            try {
                const results = await API.autocompleta(query);
                currentResults = results;
                renderResults(results);
            } catch (error) {
                console.error('Errore autocomplete:', error);
                listEl.innerHTML = `<li class="no-results">${I18n.t('general.error')}</li>`;
                listEl.style.display = 'block';
            }
        };

        const debouncedFetchData = debounce(fetchData, 300);

        const renderResults = (results) => {
            listEl.innerHTML = '';
            if (results.length === 0) {
                listEl.innerHTML = `<li class="no-results">${I18n.t('general.no_station_found')}</li>`;
                listEl.style.display = 'block';
                return;
            }

            results.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = item.nome;
                li.dataset.id = item.id;
                li.dataset.nome = item.nome;
                li.addEventListener('click', () => {
                    selectItem(index);
                });
                listEl.appendChild(li);
            });
            listEl.style.display = 'block';
            selectedIndex = -1; // Reset selection
        };

        const selectItem = (index) => {
            if (index >= 0 && index < currentResults.length) {
                const selected = currentResults[index];
                inputEl.value = selected.nome;
                onSelect(selected);
                listEl.innerHTML = '';
                listEl.style.display = 'none';
            }
        };

        const navigateResults = (direction) => {
            if (listEl.style.display === 'none' || currentResults.length === 0) return;

            const items = listEl.querySelectorAll('li:not(.no-results)');
            if (items.length === 0) return;

            if (selectedIndex !== -1) {
                items[selectedIndex].classList.remove('active');
            }

            selectedIndex += direction;

            if (selectedIndex < 0) {
                selectedIndex = items.length - 1;
            } else if (selectedIndex >= items.length) {
                selectedIndex = 0;
            }

            items[selectedIndex].classList.add('active');
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        };

        inputEl.addEventListener('input', (e) => {
            debouncedFetchData(e.target.value);
        });

        inputEl.addEventListener('keydown', (e) => {
            if (listEl.style.display === 'block') {
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        navigateResults(-1);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        navigateResults(1);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (selectedIndex !== -1) {
                            selectItem(selectedIndex);
                        } else if (currentResults.length > 0) {
                            // Se Enter premuto senza selezione, seleziona il primo risultato
                            selectItem(0);
                        }
                        break;
                    case 'Escape':
                        listEl.innerHTML = '';
                        listEl.style.display = 'none';
                        selectedIndex = -1;
                        break;
                }
            }
        });

        // Chiudi l'autocomplete se si clicca fuori
        document.addEventListener('click', (e) => {
            if (!inputEl.contains(e.target) && !listEl.contains(e.target)) {
                listEl.innerHTML = '';
                listEl.style.display = 'none';
            }
        });
    }
};
