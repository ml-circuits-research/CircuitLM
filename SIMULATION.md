# Simulare completă — SOP Symbolic Lab R1

Acest document prezintă o execuție reală a prototipului. Rapoartele brute sunt în `reports/demo-trace.json`; scriptul este `tools/demo.mjs`. Numele și regulile de inginerie sunt sintetice și stipulate pentru test. Nu există apeluri către un LLM.

## 1. Input și bootstrap

```text
Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests. Harbor shares storage with Atlas.
```

Pack-ul de bază se reconstruiește prin `kb.default`: 8 reguli, 10 intrări lexicale și 0 fapte persistente inițiale. Inputul furnizează faptele despre entități. Regulile sunt în `sop/kb/rules/`; realizările în `sop/kb/realizers/`.

## 2. Segmentare, matching și afirmații

Intervalele sunt half-open, zero-based, în unități UTF-16 asupra inputului de mai sus. Fiecare propoziție are o interpretare distinctă în lexiconul explicit. Cea de-a treia are negație explicită, iar cea de-a patra are un obiect relațional.

| Fapt | Interval | Fragment sursă |
|---|---|---|
| F0 | [0, 23) | Atlas retries requests. |
| F1 | [24, 45) | Atlas writes records. |
| F2 | [46, 82) | Atlas does not deduplicate requests. |
| F3 | [83, 116) | Harbor shares storage with Atlas. |

## 3. Starea semantică și proveniența

| Fapt | Termen | Suport | Regulă |
|---|---|---|---|
| F0 | retries(Atlas) [asserted; input] | sursă | input |
| F1 | writes(Atlas) [asserted; input] | sursă | input |
| F2 | NOT deduplicates(Atlas) [asserted; input] | sursă | input |
| F3 | shares(Harbor, Atlas) [asserted; input] | sursă | input |
| F4 | duplicate_risk(Atlas) [asserted; input] | F0, F1, F2 | kb.rules.duplicate |
| F5 | integration_review(Harbor) [asserted; input] | F3, F4 | kb.rules.shared_impact |
| F6 | dedup_review(Atlas) [asserted; input] | F4 | kb.rules.dedup_review |

Nu există un fapt sursă care să spună direct că Atlas prezintă risc. Acesta este rezultatul aplicării regulii. Nu este inferat un risc propriu al lui Harbor; regula relațională produce o cerință de analiză a integrării, mai îngustă și formulată explicit.

## 4. Rundele complete de inferență

### Runda 1: 4 → 5 fapte brute

**F4: duplicate_risk(Atlas) [asserted; input]**

Regulă: `kb.rules.duplicate`. Legări reconstruite din martorii înregistrați: `{"entity":"Atlas"}`. Părinți, în ordinea premiselor: F0, F1, F2.

Sursa regulii: examples/manual.txt, interval [0, 133), hash `9fb102f9d41a1894e54c9ee2`.

```text
Within this model, a service that retries requests and writes records without deduplicating requests has a risk of duplicate records.
```
Identitatea termenului: `0c4eb8b88e522db9405c2481`. Identitatea dovezii: `5230fca47ed45f6519757900`.

### Runda 2: 5 → 7 fapte brute

**F5: integration_review(Harbor) [asserted; input]**

Regulă: `kb.rules.shared_impact`. Legări reconstruite din martorii înregistrați: `{"service":"Harbor","component":"Atlas"}`. Părinți, în ordinea premiselor: F3, F4.

Sursa regulii: examples/manual.txt, interval [809, 932), hash `9fb102f9d41a1894e54c9ee2`.

```text
Within this model, a service that shares storage with a component at risk of duplicate records needs an integration review.
```
Identitatea termenului: `9a60f310a094a461e0eab549`. Identitatea dovezii: `8af32e47a23d408e125cd70d`.

**F6: dedup_review(Atlas) [asserted; input]**

Regulă: `kb.rules.dedup_review`. Legări reconstruite din martorii înregistrați: `{"entity":"Atlas"}`. Părinți, în ordinea premiselor: F4.

Sursa regulii: examples/manual.txt, interval [134, 229), hash `9fb102f9d41a1894e54c9ee2`.

```text
Within this model, a risk of duplicate records requires a review of the deduplication strategy.
```
Identitatea termenului: `ea1d4486d2924f97d5996555`. Identitatea dovezii: `e16303c464809b66e1db2378`.

### Runda 3: 7 → 7 fapte brute

Niciun termen nou: punct fix al implementării.


## 5. Agregarea simbolică, fără adăugarea concluziilor

```text
Atlas retries requests, writes records and does not deduplicate requests. Harbor shares storage with Atlas.
```

Mod raportat: `symbolic-aggregation`. Cele trei afirmații despre Atlas sunt coordonate, iar relația lui Harbor este păstrată într-o propoziție separată. Rezumatul nu introduce afirmațiile de risc deduse; acestea apar numai în operația de expansiune.

## 6. Expansiunea deductivă

```text
Atlas has a risk of producing duplicate records when requests are retried. Harbor requires an integration review because a component sharing its storage is at risk of duplicate records. Atlas requires a review of the deduplication strategy.
```

Mod: `grounded-deductive-completion`. Punct fix raportat: true. Aceasta este completitudinea algoritmului implementat pe acest exemplu și buget, nu completitudine epistemică sau înțelegerea oricărui text.

## 7. Completion de prefix

Prefix: `Atlas has a risk of `.

Sufix întors:

```text
producing duplicate records when requests are retried.
```

Propoziția susținută completă:

```text
Atlas has a risk of producing duplicate records when requests are retried.
```

Invariantul prefix + sufix = propoziție este verificat de test. Un prefix fără propoziție susținută produce abținere, nu o continuare inventată.

## 8. Checker separat

```text
{
  "facts": 7,
  "sourceFacts": 4,
  "derivedFacts": 3,
  "valid": true,
  "scope": "structural derivation and source integrity; not validation of the source meaning or truth"
}
```

Checker-ul folosește un matcher ground separat de motorul de inferență. Verifică termenii, premisele, capetele, părinții, amprentele și fragmentele sursă. Nu poate demonstra că regula sintetică este o lege adevărată a ingineriei ori că o formalizare viitoare a unui manual este semantic fidelă.

## 9. Reflecție și rescriere executată

```text
{
  "original": "The original circuit remains unchanged.",
  "rewritten": "The rewritten circuit returns a different value.",
  "handle": {
    "kind": "wire-handle",
    "frame": 3461,
    "module": "reflection.demo",
    "wire": "new",
    "valueHash": "280f9216344ec3dbc4c68ade",
    "producer": "kernel.graph.execute"
  }
}
```

Circuitul de transformare este `reflection.replace_output`: construiește un output nou, îmbină record-urile, validează graful și îl execută. Originalul nu este modificat. Nu este demonstrată descoperirea autonomă a transformării; ea este o competență explicită în SOP.

## 10. Transfer de domeniu fără modificarea kernelului

Input:

```text
BookQ is on loan. BookQ is overdue.
```

Output:

```text
BookQ needs a return reminder. BookQ needs a loan review.
```

Cele cinci fișiere din `examples/library_kb/library/` introduc lexiconul, cele două reguli și pack-ul. Aceasta testează granița arhitecturală dintre kernel și cunoaștere. Nu este un test de achiziție automată generală a cunoașterii din manuale.

## 11. Rezumat extractiv pe text mai obișnuit

Input:

```text
Echipa a evaluat un cache pentru a reduce latența căutărilor în documente. Sala de ședințe are o tablă nouă. Cache-ul a redus latența mediană cu 35 la sută. Raportul include fotografii ale biroului. Prezentarea a folosit noul șablon grafic. Totuși, actualizările au lăsat intrări învechite, iar echipa a decis să amâne lansarea.
```

Output:

```text
Echipa a evaluat un cache pentru a reduce latența căutărilor în documente. Cache-ul a redus latența mediană cu 35 la sută. Totuși, actualizările au lăsat intrări învechite, iar echipa a decis să amâne lansarea.
```

Acest traseu nu folosește gramatica semantică engleză. Selecția și scorurile sunt în circuitele `text.summary.*`; kernelul furnizează segmentare, colecții și operații scalare. Cazurile în care euristicile selectează greșit sunt în `VALIDATION.md`.

## 12. Reproducere și granularitatea trace-ului

`npm run demo` regenerează simularea și trace-ul. Rularea documentată: 21770 pași, 3464 cadre, 13583 evenimente, trunchiere=false. Trace-ul include numele circuitului, firul, comanda, linia și hash-ul rezultatului fiecărui nod înregistrat. Valorile semantice și dovezile sunt păstrate în structurile de rezultat ale aceluiași fișier; trace-ul nu copiază fiecare valoare mare în fiecare eveniment.

Un trace mare nu este în sine semn de inteligență. Utilitatea sa este că permite localizarea responsabilității: interpretare SOP, regulă SOP, verificare de suport sau realizare SOP. Datele brute permit reconstruirea pașilor fără a avea încredere în această prezentare narativă.
