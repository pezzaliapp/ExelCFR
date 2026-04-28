# Changelog

Tutte le modifiche rilevanti a ExelCFR vengono annotate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il progetto segue [Semantic Versioning](https://semver.org/lang/it/).

## [0.4.0] — 2026-04-28

### Added

- Modalità di confronto **Smart** (default per le nuove regole) per confronto chiavi tollerante a tipi misti (numero/testo), spazi invisibili da copia-incolla PDF (NBSP, zero-width space, BOM) e differenze di case. Mantiene gli zeri iniziali per non perdere informazione.
- Nuova modalità **Numerico** per codici puramente numerici con zeri iniziali variabili (`001234` ↔ `1234`).
- Pulsante «Scarica elenco no-match (.csv)» nella scheda statistiche di ogni regola dello step «Anteprima ed esporta»: esporta righe del file principale senza corrispondenza con indice, chiave e tutte le colonne identificative del file principale.
- Banner «Configurazione cambiata dopo l’ultimo calcolo» nello step 4 quando l’utente modifica le regole dopo aver calcolato l’anteprima.
- Documentazione: array di casi attesi in `src/lib/lookup.test-cases.ts` per congelare il comportamento di `normalizeKey`.

### Changed

- Dropdown «Modalità di confronto» riordinato (Smart in cima) con descrizione testuale dinamica della modalità selezionata.
- Sezione 8.3 del manuale interno riscritta intorno a Smart, con esempio concreto del problema dei tipi misti; sezione 14 «Risoluzione problemi» aggiornata con il nuovo caso e con il flusso del download no-match.

### Compatibility

- Le configurazioni `.json` salvate con versioni precedenti (`compareMode: 'exact' | 'caseInsensitive' | 'trim' | 'normalize'`) continuano a funzionare invariate.

## [0.3.0] — 2026-04-27

### Added

- Manuale d'uso interno alla PWA, accessibile tramite il pulsante «Guida» nell'header e dal footer.
- Disclaimer di tutela legale mostrato in modale al primo avvio (e ad ogni cambio di `DISCLAIMER_VERSION`); ri-apribile in sola lettura dal footer e dalla sezione 15 della guida.
- Persistenza dell'accettazione del disclaimer in `localStorage` (`exelcfr_disclaimer_accepted`) con campo `version` e `acceptedAt` (ISO 8601).

### Changed

- Footer rivisto: link a Guida, Note legali, Repository.
- README aggiornato con riferimenti a guida interna e note legali.

## [0.2.0] — 2026-04-27

### Added

- Modalità di scrittura «Riempi colonna esistente» per ogni colonna restituita da una regola di lookup, con opzione `Sovrascrivi anche se la cella ha già un valore`.
- Contatori per regola: celle riempite, celle sovrascritte, celle lasciate intatte.
- Evidenziazione cella-per-cella nell'anteprima: verde per le celle riempite, arancione per le sovrascritte, brand color per le colonne nuove.
- Validazione bloccante: se una regola in modalità «Riempi colonna esistente» non ha colonna di destinazione, il bottone «Calcola anteprima» è disabilitato e compare un banner ambra con la lista degli errori.

### Changed

- L'editor delle colonne restituite ora mostra un controllo segmentato («Aggiungi nuova colonna» / «Riempi colonna esistente») con campi dinamici.

### Compatibility

- I file di configurazione `.json` salvati con la 0.1.0 vengono letti correttamente: il campo `writeMode` mancante viene interpretato come `newColumn`.

## [0.1.0] — 2026-04-27

### Added

- Prima release pubblica: scaffold Vite + React + TS + Tailwind, parsing Excel/CSV con SheetJS, motore di CERCA.VERT con Map indicizzata, esportazione `.xlsx` / `.csv`, UI a 4 step in italiano con dark mode, PWA installabile (manifest + service worker autoUpdate), workflow GitHub Pages.

[0.4.0]: https://github.com/pezzaliapp/ExelCFR/releases/tag/v0.4.0
[0.3.0]: https://github.com/pezzaliapp/ExelCFR/releases/tag/v0.3.0
[0.2.0]: https://github.com/pezzaliapp/ExelCFR/releases/tag/v0.2.0
[0.1.0]: https://github.com/pezzaliapp/ExelCFR/releases/tag/v0.1.0
