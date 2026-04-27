# Changelog

Tutte le modifiche rilevanti a ExelCFR vengono annotate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il progetto segue [Semantic Versioning](https://semver.org/lang/it/).

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

[0.3.0]: https://github.com/pezzaliapp/ExelCFR/releases/tag/v0.3.0
[0.2.0]: https://github.com/pezzaliapp/ExelCFR/releases/tag/v0.2.0
[0.1.0]: https://github.com/pezzaliapp/ExelCFR/releases/tag/v0.1.0
