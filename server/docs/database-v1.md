# Database ChromaMeal V1

Un solo database MySQL: `chromameal`. Le nuove tabelle non dipendono da un catalogo personale degli alimenti e non generano automaticamente la spesa.

## Pasti: `meal_items`

Una riga rappresenta un alimento in un pasto di una data reale.

| Campo | Contenuto |
| --- | --- |
| `user_id` | Proprietario, da ricavare dalla sessione nelle future API |
| `date` | Giorno locale del pasto, formato `YYYY-MM-DD` |
| `meal_type` | `breakfast`, `morning_snack`, `lunch`, `afternoon_snack`, `dinner` |
| `food_name`, `barcode`, `brand` | Copia dei dati del prodotto scelto da Open Food Facts |
| `quantity_g` | Quantità pianificata in grammi, due decimali |
| `calories_per_100g` | Energia in kcal per 100 g, facoltativa |
| `carbohydrates_per_100g`, `proteins_per_100g`, `fat_per_100g` | Grammi per 100 g, facoltativi |

I nutrienti sono salvati con tre decimali; l'interfaccia può mostrarne due. `null` indica dato non disponibile e non equivale a zero. Per un nutriente disponibile, il valore della quantità pianificata si ricava moltiplicando il valore per 100 g per `quantity_g / 100`.

Nome e nutrienti sono una copia locale: i pasti salvati restano consultabili senza chiamare Open Food Facts. Non sono previste tabelle per settimane o pasti vuoti. La settimana viene ricavata filtrando le date. È consentito aggiungere più righe allo stesso pasto, anche dello stesso prodotto.

## Turni e impegni: `schedule_events`

`user_id`, `type` (`work` o `commitment`), `title` facoltativo, `starts_at` e `ends_at`. Le date e gli orari permettono di distinguere settimane diverse. Le future API dovranno validare che la fine segua l'inizio e definire esplicitamente la conversione del fuso orario con il frontend.

## Spesa: `shopping_items`

`user_id`, `name`, `quantity` facoltativa e `is_purchased` (inizialmente `false`). La quantità è testo, per esempio `2 confezioni` o `500 g`: sono articoli manuali, senza collegamento a pasti, ricette o cataloghi. La lista personale resta attiva finché l'utente modifica, spunta o elimina le voci.

## Proprietà e stato dell'implementazione

Tutte le tabelle hanno chiavi esterne verso `users`, cancellazione delle righe al venir meno del proprietario, timestamp e indici per le ricerche personali. I modelli espongono relazioni `belongsTo(User::class)` e `User` espone `mealItems`, `scheduleEvents` e `shoppingItems`.

`user_id` non è assegnabile tramite `$fillable`. Le API dovranno creare i dati attraverso la relazione dell'utente autenticato e cercare modifiche/eliminazioni nella stessa relazione. La sola chiave esterna non protegge gli endpoint.

Sono state aggiunte e applicate le tre migration datate `2026_10_20`. Le vecchie tabelle, inclusa `ingredients`, restano conservate. Le migration Fortify per due fattori e passkey non sono necessarie alle funzionalità V1 abilitate.

I pasti sono collegati al frontend attraverso `GET`, `POST`, `PATCH` e `DELETE /api/meal-items` (con ID per modifica ed eliminazione). La selezione di un alimento salva direttamente la copia dei dati in `meal_items`, senza passare dal catalogo `ingredients`. I nutrienti sono facoltativi e non modificabili nel modulo. La quantità è modificabile; il prodotto salvato rimane lo stesso.

Le API filtrano per proprietario anche modifica ed eliminazione: un ID appartenente ad altri utenti restituisce 404. La lettura richiede due date valide con intervallo massimo di 31 giorni inclusi. La quantità deve essere positiva, non superiore a 10000 g e avere al massimo due decimali.

Turni e impegni hanno API di lettura, creazione, modifica completa (`PUT`) e cancellazione, con intervalli salvati in UTC e lettura per giorni italiani. Il calendario React usa queste API per caricare settimane reali e salvare singoli eventi. Supporta più eventi al giorno e intervalli notturni. Non usa più il salvataggio nel browser; i vecchi dati locali non sono importati automaticamente.

La spesa è collegata a React attraverso `GET`, `POST`, `PATCH` e `DELETE /api/shopping-items` (con ID per modifica ed eliminazione). Le query partono dall'utente autenticato; i campi aggiornabili sono nome, quantità facoltativa e stato acquistato. La lista non riceve più i pasti come props e non usa `localStorage`. Non è stato effettuato un import dei vecchi articoli locali, privi di proprietario identificabile; questi dati non sono stati cancellati.

Le vecchie API ingredienti sono conservate ma non vengono usate dal nuovo planner pasti. Non è stata eseguita una conversione automatica dei vecchi testi del planner in alimenti strutturati.

## Verifica

`PlannerStorageTest` verifica la conservazione di valori mancanti e zero, dei codici a barre con zeri iniziali, delle quantità, delle relazioni personali, delle cancellazioni a cascata e della spesa manuale indipendente dai pasti. I test usano SQLite in memoria, non il database MySQL dell'app.

`MealItemApiTest` verifica accesso obbligatorio, date e quantità non valide, salvataggio del proprietario dalla sessione, lettura per data e utente, modifica e cancellazione autorizzate e impossibilità di alterare il prodotto tramite l'endpoint di modifica quantità.

`ShoppingItemApiTest` verifica aggiunta, modifica, spunta e rimozione, accesso obbligatorio, isolamento tra account, validazione e assenza di articoli generati automaticamente dai pasti.
