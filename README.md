# ChromaMeal - Progetto Finale Full Stack

Live Demo: in preparazione. Il link sarà aggiunto dopo la pubblicazione.

# Descrizione

ChromaMeal è un'applicazione web che aiuta l'utente a organizzare i pasti in base ai propri turni di lavoro e agli impegni della settimana.

Dopo la registrazione o il login, l'utente può pianificare i pasti scegliendo alimenti tramite Open Food Facts e indicando le quantità in grammi. I prodotti mostrano i valori nutrizionali disponibili; i dati mancanti vengono segnalati senza essere sostituiti con zero.

Il planner permette inoltre di inserire, modificare ed eliminare turni di lavoro e impegni, anche quando attraversano la mezzanotte. La Home mostra i pasti del giorno, il riepilogo settimanale e una lista della spesa gestita manualmente.

Pasti, eventi e lista della spesa vengono salvati nel database e associati all'account dell'utente, per ritrovarli agli accessi successivi.

Dalla pagina Account è possibile scegliere tra quattro temi stagionali: inverno, primavera, estate e autunno. La preferenza è salvata nell'account e ripristinata agli accessi successivi, anche da un altro dispositivo.

# Architettura

Il progetto è una single-page application (SPA) con un frontend React e un backend Laravel:

Components: Section, TitlePill e IconLink compongono gli elementi riutilizzabili dell'interfaccia; MealPlanner, FoodSearch, SchedulePlanner e ShoppingList gestiscono le funzionalità principali.

Pages: Home, Planner e Account. React Router gestisce la navigazione e ProtectedRoute verifica la sessione prima di mostrare Home e Planner.

Services: i moduli nella cartella lib utilizzano Fetch API per comunicare con Laravel e gestire autenticazione, ricerca degli alimenti, pasti, eventi e lista della spesa.

Backend: i controller Laravel espongono le API REST, validano i dati e limitano le operazioni ai record dell'utente autenticato.

Autenticazione: Laravel Fortify gestisce registrazione, login e logout; Sanctum autentica le richieste della SPA tramite cookie di sessione e protezione CSRF.

API esterna: Laravel interroga Open Food Facts e conserva temporaneamente i risultati della ricerca in cache. I pasti già salvati rimangono disponibili anche quando il servizio esterno non risponde.

Database: MySQL conserva utenti, pasti, turni e impegni, lista della spesa e sessioni. Le migration Laravel definiscono la struttura delle tabelle e le relazioni.

# Tecnologie utilizzate

- HTML
- CSS
- TypeScript
- React
- Vite
- React Router
- React Hooks
- Fetch API
- PHP
- Laravel
- Laravel Fortify
- Laravel Sanctum
- Eloquent ORM
- MySQL
- Open Food Facts API
- PHPUnit
- Node.js Test Runner

# Avvio locale

Le istruzioni di installazione e verifica sono disponibili nei README del [frontend](client/README.md) e del [backend](server/README.md).

Avvia MySQL e il backend Laravel, quindi il frontend Vite. Apri `http://localhost:5173` e crea un account per usare l'applicazione. Usa sempre `localhost` nel browser per mantenere coerenti i cookie della sessione.

# Pubblicazione

La live demo richiede il frontend compilato, il backend PHP e un database persistente. Il proxy di Vite funziona soltanto durante lo sviluppo: in produzione `/api` e `/sanctum` devono raggiungere Laravel sullo stesso dominio del frontend. Le pagine `/account` e `/planner` devono inoltre essere raggiungibili anche ricaricando direttamente il loro indirizzo.

Il link pubblico sarà inserito all'inizio di questo README quando il sito sarà online.

# Sviluppi futuri

- Creazione e gestione delle ricette.
- Catalogo degli alimenti personali.
- Generazione automatica della lista della spesa dal planner.
- Integrazione con Foodashi, attualmente in sviluppo, come futura fonte dei dati alimentari.
