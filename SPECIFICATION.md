# SOP Symbolic Lab R1
## Specificație executabilă pentru cunoaștere, sumarizare și completion simbolic

**Versiune:** 0.3.0 · **Data validării:** 8 septembrie 2026 · **Profil de limbaj:** SOP-R1  
**Statut:** prototip executat și testat; nu model lingvistic general și nu implementare MeTTa.

Acest document specifică sistemul din arhiva însoțitoare, nu un sistem imaginar descris ca și cum ar exista. Exemplele de ieșire sunt produse de codul inclus. Secțiunile marcate „propunere R2” nu sunt implementate. Codul executabil, testele, sursele sintetice ale regulilor și rapoartele brute sunt incluse. Nu este necesar un LLM, un GPU, acces la Internet sau instalarea unor pachete npm pentru execuție.

## 1. Rezultatul urmărit și rezultatul obținut

Ipoteza de lucru este că o parte utilă din competența de procesare a textului poate fi reprezentată prin circuite SOP inspectabile, executate de un kernel generic. Nu presupunem că o gramatică mică poate înlocui un model lingvistic general. Testăm o ipoteză mai precisă: din text și cunoaștere reprezentată prin circuite se pot obține rezumate și continuări limitate, cu un traseu verificabil între sursă, interpretare, inferență și formulare.

Sistemul livrează trei comportamente diferite. Sumarizarea extractivă selectează propoziții din text și funcționează fără o analiză semantică completă. Sumarizarea cu agregare simbolică reformulează împreună afirmații pe care gramatica le recunoaște integral. Expansiunea deductivă produce consecințe noi ale afirmațiilor recunoscute și ale regulilor din KB. O operație separată de completion întoarce sufixul unei propoziții susținute de asemenea consecințe, atunci când aceasta începe cu prefixul cerut.

Această distincție este fundamentală. Extragerea unor propoziții relevante nu demonstrează înțelegerea lor completă. Comprimarea unor afirmații nu demonstrează capacitatea de a continua orice text. O concluzie deductivă nu este o predicție probabilistică a următorului token. Folosim denumirea de „sistem simbolic text–text” în acest sens operațional precis.

### 1.1 Situația implementării

| Capacitate | Statut în R1 | Limita relevantă |
|---|---|---|
| CLI cu intrare textuală și ieșire textuală | Implementat și testat | Comenzi și instrucțiuni etichetate explicit |
| Kernel generic și namespace-uri derivate din directoare | Implementat și auditat | Nu este ABI-ul integral al versiunilor SOP anterioare |
| KB autoritativ format din fișiere SOP | Implementat și testat în două domenii | Pack-uri mici, încărcate integral |
| Sumarizare extractivă EN/RO | Implementat și evaluat | Euristici lexicale; nu analiză semantică generală |
| Agregare semantică a afirmațiilor | Implementat | Fragment englez controlat; fallback extractiv |
| Inferență înlănțuită și join între entități | Implementat | Reguli Horn finite, fără generare de termeni funcționali |
| Negație explicită, păstrarea modalității, carantinarea contradicțiilor | Implementat în profilul definit | Nu logică modală completă și nu truth-maintenance complet |
| Completion de prefix susținut | Implementat | Continuă numai o propoziție deja justificată |
| Citarea circuitului, rescriere pură și reexecuție | Implementat și testat | Nu rescriere persistentă tranzacțională multi-utilizator |
| Compilarea automată a faptelor CNL în SOP | Implementat | Nu extragere automată generală a regulilor din manuale |
| Interfață HTTP de formă OpenAI | Subset implementat și testat local | Fără streaming, tools, system prompts sau istoric |
| Container Docker/Podman | Fișiere de configurare furnizate | Nu a fost construit/rulat în mediul de validare |
| Coreferință generală, timp, cuantificatori, credințe, text liber generativ | Neimplementat | Contracte de extensie în secțiunea 22 |

### 1.2 Continuitatea cu SOP Lang

Păstrăm nucleul lexical SOP: declarații `@nume`, referințe de valoare `$nume`, referințe de metadate `~nume`, argumente numite și compoziție prin comenzi care sunt la rândul lor circuite. Nu introducem S-expressions, un fișier Datalog, o gramatică regex externă sau un limbaj separat de reguli pentru autorii KB-ului.

Profilul R1 folosește `@input` și `@output result`, în acord cu una dintre formele documentate anterior. Nu acceptă automat toate antetele `module.declare/module.input/module.output` ale arhivei `sop-symbolic-model-v0.2.0.zip`. Este o implementare de referință separată, nu un patch pretins compatibil binar cu acea arhivă. Documentele și arhivele anterioare nu sunt modificate.

Regula arhitecturală din specificația anterioară „Document Knowledge as SOP Circuits” este păstrată: pack-ul de circuite este sursa autoritativă; obiectele, relațiile și indicii materializați în memorie sunt rezultate de execuție reconstruibile, nu o a doua bază de cunoaștere autorată separat. [S1]

## 2. Ce este realmente util în baza conceptuală MeTTa

### 2.1 O clarificare necesară a nivelului de formalizare

Lucrarea lui Goertzel din 2021 propune formularea MeTTa prin rescriere reflexivă de metagrafuri. Textul însuși precizează că nu oferă o formalizare completă în detaliu. Ideile relevante sunt reprezentarea comună a expresiilor și programelor, diferențierea simbolurilor, variabilelor și operațiilor ancorate în implementare, precum și posibilitatea ca structurile de cunoaștere să transforme alte asemenea structuri. Nu preluăm speculațiile despre AGI drept rezultate demonstrate. [R1]

Lucrarea „Meta-MeTTa” din 2023 este mai operațională: descrie stări, tranziții, substituții și costuri, formulează bisimularea și prezintă traduceri către rho-calculus/rholang. Rezultatele de corectitudine sunt însoțite de **schițe de demonstrație**, nu de un certificat de verificare mecanizată al runtime-ului nostru. Autorii precizează și că semantica prezentată nu tratează versiunile tipate ale MeTTa. Este o sursă utilă de disciplină formală, nu o dovadă că MeTTa sau SOP înțeleg limbajul natural. [R2]

### 2.2 Ce adoptăm și ce construim noi

De aici înainte, formalizarea este **propunerea proprie SOP-R1**, verificată prin implementarea însoțitoare. Nu afirmăm că este o traducere demonstrată echivalentă cu MeTTa. Alegem deliberat un fragment mai mic, pur și determinist, în care putem testa separat reprezentarea, execuția și competența lingvistică.

| Problemă conceptuală | Decizia SOP-R1 | Mecanism executabil |
|---|---|---|
| Datele și programele trebuie inspectate uniform | Un circuit poate fi reificat ca date obișnuite | `kernel.registry.quote` |
| Variabilele trebuie diferențiate de valorile deja calculate | Variabilele logice sunt valori tipate; firele SOP sunt identități de producători | `kernel.logic.variable`, `$`, `~` |
| Aplicarea unui șablon trebuie separată de alegerea lui | Matching-ul produce legări; circuitele stabilesc politica | `kernel.seq.match`, `kernel.logic.query`, `logic.*` |
| Rescrierea nu trebuie să distrugă explicația inițială | Se construiește o versiune nouă, fără mutarea celei vechi | `kernel.value.merge`, `kernel.graph.validate/execute` |
| Alternativa, echivalența și implicația nu sunt același lucru | Sunt menținute ca relații conceptual distincte | Liste de candidați, egalitate structurală, reguli cu premise |
| Execuția incompletă nu înseamnă răspuns fals | Oprirea pe buget este un rezultat/eroare explicită | `flow.fix.complete`, `RESOURCE_LIMIT` |
| Cunoașterea poate fi materializată sau produsă la cerere | Un pack SOP reconstruiește valorile sale | Apelul obișnuit al circuitului pack |

Un sistem de equality saturation precum egglog ilustrează utilitatea combinării deducției și relațiilor de echivalență, dar nu este folosit aici. Nu ar fi corect să unim într-o clasă de echivalență două interpretări incompatibile doar pentru că sunt alternative pentru aceeași propoziție. Nici relația „A implică B” nu autorizează înlocuirea lui A cu B în orice context. [R3]

### 2.3 De ce sintaxa nu este obstacolul central

Un arbore finit de expresii poate fi codificat prin construcția frunzelor și apoi prin record-uri care referă rezultatele copiilor. Un DAG poate păstra partajarea folosind aceeași referință `$copil` în mai mulți părinți. Aceasta este o construcție directă, nu o presupunere despre inteligență.

```sop
@a kernel.value.record kind "symbol" name "A"
@b kernel.value.record kind "symbol" name "B"
@children kernel.seq.make item $a item $b
@expression kernel.value.record kind "application" operator "combine" children $children
@output result $expression
```

Record-ul este construit prin comenzi SOP, nu printr-un literal JSON autorat separat. Un constructor poate avea un număr diferit de argumente sau un tag nou fără schimbarea tokenizerului SOP. Sintaxa permite astfel reprezentarea structurilor de care avem nevoie. Ea nu decide însă ce înseamnă „combine”, când trebuie aplicat, dacă este corect sau ce propoziție naturală exprimă rezultatul.

Ciclurile trebuie tratate separat. Un graf semantic poate reprezenta o relație ciclică prin identificatori de noduri; aceasta nu cere un ciclu de dependențe între producători SSA. R1 respinge ciclurile de evaluare locale, iar recursia apare numai prin apeluri de circuite și combinatori controlați. Nu pretindem echivalență cu toate construcțiile, strategia de evaluare sau efectele MeTTa.

## 3. Granița kernel–competență

Kernelul furnizează mecanisme: valori, colecții, matching, substituție, traversare, apel, introspecție și operații de suprafață asupra textului. Nu conține cunoaștere despre servicii, biblioteci, duplicate, relevanța unui rezultat de experiment sau structura unui rezumat.

În particular, **nu există primitive `summarize`, `understand`, `deriveFact`, `resolvePronoun`, `rankImportantSentences` sau `generateAnswer`**. Există `kernel.seq.sort`, dar formula scorului este un circuit. Există `kernel.logic.query`, dar premisele, concluziile și strategia de saturare sunt circuite. Există `kernel.text.join`, dar alegerea propoziției și realizarea semantică sunt circuite.

O implementare în limbaj gazdă este legitimă pentru o operație generică a cărei utilizare nu depinde de vocabularul unui domeniu. Nu devine legitimă doar pentru că am pus deasupra sa un wrapper SOP. Testul practic este extensia: introducerea predicatelor `loaned`, `overdue`, `return_reminder` și `loan_review` în pack-ul demonstrativ de bibliotecă nu schimbă niciun fișier din `src/`.

### 3.1 O bază conceptuală mică, nu o minimalitate artificială

R1 exportă 43 de comenzi de kernel. Acest număr nu reprezintă 43 de axiome independente. Este un ABI practic cu operatori de conveniență. De exemplu, `map` și `filter` pot fi exprimate prin traversări mai fundamentale, iar diferența de mulțimi poate fi construită prin membership și filtrare. Păstrarea acestor operații generice în kernel reduce overhead-ul fără a transfera acolo competență lingvistică.

Baza conceptuală are șase familii: construcția și observarea valorilor imutabile; algebra secvențelor; operații scalare și asupra suprafeței textului; matching/unificare/substituție; evaluare și control limitat; reificare, validare și execuție reflexivă. Indexarea este o optimizare a matching-ului, nu o nouă semantică a cunoașterii.

O reducere ulterioară a ABI-ului poate muta operatorii derivați în SOP, dar nu ar trebui făcută doar pentru a obține un număr impresionant de mic. Criteriul este costul total: simplitatea implementării, claritatea contractului, auditabilitatea și overhead-ul măsurat.

### 3.2 Componentele gazdă care nu sunt primitive

Parserul SOP, încărcătorul, evaluatorul, validatorul generic al argumentelor și reprezentarea internă a grafului sunt infrastructură de execuție. `src/verify.mjs` este un verificator de admitere pentru profilul semantic finit și un auditor de dovezi. `src/compiler.mjs` serializează interpretări deja produse prin SOP. CLI și serverul validează intrarea și transportă rezultate.

Aceste componente sunt enumerate separat de cele 43 de primitive. Verificatorul de admitere cunoaște schema profilului — câmpuri precum `predicate`, `subject`, `mode` — dar nu decide ce înseamnă un predicat sau ce concluzie urmează din el. Nu este un parser semantic ascuns.

## 4. Modelul valorilor și al identităților

Un circuit produce valori imutabile: `null`, booleeni, numere finite, șiruri, secvențe ordonate și record-uri cu câmpuri numite. Profilul semantic de fapte impune restricții suplimentare asupra acestor valori. Unificatorul generic poate opera pe structuri recursive finite; regulile admise în KB-ul R1 folosesc termeni mai restrânși, pentru a controla spațiul inferenței.

Trebuie distinse patru identități. Numele unui circuit indică definiția încărcată dintr-un fișier. Numele unui fir indică producătorul unui rezultat în acel circuit. Identitatea cadrului indică un apel concret al circuitului. Identitatea unui termen semantic indică o afirmație normalizată, independent de numele firului care a construit-o.

`$x` citește valoarea produsă de `@x`. `~x` întoarce un handle imutabil cu identificator de cadru, circuit, fir, comandă producătoare și hash al valorii. În această implementare, obținerea handle-ului **evaluează mai întâi producătorul**; nu este un mecanism de acces la un rezultat inexistent. Pentru inspectarea unei definiții neexecutate se utilizează `registry.quote`.

### 4.1 Egalitatea și amprentele

Egalitatea structurală compară scalari, ordinea elementelor din secvențe și valorile câmpurilor record-urilor. Ordinea câmpurilor unui record nu este semantică; ordinea unei secvențe este. `hash` utilizează o serializare stabilă și SHA-256 trunchiat la **96 de biți**, reprezentat prin 24 de caractere hexazecimale.

Aceste amprente sunt identificatori de prototip, nu dovezi de autenticitate și nu o garanție de absență a coliziunilor. Hash-ul unei surse text este calculat pe serializarea JSON a șirului decodat, **nu direct pe octeții fișierului**. Nu trebuie confundat cu SHA-256 integral al fișierelor din manifestul distribuției. Un profil de producție trebuie să versioneze algoritmul și să adopte identificatori integrali de 256 de biți, plus semnături unde este necesară autenticitatea.

## 5. Sintaxa executabilă SOP-R1

O definiție este un fișier `.sop`. Namespace-ul se derivă din calea relativă: `sop/text/summary/feature.sop` definește `text.summary.feature`; `src/kernel/logic/query.mjs` definește `kernel.logic.query`. Nu există o listă paralelă de aliasuri care trebuie actualizată pentru fiecare comandă nouă.

O schiță EBNF a profilului este:

```text
module      = declaration* output ;
input       = "@input" identifier [ "default" scalar ] ;
node        = "@" identifier command ( argument value )* ;
output      = "@output" "result" value ;
value       = scalar | "$" identifier | "~" identifier ;
scalar      = JSON-string | finite-number | "true" | "false" | "null" ;
command     = identifier ( "." identifier )* ;
```

Declarația continuă până la următorul token de declarație `@...`, în afara șirurilor și comentariilor. `#` începe un comentariu în afara șirurilor. Tokenii din șiruri sunt date; un `@` sau `#` dintr-un șir nu devine instrucțiune. Valorile obiect și array nu pot fi scrise ca literali; se construiesc prin comenzi.

```sop
@input text
@input limit default 3
@summary text.summarize text $text limit $limit
@output result $summary
```

Un fișier are un singur output. Un input sau fir nu poate avea doi producători. Referințele înaintea declarației sunt permise când graful rămâne aciclic. Referințele nerezolvate, ciclurile locale, literalii numerici nefinți și sintaxa necunoscută sunt respinse.

R1 nu implementează notația `|` pentru alternative. Nu o reinterpretează ca pipeline. Alternativele sunt valori explicite produse de matching și selectate prin circuite. De asemenea, `$record.field` nu este acceptat; se utilizează `kernel.value.get`. Aceste restricții evită introducerea accidentală a unui al doilea evaluator în parser.

### 5.1 Argumente și apeluri

Argumentele primitivelor sunt verificate la nivel de nume, multiplicitate și tip de nivel superior prin `src/contracts.mjs`. Argumentele necunoscute sau repetările nepermise produc eroare. `seq.make`, `seq.concat` și `value.merge` admit repetarea argumentului lor de colecție; `value.record` admite câmpuri arbitrare, fiecare cu o singură valoare.

Combinatorii trimit circuitelor apelate câmpuri suplimentare precum `item`, `index`, `state` sau `iteration`. Un circuit consumă inputurile pe care le declară; câmpurile suplimentare ale mediului sunt ignorate deliberat. Aceasta permite reutilizarea aceluiași record de context de către ramuri cu semnături diferite. Nu este o promisiune de verificare statică integrală a tipurilor.

### 5.2 Încărcarea unei biblioteci

Încărcătorul traversează fișierele în ordine deterministă, respinge symlink-urile și numele invalide sau rezervate `kernel.*`, parsează definițiile într-un registru de staging și publică registrul numai dacă încărcarea reușește. Un test verifică faptul că o definiție validă încărcată înaintea unui duplicat nu rămâne instalată după eșec.

Aceasta este atomicitate a încărcării definițiilor în memorie, nu tranzacție distribuită sau persistență multi-utilizator. Apelurile externe nu pot instala SOP prin endpoint-urile HTTP. Admiterea semantică a pack-ului se face separat; service-ul nu expune o instanță a cărei inițializare a eșuat.

## 6. Semantica operațională propusă pentru SOP-R1

Definim un circuit drept `C = (I, N, o)`, unde `I` sunt intrările, `N` este o mapare de fire către comenzi și argumente, iar `o` este referința de ieșire. Dependența `x → y` există când producătorul lui `y` citește `$x` sau `~x`. Într-un cadru local această relație trebuie să fie aciclică.

Starea conceptuală a evaluării este:

```text
S = (registry, frame, environment, memo, demand, remainingBudget, trace)
```

Implementarea realizează această stare prin obiecte și stiva de apeluri, nu printr-o instrucțiune nouă în SOP. `environment` leagă intrările de valori; `memo` păstrează valorile produse în acel cadru. `demand` este referința necesară pentru ieșire sau pentru calcularea unui argument.

### 6.1 Reguli de evaluare

**Literal.** Evaluarea unui scalar produce scalarul însuși. Niciun text literal nu este executat ca program.

**Citire memoizată.** Dacă `memo[x] = v`, evaluarea lui `$x` întoarce `v` fără reexecutarea producătorului.

**Comandă primitivă.** Pentru un nod necalculat se evaluează argumentele, se validează contractul și se aplică operația generică. Rezultatul este înghețat, memorat și asociat cu evenimentul de trace. Erorile nu sunt transformate în valori logice false.

**Apel de circuit.** Pentru o comandă care denumește un circuit se creează un cadru nou. Inputurile declarate se leagă la valorile argumentelor sau la default-uri. Evaluarea continuă pornind de la ieșirea noului circuit. Cadrele împart același buget al cererii.

**Handle.** `~x` cere valoarea producătorului și construiește metadatele identității de execuție. Modificarea record-ului handle nu poate modifica valoarea originală, deoarece rezultatele sunt imutabile.

**Alegere.** `flow.choose` evaluează condiția deja produsă și apelează numai circuitul ramurii selectate. Referințele ramurilor sunt nume, nu rezultate evaluate anticipat. Un test demonstrează că ramura nealeasă poate avea chiar un nume inexistent fără a fi executată.

**Punct fix limitat.** Pentru transformarea `T` și sămânța `v₀`, calculăm `vᵢ₊₁ = T(vᵢ)`. Dacă egalitatea structurală se păstrează între două iterații, rezultatul are `complete=true`. Dacă se consumă numărul permis de iterații înainte de stabilizare, rezultatul conține valoarea parțială și `complete=false`.

Aceasta este o semantică demand-driven a unui DAG de valori. Nu se execută arbitrar toate declarațiile doar pentru că apar în fișier. Nodurile neatinse de cererea de ieșire nu reprezintă un mecanism implicit de efecte. Un bootstrap care trebuie să includă zece fapte trebuie să le lege efectiv la output-ul pack-ului.

### 6.2 Determinism și echivalență

Pentru aceleași inputuri, registru, versiune Node/ICU, ordine de reguli și limite, operațiile de conținut sunt deterministe. Un header HTTP conține însă timestamp și identificator aleatoriu de transport; acestea nu sunt conținut semantic.

Redenumirea firelor poate păstra rezultatul unui circuit pur fără reflecție, dar nu este o echivalență observațională universală: `quote` și handle-urile fac numele observabile. Similar, reordonarea unei secvențe de candidați poate modifica tie-breaking-ul, deși aceștia ar fi considerați o mulțime într-un model abstract. Optimizările trebuie să precizeze ce observații păstrează.

Nu există o demonstrație de bisimulare între R1 și MeTTa sau între R1 și un runtime SOP anterior. Există teste de conformitate pentru proprietăți concrete. O verificare formală ulterioară trebuie să fixeze explicit observațiile: valoarea, starea de completitudine, proveniența, ordinea alternativelor și comportamentul pe epuizarea bugetului.

### 6.3 Bugetele nu sunt un sandbox complet

Bugetul implicit al unei cereri este de 4.000.000 de pași contorizați; adâncimea apelurilor este limitată la 100. Sunt contorizate noduri, apeluri, traversări, încercări de matching și accesări din query. Costul intern al fiecărui sort, hash, segmentator sau al fiecărei operații recursive de unificare nu este contorizat proporțional cu memoria/CPU-ul consumat.

Prin urmare, `fuel` este un contor de efort util experimental, **nu gas cu taxare completă și nici o limită strictă de timp**. Serverul este sincron în timpul evaluării; timeout-ul HTTP nu poate întrerupe o buclă CPU sincronă. Pentru cod sau trafic ostil sunt necesare procese/worker-e izolate, timeout extern și limite de memorie și CPU.

## 7. ABI-ul efectiv al primitivelor

Semnăturile de mai jos descriu intrările intenționate și comportamentul implementat. `?` indică un argument opțional; `*` indică repetare. Verificarea de tip de nivel superior nu înlocuiește validarea structurilor imbricate sau a tuturor limitelor numerice. Apelul direct al exportului JavaScript ocolește verificarea VM; aceasta este o interfață internă pentru teste, nu o suprafață sigură pentru terți.

### 7.1 Valori

| Comandă | Intrări | Rezultat și contract |
|---|---|---|
| `kernel.value.record` | câmpuri numite, fiecare o valoare | Record imutabil; repetarea aceluiași câmp este eroare |
| `kernel.value.get` | `value`, `key`, `default?` | Câmp propriu sau element de secvență; dacă lipsește, default, implicit `null` |
| `kernel.value.hash` | `value` | Amprentă structurală de 96 de biți, nu semnătură |
| `kernel.value.equal` | `left`, `right` | Egalitate structurală; ordinea secvenței contează |
| `kernel.value.merge` | `value*` record-uri | Record nou; câmpurile mai târzii suprascriu în copia nouă, nu în original |

Proiecția nu traversează implicit o cale cu puncte. O cale mai lungă este un circuit care aplică explicit mai multe proiecții. Hash-urile sunt potrivite pentru deduplicarea demonstrativă, nu pentru aprobarea automată a unei surse ostile.

### 7.2 Secvențe și proiecții indexabile

| Comandă | Intrări | Rezultat și contract |
|---|---|---|
| `kernel.seq.make` | `item*` | Secvență în ordinea argumentelor; zero elemente este permis |
| `kernel.seq.concat` | `items*` secvențe | Concatenare de un nivel |
| `kernel.seq.flat` | `items?`, `depth?=1` | Aplatizare de adâncimea cerută |
| `kernel.seq.count` | `items?` secvență sau șir | Număr de elemente; pentru șir, unități UTF-16 |
| `kernel.seq.take` | `items?`, `count?=1`, `start?=0` | Slice fără mutarea secvenței |
| `kernel.seq.unique` | `items?`, `key?` | Prima apariție a fiecărei valori sau proiecții egale structural |
| `kernel.seq.sort` | `items?`, `key?`, `descending?=false` | Copie sortată stabil; egalitățile păstrează ordinea inițială |
| `kernel.seq.includes` | `items?`, `item` | Membership structural |
| `kernel.seq.range` | `count?=0` | Integere de la 0 la `count-1`; limită 100.000 |
| `kernel.seq.group` | `items?`, `key` | Grupuri `{key, items}` în ordinea primei apariții |
| `kernel.seq.histogram` | `items?` | Mapare cheie-șir → număr; pentru R1 este folosită pe tokeni |
| `kernel.seq.intersection` | `left?`, `right?` | Intersecție structurală unică, în ordinea stângă |
| `kernel.seq.difference` | `left?`, `right?` | Elementele stângi absente în dreapta; nu deduplică automat |
| `kernel.seq.match` | `items?`, `pattern?`, `limit?=128`, `casefold?=false` | Legări pentru potriviri care consumă toată secvența |

`seq.match` nu acceptă expresii regulate de gramatică. Fiecare element al pattern-ului este un literal sau un record construit în SOP cu `kind="capture"`, `name`, `min` și `max`. De exemplu, o captură de subiect urmată de tokenii unei expresii verbale. Matching-ul explorează lungimile de captură în ordine crescătoare și păstrează alternativele; politica ulterioară decide dacă acestea sunt admisibile. Depășirea limitei de alternative produce eroare, nu alegerea secretă a primei interpretări.

Implementarea presupune pattern-uri de încredere cu limite întregi și rezonabile; schema profundă a tuturor capturilor nu constituie încă un sandbox pentru pattern-uri ostile. Pattern-urile emise de biblioteca R1 sunt limitate explicit.

### 7.3 Scalar și suprafață textuală

| Comandă | Intrări | Rezultat și contract |
|---|---|---|
| `kernel.math.op` | `op`, `a?`, `b?` | `add/sub/mul/div/min/max/sqrt/log/lt/le/gt/ge/eq/and/or/not` |
| `kernel.text.tokens` | `text?`, `locale?="en"`, `lower?=false` | Tokeni word-like prin `Intl.Segmenter`; fără POS sau analiză semantică |
| `kernel.text.sentences` | `text?`, `locale?="en"` | Record-uri cu `index`, `text`, `start`, `end` |
| `kernel.text.lower` | `text?` | Normalizare NFKC și lowercase |
| `kernel.text.join` | `items?`, `separator?=""` | Concatenare textuală |
| `kernel.text.slice` | `text?`, `start?`, `end?` | Subșir folosind coordonate UTF-16 |
| `kernel.text.prefix` | `text?`, `prefix?` | Test literal, case-sensitive, de început de șir |
| `kernel.text.contains` | `text?`, `part?` | Test literal de includere |
| `kernel.text.index` | `text?`, `part?` | Prima poziție sau `-1` |
| `kernel.text.trim` | `text?` | Elimină whitespace-ul de la margini |

Aritmetica refuză operanzi nefinți, overflow-ul rezultatului, împărțirea la zero și domeniile invalide pentru log/sqrt. Operatorii logici cer booleeni; `eq` compară structural. Nu există primitive lingvistice mascate drept aritmetică.

Segmentarea este un serviciu generic de suprafață. Dicționarele stopword, markerii de context, termenii blocați, formele verbale și realizările propozițiilor se află în SOP. Rezultatele sunt reproductibile pentru versiunea runtime-ului folosit; versiuni ICU diferite pot schimba unele limite de propoziții sau cuvinte.

### 7.4 Apel, traversare și control

| Comandă | Intrări | Rezultat și contract |
|---|---|---|
| `kernel.flow.map` | `items?`, `circuit`, `with?` | Aplică circuitul pe `item`, `index` și context |
| `kernel.flow.filter` | aceleași | Păstrează elementele pentru care circuitul produce o valoare truthy |
| `kernel.flow.fold` | `items?`, `seed`, `circuit`, `with?` | Traversează cu `state`, `item`, `index`; stare nouă la fiecare pas |
| `kernel.flow.choose` | `condition`, `then`, `else`, `with?` | Apelează numai ramura selectată |
| `kernel.flow.call` | `circuit`, `with?` | Apel după nume sau referință reificată verificată prin hash |
| `kernel.flow.fix` | `seed`, `circuit`, `with?`, `limit?=12` | `{value, complete, iterations}`; limita este între 1 și 100 |

Combinatorii sunt mecanisme, nu planificatoare semantice. `map` nu știe dacă aplică un analizor de limbaj, o regulă sau un calcul numeric. Numele circuitelor din argumente sunt referințe către același registru SOP, nu instrucțiuni dintr-un DSL separat.

### 7.5 Matching logic și substituție

| Comandă | Intrări | Rezultat și contract |
|---|---|---|
| `kernel.logic.variable` | `name` | Record `{kind:"variable", name}` |
| `kernel.logic.unify` | `left`, `right`, `bindings?`, `partial?=false` | `{success, bindings}`; include occurs-check |
| `kernel.logic.substitute` | `term`, `bindings?` | Termen instanțiat; variabila rămasă nelegată produce eroare |
| `kernel.logic.query` | `facts?`, `patterns?`, `limit?=1000`, `indexKey?="predicate"` | Legări și martori pentru conjuncția pattern-urilor |

Unificarea caută o substituție care face structurile compatibile. Occurs-check respinge, de exemplu, legarea unei variabile la o structură care o conține. Potrivirea parțială a record-urilor permite pattern-ului să ceară numai unele câmpuri; secvențele cer în continuare lungime egală.

`query` operează pe înregistrări generice cu `id` și `term`; nu știe ce înseamnă câmpurile termenului. Produce rânduri cu `bindings` și `witnesses`, în ordinea premiselor. Indicele este construit după o cheie de proiecție, implicit `predicate`, și cache-uit pe identitatea secvenței de fapte. Când această secvență se schimbă, este necesar alt indice. Ordinea premiselor este cea furnizată de circuit; nu există optimizator sofisticat de join.

### 7.6 Reflecție

| Comandă | Intrări | Rezultat și contract |
|---|---|---|
| `kernel.registry.quote` | `name` | Definiție SOP reificată: inputuri, noduri, output, hash |
| `kernel.ref.inspect` | `handle` | Verifică și expune metadatele handle-ului |
| `kernel.graph.validate` | `program` | Reprezentare de graf validată și reamprentată |
| `kernel.graph.execute` | `program`, `with?` | Execută graful într-un cadru anonim nou |

Un graf reificat nu este cod JavaScript. `graph.validate` serializează numai subsetul SOP admis, îl parsează, verifică referințele și existența comenzilor și limitează numărul de noduri la 512. Nu poate introduce `eval`, acces la filesystem sau o comandă neregistrată prin injectarea unui șir.

## 8. Fapte, reguli și dovezi ca circuite

Un termen de afirmație din profilul semantic R1 are exact câmpurile:

```text
(predicate, subject, object, polarity, mode, scope)
```

Aceste nume apar în schema profilului, nu în tokenizer. `predicate`, `polarity`, `mode` și `scope` sunt șiruri constante în regulile admise. `subject` și `object` pot conține variabile logice în pattern-uri; într-un fapt sunt șiruri. `object=""` reprezintă un predicat unar în această convenție.

```sop
@term sem.term
  predicate "retries"
  subject "Atlas"
  polarity "positive"
  mode "asserted"
@output result $term
```

`sem.term` este el însuși un circuit SOP construit peste `value.record`. Nu există clasă JavaScript `RetriesFact`. Extinderea vocabularului înseamnă alte valori și circuite, nu alt kernel.

Un fapt adaugă `id`, `proofId`, `sources`, `parents`, `rule` și `sentence`. Un fapt din input are lista de părinți goală, sursa intervalului de text și un indice de propoziție. Un fapt derivat are părinții care au satisfăcut premisele, identitatea regulii și intervalul sursă al regulii. Arborele de dovadă poate fi urmărit până la input și manual.

### 8.1 Nu confundăm statutul epistemic cu adevărul

`asserted` înseamnă că parserul sau circuitul sursă a reprezentat o afirmație, nu că lumea reală a confirmat-o. `possible` și `required` păstrează două modalități de suprafață, fără a le converti în afirmații actuale. `polarity="negative"` este negație explicită; absența unui fapt nu produce automat forma sa negativă.

R1 nu implementează semantica generală a credinței, necesității, obligației, probabilității sau timpului. Aceste câmpuri nu trebuie prezentate drept o logică modală completă. Regulile actuale consumă numai premise `asserted` și produc concluzii `asserted`; predicatele rezultate pot reprezenta explicit un risc sau o cerință de analiză din modelul demonstrativ.

### 8.2 Exemple concrete de regulă autorată în SOP

Următoarea structură este chiar regula demonstrativă de risc de duplicare; sursa exactă este în fișierul executabil `sop/kb/rules/duplicate.sop`.

```sop
@x kernel.logic.variable name "entity"
@p0 sem.term predicate "retries" subject $x polarity "positive"
@p1 sem.term predicate "writes" subject $x polarity "positive"
@p2 sem.term predicate "deduplicates" subject $x polarity "negative"
@body kernel.seq.make item $p0 item $p1 item $p2
@head sem.term predicate "duplicate_risk" subject $x
@source kernel.value.record
  source "examples/manual.txt"
  hash "9fb102f9d41a1894e54c9ee2"
  start 0
  end 133
  quote "Within this model, a service that retries requests and writes records without deduplicating requests has a risk of duplicate records."
@rule kernel.value.record
  id "kb.rules.duplicate"
  body $body
  head $head
  source $source
@output result $rule
```

Textul sursă este **o stipulație sintetică a experimentului**, nu o regulă generală de inginerie validată independent. Concluzia spune „risc”, nu „duplicarea s-a produs”. Acesta este exact tipul de calificare pe care un coding agent nu are voie să îl piardă în compilare.

## 9. Inferența este o bibliotecă SOP

`logic.apply_rule` apelează matcher-ul generic pe premisele regulii. Pentru fiecare rând, `logic.conclude` substituie variabilele capului și construiește un `sem.fact` cu martorii potrivirii. `logic.step` aplică regulile peste faptele acceptate, unește rezultatele cu starea și deduplică după identitatea termenului. `logic.run` folosește un punct fix limitat și filtrează rezultatul pentru suport valid.

Formal, pentru un set admisibil de fapte `F` și o regulă `r`, o substituție `θ` este productivă când fiecare premisă instanțiată este susținută în `F`. Pasul produce `θ(head(r))` și un martor ordonat pentru premise. Nu aplicăm contrapozitivul, inversa implicației sau raționament prin absență.

### 9.1 Contradicții și dependențe

Dacă pentru același predicat, subiect, obiect, mod și scope există polarități opuse, ambele afirmații sunt contestate. Circuitele `logic.not_conflicted` și `logic.supported` nu permit utilizarea lor drept suport necontestat. O concluzie ale cărei premise au devenit contestate este filtrată, inclusiv prin verificarea recursivă a părinților.

Faptele brute nu sunt șterse: rămân în `closure.raw` pentru audit. `closure.facts` este proiecția admisă. Această separare împiedică mascarea contradicției prin pierderea istoriei. Totuși, nu este o implementare completă de logică paraconsistentă sau truth-maintenance cu toate dovezile alternative.

### 9.2 Limita unei singure dovezi canonice

R1 păstrează primul fapt pentru fiecare `id` de termen. Dacă același termen are două demonstrații, acestea nu sunt păstrate ca două suporturi independente. Dacă primul suport devine contestat, un suport ulterior valid poate fi pierdut. Rezultatul este incomplet în mod conservator; nu trebuie prezentat ca inferență completă în prezența contradicțiilor și a dovezilor alternative.

`complete=true` înseamnă că algoritmul implementat s-a stabilizat, nu că s-au obținut toate consecințele tuturor formalizărilor posibile ale sursei. Limita și ordinea regulilor contează; trebuie păstrate în audit. Separarea identității termenului de `proofId` pregătește o extensie cu dovezi multiple, dar această extensie nu este deja implementată.

### 9.3 Ce putem argumenta despre corectitudine

Pentru premise reprezentate corect, reguli admise corect și implementarea corectă a matching-ului, fiecare pas de deducție produce un cap instanțiat prin aceeași substituție care satisface premisele. Prin inducție pe adâncimea unui arbore de dovadă aciclic, fiecare concluzie are un suport în faptele sursă și regulile acceptate.

Acesta este un argument de corectitudine **relativ la reprezentare**, nu o dovadă că parserul a înțeles textul sau că manualul este adevărat. `auditProofs` implementează un checker separat pentru potrivirea termenilor ground, fără a reutiliza unificatorul ori evaluatorul de reguli al kernelului. Verifică amprente, intervale de sursă, premise, capete și existența părinților. Nu poate demonstra singur că o regulă exprimă fidel sensul citatului său.

### 9.4 Terminare și cost

Profilul de admitere cere variabile ale capului prezente în premise, câmpuri scalare sau variabile pe pozițiile permise și corpuri finite. Nu creează entități noi prin termeni funcționali de adâncime crescătoare. Pentru un univers finit și reguli pozitive fără asemenea construcții, numărul termenilor ground posibili este finit; deduplicarea oprește repetarea lor. Limita de iterații protejează suplimentar execuția.

Nu este implementată evaluarea semi-naivă: toate regulile sunt încă vizitate la fiecare rundă. Existența unui indice de query după predicat nu rezolvă selecția unui număr mare de circuite sau costul join-urilor cu cardinalitate mare. Aceasta rămâne o direcție explicită de lucru, nu o problemă declarată rezolvată prin alegerea formalismului.

## 10. Interpretarea limbajului natural în R1

Lexiconul de bază conține zece intrări, fiecare cu forme pentru afirmație pozitivă, negativă, posibilitate și obligație. O intrare este un circuit `language.en.entry`; expresiile sunt text obișnuit tokenizat, nu pattern-uri regex. Formele includ predicate unare și o relație binară de partajare a stocării.

Parserul construiește pattern-uri din tokenii formei și capturi de una până la opt cuvinte pentru subiect și, unde este cazul, obiect. Sunt încercate toate intrările. O propoziție este acceptată semantic numai dacă rămâne un singur termen distinct și potrivirea consumă toată secvența de tokeni. Mai multe interpretări incompatibile duc la abținere, nu la alegerea arbitrară a primei variante.

### 10.1 Barierele introduse prin testare

Versiunea inițială segmenta în cuvinte înainte de a proteja citatele și întrebările. În consecință, o afirmație între ghilimele sau o întrebare putea deveni fapt. Aceasta a fost o eroare reală, detectată prin teste, nu doar un risc discutat teoretic.

Versiunea curentă verifică mai întâi markeri de punctuație și blochează semantic propozițiile care conțin ghilimele, apostrof, semn de întrebare/exclamare, două puncte, punct și virgulă sau paranteze. O listă SOP separată blochează subiecți care conțin markeri de cuantificare, raportare, condiționalitate, negație, modalitate sau pronume neclarificate.

Aceste filtre sunt **conservatoare și imperfecte**. Ele pot refuza un nume cu apostrof sau o afirmație legitimă cu paranteze. Nu reprezintă un parser general pentru discurs citat, un analizor de cuantificatori sau o garanție împotriva oricărei formulări înșelătoare. Cazurile neacoperite trebuie tratate ca lipsă de interpretare.

### 10.2 Identitatea entităților și acoperirea

Potrivirea formelor poate ignora diferențe de case, dar identitatea semantică a entității păstrează forma capturată. Nu există entity linking: `Atlas`, `ATLAS`, `the service` și `it` nu sunt reunite automat. Nu este permisă transformarea absenței unei asemenea legături într-o concluzie negativă.

La nivelul `language.parse`, faptele identice sunt deduplicate. De aceea, două propoziții identice pot împărți un singur fapt și poate fi pierdută evidența celei de-a doua ocurențe. Compilatorul offline poate raporta o acoperire incompletă pentru asemenea duplicate. Este o limită cunoscută a profilului cu un singur suport, nu un motiv pentru a declara automat întregul document interpretat.

Româna este evaluată numai pentru sumarizare extractivă. Nu există în această distribuție un lexicon semantic românesc sau o realizare semantică românească. Un nou asemenea lexicon poate fi adăugat în SOP, dar aceasta trebuie demonstrată separat, nu presupusă din utilizarea Unicode.

## 11. Sumarizare extractivă: algoritmul exact

Metodele non-neurale de sumarizare extractivă există independent de acest proiect; TextRank este un exemplu istoric de abordare bazată pe graf. Algoritmul R1 **nu este TextRank**: nu calculează PageRank și nu folosește embeddings. Este o funcție explicită de selecție lexicală și contextuală exprimată în SOP. [R4]

Fie `Wᵢ` mulțimea tokenilor de conținut din propoziția `i`, după normalizare și eliminarea stopword-urilor. `df(w)` este numărul de propoziții care conțin tokenul. Definim:

```text
frequency(i) = sum(df(w), w in Wᵢ) / sqrt(max(|Wᵢ|, 1))
position(i)  = 1 / (i + 1)
cue(i)       = min(sum(cueWeight(token), token in sentence_i), 1.4)
query(i)     = |Wᵢ intersection Q| / sqrt(max(|Wᵢ|, 1))

base(i) = frequency(i) + 0.35 * position(i)
          + cue(i) + 1.8 * query(i)
```

Dicționarul de stopword-uri, dicționarul de cue-uri și coeficienții sunt fișiere SOP. Nu se deduce importanța semantică completă din aceste scoruri. Ele sunt euristici inspectabile, cu erori măsurabile.

Pentru mulțimea curentă de propoziții selectate `S`, se calculează o preferință marginală:

```text
novelty(i,S) = |Wᵢ minus Covered(S)| / max(|Wᵢ|, 1)
redundancy(i,S) = max(Jaccard(Wᵢ, Wⱼ), j in S), implicit 0
score(i,S) = base(i) + 0.65 * novelty(i,S) - 1.35 * redundancy(i,S)
```

Se alege candidatul eligibil cu scorul maxim, cu tie-breaking stabil. La sfârșit, propozițiile sunt readuse în ordinea sursei. Bugetul este exprimat în număr de propoziții, nu în tokeni. Nu există compresie sintactică ascunsă în acest mod.

### 11.1 Context înainte de selecție, nu după

O propoziție care începe cu un marker precum un pronume sau un conector dependent poate fi inutilizabilă fără context. R1 construiește pentru ea un mic cluster cu propoziția precedentă și continuă înapoi cât timp markerii indică dependență, până la limita de opt niveluri. Clusterul este eligibil numai dacă încape integral în buget și are un început acceptabil.

Acesta este un mecanism de protecție contextuală, **nu rezolvare de coreferință**. Nu dovedește că antecedentul corect este propoziția imediat precedentă. De exemplu, o referință la o entitate introdusă cu două paragrafe înainte poate rămâne neclară. În schimb, mecanismul evită cazul simplu în care sistemul selectează numai „It failed because...” și elimină complet propoziția precedentă.

### 11.2 Proprietăți și limite

Output-ul extractiv este alcătuit numai din intervale copiate exact din input. Este verificabil prin `source.slice(start,end)`. Totuși, selectarea unei propoziții adevărate dintr-un context de ipoteză poate schimba interpretarea întregului pasaj; exactitatea copierii nu este o garanție de fidelitate semantică a selecției.

Repetiția lexicală poate favoriza detalii administrative. Cue-urile pot avantaja propoziții cu anumite cuvinte fără a le face importante. O idee centrală formulată fără vocabular repetitiv poate fi omisă. Un asemenea eșec este păstrat în setul de evaluare, nu eliminat pentru a crește scorul.

## 12. Sumarizare prin agregare simbolică

`text.summarize_semantic` începe cu aceeași selecție. Parsează inputul și verifică dacă propozițiile selectate au corespondente semantice acceptate, afirmative în sens epistemic și necontestate. Numărul propozițiilor selectate trebuie să coincidă cu numărul faptelor acceptate relevante pentru selecție; cazurile deduplicate sau neacoperite pot produce fallback.

Când condiția este satisfăcută, realizările predicatelor sunt selectate din lexicon, grupate după subiect și unite printr-un circuit de coordonare. `Atlas retries requests. Atlas writes records.` poate deveni `Atlas retries requests and writes records.`. Forma negativă rămâne negativă. Nu se adaugă concluzii din reguli într-un rezumat al afirmațiilor sursă.

Dacă textul selectat conține modalități, contradicții, ambiguități sau propoziții nerecunoscute, rezultatul are `method="extractive-fallback"`. Nu fabrică o parafrază aproximativă și nu pretinde că o propoziție nerecunoscută a fost înțeleasă.

Prin această separare se evită o eroare frecventă de evaluare: un rezumat care conține un avertisment dedus poate fi util, dar nu mai este doar rezumatul documentului. Expansiunea și sumarizarea trebuie să rămână operații distincte, chiar dacă o interfață ulterioară le prezintă în secțiuni alăturate.

## 13. Expansiune și completion simbolic

### 13.1 Expansiune deductivă

`text.expand` parsează sursa, combină faptele recunoscute cu faptele pack-ului, execută inferența și selectează concluzii susținute. Pentru a evita emiterea de cunoaștere fără legătură cu cererea, R1 păstrează numai concluziile al căror subiect apare între subiecții recunoscuți în input. Aceasta este o politică simplă de relevanță, nu un planificator semantic general.

Concluziile sunt realizate prin circuite SOP. Un realizer nu ar trebui să întărească afirmația: un predicat de risc se verbalizează ca risc, nu ca eveniment cert. Reguli și realizări noi trebuie testate împreună, pentru că un cap logic corect poate deveni o propoziție naturală incorectă printr-un template nepotrivit.

În R1, selecția concluziilor urmează ordinea stabilă în care au fost derivate și limita cerută. Nu există încă un scor de utilitate, noutate sau importanță pentru aceste concluzii. Nu există planificare de paragrafe și nici generare stilistică liberă.

### 13.2 Completion de prefix

`text.complete` construiește propoziții susținute, le filtrează prin `text.prefix` și întoarce sufixul primei potriviri. Invariantul testat este:

```text
prefix + result.text == result.completedSentence
```

Acea propoziție are un fapt și o dovadă asociate. Dacă nu există potrivire, `matched=false` și textul este gol. Acesta este un completion literal și grounded. Nu modelează distribuția următorului token și nu continuă o poveste în orice direcție plauzibilă.

Limita internă pentru lista inițială de concluzii examinate de completion este 100, iar apelul său de expansiune folosește default-ul de 12 runde. Argumentul HTTP `rounds` controlează `expand`; în profilul curent nu schimbă acest apel intern din `complete`. Această diferență trebuie păstrată explicit până la unificarea interfețelor, nu ascunsă sub afirmația de compatibilitate deplină.

### 13.3 Abținerea

Un rezultat gol înseamnă „nu am o continuare susținută în acest profil și buget”, nu „propoziția este falsă” și nici „nu există nicio consecință posibilă”. CLI scrie o explicație pe stderr. HTTP include `sop.abstained=true`. Într-o interfață finală ar trebui prezentată și acoperirea semantică, nu doar un șir gol.

## 14. Simulare completă executată

Exemplul de mai jos folosește manualul sintetic inclus, cele patru afirmații sursă și nicio informație despre servicii reale. Trace-ul integral este în `reports/demo-trace.json`; nu a fost trunchiat în rularea raportată.

### 14.1 Intrarea

```text
Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests. Harbor shares storage with Atlas.
```

Sunt recunoscute patru afirmații. Primele trei au subiectul Atlas; a patra reprezintă o relație de la Harbor la Atlas. Fiecare păstrează intervalul său exact din input. Negația celei de-a treia nu este inferată din lipsă, ci extrasă din forma explicită `does not deduplicate requests`.

### 14.2 Runda 1

Regula `kb.rules.duplicate` unifică aceeași variabilă de subiect cu Atlas în toate cele trei premise. Obiectul gol, scope-ul și modul trebuie de asemenea să se potrivească. Se construiește `duplicate_risk(Atlas)` cu trei martori. Regula pentru un serviciu protejat prin deduplicare nu se activează, deoarece cere polaritate pozitivă pentru acel predicat.

### 14.3 Runda 2

`kb.rules.dedup_review` folosește riscul deja derivat și produce o cerință de revizuire pentru Atlas. Regula binară `kb.rules.shared_impact` unește relația `shares(Harbor, Atlas)` cu `duplicate_risk(Atlas)`; produce cerința de analiză a integrării pentru Harbor. Nu transferă riscul în mod nejustificat ca `duplicate_risk(Harbor)`.

### 14.4 Runda 3

Nu mai apare niciun termen nou. Sunt patru fapte sursă și trei concluzii. Verificatorul independent validează cele șapte înregistrări și legăturile lor cu sursele și regulile. Aceasta verifică derivația în modelul demonstrativ, nu adevărul extern al modelului.

### 14.5 Rezultatele efective

**Agregarea simbolică:**

```text
Atlas retries requests, writes records and does not deduplicate requests. Harbor shares storage with Atlas.
```

**Expansiunea:**

```text
Atlas has a risk of producing duplicate records when requests are retried. Harbor requires an integration review because a component sharing its storage is at risk of duplicate records. Atlas requires a review of the deduplication strategy.
```

**Prefix:** `Atlas has a risk of `

**Sufixul întors:**

```text
producing duplicate records when requests are retried.
```

Acesta este semnalul pozitiv urmărit: un text controlat devine fapte; faptele activează circuite de reguli; o relație între două entități produce o concluzie nouă; o formulare verificabilă este construită fără un model neuronal la runtime.

### 14.6 Metaprogramarea executată

`reflection.demo` citează definiția `core.identity`, construiește în SOP un nou record de output, îl îmbină cu graful original, validează versiunea nouă și o execută. Originalul întoarce `The original circuit remains unchanged.`; versiunea nouă întoarce `The rewritten circuit returns a different value.`. Handle-ul rezultatului identifică `kernel.graph.execute` drept producător.

Aceasta demonstrează mecanica reificare–transformare–validare–execuție. Nu demonstrează descoperirea automată a unei rescrieri utile, optimizarea autonomă a unui model sau menținerea unei baze de cunoaștere modificate concurent.

## 15. Cum trebuie să transforme un coding agent un manual în circuite

Procedura de autorare este parte din specificație. Faptul că un coding agent poate genera cod nu face automat corectă formalizarea documentului. Agentul poate lucra offline cu un LLM, dar artefactul executat ulterior trebuie să fie inspectabil și independent de acel model.

### 15.1 Contractul sursei

Se păstrează textul original, versiunea, identificatorul și convenția de coordonate. În R1, intervalele sunt half-open `[start,end)` în unități UTF-16 asupra șirului exact citit. Normalizarea spațiilor, traducerea sau schimbarea newline-urilor înainte de calculul hash-ului schimbă sursa. O copie normalizată trebuie să aibă alt identificator și o mapare explicită la original.

Fiecare unitate semantică produsă trebuie să indice un interval verificabil. Un citat cu hash corect dovedește integritatea referinței, nu corectitudinea interpretării. Aceasta din urmă trebuie evaluată separat prin revizuire și teste contrastive.

### 15.2 Delimitarea unității semantice

Agentul decide dacă pasajul conține o afirmație despre o instanță, o regulă generală, o definiție, o condiție, o excepție, o recomandare, o ipoteză sau o relatare despre afirmația altei persoane. Nu poate transforma un exemplu într-o regulă universală și nu poate confunda „poate”, „ar trebui” sau „autorii afirmă” cu „se întâmplă”.

Pentru R1, agentul poate promova automat numai termeni din profilul finit și reguli cu cuantificare implicită universală asupra variabilelor legate în corp, fără existențiale sau funcții generatoare. Alte structuri trebuie refuzate pentru inferență sau păstrate ca material opac pentru sumarizare extractivă. Introducerea unei scheme richer în SOP este posibilă arhitectural, dar nu îi conferă automat o semantică în motorul actual.

### 15.3 Alegerea circuitelor existente

Agentul caută mai întâi constructori și competențe reutilizabile. Pentru o afirmație R1 folosește `sem.term` și `sem.fact`. Pentru o regulă folosește variabile logice, termeni de premise, secvența corpului, termenul capului și sursa. Pentru o formă lexicală folosește `language.en.entry`. Nu adaugă o ramură în JavaScript doar pentru că vede un nou substantiv sau verb.

Un nou constructor semantic poate fi un circuit care compune record-uri și alte circuite. Agentul trebuie însă să arate cine interpretează noua structură. Un record numit `causality` care nu este consumat de niciun circuit nu demonstrează raționament cauzal.

### 15.4 Livrabilul unui pack

Un pack conține fișiere SOP pentru fapte, reguli, lexicon, realizări și un bootstrap care le compune. Sursele originale și testele sunt fișiere auxiliare, nu KB alternativ. Output-ul bootstrap-ului R1 are `facts`, `rules`, `lexicon`, `realizers` și opțional metadate precum `name`.

```sop
@document learned.document
@facts kernel.value.get value $document key "facts"
@base kb.default
@rules kernel.value.get value $base key "rules"
@lexicon kernel.value.get value $base key "lexicon"
@realizers kernel.value.get value $base key "realizers"
@pack kernel.value.record
  facts $facts
  rules $rules
  lexicon $lexicon
  realizers $realizers
@output result $pack
```

Acesta este un exemplu de compoziție; circuitul `learned.document` trebuie să existe în pack-ul utilizatorului. Nu este inclus ca modul fictiv deja disponibil în biblioteca de bază. Comanda `ingest` poate genera un asemenea modul de document din afirmațiile CNL recunoscute.

### 15.5 Validarea înainte de promovare

Mai întâi se parsează toate fișierele și se verifică numele, dependențele și primitivele folosite. Apoi se verifică schema termenilor, variabilele capului, absența termenilor funcționali neacceptați, existența realizărilor și unicitatea regulilor. Urmează verificarea fiecărui hash și interval de sursă și un audit separat al interpretării semantice.

Testele obligatorii includ cazul pozitiv, absența fiecărei premise, inversarea polarității, modalitatea, contradicția, schimbarea entității și un caz de formulare apropiată care nu trebuie interpretată ca regulă. Pentru o relație binară este necesar un test care detectează join-ul accidental pe entitatea greșită.

Promovarea se face numai după pornire într-un runtime curat și reproducerea acelorași fapte și rezultate într-un al doilea runtime. Reproducerea nu trebuie să depindă de un cache local, de o stare ascunsă în conversația coding agentului sau de o modificare JavaScript neînregistrată.

### 15.6 Criteriul pentru o primitivă nouă

Agentul nu decide singur că o competență nouă justifică extinderea kernelului. Propunerea trebuie să demonstreze că operația este generică în minimum două domenii fără vocabular comun, să specifice intrările, rezultatele, efectele și erorile și să compare implementarea primitivă cu o compoziție SOP. Un avantaj de performanță trebuie măsurat, nu presupus.

Adăugarea unei primitive doar pentru a ascunde un parser sau un generator specializat în host code respinge pack-ul. Adăugarea unui index generic sau a unei operații generice de graf poate fi justificată, dar necesită teste de conformitate și o versiune nouă de ABI.

## 16. Compilarea offline existentă și extensia de domeniu testată

`node cli.mjs ingest` parsează textul prin aceleași circuite SOP și serializează interpretările acceptate ca alte circuite SOP. În mod implicit, un interval nerecunoscut oprește compilarea. `--allow-partial` permite emiterea faptelor recunoscute, dar marchează explicit acoperirea incompletă. Serializerul nu inventează reguli din manual și nu conține un extractor semantic JavaScript.

Pack-ul de transfer din `examples/library_kb/` conține două intrări lexicale, două reguli și un bootstrap. Manualul său sintetic stipulează că un obiect împrumutat și restant necesită un reminder de returnare, iar un obiect pentru care este necesar reminder-ul necesită o analiză a împrumutului.

```bash
printf 'BookQ is on loan. BookQ is overdue.' | \
  node cli.mjs expand --library examples/library_kb --pack library.pack
```

Rezultatul executat este:

```text
BookQ needs a return reminder. BookQ needs a loan review.
```

Aceasta este o extensie reală de competență în SOP, deși rămâne un domeniu mic și o gramatică controlată. Nu au fost schimbate primitivele pentru `BookQ`, pentru împrumuturi sau pentru formularea reminder-ului. Testul este arhitectural: nu măsoară automatizarea generală a lecturii unui manual arbitrar.

## 17. CLI, transport și container

### 17.1 Rulare locală

Este necesar Node.js 22 sau ulterior. Nu există dependențe npm. Din rădăcina arhivei:

```bash
node cli.mjs help
node cli.mjs summarize --sentences 3 --file articol.txt
node cli.mjs semantic-summary --sentences 4 --file examples/facts.txt
node cli.mjs expand --file examples/facts.txt
node cli.mjs complete --prefix "Atlas has a risk of " --file examples/facts.txt
node cli.mjs expand --file examples/facts.txt --json
node cli.mjs expand --file examples/facts.txt --trace reports/my-trace.json
node cli.mjs ask "Summarize: Textul de analizat."
```

`ask` recunoaște numai o etichetă înaintea primului `:`: `summarize`, `summary`, `rezumă`, `rezuma`, `expand`, `continue`, `complete` sau `semantic-summary`. Restul textului, inclusiv alte caractere `:`, este păstrat. Nu este un classifier general de intenții. Instrucțiunile neacoperite primesc un răspuns de operație nesuportată, nu sunt trimise către un LLM ascuns.

Textul normal este scris pe stdout; erorile și mesajul de abținere merg pe stderr. Cu `--json` se emit și structurile de rezultat. `--trace` salvează trace-ul cererii, cu o limită implicită de 10.000 de evenimente și indicator explicit dacă aceasta a fost depășită. Scriptul de simulare folosește o limită mai mare pentru a păstra trace-ul său complet.

### 17.2 Serverul HTTP

```bash
node cli.mjs serve --host 127.0.0.1 --port 8000
```

Sunt implementate `GET /health`, `GET /v1/models`, `POST /v1/chat/completions` și `POST /v1/completions`. Forma răspunsurilor urmează câmpurile de bază ale endpoint-urilor respective, dar aceasta este o **interfață subset**, nu conformitate integrală cu API-ul OpenAI. [R5]

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "sop-symbolic-r1",
    "messages": [{"role":"user","content":"Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests."}],
    "task": "expand",
    "temperature": 0,
    "max_sentences": 3
  }'
```

Cererea chat acceptă exact un mesaj `user` cu conținut șir. Istoricul și mesajele `system` nu sunt ignorate: sunt refuzate. `stream=true`, tools, mai multe variante, temperatură diferită de zero, multimodalitate, response formats și parametri necunoscuți sunt refuzați. Nu există `usage` inventat, deoarece sistemul nu folosește tokenizerul unui model OpenAI. Bugetul de propoziții este câmpul propriu `max_sentences`, nu `max_tokens`.

Un SDK care permite un singur mesaj user și câmpuri suplimentare poate utiliza acest transport; nu a fost validat fiecare SDK/UI. Multe interfețe adaugă automat mesaje system sau parametri neacceptați și vor necesita adaptare. Prefixul pentru completion și sursa pe care se bazează consecința sunt câmpuri separate, nu sunt deduse magic dintr-un prompt liber.

### 17.3 Limite și izolare

Corpul JSON este limitat la 128 KiB; textul are maximum 65.536 de unități UTF-16; query și prefix au maximum 4.096. Limita de propoziții este între 1 și 12, iar parametrul `rounds` între 1 și 32. Locale-ul expus este `en` sau `ro`. Fiecare cerere primește o instanță de execuție și un cache de query separate; definițiile circuitelor sunt reutilizate, nu faptele documentului anterior.

Serverul nu implementează autentificare, TLS, cote pe utilizator, worker pooling sau timeout CPU preemptiv. Este destinat loopback-ului ori unui mediu izolat de cercetare. Header-ele de autentificare eventual trimise de un client nu transformă serverul într-un serviciu autentificat.

### 17.4 Containerul furnizat

```bash
docker build -t sop-symbolic-r1 .
docker run --rm -i sop-symbolic-r1 expand < examples/facts.txt
docker compose up --build
```

Dockerfile-ul folosește Node 22 Alpine și un utilizator non-root. Compose leagă portul numai pe loopback, activează filesystem read-only, elimină capabilitățile și specifică limite de resurse. Fișierele sunt furnizate ca configurație de pornire. **Docker și Podman nu erau disponibile în mediul de validare; build-ul și execuția containerului nu sunt raportate drept teste trecute.** Pentru reproducere strictă trebuie fixat și digest-ul imaginii, nu numai tag-ul mutabil.

## 18. Validarea efectivă și interpretarea rezultatelor

Rularea documentată are **101 teste automate trecute din 101**, fără teste sărite. Suita acoperă parserul, SSA, memoizarea, imutabilitatea, unificarea, occurs-check, matching-ul de secvențe, join-uri, bugete, negație/modalitate/contradicție, proveniență, agregare, prefix, extensie de domeniu, compilare offline, reflecție, încărcare atomică, CLI și HTTP real pe un port local efemer.

Aceste teste verifică proprietăți funcționale. Numărul lor nu este un scor de inteligență. Cazurile generate într-o matrice sunt prezentate separat, nu adunate ca și cum ar fi 64 de sarcini NLP independente.

### 18.1 Rezultate de sumarizare

Evaluarea conține 18 documente sintetice redactate pentru acest experiment, în engleză și română. Opt sunt cazuri de dezvoltare; zece au fost rezervate pentru rularea ulterioară, fără reajustarea coeficienților după examinarea lor. Același autor a creat și adnotat seturile: split-ul rezervat **nu este un benchmark independent sau o evaluare oarbă**.

Metrică: pentru fiecare document se marchează propozițiile considerate importante și se măsoară proporția lor recuperată în selecție; se face apoi media pe documente. Comparația este cu primele `k` propoziții, la același buget. Nu este factual accuracy, ROUGE sau evaluare umană de fluență.

| Set | Documente | Recall mediu al propozițiilor importante | Baseline primele k |
|---|---:|---:|---:|
| Dezvoltare | 8 | 89,58% | 41,67% |
| Rezervat, același autor | 10 | 80,00% | 43,33% |
| Total | 18 | 84,26% | 42,59% |

Toate cele 18 ieșiri extractive trec verificarea copierii exacte a intervalelor selectate. Sunt patru documente românești în set. Aceste rezultate arată un semnal util pentru selecția în exemplele studiate, nu generalizare demonstrată la presă, cărți, contracte sau texte științifice lungi.

Un eșec important este cazul `holdout-open-science`: sistemul recuperează numai una dintre cele trei propoziții importante și preferă detalii administrative repetitive. Raportul păstrează inputul, selecția și output-ul acestui eșec. Nu au fost schimbate cue-urile pentru a-l face să treacă după observare.

### 18.1.1 Verificare retrospectivă pe proză tehnică preexistentă

Separat de cele 18 fixture-uri, sumarizatorul a fost executat pe un fragment din documentul anterior al proiectului „Document Knowledge as SOP Circuits”, care nu fusese scris pentru acest sumarizator. După eliminarea titlurilor și blocurilor de cod, inputul are 608 cuvinte și 39 de propoziții. Selecția de cinci propoziții are 88 de cuvinte și păstrează exact intervalele sursă.

Rezumatul surprinde producerea unui pack SOP, reconstruirea unităților semantice, bootstrap-ul și extensia lexicală. Totuși, omite interdicția explicită de a modifica kernelul pentru vocabular nou. Este un semnal calitativ util, nu o demonstrație de acoperire integrală. Sursa descrie o versiune anterioară a proiectului; afirmațiile sale despre acea versiune nu sunt capabilități suplimentare ale R1. Rezultatele sunt în `reports/retrospective.json` și nu sunt amestecate cu scorul setului autorat.

### 18.2 Completion și contraexemple

Cele 15 cazuri semantice de dezvoltare includ lanțuri valide, negație explicită, modalitate, absență, contradicție, relatare, condiționalitate, citat, întrebare, entități diferite și input gol. Snapshot-ul inițial trece 13/15 și greșește la citat și întrebare. După corectarea circuitelor de interpretare, versiunea curentă trece 15/15.

Separat, matricea de 64 de combinații pentru trei predicate folosește stările `unknown`, `positive`, `negative`, `both`. Toate combinațiile au rezultatul așteptat. Numele entităților sunt variate, iar așteptările sunt calculate independent de executor. Acest test validează politica de evidență pentru o familie de reguli, nu acoperirea lexicală generală.

### 18.3 Audit și microbenchmark

Biblioteca activă are 114 fișiere SOP și 43 de comenzi primitive. Pack-ul demonstrativ de transfer adaugă alte cinci fișiere SOP în directorul de exemple. Auditul verifică existența comenzilor referite direct, absența unor termeni de domeniu și a operațiilor de shell/LLM/network în fișierele primitivelor și absența unui KB semantic autorat ca JSON în `sop/`.

Un microbenchmark verifică egalitatea dintre o căutare indexată și o scanare pe 50.000 de fapte sintetice. Indexul are 1.000 de valori de predicat, iar query-ul selectează 50 de fapte. Pașii contorizați sunt 50.050 pentru construirea indexului plus prima căutare și 50 pentru o căutare cu indice deja construit. Aceasta validează o optimizare punctuală; nu demonstrează scalarea inferenței cu milioane de fapte sau sute de mii de reguli.

Timpii locali și mediul exact sunt în `reports/benchmark.json` și `VALIDATION.md`. Sunt măsurători într-un proces pe o mașină CaaS partajată, nu promisiuni de latență pe hardware-ul utilizatorului. Nu există evaluare GPU, paralelă sau multi-tenant.

## 19. Ce demonstrează semnalul și ce nu

Semnalul pozitiv are trei componente. Sumarizarea lexicală explicită depășește baseline-ul simplu pe setul mic autorat. Agregarea și expansiunea produc texte inteligibile pe fragmentul semantic definit și păstrează un suport inspectabil. Un domeniu nou se adaugă prin SOP, ceea ce testează direct granița dintre kernel și competență.

Nu este demonstrată suficiența unei asemenea biblioteci pentru limbaj natural deschis. Nu este demonstrată o metodă de învățare care ar produce automat milioane de circuite utile. Nu este demonstrat controlul căutării la acea scară. Niciun număr de exemple cu predicate manual definite nu elimină aceste întrebări.

Concluzia utilă nu este „am obținut deja un LLM simbolic general”, ci: **există un traseu executabil și falsificabil, fără LLM la runtime, de la text și KB în SOP la selecție, agregare și continuare deductivă.** Putem acum măsura unde se rupe traseul și dacă extinderea competențelor rămâne compozițională.

## 20. Amenințări și limite de încredere

Intrarea textuală nu este executată ca SOP, shell sau JavaScript. O propoziție care conține o instrucțiune de ignorare a regulilor nu modifică registrul. Totuși, poate deveni text selectat de sumarizator; acesta nu este un filtru universal de prompt injection pentru sistemele care îi vor consuma output-ul.

Un coding agent poate introduce o regulă falsă, un template înșelător sau o formalizare care pierde o condiție. Verificarea intervalului sursă și tiparea structurii nu detectează automat această problemă. Este necesară admitere cu review semantic și teste independente de agentul care a scris regula.

Un pack SOP neîncrezător poate consuma resurse excesive prin recursie, combinatorică sau valori mari. Runtime-ul nu oferă acces la filesystem prin primitive, dar rămâne un program executat în același proces. Limitele de efort nu acoperă fiecare alocare. Nu trebuie expusă încărcarea arbitrară de pack-uri unor utilizatori neautentificați.

Negația de tip open-world înseamnă că lipsa datelor nu produce concluzii negative. Aceasta poate reduce numărul răspunsurilor. Invers, presupunerea că sursa este completă doar fiindcă fișierul a fost citit integral ar fi o eroare: acoperirea textuală, acoperirea parserului și închiderea epistemică sunt noțiuni diferite.

Rezumatele pot pierde calificări importante prin selecție chiar când nu modifică niciun caracter din propozițiile păstrate. Completion-ul poate reproduce o regulă neadevărată dacă aceasta a fost aprobată în KB. Faptul că rezultatul are o dovadă formală nu transformă automat premisele într-un adevăr despre lume.

## 21. Contractele de acceptare pentru continuarea proiectului

Orice nouă competență trebuie să fie identificabilă prin circuitele care o implementează, sursele pe care se sprijină și testele care o pot falsifica. Nu este suficient să crească numărul fișierelor SOP sau să apară un output plauzibil.

Pentru extinderea gramaticală, criteriul este păstrarea sensului pe perechi contrastive: afirmație/negație, posibil/faptic, relatare/fapt relatat, antecedent alternativ, cuantificator diferit. Pentru generare, fiecare afirmație trebuie să fie o realizare admisă a unui termen sau un fragment sursă păstrat cu context. Pentru sumarizare, trebuie măsurate separat selecția ideilor și fidelitatea semantică a rezumatului.

Pentru creșterea KB-ului, trebuie demonstrată reconstruirea din SOP într-un runtime curat și stabilitatea costului cererilor care nu au legătură cu noile circuite. Un milion de fișiere încărcate și scanate la fiecare cerere ar infirma arhitectura de activare rară, chiar dacă testele funcționale mici ar continua să treacă.

Pentru kernel, orice primitivă nouă necesită motivare generică și teste care nu folosesc doar domeniul care a cerut-o. Interpretoarele semantice și politicile de selecție rămân în SOP. O implementare accelerată poate înlocui un combinator numai dacă se compară diferențial cu implementarea de referință, inclusiv pe ordine, bugete și rezultate incomplete.

## 22. Extensii R2 propuse, neimplementate

### 22.1 Dovezi multiple și actualizare corectă

Separăm `termId` de o mulțime `proofId`. O concluzie rămâne acceptabilă dacă există cel puțin o dovadă cu toți părinții acceptabili și fără conflict relevant. Indicii inversi termen–dovezi și părinte–descendenți permit retractarea suportului fără ștergerea celorlalte justificări. Dovada circulară fără un suport de bază nu poate autojustifica termenul.

Contractul de validare trebuie să includă două demonstrații ale aceleiași concluzii, contestarea uneia și păstrarea celeilalte; precum și cazul în care toate suporturile dispar. Nu este suficientă schimbarea cheii de deduplicare de la `id` la `proofId`, fiindcă numărul dovezilor poate crește exploziv în cicluri. Sunt necesare reprezentare partajată și politici explicite de compresie a suporturilor.

### 22.2 Activare pe delta, nu scanare globală

Fiecare regulă poate furniza în SOP o descriere a predicatelor, arităților și condițiilor de activare. Un index generic reconstruibil mapează forma unui fapt nou către regulile candidate. Runda următoare procesează numai combinații de premise care includ cel puțin un fapt din delta. Query-ul păstrează martorii, nu doar existența unei soluții.

Selecția trebuie separată de corectitudine: un index exact poate exclude sigur reguli incompatibile; un top-k euristic nu poate pretinde exhaustivitate. Dacă un buget sau un scor exclude ramuri posibile, cererea trebuie să rămână marcată drept incompletă. Performanța se măsoară pe creștere de domenii nerelevante, pe joins adversariale și pe recursie, nu doar pe lookup după predicat.

### 22.3 Parser compozițional și graf de alternative

Un chart poate conține elemente `(category, start, end, semanticHandle, alternatives, cost)`. Circuitele de gramatică combină intervale și construiesc circuite semantice, nu clase lingvistice în kernel. Se pot partaja subanalize identice și menține mai multe interpretări fără clonarea întregului graf.

Un kernel nou de chart nu este obligatoriu pentru primul experiment: record-uri, matching, grupare și punct fix pot exprima un baseline. Un accelerator generic devine justificabil după măsurare. Contractul trebuie să distingă explicit lipsa unei analize, o singură analiză, mai multe analize și căutarea trunchiată. Construcții precum cuantificarea, negația cu scope și discursul relatat cer reprezentări și reguli de compoziție, nu numai mai multe expresii lexicale.

### 22.4 Timp, modalitate și atribuirea afirmațiilor

Scope-ul actual este o etichetă simplă. R2 trebuie să poată reprezenta propoziții despre propoziții, contexte de credință și intervale temporale fără a le aplatiza în fapte globale. Un citat poate construi un obiect `Claim` legat la vorbitor, iar o afirmație despre existența acelui citat nu implică adevărul conținutului său.

Regulile de trecere între contexte trebuie să fie circuite auditate. Nu se introduce o primitivă universală „understand modality”. Pentru fiecare familie de contexte se cer perechi de exemple în care aceeași suprafață lexicală duce la concluzii diferite din cauza scope-ului.

### 22.5 Expansiune explicativă și definitorie

Dincolo de consecința deductivă, un planner SOP poate selecta definiții, exemple și premise explicative asociate termenilor din document. Planul de paragraf ar trebui să specifice actele discursive și dovezile: definiție, consecință, excepție, exemplu declarat sau lipsă de informație. Realizer-ele verifică acordul și conectivele, iar checker-ul împiedică prezentarea unui exemplu ca fapt despre entitatea curentă.

O expansiune mai lungă nu este automat mai informativă. Se măsoară noutatea față de input, suportul fiecărei afirmații, redundanța și utilitatea pentru întrebarea utilizatorului. Nu este nevoie să simulăm stochasticitate pentru a numi rezultatul completion; este nevoie să definim ce fel de continuare produce.

### 22.6 Rescriere persistentă și promovarea circuitelor învățate

R1 transformă un graf într-un cadru izolat. R2 ar trebui să introducă un protocol de propunere a patch-ului, validare structurală, verificarea dependențelor, rularea suitei de regresie, aprobare și publicarea unei versiuni noi. Referințele de versiune veche rămân reproductibile. Cache-urile sunt invalidate după dependențe, nu golite arbitrar sau reutilizate sub aceeași identitate.

Noile circuite generate din documente nu trebuie instalate imediat ca reguli globale. O etapă de carantină poate permite execuția numai în contextul sursei, până când reutilizarea și generalizarea au fost validate. Separarea între cunoaștere despre o instanță și competență generală este un contract de promovare, nu o deducție implicită din asemănarea a două fișiere.

## 23. Reproducerea experimentului

```bash
npm test
npm run evaluate
node tools/evaluate.mjs --initial
npm run demo
npm run audit
node tools/benchmark.mjs
node tools/check-pack.mjs
node tools/check-pack.mjs \
  --library examples/library_kb \
  --pack library.pack \
  --source examples/library-manual.txt
```

`--initial` încarcă efectiv biblioteca SOP înghețată din `experiments/iteration-0/sop/`, nu doar reetichetează rezultatele curente. Astfel, erorile inițiale la citate și întrebări pot fi reproduse. Evaluarea curentă și cea inițială sunt în fișiere diferite. Testele automate curente trebuie să treacă; snapshot-ul inițial este păstrat tocmai pentru a demonstra cele două eșecuri, nu pentru a trece aceeași suită.

Rapoartele JSON sunt rezultate ale execuției, nu KB autorativ. `reports/test-run.txt` conține ieșirea test runner-ului. `reports/demo-trace.json` conține inputul, faptele, regulile aplicate, output-urile și evenimentele de execuție. `reports/architecture-audit.json` enumeră inventarul și amprenta surselor gazdă. `VALIDATION.md` și `SIMULATION.md` oferă prezentarea lizibilă a acelorași rezultate.

## 24. Decizia tehnică

Nu este necesar să adoptăm sintaxa sau runtime-ul MeTTa pentru a experimenta cu reprezentare comună a programelor și cunoașterii, matching, substituție și reflecție. SOP poate exprima structurile necesare, iar prototipul demonstrează o parte utilă din mecanismele respective.

Dificultatea reală nu este însă eliminată printr-un evaluator scurt. Ea se mută în corectitudinea formalizării surselor, acoperirea compozițională a limbajului, administrarea dovezilor și a contextelor, controlul căutării și calitatea politicilor de selecție și generare. Tocmai de aceea această versiune păstrează un kernel generic, teste contrastive și rezultate brute, inclusiv eșecuri.

**Verdict:** continuarea experimentului este justificată. Există un semnal executabil de sumarizare și completion simbolic limitat, și un test reușit de extindere numai prin SOP. Următoarea investiție justificată este în dovezi multiple, activare incrementală și gramatică compozițională măsurată, nu în creșterea necontrolată a numărului de primitive sau în declararea prematură a unui model lingvistic general.

## Referințe și proveniență

**[R1]** Ben Goertzel. *Reflective Metagraph Rewriting as a Foundation for an AGI “Language of Thought” — Toward a Formalization of OpenCog Hyperon’s MeTTa Language in Terms of Algebraic Metagraph Rewriting*. arXiv:2112.08272v1, 2021. Consultat în forma HTML; sursă conceptuală, nu dependență software. `https://arxiv.org/html/2112.08272v1`

**[R2]** Lucius Gregory Meredith, Ben Goertzel, Jonathan Warrell, Adam Vandervorst. *Meta-MeTTa: an operational semantics for MeTTa*. arXiv:2305.17218v1, 2023. Relevante: stări și tranziții; bisimulare; costuri; schițele demonstrațiilor 7.1–7.2; delimitarea privind tipurile din concluzie. `https://arxiv.org/html/2305.17218v1`

**[R3]** Yihong Zhang și colaboratorii. *Better Together: Unifying Datalog and Equality Saturation*. arXiv:2304.04332v4, 2023. Background pentru posibile backends viitoare; egglog nu este inclus sau executat aici. `https://arxiv.org/html/2304.04332v4`

**[R4]** Rada Mihalcea, Paul Tarau. *TextRank: Bringing Order into Text*. EMNLP 2004, pp. 404–411. Background pentru sumarizarea non-neurală; algoritmul R1 nu implementează TextRank. `https://aclanthology.org/W04-3252/`

**[R5]** OpenAI. *Create chat completion — API Reference*. Documentație oficială consultată la 8 septembrie 2026. Folosită numai pentru delimitarea formatului transportului, nu pentru inferență sau pentru un apel API în prototip. `https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create/`

**[S1]** *Design Specification 22: Document Knowledge as SOP Circuits*, `22-DOCUMENT-KNOWLEDGE-AS-CIRCUITS.md`, document anterior al proiectului, regăsit în Library. Regula păstrată: circuitele SOP sunt sursa autoritativă, iar proiecțiile de execuție sunt reconstruibile.

**[S2]** Arhivele anterioare `sop-symbolic-model-v0.2.0.zip` și `sop-sllm-complete.zip`, consultate pentru convenții și continuitate. R1 nu este declarat merge sau înlocuitor compatibil al acestor distribuții. Niciun rezultat de testare al lor nu este prezentat ca rezultat al versiunii curente.
