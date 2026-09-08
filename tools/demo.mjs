import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createVM, HOME } from '../src/vm.mjs';
import { auditProofs, validatePack } from '../src/verify.mjs';
const input = 'Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests. Harbor shares storage with Atlas.';
const vm = await createVM({ trace: true, traceLimit: 100000, fuel: 8000000 }), pack = vm.run('kb.default');
const expansion = vm.run('text.expand', { text: input, pack, limit: 5 });
const semanticSummary = vm.run('text.summarize_semantic', { text: input, pack, limit: 4 });
const prefix = 'Atlas has a risk of ';
const completion = vm.run('text.complete', { text: input, pack, prefix });
const manual = await readFile(path.join(HOME, 'examples/manual.txt'), 'utf8');
const audit = auditProofs(expansion.closure.raw, pack, { input, 'examples/manual.txt': manual });
const rounds = [];
let state = expansion.parsed.facts;
for (let i = 0; i < 12; i++) {
    const next = vm.run('logic.step', { state, rules: pack.rules }), newFacts = next.filter(f => !state.some(p => p.id === f.id));
    rounds.push({ round: i + 1, inputFacts: state.length, outputFacts: next.length, newFacts });
    if (newFacts.length === 0)
        break;
    state = next;
}
const reflection = vm.run('reflection.demo');
const library = await createVM();
await library.load(path.join(HOME, 'examples/library_kb'));
const libraryPack = library.run('library.pack');
const transfer = library.run('text.expand', { text: 'BookQ is on loan. BookQ is overdue.', pack: libraryPack });
const report = { input, ruleDefinitions: pack.rules, packAdmission: validatePack(pack, { sources: { 'examples/manual.txt': manual } }), semanticSummary, expansion, prefix, completion, rounds, audit, reflection, transfer, execution: vm.stats(), trace: vm.trace };
await writeFile(path.join(HOME, 'reports/demo-trace.json'), JSON.stringify(report, null, 2));
await writeFile(path.join(HOME, 'examples/facts.txt'), input + '\n');
console.log(JSON.stringify({ summary: semanticSummary.text, expansion: expansion.text, prefix, completion: completion.text, audit, rounds: rounds.map(r => ({ round: r.round, newFacts: r.newFacts.map(f => f.term.predicate) })), execution: vm.stats() }, null, 2));
