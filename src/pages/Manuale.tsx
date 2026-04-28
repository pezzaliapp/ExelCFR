import { ArrowLeft, BookOpen, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  onClose: () => void;
  onOpenDisclaimer: () => void;
  appUrl: string;
  repoUrl: string;
}

const SECTIONS: Array<{ id: string; title: string }> = [
  { id: 'cos-e', title: '1. Cos’è ExelCFR e a cosa serve' },
  { id: 'glossario', title: '2. Glossario veloce' },
  { id: 'esempio', title: '3. Esempio pratico — caso officina ricambi' },
  { id: 'aprire', title: '4. Aprire ExelCFR la prima volta' },
  { id: 'installare', title: '5. Installare ExelCFR come app (PWA)' },
  { id: 'step-1', title: '6. Step 1 — Caricare i file' },
  { id: 'step-2', title: '7. Step 2 — Scegliere il file principale' },
  { id: 'step-3', title: '8. Step 3 — Configurare le regole di lookup' },
  { id: 'step-4', title: '9. Step 4 — Anteprima ed esportazione' },
  { id: 'configurazione', title: '10. Salvare e riutilizzare la configurazione' },
  { id: 'ricette', title: '11. Tre ricette pratiche complete' },
  { id: 'privacy', title: '12. Privacy: i tuoi listini restano sul tuo computer' },
  { id: 'faq', title: '13. Domande frequenti (FAQ)' },
  { id: 'troubleshooting', title: '14. Risoluzione problemi' },
  { id: 'note-legali', title: '15. Note legali sintetiche' },
  { id: 'crediti', title: '16. Crediti' },
];

export function Manuale({ onClose, onOpenDisclaimer, appUrl, repoUrl }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>
          <ArrowLeft size={16} /> Torna all’app
        </button>
        <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <BookOpen size={14} /> Guida d’uso · v0.4.0
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Guida a ExelCFR
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
        Una guida pratica per chi riceve listini Excel/CSV dai fornitori e vuole unirli al proprio
        senza scrivere formule. Niente gergo IT inutile: si parla di file, righe, colonne e di come
        accoppiarli. Tempo di lettura: 10–15 minuti.
      </p>

      {/* TOC */}
      <nav
        aria-label="Indice della guida"
        className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Indice
        </h2>
        <ol className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-brand-700 hover:underline dark:text-brand-300"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="mt-10 space-y-12 text-slate-800 dark:text-slate-100">
        <Section id="cos-e" title={SECTIONS[0].title}>
          <Lead>
            In poche righe: cosa fa ExelCFR e perché può farti risparmiare ore di lavoro manuale su
            Excel.
          </Lead>
          <P>
            Hai due elenchi e vuoi <strong>unirli accoppiando le righe in base a un codice in
            comune</strong>? ExelCFR fa esattamente questo. Carichi il tuo listino, carichi il
            listino del fornitore, scegli quale colonna è il «punto d’incontro» (di solito il
            codice articolo) e indichi quali informazioni vuoi portarti dietro.
          </P>
          <P>
            Questa operazione, se la facessi in Excel, si chiamerebbe <em>CERCA.VERT</em> (in
            inglese <em>VLOOKUP</em>). Da qui il nome <strong>ExelCFR</strong>: «Excel» + «CFR» (CerFR
            = CERCA.VERT). L’app però non ti chiede di scrivere formule: clicchi e basta.
          </P>
          <P>
            Tutto avviene <strong>nel tuo browser</strong>. I file non vanno su nessun server. Una
            volta caricata la prima volta, l’app funziona anche senza internet.
          </P>
        </Section>

        <Section id="glossario" title={SECTIONS[1].title}>
          <Lead>Cinque parole che ricorrono in tutta la guida. Tienile a portata di mano.</Lead>
          <Table>
            <thead>
              <tr>
                <Th>Termine</Th>
                <Th>Cosa significa</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Listino / file</Td>
                <Td>
                  Un foglio di calcolo (Excel o CSV) con righe e colonne. Tipicamente contiene
                  articoli con codice, descrizione, prezzo.
                </Td>
              </tr>
              <tr>
                <Td>Riga e colonna</Td>
                <Td>
                  Una <em>riga</em> è un articolo. Una <em>colonna</em> è un’informazione (es. il
                  prezzo). Ogni cella è l’incrocio fra una riga e una colonna.
                </Td>
              </tr>
              <tr>
                <Td>Intestazione</Td>
                <Td>
                  La prima riga del file, che contiene i nomi delle colonne (es. «Codice»,
                  «Descrizione», «Prezzo»). ExelCFR la riconosce di default.
                </Td>
              </tr>
              <tr>
                <Td>Colonna chiave</Td>
                <Td>
                  La colonna che usi per accoppiare le righe fra due file. Di solito è il{' '}
                  <em>codice articolo</em>, perché è univoco.
                </Td>
              </tr>
              <tr>
                <Td>Match (corrispondenza)</Td>
                <Td>
                  Quando ExelCFR trova nel file sorgente la stessa chiave del file principale.
                  Quando non la trova, è un «no-match».
                </Td>
              </tr>
            </tbody>
          </Table>
        </Section>

        <Section id="esempio" title={SECTIONS[2].title}>
          <Lead>
            Useremo questo esempio come filo conduttore della guida: un’officina che vuole
            arricchire il proprio listino con i dati di un fornitore.
          </Lead>
          <H3>Il tuo listino (file principale)</H3>
          <Table>
            <thead>
              <tr>
                <Th>Codice</Th>
                <Th>Descrizione</Th>
                <Th>Prezzo</Th>
              </tr>
            </thead>
            <tbody>
              <tr><Td>ART001</Td><Td>Vite M6 inox</Td><Td>0,35</Td></tr>
              <tr><Td>ART002</Td><Td>(vuota)</Td><Td>1,20</Td></tr>
              <tr><Td>ART003</Td><Td>Pastiglie freni anteriori</Td><Td>28,00</Td></tr>
              <tr><Td>ART004</Td><Td>(vuota)</Td><Td>4,50</Td></tr>
            </tbody>
          </Table>
          <H3>Il listino del fornitore (file sorgente)</H3>
          <Table>
            <thead>
              <tr>
                <Th>CodArt</Th>
                <Th>Descrizione completa</Th>
                <Th>Costo</Th>
                <Th>Scorta</Th>
              </tr>
            </thead>
            <tbody>
              <tr><Td>ART001</Td><Td>Vite M6 testa esagonale acciaio inox</Td><Td>0,18</Td><Td>540</Td></tr>
              <tr><Td>ART002</Td><Td>Dado autobloccante M6 zincato</Td><Td>0,55</Td><Td>320</Td></tr>
              <tr><Td>ART003</Td><Td>Pastiglie freni anteriori — kit</Td><Td>17,90</Td><Td>22</Td></tr>
              <tr><Td>ART004</Td><Td>Olio motore 5W-30 — 1L</Td><Td>2,80</Td><Td>110</Td></tr>
            </tbody>
          </Table>
          <P>
            <strong>Obiettivo</strong>: voglio riempire le descrizioni mancanti del mio listino
            usando quelle del fornitore, senza modificare le descrizioni che ho già scritto io.
          </P>
          <H3>Risultato atteso</H3>
          <Table>
            <thead>
              <tr>
                <Th>Codice</Th>
                <Th>Descrizione</Th>
                <Th>Prezzo</Th>
              </tr>
            </thead>
            <tbody>
              <tr><Td>ART001</Td><Td>Vite M6 inox <span className="text-xs text-slate-500">(intatta)</span></Td><Td>0,35</Td></tr>
              <tr><Td>ART002</Td><Td className="bg-emerald-50 dark:bg-emerald-950/40">Dado autobloccante M6 zincato</Td><Td>1,20</Td></tr>
              <tr><Td>ART003</Td><Td>Pastiglie freni anteriori <span className="text-xs text-slate-500">(intatta)</span></Td><Td>28,00</Td></tr>
              <tr><Td>ART004</Td><Td className="bg-emerald-50 dark:bg-emerald-950/40">Olio motore 5W-30 — 1L</Td><Td>4,50</Td></tr>
            </tbody>
          </Table>
          <P>
            Le celle in verde sono quelle che ExelCFR ha riempito; le altre sono rimaste come le
            avevi scritte tu.
          </P>
        </Section>

        <Section id="aprire" title={SECTIONS[3].title}>
          <Lead>Cosa vedi quando apri l’app dal browser per la prima volta.</Lead>
          <P>
            Vai su <a className="text-brand-700 underline dark:text-brand-300" href={appUrl} target="_blank" rel="noreferrer">{appUrl}</a>.
            Al primo avvio compare una finestra con le note legali: leggile, spunta «Ho letto e
            accetto» e clicca «Continua». La finestra non riapparirà.
          </P>
          <P>A schermo trovi:</P>
          <Ul>
            <Li><strong>Header in alto</strong>: il nome ExelCFR, il badge verde «100% locale, nessun upload», il pulsante <em>Guida</em> (questo manuale!), il toggle tema chiaro/scuro e il link al repository GitHub.</Li>
            <Li><strong>4 step verticali numerati</strong> al centro: Carica i file → Scegli il principale → Configura le regole → Anteprima ed esporta.</Li>
            <Li><strong>Footer</strong> con la versione, link alla guida, link «Note legali» (riapre il disclaimer) e link al repository.</Li>
          </Ul>
          <P>
            Dal secondo avvio in poi l’app è disponibile anche <strong>senza internet</strong>:
            il browser ha memorizzato tutto.
          </P>
        </Section>

        <Section id="installare" title={SECTIONS[4].title}>
          <Lead>
            Puoi installare ExelCFR come una vera app: si apre con un’icona, in finestra propria,
            senza barra del browser.
          </Lead>
          <Ul>
            <Li><strong>Mac/Windows con Chrome o Edge</strong>: nella barra degli indirizzi compare un’icona «Installa app». Clicca → conferma.</Li>
            <Li><strong>iPhone / iPad con Safari</strong>: tocca il pulsante «Condividi» (il rettangolo con la freccia in su) → «Aggiungi a Home».</Li>
            <Li><strong>Android con Chrome</strong>: tocca i tre puntini in alto a destra → «Installa app» (o «Aggiungi a schermata Home»).</Li>
          </Ul>
          <P>
            Dopo l’installazione l’icona di ExelCFR è sul desktop o nella schermata principale del telefono.
            La useresti uguale a un programma installato, ma è sempre la stessa app web: nessun aggiornamento manuale, niente store.
          </P>
        </Section>

        <Section id="step-1" title={SECTIONS[5].title}>
          <Lead>Carichi i tuoi file. Tutto resta nel browser, niente upload.</Lead>
          <H3>Come si caricano</H3>
          <P>
            Trascina i file dentro l’area tratteggiata, oppure clicca per aprire il selettore
            file. Puoi caricarne più di uno alla volta. Formati accettati: <code>.xlsx</code>,{' '}
            <code>.xls</code>, <code>.csv</code>, <code>.tsv</code>, <code>.txt</code>.
          </P>
          <H3>Cosa puoi fare per ogni file</H3>
          <Ul>
            <Li><strong>Rinominarlo</strong> con un’etichetta più chiara (la matita accanto al nome).</Li>
            <Li><strong>Scegliere il foglio</strong>, se l’Excel ha più sheet (es. «Articoli», «Prezzi», «Sconti»).</Li>
            <Li><strong>Indicare se la prima riga è l’intestazione</strong> (di default sì). Se i nomi delle colonne sono nella seconda riga, togli la spunta finché non ricarichi il file con la struttura giusta.</Li>
            <Li><strong>Vedere un’anteprima delle prime 10 righe</strong>: serve per controllare a colpo d’occhio che i dati siano interpretati correttamente.</Li>
            <Li><strong>Rimuoverlo</strong> con il bottone «Rimuovi».</Li>
          </Ul>
          <H3>Errori comuni</H3>
          <Ul>
            <Li>Le prime righe del file sono righe vuote o un titolo: ExelCFR le considererebbe «dati». Aprilo in Excel e cancellale prima di caricarlo.</Li>
            <Li>L’intestazione è in italiano in un file e in inglese nell’altro: nessun problema, basta che ricordi quali colonne accoppiare.</Li>
            <Li>Il CSV usa il punto e virgola e ti aspettavi la virgola: ExelCFR <strong>rileva il separatore in automatico</strong>, lo vedrai indicato sotto il nome del file.</Li>
          </Ul>
        </Section>

        <Section id="step-2" title={SECTIONS[6].title}>
          <Lead>Decidi qual è il file da arricchire e quali sono le sorgenti.</Lead>
          <P>
            Il <strong>file principale</strong> è quello che vuoi arricchire e che alla fine
            scaricherai modificato. Tutti gli altri sono <strong>sorgenti</strong>: ExelCFR ci pesca
            informazioni, ma non le tocca.
          </P>
          <Note>
            ⚠️ Se scegli per sbaglio il file fornitore come principale, l’output finale avrà gli
            articoli del fornitore, non i tuoi. Cambia la selezione e procedi.
          </Note>
        </Section>

        <Section id="step-3" title={SECTIONS[7].title}>
          <Lead>
            È la sezione più importante: dici ad ExelCFR <em>cosa</em> cercare, <em>dove</em> e{' '}
            <em>cosa farne</em>.
          </Lead>

          <H3>8.1 Cos’è una regola</H3>
          <P>
            Una regola si legge così: «prendi questo codice del mio listino, cercalo nel listino
            fornitore, e quando lo trovi prendi questa colonna e portala dentro al mio file». Puoi
            avere <strong>più regole</strong> sulla stessa coppia di file (per portare costo,
            scorta, EAN, ecc.) o regole su file sorgente diversi (per pescare da più listini).
          </P>

          <H3>8.2 Colonna chiave</H3>
          <P>
            Le due dropdown affiancate ti chiedono <em>quale</em> colonna è la chiave nel file
            principale e quale è la chiave nel sorgente. Esempio: nel mio listino la chiave è{' '}
            <code>Codice</code>, nel listino fornitore è <code>CodArt</code>. Le scelgo entrambe.
          </P>

          <H3>8.3 Modalità di confronto</H3>
          <P>
            È il «come» ExelCFR decide se due chiavi sono la stessa cosa. La modalità di default
            (e consigliata) è <strong>Smart</strong>: copre il 90% dei casi reali, in particolare
            il classico problema dei codici salvati come testo in un file e come numero
            nell’altro.
          </P>
          <Table>
            <thead>
              <tr><Th>Modalità</Th><Th>Quando usarla</Th><Th>Esempio</Th></tr>
            </thead>
            <tbody>
              <tr><Td><strong>Smart</strong> <span className="text-xs text-slate-500">(default)</span></Td><Td>Il file principale ha codici testo e il sorgente li ha come numeri (o viceversa). Spazi invisibili da copia-incolla, maiuscole differenti.</Td><Td><code>"20100376"</code> = <code>20100376</code></Td></tr>
              <tr><Td>Esatto</Td><Td>I codici sono già perfettamente coerenti, stesso tipo e stesso case.</Td><Td><code>ART001</code> ≠ <code>art001</code></Td></tr>
              <tr><Td>Case-insensitive</Td><Td>Maiuscole/minuscole differenti, niente altro.</Td><Td><code>ART001</code> = <code>art001</code></Td></tr>
              <tr><Td>Trim spazi</Td><Td>Spazi prima/dopo i codici.</Td><Td><code>«ART001 »</code> = <code>«ART001»</code></Td></tr>
              <tr><Td>Normalizza</Td><Td>Trim + lowercase + spazi multipli interni collassati.</Td><Td><code>« art 001»</code> = <code>«ART 001»</code></Td></tr>
              <tr><Td>Numerico</Td><Td>Codici puramente numerici dove gli zeri iniziali variano (un sistema esporta <code>001234</code>, l’altro <code>1234</code>).</Td><Td><code>001234</code> = <code>1234</code></Td></tr>
            </tbody>
          </Table>
          <H3>Esempio concreto del problema dei tipi misti</H3>
          <P>
            Se il tuo listino ha codici tipo <code>20100376</code> salvati come testo e il listino
            del fornitore ha lo stesso codice salvato come numero, in modalità <strong>Smart</strong>{' '}
            trovi comunque la corrispondenza. In modalità <em>Esatto</em> invece no:{' '}
            <code>"20100376"</code> e <code>20100376</code> verrebbero considerati diversi perché
            sono di tipo diverso.
          </P>
          <Note>
            🛡️ In modalità <strong>Smart gli zeri iniziali sono sempre preservati</strong>:{' '}
            <code>00123</code> e <code>123</code> restano codici diversi (gli zeri davanti possono
            essere significativi). Se invece sai che sono lo stesso codice e vuoi ignorarli, usa la
            modalità <strong>Numerico</strong>.
          </Note>
          <P>
            <strong>Consiglio</strong>: parti sempre da <em>Smart</em>. Cambia solo se hai un
            requisito preciso: <em>Esatto</em> per controlli rigorosi, <em>Numerico</em> per codici
            con zeri iniziali variabili.
          </P>

          <H3>8.4 Colonne da riportare</H3>
          <P>
            Clicca sui nomi delle colonne del sorgente che vuoi importare. Diventano dei «pillolini»
            cliccabili: si aggiungono in basso, e per ognuna decidi cosa farne.
          </P>

          <H3>8.5 Le due modalità di scrittura</H3>
          <Note>
            È la differenza più importante di tutta l’app. Leggila con calma.
          </Note>
          <Ul>
            <Li>
              <strong>Aggiungi nuova colonna</strong> (default) — l’app crea una colonna in più
              nel file di output. Usala quando l’informazione del fornitore è{' '}
              <em>diversa</em> dalla tua, ad esempio <em>Costo</em>, <em>Scorta</em>, <em>EAN</em>.
              Puoi scegliere il <em>nome della nuova colonna</em> e la sua posizione (in coda, dopo
              una colonna scelta, a un indice).
            </Li>
            <Li>
              <strong>Riempi colonna esistente</strong> — l’app non aggiunge colonne: scrive
              direttamente dentro una colonna che hai già nel tuo file (es. <em>Descrizione</em>).
              Per default <strong>tocca solo le celle vuote</strong>: le tue descrizioni rimangono.
            </Li>
            <Li>
              <strong>Sovrascrivi anche se la cella ha già un valore</strong> (checkbox dentro la
              modalità «Riempi») — ⚠️ attenzione: con questa attiva, le celle del tuo listino con un
              match nel sorgente <strong>vengono sostituite</strong>. Le celle senza match restano
              comunque com’erano.
            </Li>
          </Ul>

          <H3>8.6 Cosa scrivere quando non c’è corrispondenza (no-match)</H3>
          <Ul>
            <Li><strong>Lascia vuoto</strong> — la cella resta vuota.</Li>
            <Li><strong>Scrivi «N/D»</strong> — utile per evidenziare i codici non trovati.</Li>
            <Li><strong>Valore personalizzato</strong> — ad esempio <code>—</code>, <code>0</code> o <code>NON TROVATO</code>.</Li>
          </Ul>

          <H3>8.7 Quando un codice ha più corrispondenze (match multipli)</H3>
          <Ul>
            <Li><strong>Prima corrispondenza</strong> — usa la prima riga trovata.</Li>
            <Li><strong>Ultima corrispondenza</strong> — usa l’ultima.</Li>
            <Li><strong>Concatena</strong> — unisce tutti i valori con un separatore (default <code>« ; »</code>).</Li>
          </Ul>

          <H3>8.8 Più regole insieme</H3>
          <P>
            Le regole vengono applicate <strong>in ordine</strong>, una dopo l’altra, sulla
            tabella che si va via via formando. Esempio: prima regola che aggiunge il <em>Costo</em>{' '}
            dal fornitore A, seconda regola che aggiunge la <em>Scorta</em> dal fornitore B.
          </P>
        </Section>

        <Section id="step-4" title={SECTIONS[8].title}>
          <Lead>Vedi il risultato, controlli i contatori, scarichi il file.</Lead>
          <H3>Colori delle celle</H3>
          <Ul>
            <Li>🟢 <strong>verde</strong> — cella riempita dal lookup (era vuota, ora ha un valore).</Li>
            <Li>🟠 <strong>arancione</strong> — cella sovrascritta (aveva un valore, è stata sostituita).</Li>
            <Li>🔵 <strong>azzurro/brand</strong> — colonna nuova aggiunta dal lookup.</Li>
          </Ul>
          <H3>Contatori</H3>
          <Ul>
            <Li><strong>Match</strong> — righe del tuo file per cui il sorgente ha trovato il codice.</Li>
            <Li><strong>Senza match</strong> — righe per cui non c’è corrispondenza nel sorgente. Da controllare a mano.</Li>
            <Li><strong>Celle riempite</strong> — celle prima vuote che ora hanno un valore (modalità «Riempi colonna esistente»).</Li>
            <Li><strong>Celle sovrascritte</strong> — celle prima piene che sono state sostituite (solo con la spunta «Sovrascrivi»).</Li>
            <Li><strong>Celle lasciate intatte</strong> — celle che ExelCFR non ha toccato (già piene + niente sovrascrittura, oppure no-match su cella piena).</Li>
          </Ul>
          <H3>Validazione</H3>
          <P>
            Se hai una regola in modalità «Riempi colonna esistente» senza colonna di destinazione,
            sopra al risultato vedi un <strong>banner ambra</strong> con la lista delle cose da
            sistemare. Il bottone «Calcola anteprima» resta disabilitato finché non risolvi.
          </P>
          <H3>Esportare</H3>
          <Ul>
            <Li><strong>Scarica Excel (.xlsx)</strong> — il classico file Excel, conserva date e numeri.</Li>
            <Li><strong>Scarica CSV</strong> — testo semplice. Se lo apri in Excel italiano, lascia attiva la spunta «UTF-8 con BOM» e usa il separatore <code>;</code>: così le accentate non si rompono e il file si apre già in colonne.</Li>
          </Ul>
          <P>
            Il file finisce nella tua cartella «Download» del browser. Puoi cambiarne il nome prima
            di scaricarlo.
          </P>
        </Section>

        <Section id="configurazione" title={SECTIONS[9].title}>
          <Lead>Imposta una volta, riusa per sempre.</Lead>
          <P>
            <strong>«Salva configurazione»</strong> esporta un piccolo file <code>.json</code> con
            le tue regole (chiave, modalità di confronto, colonne, ecc.). Non contiene i dati dei
            tuoi listini — solo le istruzioni.
          </P>
          <P>
            <strong>«Carica configurazione»</strong> riapplica le regole salvate ai file che hai
            caricato adesso. Se una colonna citata nella config non esiste più nel file, ExelCFR te
            lo segnala con un avviso e salta la regola problematica.
          </P>
          <Note>
            🔁 Caso d’uso classico: ogni mese il fornitore ti manda lo stesso listino aggiornato,
            tu hai già impostato le regole una volta. Carichi nuovo file + carichi la config →
            scarichi il risultato. Tre click.
          </Note>
        </Section>

        <Section id="ricette" title={SECTIONS[10].title}>
          <Lead>Tre scenari concreti che capitano davvero in officina.</Lead>

          <H3>Ricetta A — Riempire le descrizioni mancanti</H3>
          <Ul>
            <Li><strong>Punto di partenza</strong>: il tuo listino ha alcune descrizioni vuote. Il listino fornitore le ha tutte.</Li>
            <Li><strong>Cosa vuoi ottenere</strong>: completare solo le descrizioni mancanti, senza toccare quelle che hai già scritto tu.</Li>
            <Li>
              <strong>Passi</strong>:
              <ol className="ml-5 list-decimal space-y-1">
                <li>Step 1: carica entrambi i file.</li>
                <li>Step 2: scegli come principale il tuo listino.</li>
                <li>Step 3: aggiungi una regola, chiave principale = <code>Codice</code>, chiave sorgente = <code>CodArt</code>, confronto <em>Normalizza</em>.</li>
                <li>Aggiungi la colonna sorgente <em>Descrizione completa</em>.</li>
                <li>Modalità di scrittura: <strong>«Riempi colonna esistente»</strong>, destinazione = <em>Descrizione</em>, sovrascrittura <strong>OFF</strong>.</li>
                <li>Step 4: «Calcola anteprima», controlla i contatori, scarica.</li>
              </ol>
            </Li>
            <Li><strong>Risultato atteso</strong>: le tue descrizioni esistenti restano intatte; le righe vuote vengono completate. Le celle riempite sono evidenziate in verde nell’anteprima.</Li>
          </Ul>

          <H3>Ricetta B — Aggiungere costo di acquisto e scorta magazzino</H3>
          <Ul>
            <Li><strong>Punto di partenza</strong>: il tuo listino ha codice/descrizione/prezzo di vendita. Il fornitore ti dà costo e scorta.</Li>
            <Li><strong>Cosa vuoi ottenere</strong>: due nuove colonne nel tuo listino, <em>Costo</em> e <em>Scorta</em>, che prima non esistevano.</Li>
            <Li>
              <strong>Passi</strong>:
              <ol className="ml-5 list-decimal space-y-1">
                <li>Step 1-2: come sopra.</li>
                <li>Step 3: aggiungi una regola, seleziona <em>Costo</em> e <em>Scorta</em> dal sorgente.</li>
                <li>Per ognuna, modalità di scrittura: <strong>«Aggiungi nuova colonna»</strong>, posizione «In coda» (oppure «Dopo colonna Prezzo»).</li>
                <li>No-match: «N/D», così vedi subito i codici non trovati.</li>
              </ol>
            </Li>
            <Li><strong>Risultato atteso</strong>: il file scaricato ha due colonne in più; i codici non trovati hanno «N/D».</Li>
          </Ul>

          <H3>Ricetta C — Aggiornare i prezzi sovrascrivendo i vecchi</H3>
          <Note>
            ⚠️ Operazione distruttiva: <strong>fai un backup prima</strong>. Salva il listino originale
            con un nome diverso (es. <code>listino_2026-04_backup.xlsx</code>) prima di esportare il
            nuovo.
          </Note>
          <Ul>
            <Li><strong>Punto di partenza</strong>: il tuo listino ha la colonna <em>Prezzo</em> con i prezzi vecchi. Il fornitore ti manda i prezzi nuovi.</Li>
            <Li><strong>Cosa vuoi ottenere</strong>: aggiornare solo i prezzi che il fornitore ha effettivamente toccato (gli altri restano com’erano).</Li>
            <Li>
              <strong>Passi</strong>:
              <ol className="ml-5 list-decimal space-y-1">
                <li>Step 1: carica i due file. <strong>Backup fatto?</strong></li>
                <li>Step 2: principale = il tuo listino.</li>
                <li>Step 3: regola con confronto <em>Normalizza</em>; colonna sorgente = <em>Prezzo nuovo</em>.</li>
                <li>Modalità di scrittura: <strong>«Riempi colonna esistente»</strong>, destinazione = <em>Prezzo</em>, <strong>spunta «Sovrascrivi»</strong>.</li>
                <li>No-match: «Lascia vuoto» — così le righe non toccate dal fornitore restano coi tuoi vecchi prezzi (la sovrascrittura non agisce sui no-match).</li>
              </ol>
            </Li>
            <Li><strong>Risultato atteso</strong>: nell’anteprima le celle in arancione sono i prezzi aggiornati; le altre sono rimaste come prima. Controlla i contatori «celle sovrascritte» e «celle lasciate intatte».</Li>
          </Ul>
        </Section>

        <Section id="privacy" title={SECTIONS[11].title}>
          <Lead>I tuoi listini sono dati sensibili. Ecco perché ExelCFR è progettato così.</Lead>
          <P>
            Tutto avviene <strong>dentro il tuo browser</strong>: il parsing dei file Excel, il
            CERCA.VERT, l’export. <strong>ExelCFR non ha un server</strong> che riceve i tuoi
            file. Non c’è raccolta di dati personali, niente cookie di tracciamento, niente
            account.
          </P>
          <P>
            Vuoi una conferma pratica? Apri l’app, poi <strong>stacca internet</strong> (modalità
            aereo o disconnetti il Wi-Fi) e usa l’app normalmente: carica file, configura, esporta.
            Funziona uguale.
          </P>
          <P>
            Quando installi la PWA, i file dell’app vengono salvati localmente dal browser. Nessun
            dato dei listini viene mai memorizzato in modo persistente: chiudendo la scheda i file
            caricati spariscono dalla memoria.
          </P>
        </Section>

        <Section id="faq" title={SECTIONS[12].title}>
          <Lead>Le domande che ci si fa al primo utilizzo.</Lead>
          <Faq q="Posso usare ExelCFR senza internet?">
            Sì, dopo la prima apertura. Il browser ha salvato l’app come Progressive Web App: la
            ritrovi anche offline. Se la installi sul desktop, si comporta come un programma.
          </Faq>
          <Faq q="I miei listini sono riservati: dove finiscono?">
            Restano sul tuo dispositivo, in memoria del browser. Niente upload, niente server.
            Quando chiudi la scheda spariscono.
          </Faq>
          <Faq q="Quanti file posso caricare contemporaneamente?">
            Non c’è un limite teorico. In pratica dipende dalla RAM del tuo computer: per file
            piccoli (qualche migliaio di righe) puoi caricarne anche dieci.
          </Faq>
          <Faq q="Quanto può essere grande un file?">
            Indicativamente fino a qualche centinaio di migliaia di righe. Sopra le 200 000 righe
            o i 100 MB compare un avviso non bloccante. ExelCFR usa un Web Worker così la pagina
            resta reattiva durante l’elaborazione.
          </Faq>
          <Faq q="Excel mi cambia «00123» in «123»: come tengo lo zero davanti?">
            Excel convertirebbe il codice in numero. Per evitarlo, in Excel formatta la colonna
            come <em>Testo</em> prima di inserire i codici, oppure aggiungi un apice singolo davanti
            (<code>' 00123</code>). Se i codici nel file di partenza sono già stringhe,
            ExelCFR li conserva.
          </Faq>
          <Faq q="Le date Excel mi escono come numeri strani: perché?">
            Excel rappresenta le date come numeri seriali. ExelCFR le riconosce come date e nel
            CSV le formatta in <code>gg/mm/aaaa</code>. Se preferisci tenerle «vere» date, esporta
            in <code>.xlsx</code>.
          </Faq>
          <Faq q="Ho due colonne con lo stesso nome: cosa succede?">
            Le seconde occorrenze vengono rinominate automaticamente con un suffisso{' '}
            <code>(2)</code>, <code>(3)</code>, ecc. Così non si confondono.
          </Faq>
          <Faq q="Come confronto codici scritti in modo leggermente diverso?">
            La modalità di default è <strong>Smart</strong>: ignora differenze di tipo
            (testo vs numero), maiuscole, spazi normali e invisibili da copia-incolla, mantenendo
            però gli zeri iniziali. Copre la maggior parte dei casi reali. Se i codici sono
            puramente numerici e gli zeri davanti variano, usa <strong>Numerico</strong>.
          </Faq>
          <Faq q="Posso annullare un’operazione?">
            Non c’è un «annulla» dentro l’app, ma l’export è un file nuovo: il tuo file
            originale non viene mai modificato. Conserva sempre il listino di partenza prima di
            esportare.
          </Faq>
          <Faq q="Posso usarlo da telefono?">
            Sì. Su iPhone (Safari) e Android (Chrome) puoi anche installarla come app. L’interfaccia
            è responsive: lo step diventa una colonna sola.
          </Faq>
          <Faq q="L’app dice «nessun match trovato»: cosa controllo?">
            Tre cose, in ordine: 1) le colonne chiave sono quelle giuste? 2) sei in modalità{' '}
            <em>Smart</em>? È quella di default e gestisce automaticamente il caso più frequente
            (codici testo vs numeri). 3) i codici scrivono lo stesso identificatore? Scarica
            l’<strong>elenco no-match</strong> dalla scheda della regola e confronta in Excel.
          </Faq>
          <Faq q="Ho perso tutto chiudendo il browser: si recupera?">
            I dati caricati no — non vengono salvati per privacy. Le <em>regole</em>, però, le
            puoi conservare con «Salva configurazione» e ricaricarle al volo la prossima volta.
          </Faq>
        </Section>

        <Section id="troubleshooting" title={SECTIONS[13].title}>
          <Lead>Cosa fare se qualcosa non torna.</Lead>
          <Ul>
            <Li>
              <strong>Il file non si apre / errore al caricamento</strong> — apri il file in Excel,
              verifica che non sia protetto da password o corrotto. Salva con «Salva con nome» in
              formato <em>.xlsx</em> e ricarica.
            </Li>
            <Li>
              <strong>L’intestazione è sbagliata</strong> — togli la spunta «Prima riga è
              intestazione», oppure rimuovi le righe iniziali in Excel (titolo del documento, righe
              vuote, ecc.) e ricarica.
            </Li>
            <Li>
              <strong>I codici sembrano uguali ma l’app dice «nessun match»</strong> — è quasi
              sempre un problema di tipo: un file salva il codice come testo (<code>"20100376"</code>)
              e l’altro come numero (<code>20100376</code>). Usa la modalità di confronto{' '}
              <strong>Smart</strong> (default), che riconosce automaticamente questo caso. Se anche
              con Smart non trovi match, controlla se ci sono spazi nascosti, accenti o caratteri
              speciali; in alternativa prova <strong>Numerico</strong> se i codici sono solo cifre.
            </Li>
            <Li>
              <strong>I codici non si accoppiano</strong> — usa <em>Smart</em> o, in casi
              residuali, <em>Normalizza</em>. Se non basta, apri entrambi i file e confronta a mano
              una decina di codici per scoprire pattern ricorrenti (es. trattini, prefissi). Dallo
              step 4 puoi scaricare l’<strong>elenco dei no-match in CSV</strong> per indagarli in
              Excel senza filtrare a mano.
            </Li>
            <Li>
              <strong>Accenti corrotti nel CSV</strong> (à, è, ò → caratteri strani) — esporta con
              «UTF-8 con BOM» attivo. È la spunta che fa la differenza per Excel italiano.
            </Li>
            <Li>
              <strong>Numeri con virgola/punto sbagliati</strong> — è un problema della locale del
              tuo Excel. Apri il CSV con «Importa dati» e specifica la lingua, oppure usa il formato
              <code> .xlsx</code>.
            </Li>
            <Li>
              <strong>L’app si blocca con file enormi</strong> — chiudi le altre schede, riapri
              ExelCFR, riprova. Sopra ~200 000 righe può richiedere parecchi secondi anche su computer
              veloci.
            </Li>
            <Li>
              <strong>L’app non si è aggiornata alla nuova versione</strong> — fai un{' '}
              <em>refresh forzato</em>: <kbd>Ctrl/Cmd + Shift + R</kbd>. Se hai installato la PWA,
              chiudila completamente e riaprila.
            </Li>
            <Li>
              <strong>Risultato inatteso o conta dei match strana</strong> — esporta la
              configurazione, condividi il file con qualcuno che possa verificarla, e/o ricarica una
              versione ridotta dei file (prime 100 righe) per isolare il problema.
            </Li>
          </Ul>
        </Section>

        <Section id="note-legali" title={SECTIONS[14].title}>
          <Lead>I punti chiave del disclaimer iniziale, in pillole.</Lead>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-300" size={20} />
              <div className="space-y-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                <p>
                  ExelCFR è gratuito e fornito «così com’è». <strong>Verifica sempre i
                  risultati</strong> prima di usarli per decisioni commerciali, contabili o
                  operative.
                </p>
                <p>
                  <strong>Backup obbligatorio</strong> prima di sovrascrivere colonne esistenti o di
                  esportare file con lo stesso nome dei tuoi originali.
                </p>
                <p>
                  L’autore non si assume responsabilità per perdite economiche, errori di
                  prezzo, problemi con fornitori/clienti o danni derivanti dall’uso o dal
                  malfunzionamento dell’app.
                </p>
                <p>
                  Privacy: tutto resta nel tuo dispositivo, niente raccolta dati, niente cookie di
                  tracciamento.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button type="button" className="btn-secondary" onClick={onOpenDisclaimer}>
                Rileggi le note legali complete
              </button>
            </div>
          </div>
        </Section>

        <Section id="crediti" title={SECTIONS[15].title}>
          <P>
            Sviluppato con Claude Code · Licenza MIT ·{' '}
            <a className="text-brand-700 underline dark:text-brand-300" href={repoUrl} target="_blank" rel="noreferrer">
              Repository su GitHub
            </a>
            .
          </P>
        </Section>
      </article>

      <div className="mt-12 flex justify-between gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>
          <ArrowLeft size={16} /> Torna all’app
        </button>
        <a href="#cos-e" className="btn-ghost">
          ↑ Torna su
        </a>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="border-b border-slate-200 pb-2 text-2xl font-semibold tracking-tight text-slate-900 dark:border-slate-800 dark:text-white">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="text-base italic text-slate-600 dark:text-slate-300">{children}</p>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">{children}</h3>
  );
}

function Ul({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1.5">{children}</ul>;
}

function Li({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

function Note({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm italic text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
      {children}
    </blockquote>
  );
}

function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="bg-slate-50 px-3 py-2 text-left font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2 align-top ${className}`}>{children}</td>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="font-medium text-slate-900 dark:text-white">{q}</p>
      <div className="mt-1.5 text-sm text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}
