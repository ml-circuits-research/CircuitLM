# SOP Symbolic Lab — R1 / 0.3.0

Prototip CPU, fără LLM la runtime, pentru **sumarizare extractivă, agregare simbolică și completion deductiv limitat**. Competențele și cunoașterea sunt circuite SOP; kernelul oferă operații generice. Nu este un model lingvistic general și nu folosește MeTTa.

## Pornire

Necesită Node.js 22+. Nu este necesar `npm install`.

```bash
node cli.mjs help
node cli.mjs summarize --sentences 3 --file examples/summary-ro.txt --locale ro
node cli.mjs semantic-summary --sentences 4 --file examples/facts.txt
node cli.mjs expand --file examples/facts.txt
node cli.mjs complete --prefix "Atlas has a risk of " --file examples/facts.txt
```

Exemplul inclus produce o concluzie de risc, o cerință de analiză a integrării pentru o entitate legată și o cerință de revizuire a deduplicării. Regulile sunt **stipulații sintetice ale modelului de test**, nu afirmații despre servicii reale. Output-ul de completion este justificat prin acele reguli și faptele recunoscute, nu prezis printr-un model neuronal.

## Documentele principale

`SPECIFICATION.md` este specificația detaliată: baza conceptuală, semantica SOP-R1, cele 43 de primitive, reprezentarea KB-ului, parserul, inferența, sumarizarea, completion-ul, protocoalele de autorare și extensiile neimplementate.

`SIMULATION.md` arată rezultatele reale și pașii intermediari, inclusiv substituții, proveniență și rescriere de circuit. `VALIDATION.md` prezintă testele, comparația cu baseline-ul, eșecurile și microbenchmark-ul. `CODING_AGENT_GUIDE.md` este protocolul pentru transformarea documentelor în pack-uri SOP fără modificarea kernelului.

## Testare și reproducere

```bash
npm test
npm run evaluate
npm run audit
npm run demo
node tools/benchmark.mjs
node tools/check-pack.mjs
node tools/retrospective.mjs
```

Rularea documentată a avut 101 teste trecute din 101. Evaluarea de sumarizare are 18 texte autorate, iar verificarea semantică include 15 cazuri și o matrice de 64 de combinații. Acestea se suprapun cu testele funcționale; nu se adună ca un scor general de inteligență. Există și un test calitativ pe un document de proiect preexistent.

Pentru a reproduce diferența dintre circuitele inițiale și cele corectate:

```bash
node tools/evaluate.mjs --initial
```

Acest mod încarcă efectiv snapshot-ul SOP inițial, pe kernelul curent. Reproduce cele două eșecuri la citate și întrebări. Nu suprascrie biblioteca activă. Rapoartele sunt în `reports/`; timpii vor varia între rulări.

## Extensie într-un domeniu nou, numai în SOP

```bash
printf 'BookQ is on loan. BookQ is overdue.' | \
  node cli.mjs expand --library examples/library_kb --pack library.pack

node tools/check-pack.mjs \
  --library examples/library_kb --pack library.pack \
  --source examples/library-manual.txt
```

Rezultat: `BookQ needs a return reminder. BookQ needs a loan review.`

## Intrare și ieșire inspectabile

```bash
node cli.mjs expand --file examples/facts.txt --json
node cli.mjs expand --file examples/facts.txt --trace reports/request.json
node cli.mjs ingest --file examples/facts.txt > learned-document.sop
node cli.mjs inspect
```

`ingest` serializează fapte deja recunoscute în engleza controlată, nu învață automat reguli dintr-un manual arbitrar. Textul nerecunoscut oprește compilarea, exceptând utilizarea explicită a `--allow-partial`.

## Server local și container

```bash
node cli.mjs serve --host 127.0.0.1 --port 8000
```

Endpoint-uri: `/v1/models`, `/v1/chat/completions`, `/v1/completions`, `/health`. API-ul este un subset strict, non-streaming, cu un singur mesaj user; citește contractul din specificație înainte de integrare. Refuză opțiunile nesuportate în loc să pretindă că le execută.

```bash
docker build -t sop-symbolic-r1 .
docker run --rm -i sop-symbolic-r1 expand < examples/facts.txt
docker compose up --build
```

Configurația containerului este furnizată, **dar nu a fost construită/rulată în mediul de validare**, unde Docker și Podman nu erau disponibile. CLI și serverul HTTP au fost testate direct pe Node.js.

## Limite de reținut

Româna este suportată numai de calea extractivă. Parserul semantic este o microgramatică engleză explicită, nu limbaj natural deschis. Un rezultat gol de expansiune înseamnă abținere. Lipsa unei premise nu este negație. Contradicțiile sunt carantinate, dar o singură dovadă canonică este păstrată per termen, deci nu există truth-maintenance complet.

Nu există persistență distribuită, tool calling, shell, acces web din circuite, autentificare server sau sandbox complet pentru pack-uri ostile. Nu expune serverul direct pe Internet. Bugetul de pași este o protecție experimentală, nu un timeout CPU preemptiv.

## Organizare

```text
src/kernel/      primitive generice, namespace-uri derivate din căi
src/             parser, VM, contracte, reflecție, verificare și transport
sop/             competențe și KB în SOP; nicio semantică externă în JSON
examples/        surse, intrări și pack-ul SOP de transfer
experiments/     snapshot SOP inițial, pentru reproducerea eșecurilor
tests/          teste funcționale și fixture-uri autorate
tools/          evaluare, audit, simulare și verificare de pack
reports/        rezultate reconstruibile; nu KB autoritativ
```

Specificația R1 păstrează nucleul lexical SOP, dar nu este un înlocuitor declarat compatibil cu toate dialectele/arhivele anterioare.
