# TrackIT — Documentazione Tecnica

## Indice

1. [Panoramica del progetto](#1-panoramica-del-progetto)
2. [Architettura generale](#2-architettura-generale)
3. [Backend — struttura e funzionamento](#3-backend--struttura-e-funzionamento)
   - [Configurazione](#31-configurazione)
   - [Router e entry point](#32-router-e-entry-point)
   - [Controllers](#33-controllers)
   - [Services](#34-services)
   - [Helpers](#35-helpers)
4. [Frontend — struttura e funzionamento](#4-frontend--struttura-e-funzionamento)
   - [Pagine HTML](#41-pagine-html)
   - [Moduli JavaScript](#42-moduli-javascript)
   - [CSS](#43-css)
5. [Flussi dati principali](#5-flussi-dati-principali)
6. [Funzionalità implementate](#6-funzionalità-implementate)
7. [API Endpoints — riferimento completo](#7-api-endpoints--riferimento-completo)
8. [Note implementative e limitazioni note](#8-note-implementative-e-limitazioni-note)
9. [Test effettuati](#9-test-effettuati)

---

## 1. Panoramica del progetto

**TrackIT** è un'applicazione web per il monitoraggio in tempo reale dei treni italiani. Si appoggia alle API pubbliche di Trenitalia (esposte dal portale Viaggiatreno) e a Google News RSS per l'aggregazione di notizie ferroviarie.

**Stack tecnologico:**
- **Backend:** PHP vanilla (nessun framework), architettura REST
- **Frontend:** HTML5, CSS3, JavaScript ES6+ (nessun framework)
- **Mappa:** Leaflet.js 1.9.4 (CDN)
- **Font:** Google Fonts — Montserrat, Inter, Poppins (CDN)
- **Tiles mappa:** OpenStreetMap

**Non è richiesto alcun database.** L'applicazione è completamente stateless lato server: tutti i dati provengono da API esterne.

---

## 2. Architettura generale

```
trackit/
├── backend/
│   ├── index.php                  # Entry point unico (router)
│   ├── config/
│   │   └── config.php             # Costanti globali (URL base, timeout cURL)
│   ├── routes/
│   │   └── routes.php             # Tabella di routing [route → controller::metodo]
│   ├── controllers/
│   │   ├── StazioneController.php
│   │   ├── TrenoController.php
│   │   ├── NewsController.php
│   │   ├── MeteoController.php
│   │   ├── StatisticheController.php
│   │   └── LinguaController.php
│   ├── services/
│   │   └── TrenitaliaService.php  # Wrapper cURL per le chiamate esterne
│   └── helpers/
│       ├── Response.php           # Formattazione risposte JSON
│       └── Validator.php          # Sanitizzazione e validazione input
└── frontend/
    ├── index.html                 # Homepage
    ├── stazione.html              # Dettaglio stazione
    ├── treno.html                 # Dettaglio treno
    ├── news.html                  # Notizie
    ├── css/
    │   ├── reset.css
    │   ├── variables.css
    │   ├── global.css
    │   ├── components.css
    │   ├── index.css
    │   ├── stazione.css
    │   ├── treno.css
    │   ├── news.css
    │   └── map.css
    └── js/
        ├── api.js
        ├── autocomplete.js
        ├── i18n.js
        ├── index.js
        ├── map.js
        ├── meteo.js
        ├── news.js
        ├── notifications.js
        ├── stazione.js
        ├── storage.js
        ├── theme.js
        ├── treno.js
        └── utils.js
```

Il backend espone un unico entry point (`backend/index.php`) che fa da router: legge il parametro `route` dalla query string e delega l'esecuzione al metodo statico del controller corrispondente. Il frontend comunica con il backend tramite `fetch()` e costruisce l'URL usando `window.location.origin`, rendendo l'applicazione portabile su qualsiasi host.

---

## 3. Backend — struttura e funzionamento

### 3.1 Configurazione

**`backend/config/config.php`**

Definisce tre costanti globali:

| Costante | Valore | Descrizione |
|---|---|---|
| `TRENITALIA_BASE` | `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno` | URL base API Trenitalia |
| `CURL_TIMEOUT` | `10` | Timeout cURL in secondi |
| `CURL_USERAGENT` | `Mozilla/5.0 (compatible; TrackIT/1.0)` | User-agent per le richieste HTTP |

### 3.2 Router e entry point

**`backend/index.php`**

- Imposta gli header CORS (`Access-Control-Allow-Origin: *`) per consentire le chiamate cross-origin dal frontend
- Carica tutte le classi controller e il file di configurazione
- Legge il parametro `route` dalla query string
- Cerca la route nella tabella definita in `routes.php`
- Esegue il metodo statico corrispondente con `call_user_func()`
- Gestisce le eccezioni non catturate restituendo un JSON di errore con status 500

**`backend/routes/routes.php`**

| Route | Controller | Metodo |
|---|---|---|
| `stazione/autocompleta` | StazioneController | autocompleta |
| `stazione/dettaglio` | StazioneController | dettaglio |
| `stazione/partenze` | StazioneController | partenze |
| `stazione/arrivi` | StazioneController | arrivi |
| `treno/cerca` | TrenoController | cercaNumero |
| `treno/andamento` | TrenoController | andamento |
| `treno/tratte` | TrenoController | tratte |
| `news` | NewsController | get |
| `meteo` | MeteoController | get |
| `statistiche` | StatisticheController | get |
| `lingua` | LinguaController | get |

### 3.3 Controllers

#### StazioneController

Gestisce tutte le operazioni relative alle stazioni.

---

**`autocompleta()`** — Autocompletamento nome stazione

- **Parametri GET:** `q` (stringa di ricerca, obbligatorio)
- **Endpoint Trenitalia:** `GET /autocompletaStazione/{q}` (risposta testuale)
- **Elaborazione:** La risposta è una serie di righe nel formato `NomeStazione|CodiceTreno`. Il controller la parsifica e restituisce un array JSON.
- **Risposta:**
  ```json
  [
    { "nome": "Milano Centrale", "id": "S01700" },
    { "nome": "Milano Lambrate", "id": "S01704" }
  ]
  ```

---

**`dettaglio()`** — Dettaglio e coordinate stazione

- **Parametri GET:** `id` (codice stazione, es. `S01700`, obbligatorio)
- **Endpoint Trenitalia:** `GET /dettaglioStazione/{id}/0`
- **Risposta:**
  ```json
  { "lat": 45.4882, "lon": 9.2043, "nome": "Milano Centrale" }
  ```

---

**`partenze()`** — Partenze da una stazione

- **Parametri GET:** `id` (obbligatorio), `orario` (opzionale, stringa RFC-formatted; default: ora corrente)
- **Endpoint Trenitalia:** `GET /partenze/{id}/{orario}`
- **Risposta:** Array di oggetti treno con campi tra cui `compNumeroTreno`, `destinazione`, `orarioPartenza` (timestamp ms), `ritardo`, `codOrigine`

---

**`arrivi()`** — Arrivi in una stazione

- **Parametri GET:** `id` (obbligatorio), `orario` (opzionale)
- **Endpoint Trenitalia:** `GET /arrivi/{id}/{orario}`
- **Risposta:** Struttura analoga alle partenze, con campi di orario arrivo

---

#### TrenoController

Gestisce la ricerca e il tracciamento dei treni.

---

**`cercaNumero()`** — Ricerca treno per numero

- **Parametri GET:** `numero` (obbligatorio; accetta formati come `665`, `REG 20450`, `IC 665`)
- **Endpoint Trenitalia:** `GET /cercaNumeroTrenoTrenoAutocomplete/{numero}` (risposta testuale)
- **Elaborazione:** Estrae la parte numerica tramite regex (`/\d+/`). Il formato della risposta è `{numero} - {stazione} - {data}|{codice}-{codStazione}-{timestamp}`. Il controller separa la parte visuale da quella codificata sul carattere pipe (`|`).
- **Risposta:**
  ```json
  {
    "codice": "665",
    "stazione": "MILANO CENTRALE",
    "codStazione": "S01700",
    "dataPartenza": "1776463200000"
  }
  ```

---

**`andamento()`** — Stato e avanzamento treno

- **Parametri GET:** `codPartenza` (codice stazione di origine), `codTreno` (numero treno), `dataPartenza` (timestamp ms) — tutti obbligatori
- **Endpoint Trenitalia:** `GET /andamentoTreno/{codPartenza}/{codTreno}/{dataPartenza}`
- **Risposta:** Oggetto con origine, destinazione, ritardo corrente e array `fermate`, ciascuna con orario programmato, orario reale (quando disponibile), ritardo e tipo di fermata (`actualFermataType`).

---

**`tratte()`** — Dati percorso per la mappa

- **Parametri GET:** `codPartenza`, `codTreno`, `dataPartenza` (tutti obbligatori)
- **Endpoint Trenitalia:** `GET /tratteCanvas/{codPartenza}/{codTreno}/{dataPartenza}`
- **Risposta:** Dati del tracciato geografico per la visualizzazione del percorso sulla mappa

---

#### NewsController

Aggrega notizie ferroviarie da Google News RSS.

**`get()`** — Recupero notizie

- **Parametri GET:** `lang` (opzionale; `it` o `en`, default `it`)
- **Sorgente:** Google News RSS, con query specifica per lingua e filtro sugli ultimi 30 giorni
- **Elaborazione:**
  - Chiama il feed RSS con una query sul trasporto ferroviario italiano
  - Parsifica la risposta XML
  - Filtra gli articoli degli ultimi 30 giorni
  - Rimuove il suffisso della fonte dai titoli tramite regex
  - Tronca le descrizioni a 250 caratteri
  - Restituisce al massimo 20 articoli
- **Risposta:**
  ```json
  [
    {
      "titolo": "Trenitalia annuncia nuovi orari estivi",
      "testo": "A partire dal 15 giugno...",
      "data": 1713520800000,
      "url": "https://..."
    }
  ]
  ```

> **Nota:** L'API news ufficiale di Trenitalia (esposta da Viaggiatreno) è tecnicamente funzionante ma contiene soltanto una notizia risalente al 2019, di fatto non aggiornata. Per questo motivo è stato scelto Google News come sorgente alternativa, che fornisce contenuti aggiornati e pertinenti.

---

#### MeteoController

Recupera i dati meteo dalle API Trenitalia.

**`get()`** — Dati meteo stazioni

- **Endpoint Trenitalia:** `GET /datimeteo/0`
- **Risposta:** Oggetto indicizzato per codice stazione:
  ```json
  {
    "S01700": {
      "localita": "Milano",
      "oggiTemperatura": 18,
      "oggiTempo": 1
    }
  }
  ```
- **Codici meteo:**

  | Codice | Condizione |
  |---|---|
  | 1 | Sereno |
  | 2 | Poco nuvoloso |
  | 3 | Nuvoloso |
  | 4 | Coperto |
  | 101 | Pioggia |
  | 102 | Temporali |
  | 103 | Neve |
  | 104 | Nebbia |

> **Nota:** Il meteo viene visualizzato solo per le stazioni principali (le più grandi), perché Trenitalia registra i dati meteo soltanto per un sottoinsieme di stazioni. Le stazioni minori non sono presenti nell'oggetto restituito dall'API, quindi il widget meteo viene semplicemente nascosto per quelle stazioni.

---

#### StatisticheController

**`get()`** — Treni in circolazione

- **Endpoint Trenitalia:** `GET /statistiche/{timestamp}` (timestamp = ora corrente in ms)
- **Risposta:** `{ "treniCircolanti": 1250 }`
- **Utilizzo:** Alimenta il contatore animato in homepage

---

#### LinguaController

**`get()`** — Stringhe di traduzione

- **Parametri GET:** `lang` (`it` o `en`, default `it`)
- **Endpoint Trenitalia:** `GET /language/{lang}`
- **Utilizzo:** Recupera le stringhe di traduzione esposte da Trenitalia a livello di API. Attualmente vengono recuperate ma non integrate direttamente nell'UI: il frontend gestisce le traduzioni con il proprio file i18n interno.

---

### 3.4 Services

**`TrenitaliaService::fetch(endpoint, isJson = true)`**

Wrapper centralizzato per tutte le chiamate HTTP verso le API esterne.

- Costruisce l'URL completo concatenando `TRENITALIA_BASE` con l'endpoint
- Configura cURL con: timeout configurato, user-agent configurato, follow dei redirect
- Se `isJson = true`: decodifica la risposta JSON e la restituisce come oggetto PHP
- Se `isJson = false`: restituisce la risposta grezza come stringa
- Lancia eccezioni in caso di errori cURL o di decodifica JSON non valida

### 3.5 Helpers

**`Response::json(data, code = 200)`**
Imposta l'header `Content-Type: application/json`, il codice HTTP, serializza i dati e termina l'esecuzione.

**`Response::error(message, code = 500)`**
Shorthand per risposte di errore. Chiama `json(['error' => $message], $code)`.

**`Validator::string(input)`**
Esegue trim e strip_tags sull'input. Usato per sanitizzare tutti i parametri GET prima dell'elaborazione.

**`Validator::int(input)`**
Casta l'input a intero.

**`Validator::required(value)`**
Lancia un'eccezione con messaggio `"Campo richiesto mancante."` se il valore è vuoto (con eccezione per `0` e `'0'`).

---

## 4. Frontend — struttura e funzionamento

### 4.1 Pagine HTML

#### `index.html` — Homepage

Sezioni principali:
1. **Header:** Logo TrackIT, navigazione (Home / News), toggle tema chiaro/scuro, toggle lingua IT/EN, menu hamburger per mobile
2. **Hero:** Titolo, sottotitolo, form di ricerca stazione (con autocomplete), form di ricerca treno per numero
3. **Contatore treni:** Mostra il numero di treni attualmente in circolazione, aggiornato ogni 30 secondi con animazione numerica
4. **Stazioni recenti:** Griglia di chip cliccabili (max 5) con pulsante di rimozione.
5. **Footer**

#### `stazione.html` — Dettaglio stazione

Sezioni principali:
1. **Header:** Nome stazione, widget meteo (temperatura + condizione), timestamp ultimo aggiornamento
2. **Tab partenze/arrivi:** Toggle tra le due viste
3. **Soglia ritardo:** Input numerico configurabile dall'utente; le righe che superano la soglia vengono evidenziate in rosso
4. **Tabella treni:** Numero treno, destinazione/provenienza, orario programmato, ritardo, stato. Inizialmente mostra 5 righe con pulsante "Mostra altri". Ogni riga è cliccabile e porta alla pagina del treno.
5. **Mappa:** Posizione geografica della stazione
6. **Auto-refresh:** Aggiornamento automatico ogni 60 secondi

#### `treno.html` — Dettaglio treno

Sezioni principali:
1. **Header:** Numero treno, tratta origine → destinazione, ritardo corrente, timestamp
2. **Timeline verticale:** Elenco di tutte le fermate con orario programmato, orario reale (quando disponibile dall'API), badge ritardo, indicatore di stato fermata (percorsa / corrente / futura). Ogni fermata è cliccabile e porta alla pagina della stazione.
3. **Mappa:** Marker rosso per la stazione di origine, marker blu per la destinazione
4. **Auto-refresh:** Aggiornamento automatico ogni 60 secondi

#### `news.html` — Notizie

Sezioni principali:
1. **Filtri lingua:** Pulsanti IT / EN per filtrare le notizie per lingua
2. **Griglia di card:** Titolo, data/ora di pubblicazione, descrizione troncata, link "Leggi di più"
3. **Timestamp ultimo aggiornamento**

### 4.2 Moduli JavaScript

#### `api.js`
Client API centralizzato. Espone una funzione per ciascun endpoint del backend. Costruisce le URL usando `window.location.origin`, aggiunge il parametro `route` e tutti i parametri forniti (filtrando i valori `null`/`undefined`/vuoti). Parsifica le risposte JSON e propaga gli errori.

Funzioni esportate: `autocompleta`, `dettaglioStazione`, `partenze`, `arrivi`, `cercaTreno`, `andamento`, `tratte`, `news`, `meteo`, `statistiche`, `lingua`.

---

#### `autocomplete.js`
Gestisce il widget di autocompletamento per la ricerca stazione.

- Debounce di 300ms sulle chiamate API
- Minimo 2 caratteri per avviare la ricerca
- Navigazione da tastiera (frecce su/giù, Invio, Esc)
- Chiusura su click esterno

---

#### `i18n.js`
Gestione del multilingua (italiano / inglese).

- La preferenza di lingua è salvata in `localStorage`
- Applica le traduzioni a tutti gli elementi con attributo `[data-i18n]`
- Metodo `t(key)` per ottenere una stringa tradotta da codice JavaScript
- Chiavi tradotte: navigazione, form di ricerca, etichette tabella, stati treno, meteo, messaggi generici

---

#### `index.js`
Controller della homepage.

- Inizializza il form di ricerca stazione con autocomplete
- Gestisce il form di ricerca treno per numero
- Carica le stazioni recenti da `Storage` e le renderizza come chip cliccabili
- Gestisce la mappa delle stazioni recenti (recupera le coordinate e aggiunge i marker)
- Avvia il polling del contatore treni (ogni 30 secondi)

---

#### `map.js`
Wrapper attorno a Leaflet.js.

- Inizializza la mappa centrata sull'Italia (`[42.5, 12.5]`, zoom 6)
- `addMarker(lat, lng, label, tipo)`: aggiunge marker colorati (`verde`, `rosso`, `blu`, `stazione`, `treno`) basati su `L.divIcon`
- `addPercorso(fermate)`: disegna la polilinea del percorso
- `fitMarkers(padding)`: adatta lo zoom per mostrare tutti i marker
- Le coordinate vengono cachate in memoria per ridurre le chiamate API ridondanti

---

#### `meteo.js`
Widget meteo.

- `loadForStation(stationId, containerId)`: recupera i dati meteo e renderizza temperatura e condizione per una singola stazione
- Nasconde il widget in caso di errore o di dati non disponibili per quella stazione
- Mappa i codici numerici Trenitalia in etichette testuali

---

#### `news.js`
Controller della pagina notizie.

- Carica le notizie in italiano all'avvio
- Gestisce il toggle IT/EN con aggiornamento del filtro attivo
- Renderizza le card con titolo, data formattata, testo e link
- Aggiorna il timestamp di "ultimo aggiornamento"

---

#### `notifications.js`
Gestione delle notifiche di ritardo.

- Legge/scrive la soglia di ritardo su `localStorage` (chiave `trackit_soglia`, default: 5 minuti)
- `check(treni, containerEl)`: applica la classe CSS `alert-ritardo` alle righe che superano la soglia
- `showToast(messaggio)`: mostra un toast temporaneo

---

#### `stazione.js`
Controller della pagina stazione.

- Legge i parametri `id` e `nome` dalla query string
- Inizializza la mappa centrata sulla stazione
- Gestisce i tab partenze/arrivi
- Carica i dati e renderizza la tabella con paginazione (5 righe iniziali)
- Applica la colorazione del ritardo e l'evidenziazione soglia
- Click su una riga naviga a `treno.html` con i parametri corretti
- Polling ogni 60 secondi

**Gestione dello stato treno (`buildStato`):**
Determina l'etichetta di stato in base ai campi del JSON. Se l'informazione non è presente nell'API, lo stato risulta vuoto — questo è un dato mancante a monte, non un bug dell'applicazione.

---

#### `treno.js`
Controller della pagina treno.

- Legge `codTreno`, `codPartenza`, `dataPartenza` dalla query string
- Recupera l'andamento del treno e renderizza header, timeline e mappa
- `fermataStato(f)`: mappa `actualFermataType` allo stato CSS (`passata`, `corrente`, `futura`)
  - `0` → futura, `1` → passata, `2`/`3` → corrente
- Per la mappa: recupera le coordinate di origine e destinazione tramite `dettaglioStazione` e disegna la polilinea
- Polling ogni 60 secondi

---

#### `storage.js`
Gestione della cronologia stazioni in `localStorage`.

- Chiave: `trackit_stazioni_recenti`, max 5 stazioni
- `salva(stazione)`: inserisce in testa, rimuove duplicati, tronca a 5
- `leggi()`: restituisce l'array (o `[]` se vuoto)
- `cancella()`: svuota la cronologia

---

#### `theme.js`
Toggle tema chiaro/scuro.

- Eseguito come IIFE in `<head>` per evitare il flash di contenuto non stilizzato (FOUC)
- Salva la preferenza in `localStorage` (`trackit_theme`)
- Applica l'attributo `data-theme` sull'elemento `<html>`
- Aggancia il click handler dopo `DOMContentLoaded`

---

#### `utils.js`
Funzioni di utilità condivise.

- `formatTime(timestamp)` → `"HH:mm"`
- `formatDate(timestamp)` → `"DD/MM/YYYY"`
- `todayTimestamp()` → timestamp di oggi a mezzanotte
- `formatDelay(minuti)` → `"+X min"` oppure `"In orario"`
- `getDelayClass(minuti)` → classe CSS: `on-time` / `delay-low` (1-5 min) / `delay-medium` (6-15 min) / `delay-high` (>15 min)
- `showPopup(message, type)` → mostra un modale (`error`, `warning`, `info`); chiudibile con pulsante, tasto Esc o click sull'overlay
- `debounce(fn, delay)` → restituisce una versione debounced della funzione
- `escapeHtml(s)` → codifica le entità HTML (`&`, `<`, `>`, `"`, `'`)

### 4.3 CSS

| File | Contenuto |
|---|---|
| `reset.css` | Reset e normalizzazione cross-browser |
| `variables.css` | Custom properties per colori, spaziature, font, ombre, z-index (supporto tema chiaro/scuro) |
| `global.css` | Tipografia globale, body, link, bottoni, container, classi di utilità |
| `components.css` | Componenti riutilizzabili: badge ritardo, tabelle, loader, tab, popover, popup modali, toast |
| `index.css` | Stili specifici dell'homepage: hero, form di ricerca, griglia stazioni recenti, animazione contatore |
| `stazione.css` | Stili pagina stazione: header, tab, input soglia, tabella treni, layout mappa |
| `treno.css` | Stili pagina treno: header, timeline verticale, indicatori stato fermata, layout mappa |
| `news.css` | Stili pagina notizie: griglia card, pulsanti filtro, data pubblicazione |
| `map.css` | Personalizzazione Leaflet: marker SVG colorati, popup |

---

## 5. Flussi dati principali

### Ricerca stazione

```
Utente digita → debounce 300ms → api.autocompleta(q)
  → backend StazioneController::autocompleta()
  → Trenitalia /autocompletaStazione/{q}
  → parsing risposta testuale pipe-delimited
  → JSON [{nome, id}]
  → frontend renderizza lista risultati
  → click su risultato → Storage.salva() → navigazione a stazione.html?id=...&nome=...
```

### Visualizzazione partenze/arrivi

```
stazione.html carica → lettura parametri URL → api.dettaglioStazione(id) → mappa centrata
  → api.partenze(id, orario) o api.arrivi(id, orario)
  → backend → Trenitalia /partenze/{id}/{orario}
  → rendering tabella (5 righe) + paginazione
  → Notifications.check() → highlight righe oltre soglia
  → polling ogni 60s
```

### Tracciamento treno

```
Click su riga treno → navigazione a treno.html?codTreno=...&codPartenza=...&dataPartenza=...
  → api.andamento(codPartenza, codTreno, dataPartenza)
  → backend → Trenitalia /andamentoTreno/{...}/{...}/{...}
  → rendering header (origine/destinazione/ritardo)
  → rendering timeline fermate (passate/corrente/future)
  → api.dettaglioStazione() per origine e destinazione → coordinate → mappa con marker e polilinea
  → polling ogni 60s
```

### Meteo stazione

```
stazione.html carica → Meteo.loadForStation(stationId, containerId)
  → api.meteo() → backend → Trenitalia /datimeteo/0
  → ricerca stationId nell'oggetto risposta
  → se presente: temperatura + codice meteo → etichetta testuale → rendering widget
  → se assente: widget nascosto
```

### Notizie

```
news.html carica → api.news('it')
  → backend NewsController::get()
  → Google News RSS (query in italiano, ultimi 30 giorni)
  → parsing XML → filtraggio → troncatura → max 20 articoli
  → rendering card
  → click pulsante EN → api.news('en') → stessa pipeline con query in inglese
```

---

## 6. Funzionalità implementate

### Homepage
- [x] Ricerca stazione con autocompletamento (debounce 300ms, navigazione tastiera)
- [x] Ricerca treno per numero (con normalizzazione del formato in input)
- [x] Contatore animato treni in circolazione (polling 30s)
- [x] Cronologia stazioni recenti con chip cliccabili e rimozione singola (max 5)
- [x] Mappa stazioni recenti con zoom automatico su tutti i marker
- [x] Toggle tema chiaro/scuro con prevenzione FOUC
- [x] Toggle lingua IT/EN persistente
- [x] Menu hamburger per mobile

### Pagina stazione
- [x] Tab partenze / arrivi
- [x] Tabella treni con orario, ritardo e stato
- [x] Paginazione (5 righe iniziali, "Mostra altri")
- [x] Click su riga → navigazione pagina treno
- [x] Soglia ritardo configurabile con evidenziazione righe
- [x] Widget meteo (temperatura + condizione)
- [x] Mappa con posizione stazione
- [x] Timestamp ultimo aggiornamento
- [x] Auto-refresh ogni 60 secondi

### Pagina treno
- [x] Header con tratta e ritardo corrente
- [x] Timeline verticale di tutte le fermate
- [x] Orario programmato e orario reale per fermata
- [x] Badge ritardo per fermata
- [x] Colorazione stato fermata (passata / corrente / futura)
- [x] Click su fermata → navigazione pagina stazione
- [x] Mappa con marker origine (rosso), destinazione (blu) e polilinea percorso
- [x] Timestamp ultimo aggiornamento
- [x] Auto-refresh ogni 60 secondi

### Pagina notizie
- [x] Aggregazione notizie da Google News RSS
- [x] Filtro lingua IT / EN
- [x] Card con titolo, data, descrizione e link
- [x] Timestamp ultimo aggiornamento

### Trasversali
- [x] i18n italiano/inglese su tutte le pagine
- [x] Escape HTML su tutto il contenuto dinamico (prevenzione XSS)
- [x] Sanitizzazione input lato backend (`Validator`)
- [x] Gestione errori con popup modali
- [x] Design responsive (mobile-first)
- [x] Persistenza preferenze utente in `localStorage` (tema, lingua, soglia ritardo, stazioni recenti)

---

## 7. API Endpoints — riferimento completo

Tutti gli endpoint sono chiamati via `GET` verso `backend/index.php?route={route}&...`.

| Route | Parametri | Descrizione |
|---|---|---|
| `stazione/autocompleta` | `q` | Autocompletamento nome stazione |
| `stazione/dettaglio` | `id` | Coordinate e nome stazione |
| `stazione/partenze` | `id`, `orario`* | Partenze da stazione |
| `stazione/arrivi` | `id`, `orario`* | Arrivi in stazione |
| `treno/cerca` | `numero` | Ricerca treno per numero |
| `treno/andamento` | `codPartenza`, `codTreno`, `dataPartenza` | Stato e fermate treno |
| `treno/tratte` | `codPartenza`, `codTreno`, `dataPartenza` | Dati percorso per mappa |
| `news` | `lang`* | Notizie ferroviarie (Google News) |
| `meteo` | — | Dati meteo stazioni |
| `statistiche` | — | Numero treni in circolazione |
| `lingua` | `lang`* | Stringhe di traduzione Trenitalia |

*parametro opzionale

---

## 8. Note implementative e limitazioni note

### Stato treno vuoto
Nella tabella partenze/arrivi, la colonna "Stato" può risultare vuota per alcuni treni. Questo non è un bug dell'applicazione: significa che Trenitalia non fornisce quell'informazione per quel treno in quel momento. L'API restituisce lo stato solo quando è disponibile; in caso contrario il campo è assente nella risposta JSON. Tutti gli altri campi presenti vengono visualizzati normalmente.

### Meteo solo per stazioni principali
Il widget meteo viene mostrato esclusivamente per le grandi stazioni. Questo perché Trenitalia registra i dati meteo solo per un sottoinsieme di stazioni (le principali), e l'endpoint `/datimeteo/0` restituisce un oggetto che contiene solo quelle stazioni. Per le stazioni minori o secondarie, la chiave corrispondente non è presente nella risposta, quindi il widget viene automaticamente nascosto.

### Notizie da Google News (non da Trenitalia)
L'API news ufficiale di Trenitalia (`/news`) è integrata nel backend ed è tecnicamente funzionante. Tuttavia, contiene soltanto una singola notizia risalente al 2019 e non viene aggiornata. Per garantire contenuti attuali, è stato scelto di utilizzare il feed RSS di Google News con query mirate al trasporto ferroviario italiano. Le notizie sono filtrate agli ultimi 30 giorni e restituite in un massimo di 20 articoli.

### CORS aperto
Il backend imposta `Access-Control-Allow-Origin: *`. Questa configurazione è appropriata per un'applicazione didattica/locale, ma in un contesto di produzione andrebbe ristretto all'origine specifica del frontend.

### Gestione fuso orario
Il frontend costruisce la stringa orario per le chiamate a partenze/arrivi in formato inglese RFC (`"Fri Apr 18 2026 10:00:00 GMT+0200"`) con costruzione manuale, per evitare problemi di localizzazione legati al locale del browser.

---

## 9. Test effettuati

I test sono stati condotti manualmente tramite browser (Chrome e Firefox) con l'applicazione in esecuzione su XAMPP in ambiente Windows.

### Funzionalità testate e verificate

**Ricerca e navigazione**
- Autocompletamento stazione: risposta corretta con query parziali (es. "mil", "roma t")
- Ricerca treno per numero intero, con prefisso testuale (es. "REG 665") e con spazi
- Navigazione tra le pagine tramite link e click su elementi interattivi

**Stazione**
- Caricamento partenze e arrivi per stazioni di grande traffico (Milano Centrale, Roma Termini, Firenze SMN)
- Cambio tab partenze/arrivi con aggiornamento corretto della tabella
- Paginazione: visualizzazione iniziale di 5 righe e espansione con "Mostra altri"
- Soglia ritardo: configurazione, salvataggio in localStorage, evidenziazione righe corretta
- Widget meteo: corretto su stazioni principali, assente su stazioni minori
- Auto-refresh: verifica aggiornamento dati dopo 60 secondi

**Treno**
- Caricamento andamento per treni regionali e intercity in circolazione
- Timeline con fermate passate, corrente e future con colorazione corretta
- Stato fermata vuoto quando l'informazione non è disponibile nell'API
- Mappa: presenza del marker di origine, destinazione e polilinea del percorso
- Click su fermata nella timeline: navigazione corretta alla pagina stazione

**Homepage**
- Contatore treni: aggiornamento ogni 30 secondi con animazione
- Stazioni recenti: aggiunta, ordinamento (più recente prima), rimozione singola, persistenza dopo refresh
- Mappa recenti: marker per ogni stazione, zoom automatico al fit

**Notizie**
- Caricamento notizie in italiano e inglese
- Toggle lingua con aggiornamento lista
- Link "Leggi di più" aperti in nuova scheda

**UI/UX**
- Toggle tema chiaro/scuro: persistenza dopo refresh, nessun flash all'avvio
- Toggle lingua: persistenza, aggiornamento etichette su tutte le pagine
- Menu hamburger: apertura/chiusura su mobile e a schermo ridotto
- Popup di errore: apertura, chiusura con pulsante, con Esc e con click sull'overlay
- Responsive: verificato a 375px (mobile), 768px (tablet), 1280px+ (desktop)
