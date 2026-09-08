# Protocol pentru coding agent: documente → circuite SOP

**Țintă:** SOP Symbolic Lab 0.3.0, profil R1. Specificația normativă și limitele implementării sunt în `SPECIFICATION.md`. Acest ghid este o instrucțiune de lucru, nu o afirmație că transformarea unui manual arbitrar este deja automatizată.

## Mandatul agentului

Citești o sursă și produci un pack de circuite SOP care reconstruiește faptele, regulile și competențele lingvistice necesare. Nu modifici `src/` pentru a introduce vocabularul, regulile, clasificările sau template-urile sursei. Nu emiți un JSON semantic ca KB autoritativ, un fișier Prolog/Datalog, o gramatică regex sau cod JavaScript executat printr-un literal SOP.

Poți utiliza un LLM în timpul autorării offline. Pack-ul livrat trebuie să funcționeze după închiderea sesiunii agentului, fără LLM și fără artefacte ascunse. Datele de test, rapoartele JSON și sursele originale sunt permise ca material auxiliar; cunoașterea executabilă promovată rămâne în `.sop`.

## Începe de la un runtime curat

Rulează `npm test` și `npm run audit` înainte de modificări. Notează hash-ul surselor gazdă din `reports/architecture-audit.json`. Examinează `sop/sem/`, `sop/language/en/`, `sop/logic/` și `examples/library_kb/`. Reutilizează constructorii existenți în loc să inventezi un limbaj de reguli paralel.

Numele unei comenzi este calea fișierului: `my_pack/rules/reminder.sop`, încărcat din rădăcina potrivită, devine `rules.reminder`. Pentru a obține namespace-ul `library.reminder`, structura este `examples/library_kb/library/reminder.sop` și rădăcina de încărcare este `examples/library_kb`.

Nu introduce aliasuri care ascund această mapare. Nu suprascrie `kernel.*` și nu presupune că `module.declare` sau operatorul `|` sunt acceptate de parserul R1.

## Etapa A — Conservarea sursei și a calificărilor

Păstrează sursa exactă. Un interval este `[start,end)` în unități UTF-16, nu în octeți și nu în număr de code points Unicode. Folosește aceleași newline-uri ca în fișierul citit de runtime. Orice transformare de text înaintea extragerii trebuie documentată și să aibă alt identificator de sursă.

În acest prototip, hash-ul sursei se calculează prin funcția `hash` din `src/generic.mjs`, pe șirul complet. Este SHA-256 trunchiat la 96 de biți peste serializarea stabilă a valorii. Nu utiliza din greșeală comanda `sha256sum` ca și cum ar produce aceeași amprentă.

Exemplu de instrument offline pentru calculul coordonatelor:

```bash
node --input-type=module - <<'JS'
import {readFile} from 'node:fs/promises';
import {hash} from './src/generic.mjs';
const text = await readFile('examples/library-manual.txt', 'utf8');
const quote = text.split('\n')[0];
const start = text.indexOf(quote);
console.log({hash: hash(text), start, end: start + quote.length, quote});
JS
```

Acest script nu este o competență semantică la runtime. Este tooling de autorare pentru a evita coordonate sau amprente fabricate.

Pentru fiecare pasaj, decide explicit dacă este fapt, definiție, regulă, exemplu, ipoteză, recomandare, excepție sau afirmație relatată. Nu elimina expresii precum „în acest model”, „în anumite condiții”, „poate”, „nu”, „de regulă” sau „autorii susțin”. Nu transforma un risc în eveniment produs.

## Etapa B — Alegerea reprezentării admisibile

Un termen R1 are câmpurile `predicate`, `subject`, `object`, `polarity`, `mode`, `scope`. Acestea sunt date de profil construite de `sem.term`, nu cuvinte rezervate ale tokenizerului SOP. Instanțele au câmpuri scalare; pattern-urile pot avea variabile logice în `subject` și `object`.

Regulile admise sunt finite și range-restricted: toate variabilele capului apar în corp. Predicatul nu este o variabilă, iar capul nu generează un obiect nou printr-un constructor funcțional. Negația este explicită; lipsa unei premise nu o satisface. Corpurile și capetele actuale folosesc `mode="asserted"`.

Când pasajul necesită cuantificatori existențiali, timp, identități contextuale sau credințe, nu îl aplatiza într-un termen mai simplu pentru a face testul să treacă. Raportează-l drept neacoperit sau propune o extensie SOP cu interpretoare și teste proprii. Un record nou nu dobândește automat sens executabil.

## Etapa C — Construirea circuitelor

O regulă are o structură ca aceasta; exemplul este schematic pentru un pack nou, nu o comandă deja înregistrată:

```sop
@x kernel.logic.variable name "item"
@loaned sem.term predicate "loaned" subject $x
@overdue sem.term predicate "overdue" subject $x
@body kernel.seq.make item $loaned item $overdue
@head sem.term predicate "return_reminder" subject $x
@source mypack.sources.reminder
@rule kernel.value.record
  id "mypack.rules.reminder"
  body $body
  head $head
  source $source
@output result $rule
```

Circuitul `mypack.sources.reminder` trebuie să construiască sursa reală cu hash și interval corecte. Nu folosi hash-uri placeholder într-un pack candidat la promovare. Variabila `@x` este un fir SOP care conține o **variabilă logică**; `$x` transmite acea valoare în pattern. Nu confunda identitatea firului cu legarea ulterioară a variabilei logice la o entitate.

O intrare lexicală reutilizează circuitul existent:

```sop
@entry language.en.entry
  predicate "overdue"
  positive "is overdue"
  negative "is not overdue"
  possible "may be overdue"
  required "must be overdue"
@output result $entry
```

O realizare derivată poate fi un record construit în SOP:

```sop
@entry kernel.value.record
  predicate "return_reminder"
  positive "needs a return reminder"
@output result $entry
```

Agentul verifică sensul și al formelor lingvistice, nu doar sintaxa lor. Același fragment negativ nu este obligatoriu adecvat tuturor predicatelor; nici o regulă modală nu se obține doar prin adăugarea cuvântului „must”.

## Etapa D — Bootstrap și proprietatea KB-ului

Bootstrap-ul returnează `facts`, `rules`, `lexicon` și `realizers`. Fiecare valoare trebuie să fie reconstruită prin executarea circuitelor. O proiecție în array-uri sau indexuri este normală în memorie, dar nu devine un fișier semantic paralel pe care autorul trebuie să îl întrețină manual.

Pentru fapte CNL, există serializer-ul offline:

```bash
node cli.mjs ingest --file examples/facts.txt > learned-document.sop
```

Output-ul este un circuit care returnează fapte și acoperire. Nu este automat un pack complet cu reguli și lexicon. Compilatorul nu extrage singur reguli generale din manuale. `--allow-partial` este o acceptare explicită a acoperirii incomplete și trebuie păstrată în raport; nu este permisiunea de a prezenta documentul ca înțeles integral.

## Etapa E — Testele care trebuie scrise înainte de promovare

Pentru fiecare regulă, scrie un caz pozitiv cu entități care nu apar în sursa regulii. Apoi elimină pe rând fiecare premisă și verifică abținerea corespunzătoare. Inversează polaritatea, înlocuiește faptul cu o posibilitate sau obligație, adaugă o contradicție și schimbă identitatea unei entități dintr-un join.

Pentru o formă lexicală, testează o întrebare, un citat, o relatare și o propoziție condițională lexical apropiate. Ele nu trebuie transformate în afirmația directă. Testează o formulare cu două interpretări distincte și verifică abținerea, nu selectarea primei variante.

Pentru o realizare, verifică faptul că output-ul nu introduce cantități, timp, cauzalitate, certitudine sau universalitate suplimentară. O concluzie de tip `risk` trebuie să rămână risc. Un exemplu trebuie marcat drept exemplu.

Nu codifica răspunsul întreg ca literal asociat inputului de test și nu introduce numele entității de test în regula generală. Un test de transfer cu nume noi și combinații noi trebuie să producă rezultatul prin matching, substituție și compoziție.

## Etapa F — Admitere structurală, surse și execuție curată

Pack-ul inclus poate fi verificat astfel:

```bash
node tools/check-pack.mjs \
  --library examples/library_kb \
  --pack library.pack \
  --source examples/library-manual.txt
```

Instrumentul verifică numele comenzilor referite direct, schema pack-ului, siguranța variabilelor, realizările și sursele. Pentru mai multe surse se repetă `--source`. Raportul de verificare nu dovedește că formalizarea este fidelă sensului manualului; această afirmație necesită revizuirea semantică separată.

Pornește două runtime-uri curate și compară termenii și rezultatele. Reexecută toate testele existente. Rulează auditul și verifică faptul că hash-ul surselor gazdă nu s-a schimbat pentru o extensie pur semantică. În raport, separă modificările de cod, circuitele noi, sursele, cazurile pozitive, cazurile de abținere și limitările rămase.

## Când se oprește promovarea

Promovarea este respinsă când o regulă nu are sursă, pierde o calificare materială, produce o variabilă nelegată, depinde de absență fără un contract explicit de lume închisă, introduce o primitivă specifică domeniului, pretinde acoperirea unui fenomen pe care niciun circuit nu îl interpretează sau îmbunătățește exemplele noi stricând regresiile existente.

O propunere care eșuează poate rămâne în carantină ca experiment. Nu trebuie eliminată din raport. Diferența dintre un sistem extensibil și o colecție de demonstrații favorabile este tocmai capacitatea de a păstra și explica eșecurile.

## Raportul final cerut coding agentului

Raportul trebuie să spună ce este implementat, ce s-a executat, ce s-a modificat pentru a corecta un eșec și ce nu este încă susținut. Include comenzi reproductibile, rezultate brute și un exemplu end-to-end cu sursă, termeni, substituții, concluzii și textul final. Nu folosi numărul fișierelor sau al testelor ca argument de inteligență generală.
