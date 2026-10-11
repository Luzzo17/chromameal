# ChromaMeal

Frontend React + TypeScript + Vite in `client`; API Laravel in `server`.

## Avvio locale su Windows

1. Avvia MySQL nel pannello XAMPP (database `chromameal`).
2. In un terminale: `cd server`, poi `php artisan serve --host=127.0.0.1 --port=8000`.
3. In un altro terminale: `cd client`, poi `npm.cmd run dev`.
4. Apri http://localhost:5173. Usa sempre questo hostname per le sessioni.

Vite inoltra `/api` e `/sanctum` a Laravel. Dopo modifiche alla configurazione di Vite, riavvia il frontend.
`GET /api/health` restituisce lo stato del backend; `/api/user` richiede autenticazione.
Il client HTTP condiviso è `client/src/lib/api.ts`. Prima del futuro login chiamare `initializeCsrf()`.
Login e registrazione devono ancora essere implementati.

## Dipendenze e controlli

- Frontend: `npm.cmd install`, `npm.cmd run build`, `npm.cmd run lint` dentro `client`.
- Backend: `composer install`, copia `.env.example` in `.env`, configura le credenziali locali,
  poi `php artisan key:generate` e `php artisan migrate` dentro `server`.
- Non occorre installare le dipendenze JavaScript di `server`: l'interfaccia è in `client`.
- Non condividere `.env`: contiene credenziali e chiave dell'applicazione.

In produzione occorre instradare `/api` e `/sanctum` verso Laravel e impostare dominio,
HTTPS e variabili d'ambiente: il proxy di Vite serve soltanto allo sviluppo.
