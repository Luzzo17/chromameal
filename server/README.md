# ChromaMeal - Backend

Il backend utilizza Laravel, Fortify, Sanctum ed Eloquent con MySQL. Per la descrizione del progetto consulta il [README principale](../README.md).

## Requisiti

- PHP 8.3 o successivo compatibile con le dipendenze in `composer.lock`.
- Composer.
- MySQL, per esempio tramite XAMPP.
- Estensioni PHP richieste da Laravel, `pdo_mysql` e supporto HTTPS con certificati CA configurati per le richieste a Open Food Facts.
- `pdo_sqlite` per eseguire i test con un database in memoria.

## Installazione

Crea un database MySQL vuoto chiamato `chromameal`. Dalla cartella `server`:

```sh
composer install
```

Copia `.env.example` in `.env` e configura le credenziali MySQL. In PowerShell:

```powershell
Copy-Item .env.example .env
```

Le impostazioni locali previste sono:

```dotenv
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=chromameal
DB_USERNAME=root
DB_PASSWORD=
SESSION_DRIVER=database
SESSION_DOMAIN=null
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000
```

Adatta utente e password al tuo MySQL. Genera la chiave dell'applicazione e crea le tabelle:

```sh
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Avvia anche il [frontend](../client/README.md). Le dipendenze JavaScript presenti nel template Laravel non sono necessarie per avviare questa interfaccia, che si trova in `client`.

## API principali

- `GET /api/health`: stato del backend.
- `GET /sanctum/csrf-cookie`: inizializzazione CSRF.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`: autenticazione.
- `GET /api/user`: utente autenticato.
- `PATCH /api/user/theme`: salva la stagione dell'utente autenticato (`winter`, `spring`, `summer` o `fall`).
- `GET /api/foods/search?query=...`: ricerca Open Food Facts, con limite di richieste.
- `GET`, `POST`, `PATCH`, `DELETE /api/meal-items`: gestione dei pasti; modifica ed eliminazione richiedono l'ID nella rotta.
- `GET`, `POST`, `PUT`, `DELETE /api/schedule-events`: gestione degli eventi; modifica ed eliminazione richiedono l'ID nella rotta.
- `GET`, `POST`, `PATCH`, `DELETE /api/shopping-items`: gestione della spesa; modifica ed eliminazione richiedono l'ID nella rotta.

Le letture dei pasti e degli eventi richiedono `from` e `to` nel formato `YYYY-MM-DD`, per un massimo di 31 giorni. Le operazioni sui dati personali richiedono una sessione autenticata e agiscono soltanto sui record del relativo account.

Gli eventi vengono salvati in UTC e mostrati nel fuso `Europe/Rome`. Nell'ora ripetuta al cambio autunnale viene scelta la prima occorrenza; gli orari inesistenti al cambio primaverile vengono rifiutati. Il calendario rappresenta 24 ore locali e non mostra due righe separate per l'ora ripetuta.

Le precedenti API `/api/ingredients` restano nel backend, ma il catalogo personale non è utilizzato dall'interfaccia della V1.

## Test

```sh
php artisan test
```

Se `pdo_sqlite` non è abilitato nel `php.ini`, ma è installato:

```sh
php -d extension=pdo_sqlite vendor/phpunit/phpunit/phpunit
```

I test utilizzano SQLite in memoria e servizi esterni simulati. Verificano autenticazione, validazione, isolamento dei dati tra account e gestione degli errori di Open Food Facts.

## Produzione

Configura `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` con l'indirizzo HTTPS pubblico e credenziali di un database persistente. Mantieni `APP_KEY` stabile e privata. Configura `SANCTUM_STATEFUL_DOMAINS` con l'host pubblico e i cookie di sessione per HTTPS.

Il server web deve usare `public` come radice di Laravel e permettere la scrittura in `storage` e `bootstrap/cache`. Frontend, API e percorso CSRF devono essere raggiungibili secondo la configurazione descritta nel README principale.

Non pubblicare `.env`, credenziali, log o database locali.
