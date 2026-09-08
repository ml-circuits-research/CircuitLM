import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HOME } from '../src/vm.mjs';
const read = async (f) => JSON.parse(await readFile(path.join(HOME, 'reports', f), 'utf8'));
const [evaluation, baseline, grid, demo, bench, audit, retro] = await Promise.all(['evaluation.json', 'iteration-0.json', 'counterfactual-grid.json', 'demo-trace.json', 'benchmark.json', 'architecture-audit.json', 'retrospective.json'].map(read));
const log = await readFile(path.join(HOME, 'reports/test-run.txt'), 'utf8');
const tests = { total: Number(log.match(/ℹ tests (\d+)/)?.[1]), passed: Number(log.match(/ℹ pass (\d+)/)?.[1]), failed: Number(log.match(/ℹ fail (\d+)/)?.[1]) };
if (!tests.total)
    throw Error('Cannot read test report');
const pct = n => (100 * n).toFixed(2) + '%';
const ms = n => n.toFixed(2) + ' ms';
const code = s => '```text\n' + s + '\n```\n';
const safe = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const summaryRows = evaluation.summaries.map(s => `| ${s.id} | ${s.locale} | [${s.gold}] | [${s.selected}] | ${pct(s.recall)} | ${pct(s.leadRecall)} |`).join('\n');
const completionRows = evaluation.completions.map(c => `| ${c.id} | ${safe(c.text)} | ${c.actual.join(', ') || 'abținere'} | ${c.pass ? 'PASS' : 'FAIL'} |`).join('\n');
const bfailed = baseline.completions.filter(c => !c.pass);
const worst = evaluation.summaries.find(s => s.id === 'holdout-open-science');
const bySplit = ['development', 'holdout'].map(split => { const s = evaluation.summaries.filter(x => x.split === split); return { split, cases: s.length, recall: mean(s.map(x => x.recall)), lead: mean(s.map(x => x.leadRecall)) }; });
const validation = `# Raport de validare — SOP Symbolic Lab R1 / 0.3.0

Rulare locală pe ${bench.environment.node}, ICU ${bench.environment.icu}, ${bench.environment.platform}/${bench.environment.arch}. Datele provin din execuția codului inclus. Timpii sunt observații locale, nu garanții. Data de referință a distribuției: 8 septembrie 2026.

## Rezultatul funcțional

**${tests.passed}/${tests.total} teste automate trecute**, ${tests.failed} eșecuri. Suitele sunt \`tests/core.test.mjs\` și \`tests/http.test.mjs\`. Logul brut este \`reports/test-run.txt\`.

Testele includ parser, SSA, imutabilitate, memoizare, unificare cu occurs-check, joins, bugete, surse, contradicții, modalitate, query-uri indexate, reflecție, compilare în SOP, extensie de domeniu, izolare între cereri, CLI prin stdin și HTTP real pe un port local efemer. Nu toate căile tuturor primitivelor au o dovadă formală sau un test separat.

Cele 15 cazuri de completion și matricea de 64 de combinații apar și în testele funcționale. **Nu se adună cu numărul de teste ca și cum ar reprezenta sarcini independente.** Matricea este un singur test parametrizat asupra unei familii de reguli.

## Sumarizare: rezultat și metodologie

Setul conține ${evaluation.summary.cases} documente scurte sintetice, dintre care patru în română. Opt sunt de dezvoltare și zece au fost rezervate. Același autor a conceput metoda, exemplele și adnotările: nu este o evaluare independentă, o competiție publică sau un rezultat comparativ cu un LLM.

Metrică: proporția propozițiilor importante din adnotarea autorului care apar în selecție, mediată pe documente. Baseline: primele k propoziții, la același buget. **Recall-ul propozițiilor importante nu este factual accuracy.** O propoziție poate fi copiată exact și totuși să fie nepotrivită sau scoasă din context.

| Set | Documente | Recall mediu | Primele k |
|---|---:|---:|---:|
${bySplit.map(x => `| ${x.split === 'development' ? 'Dezvoltare' : 'Rezervat, același autor'} | ${x.cases} | ${pct(x.recall)} | ${pct(x.lead)} |`).join('\n')}
| Total | ${evaluation.summary.cases} | ${pct(evaluation.summary.recall)} | ${pct(evaluation.summary.leadRecall)} |

Verificarea intervalelor sursă trece pentru ${evaluation.summary.sourceFaithfulness}/${evaluation.summary.cases} ieșiri extractive. Nu este o măsurătoare independentă a adevărului sau a completitudinii semantice.

### Toate cazurile, fără eliminarea celor nereușite

Indicii de propoziție din tabel sunt zero-based. Coeficienții sunt în \`sop/text/summary/config.sop\` și nu au fost modificați după examinarea setului rezervat.

| Caz | Limbă | Gold | Selectat | Recall | Primele k |
|---|---|---|---|---:|---:|
${summaryRows}

### Un rezumat reușit în română

${code(evaluation.summaries.find(s => s.id === 'dev-ro-cache').output)}
Inputul complet și toate celelalte ieșiri sunt păstrate în \`reports/evaluation.json\`.

### Eșec păstrat: ${worst.id}

Input:

${code(worst.input)}
Output:

${code(worst.output)}
Este recuperată numai una dintre cele trei propoziții importante. Repetiția lexicală și scorurile euristice selectează și detalii administrative. Nu am adăugat reguli special-caz pentru a ascunde acest eșec. Semnalul de sumarizare este pozitiv pe medie, dar acest exemplu infirmă orice pretenție de selecție semantică robustă generală.

## Test retrospectiv pe un document tehnic preexistent

Sursa este un document anterior al proiectului utilizatorului, nu un text nou creat pentru aceste euristici. După eliminarea titlurilor și blocurilor de cod: ${retro.inputWords} cuvinte, ${retro.sourceSentences} propoziții. Output: ${retro.outputWords} cuvinte, ${retro.selected.length} propoziții, intervale sursă exacte: ${retro.sourceSpansExact}.

${code(retro.output)}
Rezumatul surprinde pack-ul SOP, reconstruirea cunoașterii, bootstrap-ul și extensia lexicală. Omite însă interdicția explicită de a modifica kernelul pentru vocabular nou. Este o verificare calitativă, fără scor gold, neamestecată cu cele 18 fixture-uri. Sursa descrie o implementare anterioară; citarea ei nu adaugă capabilități implementării R1.

## Iterații observate

| Etapă | Modificare sau observație | Rezultat |
|---|---|---|
| Baseline SOP înghețat | Matching lexical fără gardă completă de punctuație | ${baseline.completion.passed}/${baseline.completion.cases}; eșec la ${bfailed.map(x => x.id).join(' și ')} |
| Corectarea interpretării | Garda SOP înainte de tokenizare; respingere a contextelor neacoperite | ${evaluation.completion.passed}/${evaluation.completion.cases} |
| Protecția contextului în rezumat | Cluster cu propoziția precedentă, supus aceluiași buget | Teste pozitive pentru păstrarea contextului și refuzul depășirii bugetului |
| Clarificări de test | Eticheta reală este symbolic-aggregation; task parser-ul păstrează whitespace-ul sursei | Așteptările testelor au fost corectate, nu schimbată semantica pentru scor |
| Consolidare | Admitere de pack, checker independent, ABI, reflecție, transfer, CLI și HTTP | ${tests.passed}/${tests.total} teste curente |

Baseline-ul reproductibil utilizează circuitele vechi din \`experiments/iteration-0/sop\` pe kernelul curent; scopul este izolarea diferenței de competență SOP. Nu pretindem că este o imagine binară completă a fiecărui moment istoric al dezvoltării.

### Cazurile de completion

| Caz | Input | Predicate derivate | Rezultat |
|---|---|---|---|
${completionRows}

Matricea separată: ${grid.passed}/${grid.cases} combinații trecute pentru prezență, absență, negație și contradicție. Ea nu validează sinonime nelimitate, discurs general sau un nou domeniu lexical. Pack-ul de bibliotecă testează separat introducerea a două predicate de intrare și a unui lanț de reguli prin cinci fișiere SOP, fără schimbarea surselor gazdă.

## Dovezi și trasabilitate

Simularea principală are ${demo.audit.sourceFacts} fapte sursă și ${demo.audit.derivedFacts} concluzii, toate ${demo.audit.facts} verificate de checker-ul separat. Checker-ul nu folosește unificatorul kernelului pentru a compara premisele ground. Sunt testate și coruperea unui termen și schimbarea sursei. Acest audit verifică derivația și integritatea referinței, nu faptul că formalizarea reflectă perfect sensul manualului.

Trace-ul complet al simulării conține ${demo.execution.traceNodes} evenimente de nod, ${demo.execution.frames} cadre și ${demo.execution.steps} pași contorizați. Include operațiile demonstrative și reluarea explicită a rundelor; nu este doar latența unui singur apel de expansiune. Trunchiere: ${demo.execution.traceTruncated}.

## Auditul arhitectural

Biblioteca activă: ${audit.activeCircuits} circuite SOP. Kernel: ${audit.primitiveCommands} comenzi în ${audit.kernel.files} fișiere. Fișierele de primitive au ${audit.kernel.lines} linii, iar sursele gazdă din \`src/\` au ${audit.allHostSource.lines} linii în ${audit.allHostSource.files} fișiere. Aceste numere exclud CLI, teste, instrumente, snapshot și documentație; nu sunt măsuri de inteligență sau maturitate.

Comenzi directe necunoscute: ${audit.unknownDirectCommands.length}. Findings ale scanării statice în kernel: ${audit.forbiddenKernelFindings.length}. Fișiere non-SOP în biblioteca autoritativă: ${audit.persistentKBNonSOPFiles.length}. Auditul prin pattern-uri este un control practic, nu o dovadă formală că nu există nicio cale nedorită.

SHA-256 al surselor gazdă în această rulare: \`${audit.kernelAndHostSourceSHA256}\`.

## Microbenchmark local

Mașina raportează \`${bench.environment.cpuReportedByHost}\`, ${bench.environment.logicalCPUsReportedByHost} procesoare logice. Procesul este single-threaded. Pornirea service-ului și încărcarea definițiilor: ${ms(bench.bootMs)}. Latențele de mai jos sunt pentru patru afirmații scurte, în proces încălzit, câte 30 de rulări, incluzând reconstruirea pack-ului în cerere.

| Operație | Mediană | p95 empiric | Pași |
|---|---:|---:|---:|
${Object.entries(bench.latency).map(([name, b]) => `| ${name} | ${ms(b.medianMs)} | ${ms(b.p95Ms)} | ${b.steps} |`).join('\n')}

Query izolat: ${bench.index.facts} fapte, ${bench.index.predicateBuckets} valori de predicat, ${bench.index.resultRows} rezultate. Construirea indexului și primul query: ${ms(bench.index.coldBuildAndQueryMs)}, ${bench.index.coldSteps} pași. Query pe index reutilizat: mediană ${ms(bench.index.warmMedianMs)}, ${bench.index.warmSteps} pași. Scanare simplă unică în aceeași rulare: ${ms(bench.index.naiveSingleScanMs)}. Rezultatele coincid.

Acesta nu este un benchmark end-to-end pe un KB de 50.000 de fapte cu inferență, parsing și generare. Un indice nou este construit când se schimbă identitatea secvenței de fapte. Toate regulile sunt încă vizitate la fiecare rundă. Nu raportăm un speedup general și nu extrapolăm la milioane de fapte.

## Ce nu a fost validat

Nu au fost validate: containerul Docker/Podman, compatibilitatea integrală OpenAI sau toate SDK-urile, limbaj natural deschis, completion narativ liber, coreferință generală, contexte temporale sau epistemice, multiple dovezi complete, instalare persistentă concurentă, workload-uri mari de inferență și securitate pentru pack-uri/traffic ostile.

Nu există evaluatori umani independenți, intervale de încredere ale calității sau comparație cu modele neuronale. Afirmația defensabilă este existența unui semnal pe acest prototip limitat și reproductibil, nu superioritate generală.

## Reproducere

\`npm test\`, \`npm run evaluate\`, \`node tools/evaluate.mjs --initial\`, \`npm run demo\`, \`npm run audit\`, \`node tools/benchmark.mjs\`, \`node tools/retrospective.mjs\`. După regenerarea rapoartelor brute, \`node tools/render-reports.mjs\` actualizează aceste documente lizibile. Timpii și hash-urile surselor se pot modifica după intervenții; distribuția păstrează rezultatele propriei rulări.
`;
await writeFile(path.join(HOME, 'VALIDATION.md'), validation);
const all = demo.expansion.closure.raw, byId = new Map(all.map((f, i) => [f.id, { fact: f, label: 'F' + i }]));
const term = t => `${t.polarity === 'negative' ? 'NOT ' : ''}${t.predicate}(${t.subject}${t.object ? ', ' + t.object : ''}) [${t.mode}; ${t.scope}]`;
const factRows = all.map(f => `| ${byId.get(f.id).label} | ${term(f.term)} | ${f.parents.map(p => byId.get(p)?.label ?? p).join(', ') || 'sursă'} | ${f.rule || 'input'} |`).join('\n');
const sources = demo.expansion.parsed.facts.map(f => { const s = f.sources[0]; return `| ${byId.get(f.id).label} | [${s.start}, ${s.end}) | ${safe(s.quote)} |`; }).join('\n');
let roundDetails = '';
for (const round of demo.rounds) {
    roundDetails += `### Runda ${round.round}: ${round.inputFacts} → ${round.outputFacts} fapte brute\n\n`;
    if (!round.newFacts.length) {
        roundDetails += 'Niciun termen nou: punct fix al implementării.\n\n';
        continue;
    }
    for (const fact of round.newFacts) {
        const rule = demo.ruleDefinitions.find(r => r.id === fact.rule), bindings = {};
        for (let i = 0; i < rule.body.length; i++) {
            const parent = byId.get(fact.parents[i]).fact.term;
            for (const [key, value] of Object.entries(rule.body[i]))
                if (value?.kind === 'variable')
                    bindings[value.name] = parent[key];
        }
        roundDetails += `**${byId.get(fact.id).label}: ${term(fact.term)}**\n\nRegulă: \`${fact.rule}\`. Legări reconstruite din martorii înregistrați: \`${JSON.stringify(bindings)}\`. Părinți, în ordinea premiselor: ${fact.parents.map(p => byId.get(p).label).join(', ')}.\n\nSursa regulii: ${rule.source.source}, interval [${rule.source.start}, ${rule.source.end}), hash \`${rule.source.hash}\`.\n\n${code(rule.source.quote)}Identitatea termenului: \`${fact.id}\`. Identitatea dovezii: \`${fact.proofId}\`.\n\n`;
    }
}
const simulation = `# Simulare completă — SOP Symbolic Lab R1

Acest document prezintă o execuție reală a prototipului. Rapoartele brute sunt în \`reports/demo-trace.json\`; scriptul este \`tools/demo.mjs\`. Numele și regulile de inginerie sunt sintetice și stipulate pentru test. Nu există apeluri către un LLM.

## 1. Input și bootstrap

${code(demo.input)}
Pack-ul de bază se reconstruiește prin \`kb.default\`: ${demo.packAdmission.rules} reguli, ${demo.packAdmission.lexicon} intrări lexicale și ${demo.packAdmission.facts} fapte persistente inițiale. Inputul furnizează faptele despre entități. Regulile sunt în \`sop/kb/rules/\`; realizările în \`sop/kb/realizers/\`.

## 2. Segmentare, matching și afirmații

Intervalele sunt half-open, zero-based, în unități UTF-16 asupra inputului de mai sus. Fiecare propoziție are o interpretare distinctă în lexiconul explicit. Cea de-a treia are negație explicită, iar cea de-a patra are un obiect relațional.

| Fapt | Interval | Fragment sursă |
|---|---|---|
${sources}

## 3. Starea semantică și proveniența

| Fapt | Termen | Suport | Regulă |
|---|---|---|---|
${factRows}

Nu există un fapt sursă care să spună direct că Atlas prezintă risc. Acesta este rezultatul aplicării regulii. Nu este inferat un risc propriu al lui Harbor; regula relațională produce o cerință de analiză a integrării, mai îngustă și formulată explicit.

## 4. Rundele complete de inferență

${roundDetails}
## 5. Agregarea simbolică, fără adăugarea concluziilor

${code(demo.semanticSummary.text)}
Mod raportat: \`${demo.semanticSummary.method}\`. Cele trei afirmații despre Atlas sunt coordonate, iar relația lui Harbor este păstrată într-o propoziție separată. Rezumatul nu introduce afirmațiile de risc deduse; acestea apar numai în operația de expansiune.

## 6. Expansiunea deductivă

${code(demo.expansion.text)}
Mod: \`${demo.expansion.method}\`. Punct fix raportat: ${demo.expansion.complete}. Aceasta este completitudinea algoritmului implementat pe acest exemplu și buget, nu completitudine epistemică sau înțelegerea oricărui text.

## 7. Completion de prefix

Prefix: \`${demo.prefix}\`.

Sufix întors:

${code(demo.completion.text)}
Propoziția susținută completă:

${code(demo.completion.completedSentence)}
Invariantul prefix + sufix = propoziție este verificat de test. Un prefix fără propoziție susținută produce abținere, nu o continuare inventată.

## 8. Checker separat

${code(JSON.stringify(demo.audit, null, 2))}
Checker-ul folosește un matcher ground separat de motorul de inferență. Verifică termenii, premisele, capetele, părinții, amprentele și fragmentele sursă. Nu poate demonstra că regula sintetică este o lege adevărată a ingineriei ori că o formalizare viitoare a unui manual este semantic fidelă.

## 9. Reflecție și rescriere executată

${code(JSON.stringify(demo.reflection, null, 2))}
Circuitul de transformare este \`reflection.replace_output\`: construiește un output nou, îmbină record-urile, validează graful și îl execută. Originalul nu este modificat. Nu este demonstrată descoperirea autonomă a transformării; ea este o competență explicită în SOP.

## 10. Transfer de domeniu fără modificarea kernelului

Input:

${code('BookQ is on loan. BookQ is overdue.')}
Output:

${code(demo.transfer.text)}
Cele cinci fișiere din \`examples/library_kb/library/\` introduc lexiconul, cele două reguli și pack-ul. Aceasta testează granița arhitecturală dintre kernel și cunoaștere. Nu este un test de achiziție automată generală a cunoașterii din manuale.

## 11. Rezumat extractiv pe text mai obișnuit

Input:

${code(evaluation.summaries.find(s => s.id === 'dev-ro-cache').input)}
Output:

${code(evaluation.summaries.find(s => s.id === 'dev-ro-cache').output)}
Acest traseu nu folosește gramatica semantică engleză. Selecția și scorurile sunt în circuitele \`text.summary.*\`; kernelul furnizează segmentare, colecții și operații scalare. Cazurile în care euristicile selectează greșit sunt în \`VALIDATION.md\`.

## 12. Reproducere și granularitatea trace-ului

\`npm run demo\` regenerează simularea și trace-ul. Rularea documentată: ${demo.execution.steps} pași, ${demo.execution.frames} cadre, ${demo.execution.traceNodes} evenimente, trunchiere=${demo.execution.traceTruncated}. Trace-ul include numele circuitului, firul, comanda, linia și hash-ul rezultatului fiecărui nod înregistrat. Valorile semantice și dovezile sunt păstrate în structurile de rezultat ale aceluiași fișier; trace-ul nu copiază fiecare valoare mare în fiecare eveniment.

Un trace mare nu este în sine semn de inteligență. Utilitatea sa este că permite localizarea responsabilității: interpretare SOP, regulă SOP, verificare de suport sau realizare SOP. Datele brute permit reconstruirea pașilor fără a avea încredere în această prezentare narativă.
`;
await writeFile(path.join(HOME, 'SIMULATION.md'), simulation);
await writeFile(path.join(HOME, 'reports/validation-summary.json'), JSON.stringify({ tests, summary: evaluation.summary, bySplit, completion: evaluation.completion, counterfactual: { cases: grid.cases, passed: grid.passed }, architecture: audit, retrospective: { inputWords: retro.inputWords, outputWords: retro.outputWords, sourceSpansExact: retro.sourceSpansExact }, dockerValidated: false, independentBenchmark: false }, null, 2));
for (const name of ['dev-cache', 'dev-ro-cache']) {
    const s = evaluation.summaries.find(x => x.id === name);
    await writeFile(path.join(HOME, 'examples', name === 'dev-cache' ? 'summary-en.txt' : 'summary-ro.txt'), s.input + '\n');
}
console.log('Generated VALIDATION.md, SIMULATION.md and reports/validation-summary.json');
