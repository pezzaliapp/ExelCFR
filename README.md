# ExelCFR

> CERCA.VERT tra listini Excel/CSV, **direttamente nel browser**. Una PWA installabile, 100% client‑side, pensata per chi confronta listini ogni giorno e non vuole caricare i propri dati su un server.

![ExelCFR — schermata principale](docs/screenshot.png)

> Lo screenshot è un placeholder: il tuo build avrà il look reale.

## Come funziona

1. **Carica i tuoi file** — Excel (`.xlsx`, `.xls`) o CSV. Drag & drop o click. Anteprima delle prime righe per ogni file, scelta del foglio, toggle "prima riga = intestazione".
2. **Scegli il file principale** — quello a cui aggiungere nuove colonne. Tutti gli altri diventano "sorgenti" da cui pescare i dati.
3. **Configura le regole di lookup** — per ogni file sorgente: colonna chiave su entrambi i file, modalità di confronto (esatto, case‑insensitive, trim, normalize), una o più colonne da riportare, comportamento per i no‑match e per i match multipli.
4. **Anteprima ed esporta** — vedi le prime 50 righe del risultato (con le colonne aggiunte evidenziate) e scarica il file finale come `.xlsx` o `.csv`. Salva o ricarica la configurazione come `.json` per riusarla.

## Modalità di scrittura

Per ciascuna colonna restituita da una regola di lookup puoi scegliere **come scriverla nel risultato**:

- **Aggiungi nuova colonna** *(default)* — crea una colonna in più nel file di output (in coda, dopo una colonna scelta o a un indice). Comportamento storico.
- **Riempi colonna esistente** — non aggiunge nessuna colonna: scrive il valore trovato dentro una colonna **già presente** nel file principale. Di default riempie **solo le celle vuote** (`null` / `undefined` / stringa `""`); con la spunta «Sovrascrivi anche se la cella ha già un valore» le celle con un match vengono sostituite (le celle senza match restano sempre intatte).

> **Esempio**: il file principale ha una colonna `Descrizione` parzialmente compilata. In modalità "Riempi colonna esistente" su `Descrizione`, ExelCFR riempie solo le celle vuote attingendo dal listino sorgente, lasciando intatte le descrizioni già scritte a meno che non abiliti la sovrascrittura.

Le configurazioni salvate in JSON con versioni precedenti (senza il campo `writeMode`) vengono automaticamente interpretate come «Aggiungi nuova colonna», quindi non serve rifarle.

## Privacy

ExelCFR è **completamente client‑side**. Nessun file viene mai inviato a un server: il parsing, il merge e l'export avvengono nel tuo browser. La PWA, una volta installata, funziona anche **offline**. Quando la metti in produzione su GitHub Pages, l'unica connessione di rete avviene per scaricare l'app stessa la prima volta — i dati restano sempre sul tuo dispositivo.

## Setup locale

Richiesti **Node.js ≥ 18** e **npm**.

```bash
git clone https://github.com/<tuo-utente>/ExelCFR.git
cd ExelCFR
npm install
npm run dev          # http://localhost:5173/ExelCFR/
npm run build        # produce ./dist
npm run preview      # serve ./dist
```

Lo script `scripts/generate-icons.mjs` rigenera gli asset PNG della PWA partendo da puro Node, senza dipendenze esterne (`node scripts/generate-icons.mjs`).

## Installazione come PWA

- **Chrome/Edge desktop**: nella barra degli indirizzi appare un'icona "Installa app" → click.
- **Safari iOS**: Condividi → "Aggiungi a Home".
- **Android Chrome**: menu ⋮ → "Installa app" / "Aggiungi a schermata Home".

Dopo l'installazione l'app si apre in finestra dedicata e funziona offline.

## Stack tecnico

- [Vite](https://vite.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) per lo styling
- [SheetJS / xlsx](https://sheetjs.com/) per il parsing e l'export Excel/CSV
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) per il service worker e il manifest
- [react-dropzone](https://react-dropzone.js.org/) per il drag & drop
- [lucide-react](https://lucide.dev/) per le icone
- Web Worker per i lookup su file grandi (≥ 5 000 righe complessive)

## Performance

Il lookup è implementato con una `Map` indicizzata sulla chiave del file sorgente: complessità **O(n + m)** dove `n` è il numero di righe del file principale e `m` quello del sorgente. Per grossi listini (somma > 5 000 righe) l'operazione viene spostata in un Web Worker, mantenendo la UI reattiva. Sopra 100 MB o 200 000 righe complessive l'app mostra un avviso non bloccante.

## Limitazioni conosciute

- I file restano in memoria del browser: file giganteschi possono saturarne la RAM.
- Le date sono serializzate in formato locale italiano (`gg/mm/aaaa`) in CSV. In Excel rimangono date "vere".
- Codici alfanumerici con zeri iniziali (es. `00123`) vengono preservati come stringhe se il file di origine li contiene già come tali; se nel file Excel sono salvati come numero, sarà necessario forzarne il formato testo prima del caricamento.

## Licenza

[MIT](./LICENSE) — usalo, modificalo, distribuiscilo. Nessuna garanzia.
