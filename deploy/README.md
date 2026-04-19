# TrackIT

Applicazione web per il tracciamento in tempo reale dei treni italiani, basata sulle API pubbliche di Trenitalia.

## Requisiti

- **PHP 7.4+** con estensione cURL abilitata
- Un server web locale che supporti PHP: [XAMPP](https://www.apachefriends.org/), [WAMP](https://www.wampserver.com/), Laragon, o qualsiasi altro
- Nessun database richiesto — l'app usa solo le API esterne di Trenitalia

## Installazione con XAMPP (consigliato)

1. **Clona il repository** nella cartella `htdocs` di XAMPP:

   ```bash
   cd C:/xampp/htdocs
   git clone https://github.com/matteo-gabbana/trackit.git
   ```

2. **Avvia XAMPP** e attiva il modulo **Apache**.

3. **Apri il browser** e vai su:

   ```
   http://localhost/trackit/frontend/
   ```

Il backend PHP viene chiamato automaticamente dal frontend tramite richieste API verso `http://localhost/trackit/backend/`.

## Installazione con server PHP built-in

In alternativa, puoi usare direttamente il server integrato di PHP senza XAMPP:

1. **Clona il repository** dove preferisci:

   ```bash
   git clone https://github.com/matteo-gabbana/trackit.git
   cd trackit-finto
   ```

2. **Avvia il backend** PHP dalla cartella `backend/`:

   ```bash
   cd backend
   php -S localhost:8000
   ```

3. **Apri `frontend/index.html`** nel browser.

   > Nota: con il server built-in di PHP potrebbe essere necessario aggiornare l'URL base delle API in `frontend/js/api.js` affinché punti a `http://localhost:8000`.

## Struttura del progetto

```
trackit-finto/
├── backend/
│   ├── index.php          # Entry point API (router)
│   ├── config/
│   │   └── config.php     # Configurazione (URL Trenitalia, timeout cURL)
│   ├── controllers/       # Controller per ogni risorsa
│   ├── services/          # TrenitaliaService (wrapper cURL)
│   └── helpers/           # Response, Validator
└── frontend/
    ├── index.html          # Homepage
    ├── treno.html          # Dettaglio treno
    ├── stazione.html       # Dettaglio stazione
    ├── news.html           # Notizie
    ├── css/                # Fogli di stile modulari
    └── js/                 # Moduli JavaScript
```

## Note

- **Nessuna dipendenza esterna**: non è richiesto `npm install` né `composer install`.
- L'app si appoggia alle API pubbliche di Trenitalia; la disponibilità dei dati dipende da esse.
- La funzionalità meteo utilizza anch'essa un'API esterna.
