# ChromaMeal - Frontend

Il frontend utilizza React, TypeScript e Vite. Per la descrizione del progetto consulta il [README principale](../README.md).

## Requisiti

- Node.js 22.18 o successivo compatibile con Vite 8.
- Backend Laravel e MySQL avviati seguendo le [istruzioni del backend](../server/README.md).

## Installazione e avvio

Dalla cartella `client`:

```sh
npm install
npm run dev
```

Apri `http://localhost:5173`. Vite inoltra `/api` e `/sanctum` a `http://127.0.0.1:8000`. Riavvia Vite dopo modifiche alla sua configurazione.

## Controlli

```sh
npm run lint
npm run build
node --test tests/scheduleDates.test.mjs
```

La build viene generata in `dist`. I test verificano le conversioni degli orari italiani, compresi i cambi tra ora solare e legale.

## Produzione

La sola cartella `dist` non comprende il backend. L'hosting deve inoltrare `/api` e `/sanctum` a Laravel e servire `index.html` per le rotte frontend, senza intercettare le API. Il proxy configurato in Vite non viene incluso nella build.
