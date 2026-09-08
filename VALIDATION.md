# Raport de validare — SOP Symbolic Lab R1 / 0.3.0

Rulare locală pe v22.16.0, ICU 77.1, linux/x64. Datele provin din execuția codului inclus. Timpii sunt observații locale, nu garanții. Data de referință a distribuției: 8 septembrie 2026.

## Rezultatul funcțional

**101/101 teste automate trecute**, 0 eșecuri. Suitele sunt `tests/core.test.mjs` și `tests/http.test.mjs`. Logul brut este `reports/test-run.txt`.

Testele includ parser, SSA, imutabilitate, memoizare, unificare cu occurs-check, joins, bugete, surse, contradicții, modalitate, query-uri indexate, reflecție, compilare în SOP, extensie de domeniu, izolare între cereri, CLI prin stdin și HTTP real pe un port local efemer. Nu toate căile tuturor primitivelor au o dovadă formală sau un test separat.

Cele 15 cazuri de completion și matricea de 64 de combinații apar și în testele funcționale. **Nu se adună cu numărul de teste ca și cum ar reprezenta sarcini independente.** Matricea este un singur test parametrizat asupra unei familii de reguli.

## Sumarizare: rezultat și metodologie

Setul conține 18 documente scurte sintetice, dintre care patru în română. Opt sunt de dezvoltare și zece au fost rezervate. Același autor a conceput metoda, exemplele și adnotările: nu este o evaluare independentă, o competiție publică sau un rezultat comparativ cu un LLM.

Metrică: proporția propozițiilor importante din adnotarea autorului care apar în selecție, mediată pe documente. Baseline: primele k propoziții, la același buget. **Recall-ul propozițiilor importante nu este factual accuracy.** O propoziție poate fi copiată exact și totuși să fie nepotrivită sau scoasă din context.

| Set | Documente | Recall mediu | Primele k |
|---|---:|---:|---:|
| Dezvoltare | 8 | 89.58% | 41.67% |
| Rezervat, același autor | 10 | 80.00% | 43.33% |
| Total | 18 | 84.26% | 42.59% |

Verificarea intervalelor sursă trece pentru 18/18 ieșiri extractive. Nu este o măsurătoare independentă a adevărului sau a completitudinii semantice.

### Toate cazurile, fără eliminarea celor nereușite

Indicii de propoziție din tabel sunt zero-based. Coeficienții sunt în `sop/text/summary/config.sop` și nu au fost modificați după examinarea setului rezervat.

| Caz | Limbă | Gold | Selectat | Recall | Primele k |
|---|---|---|---|---:|---:|
| dev-cache | en | [0,3,5] | [0,3,5] | 100.00% | 33.33% |
| dev-sensor | en | [0,3,5] | [0,3,5] | 100.00% | 33.33% |
| dev-queue | en | [0,2,5] | [0,2,5] | 100.00% | 66.67% |
| dev-library | en | [0,3,5] | [0,3,5] | 100.00% | 33.33% |
| dev-ro-cache | ro | [0,2,5] | [0,2,5] | 100.00% | 66.67% |
| dev-negative-result | en | [0,3,5] | [0,3,5] | 100.00% | 33.33% |
| dev-long-distractor | en | [0,2,5] | [1,2,5] | 66.67% | 66.67% |
| dev-query | en | [3,5] | [1,3] | 50.00% | 0.00% |
| holdout-backup | en | [0,3,6] | [0,3,6] | 100.00% | 33.33% |
| holdout-bus | en | [0,3,5] | [0,2,5] | 66.67% | 33.33% |
| holdout-compression | en | [0,3,5] | [0,3,5] | 100.00% | 33.33% |
| holdout-ro-school | ro | [0,2,5] | [0,2,5] | 100.00% | 66.67% |
| holdout-ro-network | ro | [0,3,5] | [0,3,5] | 100.00% | 33.33% |
| holdout-open-science | en | [0,3,5] | [1,3,4] | 33.33% | 33.33% |
| holdout-no-cue | en | [0,3,5] | [0,2,5] | 66.67% | 33.33% |
| holdout-privacy | en | [0,2,5] | [0,1,5] | 66.67% | 66.67% |
| holdout-garden | en | [0,3,5] | [0,1,3] | 66.67% | 33.33% |
| holdout-ro-archive | ro | [0,2,5] | [0,2,5] | 100.00% | 66.67% |

### Un rezumat reușit în română

```text
Echipa a evaluat un cache pentru a reduce latența căutărilor în documente. Cache-ul a redus latența mediană cu 35 la sută. Totuși, actualizările au lăsat intrări învechite, iar echipa a decis să amâne lansarea.
```

Inputul complet și toate celelalte ieșiri sunt păstrate în `reports/evaluation.json`.

### Eșec păstrat: holdout-open-science

Input:

```text
The project published an executable reproduction of the simulation study. The repository contains a banner designed by the communications team. The authors presented the repository at a departmental meeting. Independent reruns reproduced the main trend but not the reported confidence interval. The issue tracker also contains requests for a different website theme. The mismatch was traced to an undocumented filtering step in the original analysis.
```

Output:

```text
The repository contains a banner designed by the communications team. Independent reruns reproduced the main trend but not the reported confidence interval. The issue tracker also contains requests for a different website theme.
```

Este recuperată numai una dintre cele trei propoziții importante. Repetiția lexicală și scorurile euristice selectează și detalii administrative. Nu am adăugat reguli special-caz pentru a ascunde acest eșec. Semnalul de sumarizare este pozitiv pe medie, dar acest exemplu infirmă orice pretenție de selecție semantică robustă generală.

## Test retrospectiv pe un document tehnic preexistent

Sursa este un document anterior al proiectului utilizatorului, nu un text nou creat pentru aceste euristici. După eliminarea titlurilor și blocurilor de cod: 608 cuvinte, 39 propoziții. Output: 88 cuvinte, 5 propoziții, intervale sursă exacte: true.

```text
A document-processing agent may read arbitrary source material, but its durable output is a **circuit pack made of SOP Lang files**. A knowledge circuit is an ordinary SOP circuit. For every useful semantic unit, generate an ordinary SOP circuit that reconstructs that unit from constants, terms, atoms, rules, and other circuits already available. Create a document bootstrap circuit that invokes the knowledge circuits and materializes their results. When the document introduces useful new vocabulary or a new natural-language construction, generate additional SOP language circuits in the same pack.
```

Rezumatul surprinde pack-ul SOP, reconstruirea cunoașterii, bootstrap-ul și extensia lexicală. Omite însă interdicția explicită de a modifica kernelul pentru vocabular nou. Este o verificare calitativă, fără scor gold, neamestecată cu cele 18 fixture-uri. Sursa descrie o implementare anterioară; citarea ei nu adaugă capabilități implementării R1.

## Iterații observate

| Etapă | Modificare sau observație | Rezultat |
|---|---|---|
| Baseline SOP înghețat | Matching lexical fără gardă completă de punctuație | 13/15; eșec la quoted-assertion și question |
| Corectarea interpretării | Garda SOP înainte de tokenizare; respingere a contextelor neacoperite | 15/15 |
| Protecția contextului în rezumat | Cluster cu propoziția precedentă, supus aceluiași buget | Teste pozitive pentru păstrarea contextului și refuzul depășirii bugetului |
| Clarificări de test | Eticheta reală este symbolic-aggregation; task parser-ul păstrează whitespace-ul sursei | Așteptările testelor au fost corectate, nu schimbată semantica pentru scor |
| Consolidare | Admitere de pack, checker independent, ABI, reflecție, transfer, CLI și HTTP | 101/101 teste curente |

Baseline-ul reproductibil utilizează circuitele vechi din `experiments/iteration-0/sop` pe kernelul curent; scopul este izolarea diferenței de competență SOP. Nu pretindem că este o imagine binară completă a fiecărui moment istoric al dezvoltării.

### Cazurile de completion

| Caz | Input | Predicate derivate | Rezultat |
|---|---|---|---|
| positive-chain | Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests. | dedup_review, duplicate_risk | PASS |
| explicit-negative | Atlas does not retry requests. Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| modal-may | Atlas may retry requests. Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| modal-must | Atlas must retry requests. Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| unknown-is-not-negative | Atlas retries requests. Atlas writes records. | abținere | PASS |
| conflict | Atlas retries requests. Atlas deduplicates requests. Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| reported-speech | Mara said that Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| conditional | If Atlas retries requests, the operation may fail. Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| quoted-assertion | "Atlas retries requests." Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| question | Atlas retries requests? Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| unknown-subject | Orion retries requests. Atlas writes records. Atlas does not deduplicate requests. | abținere | PASS |
| protected-retry | Atlas retries requests. Atlas deduplicates requests. | retry_protected | PASS |
| worker-loss | Delta is a worker. Delta acknowledges messages before persisting them. Delta uses volatile memory. | durability_review, loss_risk | PASS |
| cache-stale | Cedar is a cache. Cedar has an expiration limit. Cedar does not invalidate entries after updates. | cache_review, stale_risk | PASS |
| empty-evidence | The meeting ended after lunch. | abținere | PASS |

Matricea separată: 64/64 combinații trecute pentru prezență, absență, negație și contradicție. Ea nu validează sinonime nelimitate, discurs general sau un nou domeniu lexical. Pack-ul de bibliotecă testează separat introducerea a două predicate de intrare și a unui lanț de reguli prin cinci fișiere SOP, fără schimbarea surselor gazdă.

## Dovezi și trasabilitate

Simularea principală are 4 fapte sursă și 3 concluzii, toate 7 verificate de checker-ul separat. Checker-ul nu folosește unificatorul kernelului pentru a compara premisele ground. Sunt testate și coruperea unui termen și schimbarea sursei. Acest audit verifică derivația și integritatea referinței, nu faptul că formalizarea reflectă perfect sensul manualului.

Trace-ul complet al simulării conține 13583 evenimente de nod, 3464 cadre și 21770 pași contorizați. Include operațiile demonstrative și reluarea explicită a rundelor; nu este doar latența unui singur apel de expansiune. Trunchiere: false.

## Auditul arhitectural

Biblioteca activă: 114 circuite SOP. Kernel: 43 comenzi în 43 fișiere. Fișierele de primitive au 284 linii, iar sursele gazdă din `src/` au 983 linii în 52 fișiere. Aceste numere exclud CLI, teste, instrumente, snapshot și documentație; nu sunt măsuri de inteligență sau maturitate.

Comenzi directe necunoscute: 0. Findings ale scanării statice în kernel: 0. Fișiere non-SOP în biblioteca autoritativă: 0. Auditul prin pattern-uri este un control practic, nu o dovadă formală că nu există nicio cale nedorită.

SHA-256 al surselor gazdă în această rulare: `03ab280890a2630c3581dc6982d345e449693ca7b50a1b5f7fbc261fbf79c900`.

## Microbenchmark local

Mașina raportează `INTEL(R) XEON(R) PLATINUM 8573C`, 5 procesoare logice. Procesul este single-threaded. Pornirea service-ului și încărcarea definițiilor: 168.08 ms. Latențele de mai jos sunt pentru patru afirmații scurte, în proces încălzit, câte 30 de rulări, incluzând reconstruirea pack-ului în cerere.

| Operație | Mediană | p95 empiric | Pași |
|---|---:|---:|---:|
| summarize | 5.68 ms | 10.03 ms | 1568 |
| semantic-summary | 14.53 ms | 29.56 ms | 5789 |
| expand | 17.80 ms | 52.37 ms | 7301 |

Query izolat: 50000 fapte, 1000 valori de predicat, 50 rezultate. Construirea indexului și primul query: 24.69 ms, 50050 pași. Query pe index reutilizat: mediană 0.15 ms, 50 pași. Scanare simplă unică în aceeași rulare: 36.95 ms. Rezultatele coincid.

Acesta nu este un benchmark end-to-end pe un KB de 50.000 de fapte cu inferență, parsing și generare. Un indice nou este construit când se schimbă identitatea secvenței de fapte. Toate regulile sunt încă vizitate la fiecare rundă. Nu raportăm un speedup general și nu extrapolăm la milioane de fapte.

## Ce nu a fost validat

Nu au fost validate: containerul Docker/Podman, compatibilitatea integrală OpenAI sau toate SDK-urile, limbaj natural deschis, completion narativ liber, coreferință generală, contexte temporale sau epistemice, multiple dovezi complete, instalare persistentă concurentă, workload-uri mari de inferență și securitate pentru pack-uri/traffic ostile.

Nu există evaluatori umani independenți, intervale de încredere ale calității sau comparație cu modele neuronale. Afirmația defensabilă este existența unui semnal pe acest prototip limitat și reproductibil, nu superioritate generală.

## Reproducere

`npm test`, `npm run evaluate`, `node tools/evaluate.mjs --initial`, `npm run demo`, `npm run audit`, `node tools/benchmark.mjs`, `node tools/retrospective.mjs`. După regenerarea rapoartelor brute, `node tools/render-reports.mjs` actualizează aceste documente lizibile. Timpii și hash-urile surselor se pot modifica după intervenții; distribuția păstrează rezultatele propriei rulări.
